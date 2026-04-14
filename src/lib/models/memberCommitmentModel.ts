import { getEventLocationLabel } from '$lib/models/eventCalendarModel';
import { isEventArchived, isEventCanceled, isEventPublished } from '$lib/models/eventLifecycleModel';
import { formatEventReminderOffset } from '$lib/models/eventReminderModel';
import { getEventResponseLabel } from '$lib/models/eventResponseModel';
import type { HubNotificationItem } from '$lib/models/hubNotifications';
import type {
	EventAttendanceStatus,
	EventResponseStatus,
	EventRow
} from '$lib/repositories/hubRepository';
import { formatEventDateTime, formatRelativeDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

export type MemberCommitmentResponseLookup = Record<
	string,
	EventResponseStatus | null | undefined
>;

export type MemberCommitmentAttendanceLookup = Record<
	string,
	EventAttendanceStatus | null | undefined
>;

export type MemberCommitmentStatus =
	| 'reply_needed'
	| 'going'
	| 'maybe'
	| 'cannot_attend'
	| 'attended'
	| 'absent';

export type MemberCommitmentTimingState =
	| 'upcoming'
	| 'today'
	| 'in_progress'
	| 'recently_completed';

export type MemberCommitmentPhase = 'reply_needed' | 'today' | 'upcoming' | 'recent';

export type MemberCommitmentItem = {
	eventId: string;
	event: EventRow;
	title: string;
	response: EventResponseStatus | null;
	attendanceStatus: EventAttendanceStatus | null;
	status: MemberCommitmentStatus;
	statusLabel: string;
	responseLabel: string | null;
	attendanceLabel: string | null;
	phase: MemberCommitmentPhase;
	timingState: MemberCommitmentTimingState;
	timingLabel: string;
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
	isToday: boolean;
	isInProgress: boolean;
	isRecentlyCompleted: boolean;
	needsReply: boolean;
};

export type MemberCommitmentSections = {
	all: MemberCommitmentItem[];
	replyNeeded: MemberCommitmentItem[];
	today: MemberCommitmentItem[];
	upcoming: MemberCommitmentItem[];
	recent: MemberCommitmentItem[];
	replyNeededCount: number;
	todayCount: number;
	upcomingCount: number;
	recentCount: number;
	startsSoonCount: number;
	inProgressCount: number;
};

type ReminderSignal = {
	occurredAt: string;
	copy: string;
	hasUnreadReminder: boolean;
};

const STARTS_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;
const DEFAULT_MEMBER_EVENT_DURATION_MS = 4 * 60 * 60 * 1000;
const MEMBER_EVENT_RECENT_COMPLETION_MS = 24 * 60 * 60 * 1000;

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function getEffectiveEventEndTime(event: EventRow) {
	const startsAt = getTime(event.starts_at);
	if (startsAt === null) {
		return null;
	}

	return getTime(event.ends_at) ?? startsAt + DEFAULT_MEMBER_EVENT_DURATION_MS;
}

function getRecentSortTime(event: EventRow) {
	return getEffectiveEventEndTime(event) ?? getTime(event.starts_at) ?? 0;
}

function isSameLocalDay(timestamp: number, now: number) {
	const left = new Date(timestamp);
	const right = new Date(now);

	return (
		left.getFullYear() === right.getFullYear() &&
		left.getMonth() === right.getMonth() &&
		left.getDate() === right.getDate()
	);
}

function isMemberVisibleEvent(event: EventRow, now: number) {
	return !isEventArchived(event) && !isEventCanceled(event) && isEventPublished(event, now);
}

export function getMemberEventTimingState(
	event: EventRow,
	now = Date.now()
): MemberCommitmentTimingState | null {
	if (!isMemberVisibleEvent(event, now)) {
		return null;
	}

	const startsAt = getTime(event.starts_at);
	const endsAt = getEffectiveEventEndTime(event);

	if (startsAt === null || endsAt === null) {
		return null;
	}

	if (now < startsAt) {
		return isSameLocalDay(startsAt, now) ? 'today' : 'upcoming';
	}

	if (now <= endsAt) {
		return 'in_progress';
	}

	if (now <= endsAt + MEMBER_EVENT_RECENT_COMPLETION_MS) {
		return 'recently_completed';
	}

	return null;
}

export function sortMemberVisibleEvents(rows: EventRow[], now = Date.now()) {
	const visibleRows = rows.filter((event) => getMemberEventTimingState(event, now) !== null);
	const activeRows = visibleRows
		.filter((event) => getMemberEventTimingState(event, now) !== 'recently_completed')
		.sort((left, right) => (getTime(left.starts_at) ?? 0) - (getTime(right.starts_at) ?? 0));
	const recentRows = visibleRows
		.filter((event) => getMemberEventTimingState(event, now) === 'recently_completed')
		.sort((left, right) => getRecentSortTime(right) - getRecentSortTime(left));

	return [...activeRows, ...recentRows];
}

function getCommitmentStatus(
	response: EventResponseStatus | null,
	attendanceStatus: EventAttendanceStatus | null,
	timingState: MemberCommitmentTimingState
): MemberCommitmentStatus | null {
	if (attendanceStatus === 'attended') {
		return 'attended';
	}

	if (attendanceStatus === 'absent') {
		return 'absent';
	}

	if (response === 'going') {
		return 'going';
	}

	if (response === 'maybe') {
		return 'maybe';
	}

	if (response === null) {
		return timingState === 'recently_completed' ? null : 'reply_needed';
	}

	return null;
}

function getCommitmentStatusLabel(status: MemberCommitmentStatus) {
	switch (status) {
		case 'attended':
			return 'Attended';
		case 'absent':
			return 'Absent';
		case 'cannot_attend':
			return getEventResponseLabel('cannot_attend');
		case 'going':
			return 'Going';
		case 'maybe':
			return 'Maybe';
		default:
			return 'Reply needed';
	}
}

function getCommitmentPhase(
	status: MemberCommitmentStatus,
	timingState: MemberCommitmentTimingState
): MemberCommitmentPhase {
	if (timingState === 'recently_completed') {
		return 'recent';
	}

	if (status === 'reply_needed') {
		return 'reply_needed';
	}

	if (timingState === 'today' || timingState === 'in_progress') {
		return 'today';
	}

	return 'upcoming';
}

function getTimingLabel(timingState: MemberCommitmentTimingState) {
	switch (timingState) {
		case 'today':
			return 'Today';
		case 'in_progress':
			return 'In progress';
		case 'recently_completed':
			return 'Recently completed';
		default:
			return 'Upcoming';
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

function getTimingCopy(event: EventRow, timingState: MemberCommitmentTimingState, now: number) {
	if (timingState === 'in_progress') {
		return event.ends_at
			? `Ends ${formatShortDateTime(event.ends_at)}.`
			: `Started ${formatRelativeDateTime(event.starts_at, now)}.`;
	}

	if (timingState === 'recently_completed') {
		const completedAt = event.ends_at ?? event.starts_at;
		return `Completed ${formatRelativeDateTime(completedAt, now)}.`;
	}

	return `Starts ${formatRelativeDateTime(event.starts_at, now)}.`;
}

function getCommitmentStatusCopy(input: {
	status: MemberCommitmentStatus;
	timingState: MemberCommitmentTimingState;
	isStartingSoon: boolean;
}) {
	if (input.timingState === 'recently_completed') {
		switch (input.status) {
			case 'attended':
				return 'You were marked attended.';
			case 'absent':
				return 'You were marked absent.';
			case 'cannot_attend':
				return "You had already marked this as can't make it.";
			case 'going':
				return 'You replied going, but no attendance outcome was recorded.';
			case 'maybe':
				return 'You replied maybe. No attendance outcome was recorded.';
			default:
				return 'No attendance outcome was recorded.';
		}
	}

	if (input.timingState === 'in_progress') {
		switch (input.status) {
			case 'attended':
				return 'You are marked attended for this event.';
			case 'absent':
				return 'You are marked absent for this event.';
			case 'reply_needed':
				return 'This is underway. Reply now if you are still joining.';
			case 'going':
				return 'This is underway and you are on the RSVP list.';
			case 'maybe':
				return 'This is underway. Confirm if you are still joining.';
			default:
				return "This is underway and you already marked this as can't make it.";
		}
	}

	if (input.timingState === 'today') {
		switch (input.status) {
			case 'attended':
				return 'Attendance is already recorded for today.';
			case 'absent':
				return 'Attendance is already recorded for today.';
			case 'reply_needed':
				return 'Starts today. Reply now so planners can lock the roster.';
			case 'going':
				return 'Today. You are already on the list.';
			case 'maybe':
				return 'Today. Confirm if you can still make it.';
			default:
				return "Today. You already marked this as can't make it.";
		}
	}

	if (input.status === 'reply_needed') {
		return input.isStartingSoon
			? 'Starts soon. Reply now so planners can lock the roster.'
			: 'Reply now so planners can lock the roster.';
	}

	if (input.status === 'going') {
		return input.isStartingSoon
			? 'Starts soon. You are already on the list.'
			: 'You are already on the list.';
	}

	if (input.status === 'maybe') {
		return input.isStartingSoon
			? 'Starts soon. Confirm if you can still make it.'
			: 'You marked this as maybe.';
	}

	return "You already marked this as can't make it.";
}

function buildMemberCommitmentItem(input: {
	event: EventRow;
	response: EventResponseStatus | null;
	attendanceStatus: EventAttendanceStatus | null;
	reminderSignal: ReminderSignal | null;
	now: number;
}): MemberCommitmentItem | null {
	const timingState = getMemberEventTimingState(input.event, input.now);
	if (!timingState) {
		return null;
	}

	const status = getCommitmentStatus(input.response, input.attendanceStatus, timingState);
	if (!status) {
		return null;
	}

	const phase = getCommitmentPhase(status, timingState);

	const startsAtTime = getTime(input.event.starts_at);
	const isStartingSoon =
		startsAtTime !== null && startsAtTime >= input.now && startsAtTime - input.now <= STARTS_SOON_WINDOW_MS;
	const showReminderSignal = timingState !== 'recently_completed';

	return {
		eventId: input.event.id,
		event: input.event,
		title: input.event.title.trim() || 'Untitled event',
		response: input.response,
		attendanceStatus: input.attendanceStatus,
		status,
		statusLabel: getCommitmentStatusLabel(status),
		responseLabel: input.response ? getEventResponseLabel(input.response) : null,
		attendanceLabel:
			input.attendanceStatus === 'attended'
				? 'Attended'
				: input.attendanceStatus === 'absent'
					? 'Absent'
					: null,
		phase,
		timingState,
		timingLabel: getTimingLabel(timingState),
		startsAt: input.event.starts_at,
		startsAtLabel: formatEventDateTime(input.event.starts_at),
		timingCopy: getTimingCopy(input.event, timingState, input.now),
		locationLabel: getEventLocationLabel(input.event.location),
		statusCopy: getCommitmentStatusCopy({ status, timingState, isStartingSoon }),
		reminderCopy: showReminderSignal ? input.reminderSignal?.copy ?? null : null,
		latestReminderAt: input.reminderSignal?.occurredAt ?? null,
		hasReminder: showReminderSignal && input.reminderSignal !== null,
		hasUnreadReminder: showReminderSignal && (input.reminderSignal?.hasUnreadReminder ?? false),
		isStartingSoon,
		isToday: timingState === 'today',
		isInProgress: timingState === 'in_progress',
		isRecentlyCompleted: timingState === 'recently_completed',
		needsReply: status === 'reply_needed'
	};
}

export function buildMemberCommitments(input: {
	events: EventRow[];
	ownResponses?: MemberCommitmentResponseLookup;
	ownAttendance?: MemberCommitmentAttendanceLookup;
	notifications?: HubNotificationItem[];
	now?: number;
}): MemberCommitmentSections {
	const ownResponses = input.ownResponses ?? {};
	const ownAttendance = input.ownAttendance ?? {};
	const notifications = input.notifications ?? [];
	const now = input.now ?? Date.now();
	const reminderSignalMap = buildReminderSignalMap(notifications);

	const all = sortMemberVisibleEvents(input.events, now)
		.map((event) =>
			buildMemberCommitmentItem({
				event,
				response: ownResponses[event.id] ?? null,
				attendanceStatus: ownAttendance[event.id] ?? null,
				reminderSignal: reminderSignalMap.get(event.id) ?? null,
				now
			})
		)
		.filter((item): item is MemberCommitmentItem => item !== null);

	const replyNeeded = all.filter((item) => item.needsReply);
	const today = all.filter((item) => item.phase === 'today');
	const upcoming = all.filter((item) => item.phase === 'upcoming');
	const recent = all.filter((item) => item.phase === 'recent');

	return {
		all,
		replyNeeded,
		today,
		upcoming,
		recent,
		replyNeededCount: replyNeeded.length,
		todayCount: today.length,
		upcomingCount: upcoming.length,
		recentCount: recent.length,
		startsSoonCount: all.filter((item) => item.isStartingSoon).length,
		inProgressCount: all.filter((item) => item.isInProgress).length
	};
}

export function buildMemberCommitmentLookup(items: MemberCommitmentItem[]) {
	return Object.fromEntries(items.map((item) => [item.eventId, item]));
}