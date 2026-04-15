/**
 * currentHub/sync — persistence helpers for delivery metadata and queue state.
 *
 * This file owns the side effects that keep scheduled delivery rows and the
 * execution ledger aligned with the current broadcast/event state.
 */

import {
	buildExpectedHubExecutionLedgerRows,
	buildHubExecutionLedgerSyncPlan,
	getHubExecutionLedgerKey,
	mergeHubExecutionLedgerRows,
	sortHubExecutionLedgerRows
} from '$lib/models/hubExecutionLedger';
import {
	getBroadcastDeliveryPatch,
	getEventDeliveryPatch
} from '$lib/models/scheduledDeliveryModel';
import {
	deleteHubExecutionLedgerEntries,
	updateBroadcastDeliveryState,
	updateEventDeliveryState,
	upsertHubExecutionLedgerEntries,
	type BroadcastRow,
	type EventReminderSettingsRow,
	type EventResponseRow,
	type EventAttendanceRow,
	type EventRow,
	type HubExecutionLedgerMutationPayload,
	type HubExecutionLedgerRow
} from '$lib/repositories/hubRepository';

type ExpectedHubExecutionRow = ReturnType<typeof buildExpectedHubExecutionLedgerRows>[number];

export async function syncCurrentHubBroadcastDeliveryRow(row: BroadcastRow) {
	const patch = getBroadcastDeliveryPatch(row);
	if (!patch) {
		return row;
	}

	return updateBroadcastDeliveryState(row.id, patch);
}

export async function syncCurrentHubEventDeliveryRow(row: EventRow) {
	const patch = getEventDeliveryPatch(row);
	if (!patch) {
		return row;
	}

	return updateEventDeliveryState(row.id, patch);
}

export async function syncCurrentHubExecutionLedgerRows(input: {
	orgId: string | null;
	isAdmin: boolean;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
	currentRows: HubExecutionLedgerRow[];
}) {
	if (!input.orgId || !input.isAdmin) {
		return [] as HubExecutionLedgerRow[];
	}

	const { upsertEntries, deleteEntryIds } = buildHubExecutionLedgerSyncPlan({
		broadcasts: input.broadcasts,
		events: input.events,
		eventReminderSettings: input.eventReminderSettingsMap,
		currentRows: input.currentRows
	});

	if (upsertEntries.length === 0 && deleteEntryIds.length === 0) {
		return sortHubExecutionLedgerRows(input.currentRows);
	}

	const upsertedRows = upsertEntries.length
		? await upsertHubExecutionLedgerEntries(upsertEntries)
		: [];

	if (deleteEntryIds.length > 0) {
		await deleteHubExecutionLedgerEntries(deleteEntryIds);
	}

	return mergeHubExecutionLedgerRows(input.currentRows, upsertedRows, deleteEntryIds);
}

export function getCurrentHubExpectedExecutionLedgerRow(input: {
	broadcasts: BroadcastRow[];
	events: EventRow[];
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
	row: Pick<HubExecutionLedgerRow, 'job_kind' | 'source_id' | 'execution_key'>;
}): ExpectedHubExecutionRow | null {
	return (
		buildExpectedHubExecutionLedgerRows({
			broadcasts: input.broadcasts,
			events: input.events,
			eventReminderSettings: input.eventReminderSettingsMap
		}).find(
			(entry) =>
				getHubExecutionLedgerKey(entry.job_kind, entry.source_id, entry.execution_key) ===
				getHubExecutionLedgerKey(input.row.job_kind, input.row.source_id, input.row.execution_key)
		) ?? null
	);
}

export async function upsertCurrentHubExecutionLedgerEntry(
	currentRows: HubExecutionLedgerRow[],
	entry: HubExecutionLedgerMutationPayload
) {
	const [upsertedRow] = await upsertHubExecutionLedgerEntries([entry]);
	return mergeHubExecutionLedgerRows(currentRows, [upsertedRow], []);
}

export async function deleteCurrentHubExecutionLedgerEntry(
	currentRows: HubExecutionLedgerRow[],
	entryId: string
) {
	await deleteHubExecutionLedgerEntries([entryId]);
	return sortHubExecutionLedgerRows(currentRows.filter((entry) => entry.id !== entryId));
}

export function removeCurrentHubEventState(input: {
	eventId: string;
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
}) {
	const nextEventResponseMap = { ...input.eventResponseMap };
	const nextEventAttendanceMap = { ...input.eventAttendanceMap };
	const nextEventReminderSettingsMap = { ...input.eventReminderSettingsMap };

	delete nextEventResponseMap[input.eventId];
	delete nextEventAttendanceMap[input.eventId];
	delete nextEventReminderSettingsMap[input.eventId];

	return {
		eventResponseMap: nextEventResponseMap,
		eventAttendanceMap: nextEventAttendanceMap,
		eventReminderSettingsMap: nextEventReminderSettingsMap
	};
}
