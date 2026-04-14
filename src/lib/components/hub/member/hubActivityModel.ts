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

function getEventActionDescription(item: HubNotificationItem) {
	if (item.eventTimingState === 'today') {
		return item.kind === 'event_reminder'
			? "Jump to today's event details below and review the latest reminder."
			: "Jump to today's event details below.";
	}

	if (item.eventTimingState === 'in_progress') {
		return item.kind === 'event_reminder'
			? 'Jump to the live event details below. This reminder was sent before the event started.'
			: 'Jump to the live event details below.';
	}

	if (item.eventTimingState === 'recently_completed') {
		return item.kind === 'event_reminder'
			? 'Jump to the recent event details below. This reminder was sent before the event wrapped.'
			: 'Jump to the recent event details below and review what just wrapped.';
	}

	return item.kind === 'event_reminder'
		? 'Jump to the upcoming events below and review the reminder target.'
		: 'Jump to the upcoming events below.';
}

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
		label:
			item.kind === 'event_reminder'
				? item.eventTimingState === 'in_progress'
					? 'Open live event'
					: item.eventTimingState === 'recently_completed'
						? 'Open recent event'
						: 'Open event details'
				: 'Open events',
		href: destinations.eventHref,
		description: getEventActionDescription(item)
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