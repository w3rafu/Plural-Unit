import { describe, expect, it } from 'vitest';
import { buildHubNotifications } from './hubNotifications';

function makeBroadcast(overrides: Partial<{
	id: string;
	organization_id: string;
	title: string;
	body: string;
	created_at: string;
}> = {}) {
	return {
		id: overrides.id ?? 'b1',
		organization_id: overrides.organization_id ?? 'org1',
		title: overrides.title ?? 'Broadcast title',
		body: overrides.body ?? 'Broadcast body',
		created_at: overrides.created_at ?? '2026-04-05T18:00:00.000Z'
	};
}

function makeEvent(overrides: Partial<{
	id: string;
	organization_id: string;
	title: string;
	description: string;
	starts_at: string;
	location: string;
	created_at: string;
}> = {}) {
	return {
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org1',
		title: overrides.title ?? 'Event title',
		description: overrides.description ?? 'Event description',
		starts_at: overrides.starts_at ?? '2026-04-20T16:30:00.000Z',
		location: overrides.location ?? 'Main Hall',
		created_at: overrides.created_at ?? '2026-04-06T12:00:00.000Z'
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
});