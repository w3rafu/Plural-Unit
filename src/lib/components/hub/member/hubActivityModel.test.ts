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
	notificationKey = 'default',
	eventTimingState: 'upcoming' | 'today' | 'in_progress' | 'recently_completed' | undefined =
		undefined
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
		readAt: null,
		eventTimingState
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

	it('adjusts event actions for today, live, and recent event states', () => {
		expect(
			getHubActivityPrimaryAction(
				makeNotification('event', 'today', 'default', 'today'),
				destinations
			)
		).toEqual({
			label: "Open today's event",
			href: '#hub-events',
			description: "Jump to today's event details below."
		});

		expect(
			getHubActivityPrimaryAction(
				makeNotification('event_reminder', 'live', '120', 'in_progress'),
				destinations
			)
		).toEqual({
			label: 'Open live event',
			href: '#hub-events',
			description: 'Jump to the live event details below. This reminder was sent before the event started.'
		});

		expect(
			getHubActivityPrimaryAction(
				makeNotification('event', 'recent', 'default', 'recently_completed'),
				destinations
			)
		).toEqual({
			label: 'Open recent event',
			href: '#hub-events',
			description: 'Jump to the recent event details below and review what just wrapped.'
		});
	});

	it('builds secondary manage actions when content tools are available', () => {
		expect(
			getHubActivitySecondaryAction(makeNotification('broadcast', 'b1'), destinations)
		).toEqual({
			label: 'Review broadcast',
			href: '/hub/manage/content#broadcast-b1',
			description: 'Jump straight to this broadcast card and publishing tools.'
		});

		expect(
			getHubActivitySecondaryAction(makeNotification('event', 'e1'), destinations)
		).toEqual({
			label: 'Review event',
			href: '/hub/manage/content#event-e1',
			description: 'Jump straight to this event card and scheduling tools.'
		});

		expect(
			getHubActivitySecondaryAction(
				makeNotification('event', 'e2', 'default', 'recently_completed'),
				destinations
			)
		).toEqual({
			label: 'Close out event',
			href: '/hub/manage/content#event-e2',
			description: 'Jump straight to this event card and finish closeout or follow-up.'
		});

		expect(
			getHubActivitySecondaryAction(
				makeNotification('event_reminder', 'e3', '120', 'today'),
				destinations
			)
		).toEqual({
			label: 'Review attendance',
			href: '/hub/manage/content#event-e3',
			description: 'Jump straight to this event card and roster for attendance closeout.'
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
			label: 'Review broadcast',
			href: '/hub/manage/content#broadcast-b1',
			description: 'Jump straight to this broadcast card and publishing tools.'
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