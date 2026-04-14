import { getEventLocationLabel } from '$lib/models/eventCalendarModel';
import { sortLiveEvents } from '$lib/models/eventLifecycleModel';
import { formatEventReminderOffset } from '$lib/models/eventReminderModel';
import type { HubNotificationItem } from '$lib/models/hubNotifications';
import type { EventResponseStatus, EventRow } from '$lib/repositories/hubRepository';
import { formatEventDateTime, formatRelativeDateTime } from '$lib/utils/dateFormat';

export type MemberCommitmentResponseLookup = Record<
	string,
	EventResponseStatus | null | undefined
>;

export type MemberCommitmentStatus = 'reply_needed' | 'going' | 'maybe';

export type MemberCommitmentItem = {
	eventId: string;
	event: EventRow;
	title: string;
	response: EventResponseStatus | null;
	status: MemberCommitmentStatus;
	statusLabel: string;
	startsAt: string;
	startsAtLabel: string;
	timingCopy: string;
	locationLabel: string | null;
	statusCopy: string;
	reminderCopy: string | null;
	latestReminderAt: string | null;
	hasReminder: boolean;
	hasUnreadReminder: boolean;
	isStartingSoon: boolean;
	needsReply: boolean;
};

export type MemberCommitmentSections = {
	all: MemberCommitmentItem[];
	replyNeeded: MemberCommitmentItem[];
	upcoming: MemberCommitmentItem[];
	replyNeededCount: number;
	upcomingCount: number;
	startsSoonCount: number;
};

type ReminderSignal = {
	occurredAt: string;
	copy: string;
	hasUnreadReminder: boolean;
};

const STARTS_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function getCommitmentStatus(response: EventResponseStatus | null): MemberCommitmentStatus | null {
	if (response === 'going') {
		return 'going';
	}

	if (response === 'maybe') {
		return 'maybe';
	}

	if (response === null) {
		return 'reply_needed';
	}

	return null;
}

function getCommitmentStatusLabel(status: MemberCommitmentStatus) {
	switch (status) {
		case 'going':
			return 'Going';
		case 'maybe':
			return 'Maybe';
		default:
			return 'Reply needed';
	}
}

function getReminderSignalCopy(notification: HubNotificationItem) {
	const offsetMinutes = Number.parseInt(notification.notificationKey, 10);

	if (Number.isInteger(offsetMinutes) && offsetMinutes > 0) {
		return `Reminder sent ${formatEventReminderOffset(offsetMinutes)}.`;
	}

	return 'Reminder sent.';
}

function buildReminderSignalMap(notifications: HubNotificationItem[]) {
	const map = new Map<string, ReminderSignal>();

	for (const notification of notifications) {
		if (notification.kind !== 'event_reminder') {
			continue;
		}

		const existing = map.get(notification.sourceId);
		const existingTime = getTime(existing?.occurredAt);
		const currentTime = getTime(notification.occurredAt) ?? 0;

		if (!existing || existingTime === null || currentTime > existingTime) {
			map.set(notification.sourceId, {
				occurredAt: notification.occurredAt,
				copy: getReminderSignalCopy(notification),
				hasUnreadReminder: !notification.isRead || existing?.hasUnreadReminder === true
			});
			continue;
		}

		if (!notification.isRead && existing) {
			existing.hasUnreadReminder = true;
		}
	}

	return map;
}

function getCommitmentStatusCopy(status: MemberCommitmentStatus, isStartingSoon: boolean) {
	if (status === 'reply_needed') {
		return isStartingSoon
			? 'Starts soon. Reply now so planners can lock the roster.'
			: 'Reply now so planners can lock the roster.';
	}

	if (status === 'going') {
		return isStartingSoon ? 'Starts soon. You are already on the list.' : 'You are already on the list.';
	}

	return isStartingSoon
		? 'Starts soon. Confirm if you can still make it.'
		: 'You marked this as maybe.';
}

function buildMemberCommitmentItem(input: {
	event: EventRow;
	response: EventResponseStatus | null;
	reminderSignal: ReminderSignal | null;
	now: number;
}): MemberCommitmentItem | null {
	const status = getCommitmentStatus(input.response);
	if (!status) {
		return null;
	}

	const startsAtTime = getTime(input.event.starts_at);
	const isStartingSoon =
		startsAtTime !== null && startsAtTime - input.now <= STARTS_SOON_WINDOW_MS;

	return {
		eventId: input.event.id,
		event: input.event,
		title: input.event.title.trim() || 'Untitled event',
		response: input.response,
		status,
		statusLabel: getCommitmentStatusLabel(status),
		startsAt: input.event.starts_at,
		startsAtLabel: formatEventDateTime(input.event.starts_at),
		timingCopy: isStartingSoon
			? 'Starts soon'
			: `Starts ${formatRelativeDateTime(input.event.starts_at, input.now)}.`,
		locationLabel: getEventLocationLabel(input.event.location),
		statusCopy: getCommitmentStatusCopy(status, isStartingSoon),
		reminderCopy: input.reminderSignal?.copy ?? null,
		latestReminderAt: input.reminderSignal?.occurredAt ?? null,
		hasReminder: input.reminderSignal !== null,
		hasUnreadReminder: input.reminderSignal?.hasUnreadReminder ?? false,
		isStartingSoon,
		needsReply: status === 'reply_needed'
	};
}

export function buildMemberCommitments(input: {
	events: EventRow[];
	ownResponses?: MemberCommitmentResponseLookup;
	notifications?: HubNotificationItem[];
	now?: number;
}): MemberCommitmentSections {
	const ownResponses = input.ownResponses ?? {};
	const notifications = input.notifications ?? [];
	const now = input.now ?? Date.now();
	const reminderSignalMap = buildReminderSignalMap(notifications);

	const all = sortLiveEvents(input.events)
		.map((event) =>
			buildMemberCommitmentItem({
				event,
				response: ownResponses[event.id] ?? null,
				reminderSignal: reminderSignalMap.get(event.id) ?? null,
				now
			})
		)
		.filter((item): item is MemberCommitmentItem => item !== null);

	const replyNeeded = all.filter((item) => item.needsReply);
	const upcoming = all.filter((item) => !item.needsReply);

	return {
		all,
		replyNeeded,
		upcoming,
		replyNeededCount: replyNeeded.length,
		upcomingCount: upcoming.length,
		startsSoonCount: all.filter((item) => item.isStartingSoon).length
	};
}

export function buildMemberCommitmentLookup(items: MemberCommitmentItem[]) {
	return Object.fromEntries(items.map((item) => [item.eventId, item]));
}