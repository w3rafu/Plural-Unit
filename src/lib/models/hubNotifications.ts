import type { BroadcastRow, EventRow } from '$lib/repositories/hubRepository';
import { isBroadcastLive } from '$lib/models/broadcastLifecycleModel';
import { getEventLocationLabel } from '$lib/models/eventCalendarModel';
import { isEventLive } from '$lib/models/eventLifecycleModel';
import { formatShortDateTime } from '$lib/utils/dateFormat';

/** Unified notification item combining broadcasts and events for the hub feed. */
export type HubNotificationItem = {
	id: string;
	kind: 'broadcast' | 'event';
	title: string;
	summary: string;
	meta: string;
	occurredAt: string;
	label: string;
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
}): HubNotificationItem[] {
	const broadcastItems = input.broadcasts.filter((broadcast) => isBroadcastLive(broadcast)).map((broadcast) => ({
		id: `broadcast:${broadcast.id}`,
		kind: 'broadcast' as const,
		title: broadcast.title.trim() || 'Broadcast',
		summary: broadcast.body.trim(),
		meta: broadcast.is_pinned
			? `Pinned · ${formatShortDateTime(broadcast.publish_at ?? broadcast.created_at)}`
			: formatShortDateTime(broadcast.publish_at ?? broadcast.created_at),
		occurredAt: broadcast.publish_at ?? broadcast.created_at,
		label: 'Broadcast',
		priority: getBroadcastPriority(broadcast)
	}));

	const eventItems = input.events.filter((event) => isEventLive(event)).map((event) => ({
		id: `event:${event.id}`,
		kind: 'event' as const,
		title: event.title.trim() || 'Event update',
		summary: event.description.trim() || 'A new event was posted to the hub.',
		meta: formatEventMeta(event),
		occurredAt: event.created_at,
		label: 'Event',
		priority: 1
	}));

	return [...broadcastItems, ...eventItems].sort((a, b) => {
		if (a.priority !== b.priority) {
			return a.priority - b.priority;
		}

		return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
	});
}