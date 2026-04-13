import type { EventRow } from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';

export const EVENT_REMINDER_OPTIONS = [
	{
		value: 1440,
		label: '1 day before',
		description: 'Queue an in-app reminder 24 hours before the event begins.'
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
	now = Date.now()
): EventReminderSummary {
	const schedule = buildEventReminderSchedule(event, offsets, now);
	const nextReminder = schedule.find((entry) => entry.isUpcoming) ?? null;

	return {
		count: schedule.length,
		offsets: normalizeEventReminderOffsets(offsets),
		schedule,
		nextReminderAt: nextReminder?.sendAt ?? null,
		nextReminderOffsetMinutes: nextReminder?.offsetMinutes ?? null,
		hasUpcomingReminder: nextReminder !== null
	};
}

export function getEventReminderSummaryCopy(summary: EventReminderSummary, now = Date.now()) {
	if (summary.count === 0) {
		return 'No reminders planned.';
	}

	const parts = [`${summary.count} reminder${summary.count === 1 ? '' : 's'} planned.`];

	if (summary.nextReminderAt) {
		parts.push(`Next goes out ${formatRelativeDateTime(summary.nextReminderAt, now)}.`);
	} else {
		parts.push('All reminder windows are already behind this event.');
	}

	return parts.join(' ');
}