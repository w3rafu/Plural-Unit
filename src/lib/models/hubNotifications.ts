import type {
	BroadcastRow,
	EventRow,
	HubExecutionLedgerRow,
	HubNotificationKind,
	HubNotificationPreferenceRow,
	HubNotificationReadRow
} from '$lib/repositories/hubRepository';
import { isBroadcastLive } from '$lib/models/broadcastLifecycleModel';
import { getEventLocationLabel } from '$lib/models/eventCalendarModel';
import { formatEventReminderOffset } from '$lib/models/eventReminderModel';
import { isEventLive } from '$lib/models/eventLifecycleModel';
import { formatShortDateTime } from '$lib/utils/dateFormat';

export type HubNotificationPreferences = {
	broadcast: boolean;
	event: boolean;
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

export function createDefaultHubNotificationPreferences(): HubNotificationPreferences {
	return {
		broadcast: true,
		event: true
	};
}

export function normalizeHubNotificationPreferences(
	row: HubNotificationPreferenceRow | null | undefined
): HubNotificationPreferences {
	const defaults = createDefaultHubNotificationPreferences();

	return {
		broadcast: row?.broadcast_enabled ?? defaults.broadcast,
		event: row?.event_enabled ?? defaults.event
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

	return {
		id,
		kind: 'event_reminder',
		sourceId: event.id,
		notificationKey,
		title: event.title.trim() || 'Event reminder',
		summary: eventDescription
			? `${eventDescription} Reminder sent ${reminderLabel}.`
			: `Reminder sent ${reminderLabel}. Open the event for the latest details.`,
		meta: `${formatEventMeta(event)} · Reminder sent ${formatShortDateTime(row.processed_at ?? row.due_at)}`,
		occurredAt: row.processed_at ?? row.due_at,
		label: 'Reminder',
		isRead: Boolean(readAt),
		readAt,
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
}): HubNotificationItem[] {
	const preferences = input.preferences ?? createDefaultHubNotificationPreferences();
	const readMap = input.readMap ?? {};
	const liveEvents = input.events.filter((event) => isEventLive(event));
	const liveEventMap = new Map(liveEvents.map((event) => [event.id, event]));

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
		? liveEvents.map((event) => {
				const notificationKey = 'default';
				const id = getHubNotificationId('event', event.id, notificationKey);
				const readAt = readMap[id] ?? null;

				return {
					id,
					kind: 'event' as const,
					sourceId: event.id,
					notificationKey,
					title: event.title.trim() || 'Event update',
					summary: event.description.trim() || 'A new event was posted to the hub.',
					meta: formatEventMeta(event),
					occurredAt: event.created_at,
					label: 'Event',
					isRead: Boolean(readAt),
					readAt,
					priority: 1
				};
			})
		: [];

	const reminderItems = preferences.event
		? (input.reminderExecutions ?? [])
				.filter(
					(row) => row.job_kind === 'event_reminder' && row.execution_state === 'processed'
				)
				.map((row) => {
					const event = liveEventMap.get(row.source_id);
					return event ? buildEventReminderNotification(row, event, readMap) : null;
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