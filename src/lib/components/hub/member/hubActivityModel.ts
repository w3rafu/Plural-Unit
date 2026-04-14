import type { HubNotificationItem } from '$lib/models/hubNotifications';

export type HubActivityDestinations = {
	broadcastHref: string;
	eventHref: string;
	manageContentHref?: string;
	manageBroadcastsHref?: string;
	manageEventsHref?: string;
};

export type HubActivityAction = {
	label: string;
	href: string;
	description: string;
};

export function getHubActivityPrimaryAction(
	item: HubNotificationItem,
	destinations: HubActivityDestinations
): HubActivityAction {
	if (item.kind === 'broadcast') {
		return {
			label: 'Open broadcasts',
			href: destinations.broadcastHref,
			description: 'Jump to the live broadcast list below.'
		};
	}

	return {
		label: item.kind === 'event_reminder' ? 'Open event details' : 'Open events',
		href: destinations.eventHref,
		description:
			item.kind === 'event_reminder'
				? 'Jump to the upcoming events below and review the reminder target.'
				: 'Jump to the upcoming events below.'
	};
}

export function getHubActivitySecondaryAction(
	item: HubNotificationItem,
	destinations: HubActivityDestinations
): HubActivityAction | null {
	if (item.kind === 'broadcast') {
		const href = destinations.manageBroadcastsHref ?? destinations.manageContentHref;

		if (!href) {
			return null;
		}

		return {
			label: 'Manage broadcasts',
			href,
			description: 'Jump straight to the broadcast editor and publishing tools.'
		};
	}

	const href = destinations.manageEventsHref ?? destinations.manageContentHref;

	if (!href) {
		return null;
	}

	return {
		label: 'Manage events',
		href,
		description: 'Jump straight to the event editor and scheduling tools.'
	};
}