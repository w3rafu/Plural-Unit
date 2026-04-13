import type {
	BroadcastRow,
	EventRow,
	HubNotificationKind,
	HubNotificationPreferenceRow,
	HubNotificationReadRow
} from '$lib/repositories/hubRepository';
import { isBroadcastLive } from '$lib/models/broadcastLifecycleModel';
import { getEventLocationLabel } from '$lib/models/eventCalendarModel';
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
	title: string;
	summary: string;
	meta: string;
	occurredAt: string;
	label: string;
	isRead: boolean;
	readAt: string | null;
	priority?: number;
};

export type HubNotificationFilter = 'all' | HubNotificationItem['kind'];

export type HubNotificationCounts = {
	all: number;
	broadcast: number;
	event: number;
};

function getBroadcastPriority(broadcast: BroadcastRow) {
	return broadcast.is_pinned ? 0 : 1;
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

export function getHubNotificationId(kind: HubNotificationKind, sourceId: string) {
	return `${kind}:${sourceId}`;
}

export function buildHubNotificationReadMap(
	rows: Array<Pick<HubNotificationReadRow, 'notification_kind' | 'source_id' | 'read_at'>>
): HubNotificationReadMap {
	return Object.fromEntries(
		rows.map((row) => [getHubNotificationId(row.notification_kind, row.source_id), row.read_at])
	);
}

export function upsertHubNotificationReadMap(
	current: HubNotificationReadMap,
	row: Pick<HubNotificationReadRow, 'notification_kind' | 'source_id' | 'read_at'>
): HubNotificationReadMap {
	return {
		...current,
		[getHubNotificationId(row.notification_kind, row.source_id)]: row.read_at
	};
}

export function countUnreadHubNotifications(items: HubNotificationItem[]) {
	return items.filter((item) => !item.isRead).length;
}

export function countHubNotifications(items: HubNotificationItem[]): HubNotificationCounts {
	return items.reduce(
		(counts, item) => {
			counts.all += 1;
			counts[item.kind] += 1;
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

	return items.filter((item) => item.kind === filter);
}

/** Merge broadcasts and events into a single sorted notification list. */
export function buildHubNotifications(input: {
	broadcasts: BroadcastRow[];
	events: EventRow[];
	preferences?: HubNotificationPreferences;
	readMap?: HubNotificationReadMap;
}): HubNotificationItem[] {
	const preferences = input.preferences ?? createDefaultHubNotificationPreferences();
	const readMap = input.readMap ?? {};

	const broadcastItems = preferences.broadcast
		? input.broadcasts.filter((broadcast) => isBroadcastLive(broadcast)).map((broadcast) => {
				const id = getHubNotificationId('broadcast', broadcast.id);
				const readAt = readMap[id] ?? null;

				return {
					id,
					kind: 'broadcast' as const,
					sourceId: broadcast.id,
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
		? input.events.filter((event) => isEventLive(event)).map((event) => {
				const id = getHubNotificationId('event', event.id);
				const readAt = readMap[id] ?? null;

				return {
					id,
					kind: 'event' as const,
					sourceId: event.id,
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

	return [...broadcastItems, ...eventItems].sort((a, b) => {
		if (a.priority !== b.priority) {
			return a.priority - b.priority;
		}

		return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
	});
}