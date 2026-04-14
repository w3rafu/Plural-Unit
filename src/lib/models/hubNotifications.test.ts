import { describe, expect, it } from 'vitest';
import {
	buildHubNotificationReadMap,
	buildHubNotifications,
	countHubNotifications,
	countUnreadHubNotifications,
	createDefaultHubNotificationPreferences,
	filterHubNotifications
} from './hubNotifications';

function makeBroadcast(overrides: Partial<{
	id: string;
	organization_id: string;
	title: string;
	body: string;
	created_at: string;
	updated_at: string;
	is_pinned: boolean;
	is_draft: boolean;
	publish_at: string | null;
	archived_at: string | null;
	expires_at: string | null;
}> = {}) {
	return {
		id: overrides.id ?? 'b1',
		organization_id: overrides.organization_id ?? 'org1',
		title: overrides.title ?? 'Broadcast title',
		body: overrides.body ?? 'Broadcast body',
		created_at: overrides.created_at ?? '2026-04-05T18:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-05T18:00:00.000Z',
		is_pinned: overrides.is_pinned ?? false,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? null,
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null
	};
}

function makeEvent(overrides: Partial<{
	id: string;
	organization_id: string;
	title: string;
	description: string;
	starts_at: string;
	ends_at: string | null;
	location: string;
	created_at: string;
	updated_at: string;
	publish_at: string | null;
	canceled_at: string | null;
	archived_at: string | null;
}> = {}) {
	return {
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org1',
		title: overrides.title ?? 'Event title',
		description: overrides.description ?? 'Event description',
		starts_at: overrides.starts_at ?? '2026-04-20T16:30:00.000Z',
		ends_at: overrides.ends_at ?? null,
		location: overrides.location ?? 'Main Hall',
		created_at: overrides.created_at ?? '2026-04-06T12:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-06T12:00:00.000Z',
		publish_at: overrides.publish_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null
	};
}

function makeReminderExecutionRow(overrides: Partial<{
	id: string;
	organization_id: string;
	source_id: string;
	execution_key: string;
	due_at: string;
	processed_at: string | null;
	execution_state: 'pending' | 'processed' | 'failed' | 'skipped';
}> = {}) {
	return {
		id: overrides.id ?? 'exec-1',
		organization_id: overrides.organization_id ?? 'org1',
		job_kind: 'event_reminder' as const,
		source_id: overrides.source_id ?? 'e1',
		execution_key: overrides.execution_key ?? '120',
		due_at: overrides.due_at ?? '2026-04-20T14:30:00.000Z',
		execution_state: overrides.execution_state ?? 'processed',
		processed_at: overrides.processed_at ?? '2026-04-20T14:30:00.000Z',
		last_attempted_at: overrides.processed_at ?? '2026-04-20T14:30:00.000Z',
		attempt_count: 1,
		last_failure_reason: null,
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-20T14:30:00.000Z'
	};
}

describe('buildHubNotifications', () => {
	it('merges broadcasts and events newest first', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast()],
			events: [makeEvent()]
		});

		expect(notifications.map((item) => item.id)).toEqual(['event:e1', 'broadcast:b1']);
		expect(notifications[0]?.label).toBe('Event');
		expect(notifications[1]?.label).toBe('Broadcast');
	});

	it('uses a fallback event summary when description is blank', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [makeEvent({ description: '   ' })]
		});

		expect(notifications[0]?.summary).toBe('A new event was posted to the hub.');
	});

	it('returns an empty array when both lists are empty', () => {
		const notifications = buildHubNotifications({ broadcasts: [], events: [] });
		expect(notifications).toEqual([]);
	});

	it('handles broadcasts only', () => {
		const notifications = buildHubNotifications({
			broadcasts: [
				makeBroadcast({ id: 'b1', created_at: '2026-04-05T10:00:00.000Z' }),
				makeBroadcast({ id: 'b2', created_at: '2026-04-06T10:00:00.000Z' })
			],
			events: []
		});

		expect(notifications).toHaveLength(2);
		expect(notifications.map((n) => n.id)).toEqual(['broadcast:b2', 'broadcast:b1']);
		expect(notifications.every((n) => n.kind === 'broadcast')).toBe(true);
	});

	it('handles events only', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [
				makeEvent({ id: 'e1', created_at: '2026-04-01T12:00:00.000Z' }),
				makeEvent({ id: 'e2', created_at: '2026-04-03T12:00:00.000Z' })
			]
		});

		expect(notifications).toHaveLength(2);
		expect(notifications.map((n) => n.id)).toEqual(['event:e2', 'event:e1']);
		expect(notifications.every((n) => n.kind === 'event')).toBe(true);
	});

	it('sorts interleaved items by occurredAt descending', () => {
		const notifications = buildHubNotifications({
			broadcasts: [
				makeBroadcast({ id: 'b1', created_at: '2026-04-01T00:00:00.000Z' }),
				makeBroadcast({ id: 'b2', created_at: '2026-04-03T00:00:00.000Z' }),
				makeBroadcast({ id: 'b3', created_at: '2026-04-05T00:00:00.000Z' })
			],
			events: [
				makeEvent({ id: 'e1', created_at: '2026-04-02T00:00:00.000Z' }),
				makeEvent({ id: 'e2', created_at: '2026-04-04T00:00:00.000Z' })
			]
		});

		expect(notifications.map((n) => n.id)).toEqual([
			'broadcast:b3',
			'event:e2',
			'broadcast:b2',
			'event:e1',
			'broadcast:b1'
		]);
	});

	it('uses fallback title when broadcast title is empty', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ title: '   ' })],
			events: []
		});

		expect(notifications[0]?.title).toBe('Broadcast');
	});

	it('uses fallback title when event title is empty', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [makeEvent({ title: '  ' })]
		});

		expect(notifications[0]?.title).toBe('Event update');
	});

	it('includes location in event meta when present', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [makeEvent({ location: 'Room A' })]
		});

		expect(notifications[0]?.meta).toContain('Room A');
	});

	it('omits location from event meta when blank', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [makeEvent({ location: '   ' })]
		});

		expect(notifications[0]?.meta).not.toContain('·');
	});

	it('trims broadcast body for summary', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ body: '  Some content  ' })],
			events: []
		});

		expect(notifications[0]?.summary).toBe('Some content');
	});

	it('sets occurredAt to created_at for both kinds', () => {
		const bDate = '2026-04-05T10:00:00.000Z';
		const eDate = '2026-04-06T10:00:00.000Z';
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ created_at: bDate })],
			events: [makeEvent({ created_at: eDate })]
		});

		expect(notifications[0]?.occurredAt).toBe(eDate);
		expect(notifications[1]?.occurredAt).toBe(bDate);
	});

	it('assigns correct labels', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast()],
			events: [makeEvent()]
		});

		expect(notifications.find((n) => n.kind === 'broadcast')?.label).toBe('Broadcast');
		expect(notifications.find((n) => n.kind === 'event')?.label).toBe('Event');
	});

	it('handles items with identical timestamps', () => {
		const sameTime = '2026-04-05T12:00:00.000Z';
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ id: 'b1', created_at: sameTime })],
			events: [makeEvent({ id: 'e1', created_at: sameTime })]
		});

		expect(notifications).toHaveLength(2);
		// Both present, order is stable (broadcast first from spread order when equal)
		expect(notifications.map((n) => n.id)).toContain('broadcast:b1');
		expect(notifications.map((n) => n.id)).toContain('event:e1');
	});

	it('keeps pinned broadcasts at the top of the feed', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ id: 'b1', is_pinned: true, created_at: '2026-04-01T00:00:00.000Z' })],
			events: [makeEvent({ id: 'e1', created_at: '2026-04-06T00:00:00.000Z' })]
		});

		expect(notifications.map((item) => item.id)).toEqual(['broadcast:b1', 'event:e1']);
		expect(notifications[0]?.meta).toContain('Pinned');
	});

	it('filters scheduled and historical events out of the feed', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [
				makeEvent({ id: 'live' }),
				makeEvent({ id: 'scheduled', publish_at: '3026-04-06T00:00:00.000Z' }),
				makeEvent({ id: 'canceled', canceled_at: '2026-04-06T00:00:00.000Z' }),
				makeEvent({ id: 'archived', archived_at: '2026-04-06T00:00:00.000Z' }),
				makeEvent({ id: 'past', starts_at: '2000-04-06T00:00:00.000Z' })
			]
		});

		expect(notifications.map((item) => item.id)).toEqual(['event:live']);
	});

	it('filters draft, scheduled, and inactive broadcasts out of the feed', () => {
		const notifications = buildHubNotifications({
			broadcasts: [
				makeBroadcast({ id: 'live' }),
				makeBroadcast({ id: 'draft', is_draft: true }),
				makeBroadcast({ id: 'scheduled', publish_at: '3026-04-06T00:00:00.000Z' }),
				makeBroadcast({ id: 'archived', archived_at: '2026-04-06T00:00:00.000Z' }),
				makeBroadcast({ id: 'expired', expires_at: '2000-04-06T00:00:00.000Z' })
			],
			events: []
		});

		expect(notifications.map((item) => item.id)).toEqual(['broadcast:live']);
	});

	it('orders newly published broadcasts by publish time instead of original draft creation time', () => {
		const notifications = buildHubNotifications({
			broadcasts: [
				makeBroadcast({
					id: 'older-created-later-published',
					created_at: '2026-04-01T00:00:00.000Z',
					publish_at: '2026-04-08T00:00:00.000Z'
				}),
				makeBroadcast({ id: 'recent-created', created_at: '2026-04-07T00:00:00.000Z' })
			],
			events: []
		});

		expect(notifications.map((item) => item.id)).toEqual([
			'broadcast:older-created-later-published',
			'broadcast:recent-created'
		]);
		expect(notifications[0]?.occurredAt).toBe('2026-04-08T00:00:00.000Z');
	});

	it('counts notifications by kind for filter controls', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ id: 'b1' }), makeBroadcast({ id: 'b2' })],
			events: [makeEvent({ id: 'e1' })]
		});

		expect(countHubNotifications(notifications)).toEqual({
			all: 3,
			broadcast: 2,
			event: 1
		});
	});

	it('filters notifications without changing their existing order', () => {
		const notifications = buildHubNotifications({
			broadcasts: [
				makeBroadcast({ id: 'b1', created_at: '2026-04-08T00:00:00.000Z' }),
				makeBroadcast({ id: 'b2', created_at: '2026-04-06T00:00:00.000Z' })
			],
			events: [makeEvent({ id: 'e1', created_at: '2026-04-07T00:00:00.000Z' })]
		});

		expect(filterHubNotifications(notifications, 'all').map((item) => item.id)).toEqual([
			'broadcast:b1',
			'event:e1',
			'broadcast:b2'
		]);
		expect(filterHubNotifications(notifications, 'broadcast').map((item) => item.id)).toEqual([
			'broadcast:b1',
			'broadcast:b2'
		]);
		expect(filterHubNotifications(notifications, 'event').map((item) => item.id)).toEqual([
			'event:e1'
		]);
	});

	it('defaults notification preferences to all enabled when no row exists', () => {
		expect(createDefaultHubNotificationPreferences()).toEqual({
			broadcast: true,
			event: true
		});
	});

	it('filters out disabled alert categories when preferences are applied', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ id: 'b1' })],
			events: [makeEvent({ id: 'e1' })],
			preferences: {
				broadcast: false,
				event: true
			}
		});

		expect(notifications.map((item) => item.id)).toEqual(['event:e1']);
	});

	it('applies read-state metadata from the persisted read map', () => {
		const readMap = buildHubNotificationReadMap([
			{
				notification_kind: 'broadcast',
				source_id: 'b1',
				notification_key: 'default',
				read_at: '2026-04-13T10:00:00.000Z'
			}
		]);

		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ id: 'b1' })],
			events: [makeEvent({ id: 'e1' })],
			readMap
		});

		expect(notifications.find((item) => item.id === 'broadcast:b1')).toMatchObject({
			isRead: true,
			readAt: '2026-04-13T10:00:00.000Z'
		});
		expect(notifications.find((item) => item.id === 'event:e1')).toMatchObject({
			isRead: false,
			readAt: null
		});
		expect(countUnreadHubNotifications(notifications)).toBe(1);
	});

	it('builds reminder alerts from processed reminder executions with distinct identity keys', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [makeEvent({ id: 'e1', title: 'Volunteer night', location: 'Room A' })],
			reminderExecutions: [makeReminderExecutionRow({ source_id: 'e1', execution_key: '120' })]
		});

		expect(notifications.map((item) => item.id)).toEqual(['event_reminder:e1:120', 'event:e1']);
		expect(notifications[0]).toMatchObject({
			kind: 'event_reminder',
			notificationKey: '120',
			label: 'Reminder'
		});
		expect(notifications[0]?.summary).toContain('Reminder sent 2 hours before.');
	});

	it('counts reminder alerts under the event filter', () => {
		const notifications = buildHubNotifications({
			broadcasts: [makeBroadcast({ id: 'b1' })],
			events: [makeEvent({ id: 'e1' })],
			reminderExecutions: [makeReminderExecutionRow({ source_id: 'e1', execution_key: '30' })]
		});

		expect(countHubNotifications(notifications)).toEqual({
			all: 3,
			broadcast: 1,
			event: 2
		});
		expect(filterHubNotifications(notifications, 'event').map((item) => item.id)).toEqual([
			'event_reminder:e1:30',
			'event:e1'
		]);
	});

	it('tracks reminder read state by notification key instead of colliding with the base event alert', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [makeEvent({ id: 'e1' })],
			reminderExecutions: [makeReminderExecutionRow({ source_id: 'e1', execution_key: '120' })],
			readMap: buildHubNotificationReadMap([
				{
					notification_kind: 'event_reminder',
					source_id: 'e1',
					notification_key: '120',
					read_at: '2026-04-20T14:35:00.000Z'
				}
			])
		});

		expect(notifications.find((item) => item.id === 'event_reminder:e1:120')).toMatchObject({
			isRead: true,
			readAt: '2026-04-20T14:35:00.000Z'
		});
		expect(notifications.find((item) => item.id === 'event:e1')).toMatchObject({
			isRead: false,
			readAt: null
		});
	});
});