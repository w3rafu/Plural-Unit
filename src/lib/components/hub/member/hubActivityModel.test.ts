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

describe('hubActivityModel', () => {
	it('builds primary actions for broadcasts and events', () => {
		expect(
			getHubActivityPrimaryAction(
				{
					id: 'broadcast:b1',
					kind: 'broadcast',
					title: 'Broadcast',
					summary: 'Summary',
					meta: 'Meta',
					occurredAt: '2026-04-11T10:00:00.000Z',
					label: 'Broadcast'
				},
				destinations
			)
		).toEqual({
			label: 'Open broadcasts',
			href: '#hub-broadcasts',
			description: 'Jump to the live broadcast list below.'
		});

		expect(
			getHubActivityPrimaryAction(
				{
					id: 'event:e1',
					kind: 'event',
					title: 'Event',
					summary: 'Summary',
					meta: 'Meta',
					occurredAt: '2026-04-11T10:00:00.000Z',
					label: 'Event'
				},
				destinations
			)
		).toEqual({
			label: 'Open events',
			href: '#hub-events',
			description: 'Jump to the upcoming events below.'
		});
	});

	it('builds secondary manage actions when content tools are available', () => {
		expect(
			getHubActivitySecondaryAction(
				{
					id: 'broadcast:b1',
					kind: 'broadcast',
					title: 'Broadcast',
					summary: 'Summary',
					meta: 'Meta',
					occurredAt: '2026-04-11T10:00:00.000Z',
					label: 'Broadcast'
				},
				destinations
			)
		).toEqual({
			label: 'Manage broadcasts',
			href: '/hub/manage/content#manage-broadcasts',
			description: 'Jump straight to the broadcast editor and publishing tools.'
		});

		expect(
			getHubActivitySecondaryAction(
				{
					id: 'event:e1',
					kind: 'event',
					title: 'Event',
					summary: 'Summary',
					meta: 'Meta',
					occurredAt: '2026-04-11T10:00:00.000Z',
					label: 'Event'
				},
				destinations
			)
		).toEqual({
			label: 'Manage events',
			href: '/hub/manage/content#manage-events',
			description: 'Jump straight to the event editor and scheduling tools.'
		});
	});

	it('falls back to the generic content route when section links are unavailable', () => {
		expect(
			getHubActivitySecondaryAction(
				{
					id: 'broadcast:b1',
					kind: 'broadcast',
					title: 'Broadcast',
					summary: 'Summary',
					meta: 'Meta',
					occurredAt: '2026-04-11T10:00:00.000Z',
					label: 'Broadcast'
				},
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
				{
					id: 'event:e1',
					kind: 'event',
					title: 'Event',
					summary: 'Summary',
					meta: 'Meta',
					occurredAt: '2026-04-11T10:00:00.000Z',
					label: 'Event'
				},
				{ broadcastHref: '#hub-broadcasts', eventHref: '#hub-events' }
			)
		).toBeNull();
	});
});