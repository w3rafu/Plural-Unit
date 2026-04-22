/**
 * currentHub/events — event-specific mutations for the hub store.
 *
 * This includes event lifecycle writes plus the member/admin side maps that
 * hang off events: RSVP state, attendance records, and reminder settings.
 */

import {
	removeEventAttendanceFromMap,
	upsertEventAttendanceMap
} from '$lib/models/eventAttendanceModel';
import {
	removeEventRow,
	replaceEventRow
} from '$lib/models/eventLifecycleModel';
import { normalizeEventReminderOffsets } from '$lib/models/eventReminderModel';
import { upsertEventResponseMap } from '$lib/models/eventResponseModel';
import {
	archiveEvent,
	cancelEvent,
	createEvent,
	deleteEvent,
	deleteEventAttendanceRecord,
	saveEventReminderSettings,
	restoreEvent,
	updateEvent,
	upsertEventAttendanceRecord,
	upsertOwnEventResponse,
	type EventAttendanceRow,
	type EventAttendanceStatus,
	type EventMemberSignalKind,
	type EventMutationPayload,
	type EventReminderChannel,
	type EventReminderSettingsRow,
	type EventResponseRow,
	type EventResponseStatus,
	type EventRow
} from '$lib/repositories/hubRepository';
import { removeCurrentHubEventState } from './sync';

async function syncAndReplaceEventRow(input: {
	currentRows: EventRow[];
	row: EventRow;
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	const syncedRow = await input.syncEventDeliveryRow(input.row);
	return replaceEventRow(input.currentRows, syncedRow);
}

export async function addCurrentHubEvent(input: {
	orgId: string;
	payload: EventMutationPayload;
	currentRows: EventRow[];
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	const row = await createEvent(input.orgId, input.payload);
	return {
		createdEventId: row.id,
		events: await syncAndReplaceEventRow({
			currentRows: input.currentRows,
			row,
			syncEventDeliveryRow: input.syncEventDeliveryRow
		})
	};
}

export async function updateCurrentHubEvent(input: {
	eventId: string;
	payload: EventMutationPayload;
	currentRows: EventRow[];
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	const existingRow = input.currentRows.find((event) => event.id === input.eventId) ?? null;
	const lifecycleSignal: EventMemberSignalKind =
		existingRow?.canceled_at ? 'canceled' : 'default';
	const row = await updateEvent(input.eventId, {
		...input.payload,
		member_signal_kind: lifecycleSignal,
		member_signal_at: existingRow?.member_signal_at ?? new Date().toISOString()
	});
	return syncAndReplaceEventRow({
		currentRows: input.currentRows,
		row,
		syncEventDeliveryRow: input.syncEventDeliveryRow
	});
}

export async function cancelCurrentHubEvent(input: {
	eventId: string;
	currentRows: EventRow[];
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	const row = await cancelEvent(input.eventId);
	return syncAndReplaceEventRow({
		currentRows: input.currentRows,
		row,
		syncEventDeliveryRow: input.syncEventDeliveryRow
	});
}

export async function archiveCurrentHubEvent(input: {
	eventId: string;
	currentRows: EventRow[];
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	const row = await archiveEvent(input.eventId);
	return syncAndReplaceEventRow({
		currentRows: input.currentRows,
		row,
		syncEventDeliveryRow: input.syncEventDeliveryRow
	});
}

export async function restoreCurrentHubEvent(input: {
	eventId: string;
	currentRows: EventRow[];
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	const row = await restoreEvent(input.eventId);
	return syncAndReplaceEventRow({
		currentRows: input.currentRows,
		row,
		syncEventDeliveryRow: input.syncEventDeliveryRow
	});
}

export async function removeCurrentHubEvent(input: {
	eventId: string;
	currentRows: EventRow[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
}) {
	await deleteEvent(input.eventId);

	return {
		events: removeEventRow(input.currentRows, input.eventId),
		...removeCurrentHubEventState({
			eventId: input.eventId,
			eventResponseMap: input.eventResponseMap,
			eventAttendanceMap: input.eventAttendanceMap,
			eventReminderSettingsMap: input.eventReminderSettingsMap
		})
	};
}

export async function persistCurrentHubEventReminderSettings(input: {
	orgId: string;
	eventId: string;
	reminderOffsets: number[];
	deliveryChannel: EventReminderChannel;
	currentMap: Record<string, EventReminderSettingsRow>;
}) {
	const row = await saveEventReminderSettings(input.eventId, input.orgId, {
		delivery_channel: input.deliveryChannel,
		reminder_offsets: normalizeEventReminderOffsets(input.reminderOffsets)
	});

	return {
		...input.currentMap,
		[input.eventId]: row
	};
}

export async function setCurrentHubEventResponse(input: {
	orgId: string;
	ownProfileId: string;
	eventId: string;
	response: EventResponseStatus;
	currentMap: Record<string, EventResponseRow[]>;
}) {
	const row = await upsertOwnEventResponse({
		eventId: input.eventId,
		organizationId: input.orgId,
		profileId: input.ownProfileId,
		response: input.response
	});

	return upsertEventResponseMap(input.currentMap, row);
}

export async function setCurrentHubEventAttendance(input: {
	orgId: string;
	ownProfileId: string;
	eventId: string;
	profileId: string;
	status: EventAttendanceStatus;
	currentMap: Record<string, EventAttendanceRow[]>;
}) {
	const row = await upsertEventAttendanceRecord({
		eventId: input.eventId,
		organizationId: input.orgId,
		profileId: input.profileId,
		status: input.status,
		markedByProfileId: input.ownProfileId
	});

	return upsertEventAttendanceMap(input.currentMap, row);
}

export async function clearCurrentHubEventAttendance(input: {
	eventId: string;
	profileId: string;
	currentMap: Record<string, EventAttendanceRow[]>;
}) {
	await deleteEventAttendanceRecord(input.eventId, input.profileId);
	return removeEventAttendanceFromMap(input.currentMap, input.eventId, input.profileId);
}
