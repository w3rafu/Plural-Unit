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

function replaceHrefHash(href: string, hash: string) {
	return `${href.split('#')[0]}#${hash}`;
}

function getManageBroadcastHref(destinations: HubActivityDestinations, sourceId: string) {
	const baseHref = destinations.manageContentHref ?? destinations.manageBroadcastsHref;
	return baseHref ? replaceHrefHash(baseHref, `broadcast-${sourceId}`) : null;
}

function getManageEventHref(destinations: HubActivityDestinations, sourceId: string) {
	const baseHref = destinations.manageContentHref ?? destinations.manageEventsHref;
	return baseHref ? replaceHrefHash(baseHref, `event-${sourceId}`) : null;
}

function getEventActionDescription(item: HubNotificationItem) {
	if (item.eventLifecycleSignal === 'canceled') {
		return 'Open the canceled event details and review the final update.';
	}

	if (item.eventLifecycleSignal === 'restored') {
		return 'Open the restored event details and confirm the latest timing.';
	}

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
			label: 'Open broadcast',
			href: `/hub/broadcast/${item.sourceId}`,
			description: 'Open this broadcast in its detail view.'
		};
	}

	const eventLabel =
		item.eventLifecycleSignal === 'canceled'
			? 'Open canceled event'
			: item.eventLifecycleSignal === 'restored'
				? 'Open restored event'
				: item.eventTimingState === 'today'
					? "Open today's event"
					: item.kind === 'event_reminder'
						? item.eventTimingState === 'in_progress'
							? 'Open live event'
							: item.eventTimingState === 'recently_completed'
								? 'Open recent event'
								: 'Open event details'
						: item.eventTimingState === 'in_progress'
							? 'Open live event'
							: item.eventTimingState === 'recently_completed'
								? 'Open recent event'
								: 'Open events';

	return {
		label: eventLabel,
		href: destinations.eventHref,
		description: getEventActionDescription(item)
	};
}

function getEventManageActionLabel(item: HubNotificationItem) {
	if (item.eventLifecycleSignal === 'canceled') {
		return 'Review cancellation';
	}

	if (item.eventLifecycleSignal === 'restored') {
		return 'Review restore';
	}

	if (item.eventTimingState === 'today' || item.eventTimingState === 'in_progress') {
		return 'Review attendance';
	}

	if (item.eventTimingState === 'recently_completed') {
		return item.kind === 'event_reminder' ? 'Review follow-up' : 'Close out event';
	}

	return item.kind === 'event_reminder' ? 'Review reminder plan' : 'Review event';
}

function getEventManageActionDescription(item: HubNotificationItem) {
	if (item.eventLifecycleSignal === 'canceled') {
		return 'Jump straight to this event card and confirm the canceled-state follow-through.';
	}

	if (item.eventLifecycleSignal === 'restored') {
		return 'Jump straight to this event card and confirm the restored schedule.';
	}

	if (item.eventTimingState === 'today' || item.eventTimingState === 'in_progress') {
		return 'Jump straight to this event card and roster for attendance closeout.';
	}

	if (item.eventTimingState === 'recently_completed') {
		return item.kind === 'event_reminder'
			? 'Jump straight to this event card and review the recent follow-up context.'
			: 'Jump straight to this event card and finish closeout or follow-up.';
	}

	return item.kind === 'event_reminder'
		? 'Jump straight to this event card and review the reminder plan.'
		: 'Jump straight to this event card and scheduling tools.';
}

export function getHubActivitySecondaryAction(
	item: HubNotificationItem,
	destinations: HubActivityDestinations
): HubActivityAction | null {
	if (item.kind === 'broadcast') {
		const href = getManageBroadcastHref(destinations, item.sourceId);

		if (!href) {
			return null;
		}

		return {
			label: 'Review broadcast',
			href,
			description: 'Jump straight to this broadcast card and publishing tools.'
		};
	}

	const href = getManageEventHref(destinations, item.sourceId);

	if (!href) {
		return null;
	}

	return {
		label: getEventManageActionLabel(item),
		href,
		description: getEventManageActionDescription(item)
	};
}
