import { describe, expect, it } from 'vitest';
import {
	getHubActivityPrimaryAction,
	getHubActivitySecondaryAction,
	type HubActivityDestinations
} from './hubActivityModel';

const destinations: HubActivityDestinations = {
	broadcastHref: '#hub-broadcasts',
	eventHref: '#hub-events',
	manageContentHref: '/hub/manage/content',
	manageBroadcastsHref: '/hub/manage/content#manage-broadcasts',
	manageEventsHref: '/hub/manage/content#manage-events'
};

function makeNotification(
	kind: 'broadcast' | 'event' | 'event_reminder',
	sourceId: string,
	notificationKey = 'default'
) {
	const id =
		notificationKey === 'default'
			? `${kind}:${sourceId}`
			: `${kind}:${sourceId}:${notificationKey}`;
	const label =
		kind === 'broadcast' ? 'Broadcast' : kind === 'event_reminder' ? 'Reminder' : 'Event';
	const title =
		kind === 'broadcast' ? 'Broadcast' : kind === 'event_reminder' ? 'Reminder' : 'Event';

	return {
		id,
		kind,
		sourceId,
		notificationKey,
		title,
		summary: 'Summary',
		meta: 'Meta',
		occurredAt: '2026-04-11T10:00:00.000Z',
		label,
		isRead: false,
		readAt: null
	} as const;
}

describe('hubActivityModel', () => {
	it('builds primary actions for broadcasts and events', () => {
		expect(
			getHubActivityPrimaryAction(makeNotification('broadcast', 'b1'), destinations)
		).toEqual({
			label: 'Open broadcasts',
			href: '#hub-broadcasts',
			description: 'Jump to the live broadcast list below.'
		});

		expect(
			getHubActivityPrimaryAction(makeNotification('event', 'e1'), destinations)
		).toEqual({
			label: 'Open events',
			href: '#hub-events',
			description: 'Jump to the upcoming events below.'
		});

		expect(
			getHubActivityPrimaryAction(makeNotification('event_reminder', 'e1', '120'), destinations)
		).toEqual({
			label: 'Open event details',
			href: '#hub-events',
			description: 'Jump to the upcoming events below and review the reminder target.'
		});
	});

	it('builds secondary manage actions when content tools are available', () => {
		expect(
			getHubActivitySecondaryAction(makeNotification('broadcast', 'b1'), destinations)
		).toEqual({
			label: 'Manage broadcasts',
			href: '/hub/manage/content#manage-broadcasts',
			description: 'Jump straight to the broadcast editor and publishing tools.'
		});

		expect(
			getHubActivitySecondaryAction(makeNotification('event', 'e1'), destinations)
		).toEqual({
			label: 'Manage events',
			href: '/hub/manage/content#manage-events',
			description: 'Jump straight to the event editor and scheduling tools.'
		});
	});

	it('falls back to the generic content route when section links are unavailable', () => {
		expect(
			getHubActivitySecondaryAction(
				makeNotification('broadcast', 'b1'),
				{
					broadcastHref: '#hub-broadcasts',
					eventHref: '#hub-events',
					manageContentHref: '/hub/manage/content'
				}
			)
		).toEqual({
			label: 'Manage broadcasts',
			href: '/hub/manage/content',
			description: 'Jump straight to the broadcast editor and publishing tools.'
		});
	});

	it('returns no secondary action when manage content is unavailable', () => {
		expect(
			getHubActivitySecondaryAction(
				makeNotification('event', 'e1'),
				{ broadcastHref: '#hub-broadcasts', eventHref: '#hub-events' }
			)
		).toBeNull();
	});
});