import type { BroadcastRow, EventRow } from '$lib/repositories/hubRepository';
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
};

function formatEventMeta(event: EventRow) {
	const startsAt = new Date(event.starts_at);
	const startsText = Number.isNaN(startsAt.getTime())
		? 'Schedule pending'
		: formatShortDateTime(event.starts_at);

	return event.location.trim() ? `${startsText} · ${event.location.trim()}` : startsText;
}

/** Merge broadcasts and events into a single sorted notification list. */
export function buildHubNotifications(input: {
	broadcasts: BroadcastRow[];
	events: EventRow[];
}): HubNotificationItem[] {
	const broadcastItems = input.broadcasts.map((broadcast) => ({
		id: `broadcast:${broadcast.id}`,
		kind: 'broadcast' as const,
		title: broadcast.title.trim() || 'Broadcast',
		summary: broadcast.body.trim(),
		meta: formatShortDateTime(broadcast.created_at),
		occurredAt: broadcast.created_at,
		label: 'Broadcast'
	}));

	const eventItems = input.events.map((event) => ({
		id: `event:${event.id}`,
		kind: 'event' as const,
		title: event.title.trim() || 'Event update',
		summary: event.description.trim() || 'A new event was posted to the hub.',
		meta: formatEventMeta(event),
		occurredAt: event.created_at,
		label: 'Event'
	}));

	return [...broadcastItems, ...eventItems].sort(
		(a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
	);
}