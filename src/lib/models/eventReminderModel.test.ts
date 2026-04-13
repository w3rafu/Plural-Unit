import { describe, expect, it } from 'vitest';
import {
	buildEventReminderSchedule,
	formatEventReminderOffset,
	getEventReminderSummaryCopy,
	normalizeEventReminderOffsets,
	resolveEventReminderSendAt,
	summarizeEventReminderSchedule
} from './eventReminderModel';

describe('eventReminderModel', () => {
	it('normalizes reminder offsets into a unique descending list', () => {
		expect(normalizeEventReminderOffsets([30, 1440, 30, -5, 120])).toEqual([1440, 120, 30]);
	});

	it('formats reminder offsets into readable labels', () => {
		expect(formatEventReminderOffset(1440)).toBe('1 day before');
		expect(formatEventReminderOffset(120)).toBe('2 hours before');
		expect(formatEventReminderOffset(30)).toBe('30 minutes before');
	});

	it('resolves send times relative to the event start', () => {
		expect(resolveEventReminderSendAt('2026-04-20T14:00:00.000Z', 120)).toBe(
			'2026-04-20T12:00:00.000Z'
		);
		expect(resolveEventReminderSendAt('garbage', 120)).toBeNull();
	});

	it('builds a sorted reminder schedule and identifies the next upcoming reminder', () => {
		const now = new Date('2026-04-20T10:00:00.000Z').getTime();
		const schedule = buildEventReminderSchedule('2026-04-20T14:00:00.000Z', [30, 1440, 120], now);

		expect(schedule.map((entry) => entry.offsetMinutes)).toEqual([1440, 120, 30]);
		expect(schedule.map((entry) => entry.sendAt)).toEqual([
			'2026-04-19T14:00:00.000Z',
			'2026-04-20T12:00:00.000Z',
			'2026-04-20T13:30:00.000Z'
		]);

		const summary = summarizeEventReminderSchedule('2026-04-20T14:00:00.000Z', [30, 1440, 120], now);
		expect(summary).toMatchObject({
			count: 3,
			nextReminderAt: '2026-04-20T12:00:00.000Z',
			nextReminderOffsetMinutes: 120,
			hasUpcomingReminder: true
		});
	});

	it('returns clear copy for upcoming and fully passed reminder windows', () => {
		const nextSummary = summarizeEventReminderSchedule(
			'2026-04-20T14:00:00.000Z',
			[120],
			new Date('2026-04-20T10:00:00.000Z').getTime()
		);
		expect(getEventReminderSummaryCopy(nextSummary, new Date('2026-04-20T10:00:00.000Z').getTime())).toBe(
			'1 reminder planned. Next goes out in 2 hours.'
		);

		const passedSummary = summarizeEventReminderSchedule(
			'2026-04-20T14:00:00.000Z',
			[120],
			new Date('2026-04-20T13:00:00.000Z').getTime()
		);
		expect(getEventReminderSummaryCopy(passedSummary, new Date('2026-04-20T13:00:00.000Z').getTime())).toBe(
			'1 reminder planned. All reminder windows are already behind this event.'
		);

		expect(
			getEventReminderSummaryCopy(
				summarizeEventReminderSchedule('2026-04-20T14:00:00.000Z', [], new Date('2026-04-20T10:00:00.000Z').getTime())
			)
		).toBe('No reminders planned.');
	});
});