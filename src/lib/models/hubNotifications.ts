import type {
	BroadcastRow,
	EventRow,
	EventMemberSignalKind,
	HubExecutionLedgerRow,
	HubNotificationKind,
	HubNotificationPreferenceRow,
	HubNotificationReadRow
} from '$lib/repositories/hubRepository';
import { isBroadcastLive } from '$lib/models/broadcastLifecycleModel';
import { getEventLocationLabel } from '$lib/models/eventCalendarModel';
import {
	getEventEffectiveEndTime,
	isEventPublishedToMembers,
	isEventWithinMemberHistoryWindow
} from '$lib/models/eventLifecycleModel';
import {
	getMemberEventTimingState,
	type MemberCommitmentTimingState
} from '$lib/models/memberCommitmentModel';
import { formatEventReminderOffset } from '$lib/models/eventReminderModel';
import { formatShortDateTime } from '$lib/utils/dateFormat';

export type HubNotificationPreferences = {
	broadcast: boolean;
	event: boolean;
	message: boolean;
};

export type HubNotificationReadMap = Record<string, string>;

/** Unified notification item combining broadcasts and events for the hub feed. */
export type HubNotificationItem = {
	id: string;
	kind: HubNotificationKind;
	sourceId: string;
	notificationKey: string;
	title: string;
	summary: string;
	meta: string;
	occurredAt: string;
	label: string;
	isRead: boolean;
	readAt: string | null;
	eventTimingState?: MemberCommitmentTimingState;
	eventLifecycleSignal?: EventMemberSignalKind;
	priority?: number;
};

export type HubNotificationFilter = 'all' | 'broadcast' | 'event';

export type HubNotificationCounts = {
	all: number;
	broadcast: number;
	event: number;
};

function getBroadcastPriority(broadcast: BroadcastRow) {
	return broadcast.is_pinned ? 0 : 1;
}

function getNotificationFilterKind(kind: HubNotificationKind): Exclude<HubNotificationFilter, 'all'> {
	return kind === 'broadcast' ? 'broadcast' : 'event';
}

function formatEventMeta(event: EventRow) {
	const startsAt = new Date(event.starts_at);
	const startsText = Number.isNaN(startsAt.getTime())
		? 'Schedule pending'
		: formatShortDateTime(event.starts_at);
	const location = getEventLocationLabel(event.location);

	return location ? `${startsText} · ${location}` : startsText;
}

function joinMeta(parts: Array<string | null | undefined>) {
	return parts.filter((part): part is string => Boolean(part)).join(' · ');
}

function getEventNotificationOccurredAt(
	event: EventRow,
	timingState: MemberCommitmentTimingState
) {
	if (event.member_signal_kind === 'canceled') {
		return event.member_signal_at ?? event.canceled_at ?? event.updated_at;
	}

	if (event.member_signal_kind === 'restored') {
		return event.member_signal_at ?? event.updated_at;
	}

	if (timingState === 'today' || timingState === 'in_progress') {
		return event.starts_at;
	}

	if (timingState === 'recently_completed') {
		return event.ends_at ?? event.starts_at;
	}

	return event.publish_at ?? event.created_at;
}

function getEventNotificationLabel(timingState: MemberCommitmentTimingState) {
	if (timingState === 'today') {
		return 'Today';
	}

	if (timingState === 'in_progress') {
		return 'Live';
	}

	if (timingState === 'recently_completed') {
		return 'Recent';
	}

	return 'Event';
}

function getEventNotificationLifecycleLabel(event: EventRow, timingState: MemberCommitmentTimingState) {
	if (event.member_signal_kind === 'canceled') {
		return 'Canceled';
	}

	if (event.member_signal_kind === 'restored') {
		return 'Restored';
	}

	return getEventNotificationLabel(timingState);
}

function getEventNotificationSummary(
	event: EventRow,
	timingState: MemberCommitmentTimingState
) {
	if (event.member_signal_kind === 'canceled') {
		return 'This event was canceled. Open it to confirm the final timing and any follow-through details.';
	}

	if (event.member_signal_kind === 'restored') {
		return 'This event is back on the schedule. Open it for the latest timing and reminder details.';
	}

	const description = event.description.trim();
	if (description) {
		return description;
	}

	if (timingState === 'today') {
		return 'This event is happening today. Open it for the latest details.';
	}

	if (timingState === 'in_progress') {
		return 'This event is underway now. Open it for the latest details.';
	}

	if (timingState === 'recently_completed') {
		return 'This event wrapped recently. Open it for the latest details.';
	}

	return 'A new event was posted to the hub.';
}

function getEventNotificationMeta(
	event: EventRow,
	timingState: MemberCommitmentTimingState
) {
	if (event.member_signal_kind === 'canceled') {
		return joinMeta([
			formatEventMeta(event),
			`Canceled ${formatShortDateTime(event.member_signal_at ?? event.canceled_at ?? event.updated_at)}`
		]);
	}

	if (event.member_signal_kind === 'restored') {
		return joinMeta([
			formatEventMeta(event),
			`Restored ${formatShortDateTime(event.member_signal_at ?? event.updated_at)}`
		]);
	}

	if (timingState === 'today') {
		return joinMeta([formatEventMeta(event), 'Today']);
	}

	if (timingState === 'in_progress') {
		return joinMeta([formatEventMeta(event), 'In progress']);
	}

	if (timingState === 'recently_completed') {
		return joinMeta([
			formatEventMeta(event),
			`Completed ${formatShortDateTime(event.ends_at ?? event.starts_at)}`
		]);
	}

	return formatEventMeta(event);
}

function buildEventNotification(
	event: EventRow,
	timingState: MemberCommitmentTimingState,
	readMap: HubNotificationReadMap
): HubNotificationItem {
	const notificationKey = 'default';
	const id = getHubNotificationId('event', event.id, notificationKey);
	const readAt = readMap[id] ?? null;

	return {
		id,
		kind: 'event',
		sourceId: event.id,
		notificationKey,
		title: event.title.trim() || 'Event update',
		summary: getEventNotificationSummary(event, timingState),
		meta: getEventNotificationMeta(event, timingState),
		occurredAt: getEventNotificationOccurredAt(event, timingState),
		label: getEventNotificationLifecycleLabel(event, timingState),
		isRead: Boolean(readAt),
		readAt,
		eventTimingState: timingState,
		eventLifecycleSignal: event.member_signal_kind,
		priority: 1
	};
}

function getEventNotificationTimingState(
	event: EventRow,
	now: number
): MemberCommitmentTimingState | null {
	const activeTimingState = getMemberEventTimingState(event, now);
	if (activeTimingState) {
		return activeTimingState;
	}

	if (
		event.member_signal_kind !== 'canceled' ||
		!event.canceled_at ||
		!isEventPublishedToMembers(event, new Date(event.canceled_at).getTime()) ||
		!isEventWithinMemberHistoryWindow(event, now)
	) {
		return null;
	}

	const startsAt = new Date(event.starts_at).getTime();
	const endsAt = getEventEffectiveEndTime(event);
	if (Number.isNaN(startsAt) || endsAt === null) {
		return null;
	}

	if (now < startsAt) {
		const startDate = new Date(startsAt);
		const currentDate = new Date(now);
		return startDate.toDateString() === currentDate.toDateString() ? 'today' : 'upcoming';
	}

	if (now <= endsAt) {
		return 'in_progress';
	}

	return 'recently_completed';
}

export function createDefaultHubNotificationPreferences(): HubNotificationPreferences {
	return {
		broadcast: true,
		event: true,
		message: true
	};
}

export function normalizeHubNotificationPreferences(
	row: HubNotificationPreferenceRow | null | undefined
): HubNotificationPreferences {
	const defaults = createDefaultHubNotificationPreferences();

	return {
		broadcast: row?.broadcast_enabled ?? defaults.broadcast,
		event: row?.event_enabled ?? defaults.event,
		message: row?.message_enabled ?? defaults.message
	};
}

export function hasEnabledHubNotificationPreferences(preferences: HubNotificationPreferences) {
	return preferences.broadcast || preferences.event;
}

export function getHubNotificationId(
	kind: HubNotificationKind,
	sourceId: string,
	notificationKey = 'default'
) {
	return notificationKey === 'default'
		? `${kind}:${sourceId}`
		: `${kind}:${sourceId}:${notificationKey}`;
}

export function buildHubNotificationReadMap(
	rows: Array<
		Pick<HubNotificationReadRow, 'notification_kind' | 'source_id' | 'notification_key' | 'read_at'>
	>
): HubNotificationReadMap {
	return Object.fromEntries(
		rows.map((row) => [
			getHubNotificationId(row.notification_kind, row.source_id, row.notification_key),
			row.read_at
		])
	);
}

export function upsertHubNotificationReadMap(
	current: HubNotificationReadMap,
	row: Pick<
		HubNotificationReadRow,
		'notification_kind' | 'source_id' | 'notification_key' | 'read_at'
	>
): HubNotificationReadMap {
	return {
		...current,
		[getHubNotificationId(row.notification_kind, row.source_id, row.notification_key)]: row.read_at
	};
}

export function countUnreadHubNotifications(items: HubNotificationItem[]) {
	return items.filter((item) => !item.isRead).length;
}

export function countHubNotifications(items: HubNotificationItem[]): HubNotificationCounts {
	return items.reduce(
		(counts, item) => {
			counts.all += 1;
			counts[getNotificationFilterKind(item.kind)] += 1;
			return counts;
		},
		{ all: 0, broadcast: 0, event: 0 } satisfies HubNotificationCounts
	);
}

export function filterHubNotifications(
	items: HubNotificationItem[],
	filter: HubNotificationFilter
) {
	if (filter === 'all') {
		return items;
	}

	return items.filter((item) => getNotificationFilterKind(item.kind) === filter);
}

function buildEventReminderNotification(
	row: HubExecutionLedgerRow,
	event: EventRow,
	timingState: MemberCommitmentTimingState,
	readMap: HubNotificationReadMap
): HubNotificationItem {
	const notificationKey = row.execution_key;
	const id = getHubNotificationId('event_reminder', event.id, notificationKey);
	const readAt = readMap[id] ?? null;
	const offsetMinutes = Number.parseInt(row.execution_key, 10);
	const reminderLabel = Number.isInteger(offsetMinutes) && offsetMinutes > 0
		? formatEventReminderOffset(offsetMinutes)
		: 'Event starts soon';
	const eventDescription = event.description.trim();
	const reminderSentAt = row.processed_at ?? row.due_at;
	const detailCopy =
		timingState === 'in_progress'
			? `This event is underway. The last reminder went out ${reminderLabel}.`
			: timingState === 'recently_completed'
				? `This event wrapped recently. The last reminder went out ${reminderLabel}.`
				: `Reminder sent ${reminderLabel}. Open the event for the latest details.`;

	return {
		id,
		kind: 'event_reminder',
		sourceId: event.id,
		notificationKey,
		title: event.title.trim() || 'Event reminder',
		summary: eventDescription ? `${eventDescription} ${detailCopy}` : detailCopy,
		meta: joinMeta([
			getEventNotificationMeta(event, timingState),
			`Reminder sent ${formatShortDateTime(reminderSentAt)}`
		]),
		occurredAt: reminderSentAt,
		label: 'Reminder',
		isRead: Boolean(readAt),
		readAt,
		eventTimingState: timingState,
		priority: 1
	};
}

/** Merge broadcasts and events into a single sorted notification list. */
export function buildHubNotifications(input: {
	broadcasts: BroadcastRow[];
	events: EventRow[];
	reminderExecutions?: HubExecutionLedgerRow[];
	preferences?: HubNotificationPreferences;
	readMap?: HubNotificationReadMap;
}, now = Date.now()): HubNotificationItem[] {
	const preferences = input.preferences ?? createDefaultHubNotificationPreferences();
	const readMap = input.readMap ?? {};
	const visibleEvents = input.events
		.map((event) => ({ event, timingState: getEventNotificationTimingState(event, now) }))
		.filter(
			(item): item is { event: EventRow; timingState: MemberCommitmentTimingState } =>
				item.timingState !== null
		);
	const visibleEventMap = new Map(visibleEvents.map((item) => [item.event.id, item]));

	const broadcastItems = preferences.broadcast
		? input.broadcasts.filter((broadcast) => isBroadcastLive(broadcast)).map((broadcast) => {
				const notificationKey = 'default';
				const id = getHubNotificationId('broadcast', broadcast.id, notificationKey);
				const readAt = readMap[id] ?? null;

				return {
					id,
					kind: 'broadcast' as const,
					sourceId: broadcast.id,
					notificationKey,
					title: broadcast.title.trim() || 'Broadcast',
					summary: broadcast.body.trim(),
					meta: broadcast.is_pinned
						? `Pinned · ${formatShortDateTime(broadcast.publish_at ?? broadcast.created_at)}`
						: formatShortDateTime(broadcast.publish_at ?? broadcast.created_at),
					occurredAt: broadcast.publish_at ?? broadcast.created_at,
					label: 'Broadcast',
					isRead: Boolean(readAt),
					readAt,
					priority: getBroadcastPriority(broadcast)
				};
			})
		: [];

	const eventItems = preferences.event
		? visibleEvents.map(({ event, timingState }) =>
				buildEventNotification(event, timingState, readMap)
			)
		: [];

	const reminderItems = preferences.event
		? (input.reminderExecutions ?? [])
				.filter(
					(row) => row.job_kind === 'event_reminder' && row.execution_state === 'processed'
				)
				.map((row) => {
					const eventEntry = visibleEventMap.get(row.source_id);
					return eventEntry
						? buildEventReminderNotification(row, eventEntry.event, eventEntry.timingState, readMap)
						: null;
				})
				.filter((item): item is HubNotificationItem => item !== null)
		: [];

	return [...broadcastItems, ...eventItems, ...reminderItems].sort((a, b) => {
		const priorityA = a.priority ?? 1;
		const priorityB = b.priority ?? 1;

		if (priorityA !== priorityB) {
			return priorityA - priorityB;
		}

		return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
	});
}
