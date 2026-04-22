import type {
	EventReminderChannel,
	EventRow
} from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';

export const EVENT_REMINDER_OPTIONS = [
	{
		value: 1440,
		label: '1 day before',
		description: 'Queue a reminder 24 hours before the event begins.'
	},
	{
		value: 120,
		label: '2 hours before',
		description: 'Catch same-day plans while people still have time to respond.'
	},
	{
		value: 30,
		label: '30 minutes before',
		description: 'Add a last-minute nudge shortly before the event starts.'
	}
] as const satisfies Array<{ value: number; label: string; description: string }>;

export const EVENT_REMINDER_CHANNEL_OPTIONS = [
	{
		value: 'in_app',
		label: 'In-app only',
		description: 'Members see reminder alerts in the hub activity feed.'
	},
	{
		value: 'in_app_and_push',
		label: 'In-app and push',
		description: 'Send the same reminder through hub alerts and device push when members opted in.'
	},
	{
		value: 'push',
		label: 'Push only',
		description: 'Only send device push to members who enabled event alerts and registered a device.'
	}
] as const satisfies Array<{
	value: EventReminderChannel;
	label: string;
	description: string;
}>;

export type EventReminderScheduleEntry = {
	offsetMinutes: number;
	label: string;
	sendAt: string;
	isUpcoming: boolean;
};

export type EventReminderSummary = {
	count: number;
	offsets: number[];
	schedule: EventReminderScheduleEntry[];
	nextReminderAt: string | null;
	nextReminderOffsetMinutes: number | null;
	hasUpcomingReminder: boolean;
	deliveryChannel?: EventReminderChannel;
	deliveryLabel?: string;
	supportsInApp?: boolean;
	supportsPush?: boolean;
};

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

export function normalizeEventReminderOffsets(offsets: number[]) {
	return [...new Set(offsets.filter((offset) => Number.isInteger(offset) && offset > 0))].sort(
		(left, right) => right - left
	);
}

export function normalizeEventReminderChannel(
	deliveryChannel: EventReminderChannel | null | undefined
): EventReminderChannel {
	return deliveryChannel === 'push' || deliveryChannel === 'in_app_and_push'
		? deliveryChannel
		: 'in_app';
}

export function reminderChannelSupportsInApp(deliveryChannel: EventReminderChannel | null | undefined) {
	const normalized = normalizeEventReminderChannel(deliveryChannel);
	return normalized === 'in_app' || normalized === 'in_app_and_push';
}

export function reminderChannelSupportsPush(deliveryChannel: EventReminderChannel | null | undefined) {
	return normalizeEventReminderChannel(deliveryChannel) !== 'in_app';
}

export function getEventReminderChannelLabel(
	deliveryChannel: EventReminderChannel | null | undefined
) {
	switch (normalizeEventReminderChannel(deliveryChannel)) {
		case 'push':
			return 'Push only';
		case 'in_app_and_push':
			return 'In-app and push';
		default:
			return 'In-app only';
	}
}

export function getEventReminderChannelCopy(
	deliveryChannel: EventReminderChannel | null | undefined
) {
	switch (normalizeEventReminderChannel(deliveryChannel)) {
		case 'push':
			return 'Push notifications only';
		case 'in_app_and_push':
			return 'In-app alerts and push notifications';
		default:
			return 'In-app alerts';
	}
}

export function formatEventReminderOffset(offsetMinutes: number) {
	if (offsetMinutes % 1440 === 0) {
		const days = offsetMinutes / 1440;
		return `${days} day${days === 1 ? '' : 's'} before`;
	}

	if (offsetMinutes % 60 === 0) {
		const hours = offsetMinutes / 60;
		return `${hours} hour${hours === 1 ? '' : 's'} before`;
	}

	return `${offsetMinutes} minute${offsetMinutes === 1 ? '' : 's'} before`;
}

export function resolveEventReminderSendAt(
	startsAt: string,
	offsetMinutes: number
) {
	const startsAtTime = getTime(startsAt);
	if (startsAtTime === null || offsetMinutes <= 0) {
		return null;
	}

	return new Date(startsAtTime - offsetMinutes * 60_000).toISOString();
}

export function buildEventReminderSchedule(
	event: Pick<EventRow, 'starts_at'> | string,
	offsets: number[],
	now = Date.now()
) {
	const startsAt = typeof event === 'string' ? event : event.starts_at;

	return normalizeEventReminderOffsets(offsets)
		.map((offsetMinutes) => {
			const sendAt = resolveEventReminderSendAt(startsAt, offsetMinutes);
			if (!sendAt) {
				return null;
			}

			return {
				offsetMinutes,
				label: formatEventReminderOffset(offsetMinutes),
				sendAt,
				isUpcoming: (getTime(sendAt) ?? 0) > now
			};
		})
		.filter((entry): entry is EventReminderScheduleEntry => entry !== null)
		.sort((left, right) => (getTime(left.sendAt) ?? 0) - (getTime(right.sendAt) ?? 0));
}

export function summarizeEventReminderSchedule(
	event: Pick<EventRow, 'starts_at'> | string,
	offsets: number[],
	deliveryChannelOrNow: EventReminderChannel | number = 'in_app',
	now = Date.now()
): EventReminderSummary {
	const deliveryChannel =
		typeof deliveryChannelOrNow === 'number' ? 'in_app' : deliveryChannelOrNow;
	const resolvedNow = typeof deliveryChannelOrNow === 'number' ? deliveryChannelOrNow : now;
	const schedule = buildEventReminderSchedule(event, offsets, resolvedNow);
	const nextReminder = schedule.find((entry) => entry.isUpcoming) ?? null;
	const normalizedDeliveryChannel = normalizeEventReminderChannel(deliveryChannel);

	return {
		count: schedule.length,
		offsets: normalizeEventReminderOffsets(offsets),
		schedule,
		nextReminderAt: nextReminder?.sendAt ?? null,
		nextReminderOffsetMinutes: nextReminder?.offsetMinutes ?? null,
		hasUpcomingReminder: nextReminder !== null,
		deliveryChannel: normalizedDeliveryChannel,
		deliveryLabel: getEventReminderChannelLabel(normalizedDeliveryChannel),
		supportsInApp: reminderChannelSupportsInApp(normalizedDeliveryChannel),
		supportsPush: reminderChannelSupportsPush(normalizedDeliveryChannel)
	};
}

export function getEventReminderSummaryCopy(summary: EventReminderSummary, now = Date.now()) {
	if (summary.count === 0) {
		return 'No reminders planned.';
	}

	const parts = [
		`${summary.count} reminder${summary.count === 1 ? '' : 's'} planned via ${getEventReminderChannelCopy(summary.deliveryChannel)}.`
	];

	if (summary.nextReminderAt) {
		parts.push(`Next goes out ${formatRelativeDateTime(summary.nextReminderAt, now)}.`);
	} else {
		parts.push('All reminder windows are already behind this event.');
	}

	return parts.join(' ');
}
