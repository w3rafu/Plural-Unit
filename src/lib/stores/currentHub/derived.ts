/**
 * currentHub/derived — read-only selectors and summaries for hub state.
 *
 * These helpers keep `currentHub.svelte.ts` from recomputing presentation
 * data inline. Nothing here writes to Supabase or mutates store state.
 */

import type { OrganizationMember } from '$lib/models/organizationModel';
import {
	buildBroadcastAcknowledgmentRoster,
	type BroadcastAcknowledgmentMap,
	type BroadcastAcknowledgmentRoster
} from '$lib/models/broadcastAcknowledgmentModel';
import {
	buildEventResponseRoster,
	getOwnEventResponseForProfile,
	summarizeEventResponses,
	type EventAttendanceSummary,
	type EventResponseRoster
} from '$lib/models/eventResponseModel';
import {
	buildEventAttendanceRoster,
	getEventAttendanceForProfile,
	isEventAttendanceWindowOpen,
	summarizeEventAttendance,
	type EventAttendanceRoster,
	type EventAttendanceOutcomeSummary
} from '$lib/models/eventAttendanceModel';
import {
	buildHubAdminEngagementSummary,
	buildHubEventFollowUpSignals,
	getBroadcastEngagementSignal as buildBroadcastEngagementSignal,
	getEventEngagementSignal as buildEventEngagementSignal,
	type HubAdminEngagementSummary,
	type HubEventFollowUpSignal,
	type HubEngagementSignal
} from '$lib/models/hubEngagementModel';
import {
	buildHubExecutionQueueFollowUpSignals,
	type HubExecutionQueueFollowUpSignal,
	type HubExecutionTriageMap
} from '$lib/models/hubExecutionQueue';
import {
	buildHubNotifications,
	countUnreadHubNotifications,
	type HubNotificationItem,
	type HubNotificationPreferences
} from '$lib/models/hubNotifications';
import {
	buildBroadcastExecutionDiagnostics,
	buildEventExecutionDiagnostics,
	type HubExecutionDiagnosticEntry
} from '$lib/models/hubExecutionDiagnostics';
import {
	summarizeEventReminderSchedule,
	type EventReminderSummary
} from '$lib/models/eventReminderModel';
import {
	getBroadcastDeliveryStatus,
	getEventDeliveryStatus,
	type ScheduledDeliveryStatus
} from '$lib/models/scheduledDeliveryModel';
import type {
	BroadcastRow,
	EventAttendanceRow,
	EventAttendanceStatus,
	EventReminderSettingsRow,
	EventResponseRow,
	EventResponseStatus,
	EventRow,
	HubExecutionLedgerRow
} from '$lib/repositories/hubRepository';

type CurrentHubEventSummaryInput = {
	events: EventRow[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
};

type CurrentHubEventLookupInput = {
	events: EventRow[];
	eventId: string;
};

function buildEventAttendanceSummaryMap({
	events,
	eventResponseMap
}: Pick<CurrentHubEventSummaryInput, 'events' | 'eventResponseMap'>) {
	return Object.fromEntries(
		events.map((event) => [event.id, summarizeEventResponses(eventResponseMap[event.id] ?? [])])
	);
}

function buildEventAttendanceOutcomeSummaryMap({
	events,
	eventAttendanceMap
}: Pick<CurrentHubEventSummaryInput, 'events' | 'eventAttendanceMap'>) {
	return Object.fromEntries(
		events.map((event) => [event.id, summarizeEventAttendance(eventAttendanceMap[event.id] ?? [])])
	);
}

function findEventById({ events, eventId }: CurrentHubEventLookupInput) {
	return events.find((event) => event.id === eventId) ?? null;
}

function findBroadcastById(broadcasts: BroadcastRow[], broadcastId: string) {
	return broadcasts.find((broadcast) => broadcast.id === broadcastId) ?? null;
}

export function getCurrentHubEngagementSummary(input: {
	events: EventRow[];
	broadcasts: BroadcastRow[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
	queueTriageMap?: HubExecutionTriageMap;
}): HubAdminEngagementSummary {
	const eventAttendances = buildEventAttendanceSummaryMap(input);
	const eventAttendanceOutcomes = buildEventAttendanceOutcomeSummaryMap(input);
	const followUpSignals = buildHubExecutionQueueFollowUpSignals({
		signals: buildHubEventFollowUpSignals({
			events: input.events,
			eventAttendances,
			eventAttendanceOutcomes
		}),
		triageMap: input.queueTriageMap
	});

	return buildHubAdminEngagementSummary({
		events: input.events,
		broadcasts: input.broadcasts,
		eventAttendances,
		eventAttendanceOutcomes,
		followUpSignals
	});
}

export function getCurrentHubEventFollowUpSignals(
	input: CurrentHubEventSummaryInput & {
		queueTriageMap?: HubExecutionTriageMap;
		includeTriaged?: boolean;
	}
): HubExecutionQueueFollowUpSignal[] {
	const eventAttendances = buildEventAttendanceSummaryMap(input);
	const eventAttendanceOutcomes = buildEventAttendanceOutcomeSummaryMap(input);

	return buildHubExecutionQueueFollowUpSignals({
		signals: buildHubEventFollowUpSignals({
			events: input.events,
			eventAttendances,
			eventAttendanceOutcomes
		}),
		triageMap: input.queueTriageMap,
		includeTriaged: input.includeTriaged
	});
}

export function getCurrentHubAllActivityFeed(input: {
	activeBroadcasts: BroadcastRow[];
	events: EventRow[];
	processedReminderExecutionItems: HubExecutionLedgerRow[];
	notificationReadMap: Record<string, string>;
}): HubNotificationItem[] {
	return buildHubNotifications({
		broadcasts: input.activeBroadcasts,
		events: input.events,
		reminderExecutions: input.processedReminderExecutionItems,
		readMap: input.notificationReadMap
	});
}

export function getCurrentHubActivityFeed(
	allActivityFeed: HubNotificationItem[],
	notificationPreferences: HubNotificationPreferences
) {
	return allActivityFeed.filter(
		(item) => notificationPreferences[item.kind === 'broadcast' ? 'broadcast' : 'event']
	);
}

export function getCurrentHubUnreadActivityCount(activityFeed: HubNotificationItem[]) {
	return countUnreadHubNotifications(activityFeed);
}

export function getCurrentHubEventReminderSettings(
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>,
	eventId: string
): EventReminderSettingsRow | null {
	return eventReminderSettingsMap[eventId] ?? null;
}

export function getCurrentHubEventReminderOffsets(
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>,
	eventId: string
) {
	return getCurrentHubEventReminderSettings(eventReminderSettingsMap, eventId)?.reminder_offsets ?? [];
}

export function getCurrentHubEventReminderSummary(input: {
	events: EventRow[];
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
	eventId: string;
}): EventReminderSummary | null {
	const event = findEventById(input);
	if (!event) {
		return null;
	}

	return summarizeEventReminderSchedule(
		event,
		getCurrentHubEventReminderOffsets(input.eventReminderSettingsMap, input.eventId)
	);
}

export function getCurrentHubBroadcastDeliveryStatus(
	broadcasts: BroadcastRow[],
	broadcastId: string
): ScheduledDeliveryStatus | null {
	const broadcast = findBroadcastById(broadcasts, broadcastId);
	return broadcast ? getBroadcastDeliveryStatus(broadcast) : null;
}

export function getCurrentHubBroadcastExecutionDiagnostics(input: {
	broadcasts: BroadcastRow[];
	executionLedger: HubExecutionLedgerRow[];
	broadcastId: string;
}): HubExecutionDiagnosticEntry[] {
	const broadcast = findBroadcastById(input.broadcasts, input.broadcastId);
	if (!broadcast) {
		return [];
	}

	return buildBroadcastExecutionDiagnostics({
		broadcast,
		executionLedger: input.executionLedger
	});
}

export function getCurrentHubBroadcastAcknowledgmentRoster(input: {
	broadcasts: BroadcastRow[];
	members: OrganizationMember[];
	broadcastAcknowledgmentMap: BroadcastAcknowledgmentMap;
	broadcastId: string;
	ownProfileId: string | null;
}): BroadcastAcknowledgmentRoster | null {
	const broadcast = findBroadcastById(input.broadcasts, input.broadcastId);
	if (!broadcast) {
		return null;
	}

	return buildBroadcastAcknowledgmentRoster(
		input.members,
		input.broadcastAcknowledgmentMap[input.broadcastId] ?? [],
		input.ownProfileId ?? ''
	);
}

export function getCurrentHubEventDeliveryStatus(
	events: EventRow[],
	eventId: string
): ScheduledDeliveryStatus | null {
	const event = findEventById({ events, eventId });
	return event ? getEventDeliveryStatus(event) : null;
}

export function getCurrentHubEventExecutionDiagnostics(input: {
	events: EventRow[];
	executionLedger: HubExecutionLedgerRow[];
	eventId: string;
}): HubExecutionDiagnosticEntry[] {
	const event = findEventById({ events: input.events, eventId: input.eventId });
	if (!event) {
		return [];
	}

	return buildEventExecutionDiagnostics({
		event,
		executionLedger: input.executionLedger
	});
}

export function getCurrentHubEventAttendanceSummary(
	eventResponseMap: Record<string, EventResponseRow[]>,
	eventId: string
): EventAttendanceSummary {
	return summarizeEventResponses(eventResponseMap[eventId] ?? []);
}

export function getCurrentHubEventAttendanceOutcomeSummary(
	eventAttendanceMap: Record<string, EventAttendanceRow[]>,
	eventId: string
): EventAttendanceOutcomeSummary {
	return summarizeEventAttendance(eventAttendanceMap[eventId] ?? []);
}

export function getCurrentHubEventAttendanceRoster(input: {
	events: EventRow[];
	members: OrganizationMember[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
	eventId: string;
	ownProfileId: string | null;
}): EventAttendanceRoster | null {
	const event = findEventById(input);
	if (!event || !isEventAttendanceWindowOpen(event)) {
		return null;
	}

	return buildEventAttendanceRoster(
		input.members,
		input.eventResponseMap[input.eventId] ?? [],
		input.eventAttendanceMap[input.eventId] ?? [],
		input.ownProfileId ?? ''
	);
}

export function getCurrentHubEventResponseRoster(input: {
	events: EventRow[];
	members: OrganizationMember[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventId: string;
	ownProfileId: string | null;
}): EventResponseRoster | null {
	const event = findEventById(input);
	if (!event) {
		return null;
	}

	return buildEventResponseRoster(
		input.members,
		input.eventResponseMap[input.eventId] ?? [],
		input.ownProfileId ?? ''
	);
}

export function getCurrentHubEventEngagementSignal(input: {
	events: EventRow[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
	eventId: string;
}): HubEngagementSignal | null {
	const event = findEventById(input);
	if (!event) {
		return null;
	}

	return buildEventEngagementSignal(
		event,
		getCurrentHubEventAttendanceSummary(input.eventResponseMap, input.eventId),
		getCurrentHubEventReminderSummary(input)
	);
}

export function getCurrentHubBroadcastEngagementSignal(
	broadcasts: BroadcastRow[],
	broadcastId: string
): HubEngagementSignal | null {
	const broadcast = findBroadcastById(broadcasts, broadcastId);
	return broadcast ? buildBroadcastEngagementSignal(broadcast) : null;
}

export function getCurrentHubEventAttendanceStatus(
	eventAttendanceMap: Record<string, EventAttendanceRow[]>,
	eventId: string,
	profileId: string
): EventAttendanceStatus | null {
	return getEventAttendanceForProfile(eventAttendanceMap[eventId] ?? [], profileId);
}

export function getCurrentHubOwnEventAttendance(input: {
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
	eventId: string;
	ownProfileId: string | null;
}): EventAttendanceStatus | null {
	if (!input.ownProfileId) {
		return null;
	}

	return getCurrentHubEventAttendanceStatus(
		input.eventAttendanceMap,
		input.eventId,
		input.ownProfileId
	);
}

export function getCurrentHubOwnEventResponse(input: {
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventId: string;
	ownProfileId: string | null;
}): EventResponseStatus | null {
	if (!input.ownProfileId) {
		return null;
	}

	return getOwnEventResponseForProfile(
		input.eventResponseMap[input.eventId] ?? [],
		input.ownProfileId
	);
}
