import { describe, expect, it } from 'vitest';
import { buildHubNotifications } from './hubNotifications';

describe('buildHubNotifications', () => {
	it('merges broadcasts and events newest first', () => {
		const notifications = buildHubNotifications({
			broadcasts: [
				{
					id: 'b1',
					organization_id: 'org1',
					title: 'Broadcast title',
					body: 'Broadcast body',
					created_at: '2026-04-05T18:00:00.000Z'
				}
			],
			events: [
				{
					id: 'e1',
					organization_id: 'org1',
					title: 'Event title',
					description: 'Event description',
					starts_at: '2026-04-20T16:30:00.000Z',
					location: 'Main Hall',
					created_at: '2026-04-06T12:00:00.000Z'
				}
			]
		});

		expect(notifications.map((item) => item.id)).toEqual(['event:e1', 'broadcast:b1']);
		expect(notifications[0]?.label).toBe('Event');
		expect(notifications[1]?.label).toBe('Broadcast');
	});

	it('uses a fallback event summary when description is blank', () => {
		const notifications = buildHubNotifications({
			broadcasts: [],
			events: [
				{
					id: 'e2',
					organization_id: 'org1',
					title: 'Quiet event',
					description: '   ',
					starts_at: '2026-04-20T16:30:00.000Z',
					location: '',
					created_at: '2026-04-06T12:00:00.000Z'
				}
			]
		});

		expect(notifications[0]?.summary).toBe('A new event was posted to the hub.');
	});
});