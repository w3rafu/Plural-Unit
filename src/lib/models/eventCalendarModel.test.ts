import { describe, expect, it } from 'vitest';
import {
	DEFAULT_EVENT_DURATION_MINUTES,
	buildEventCalendarDataUrl,
	buildEventCalendarFileName,
	buildEventCalendarIcs,
	buildGoogleCalendarHref,
	getEventLocationLabel,
	normalizeEventLocation,
	resolveEventEndsAt
} from './eventCalendarModel';

function makeEvent(
	overrides: Partial<{
		id: string;
		organization_id: string;
		title: string;
		description: string;
		starts_at: string;
		ends_at: string | null;
		location: string;
		created_at: string;
		updated_at: string;
		publish_at: string | null;
		canceled_at: string | null;
		archived_at: string | null;
	}> = {}
) {
	return {
		id: overrides.id ?? 'event-1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Neighborhood dinner',
		description: overrides.description ?? 'Shared meal for new members.',
		starts_at: overrides.starts_at ?? '2026-04-17T01:30:00.000Z',
		ends_at: overrides.ends_at === undefined ? '2026-04-17T03:00:00.000Z' : overrides.ends_at,
		location: overrides.location ?? ' North  Hall  ',
		created_at: overrides.created_at ?? '2026-04-10T19:15:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-10T19:15:00.000Z',
		publish_at: overrides.publish_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null
	};
}

describe('eventCalendarModel', () => {
	it('normalizes freeform location copy', () => {
		expect(normalizeEventLocation('  North\nHall   Annex ')).toBe('North Hall Annex');
		expect(getEventLocationLabel('')).toBe('');
	});

	it('falls back to a default event duration when no explicit end time exists', () => {
		expect(resolveEventEndsAt('2026-04-17T01:30:00.000Z', null)).toBe('2026-04-17T02:30:00.000Z');
		expect(
			resolveEventEndsAt('2026-04-17T01:30:00.000Z', '2026-04-17T01:15:00.000Z')
		).toBe('2026-04-17T02:30:00.000Z');
		expect(DEFAULT_EVENT_DURATION_MINUTES).toBe(60);
	});

	it('builds a Google Calendar link with normalized details', () => {
		const href = buildGoogleCalendarHref(makeEvent(), { organizationName: 'Harbor Unit' });

		expect(href).toContain('https://calendar.google.com/calendar/render?');
		expect(href).toContain('action=TEMPLATE');
		expect(href).toContain('Neighborhood+dinner');
		expect(href).toContain('Location%3A+North+Hall');
		expect(href).toContain('Organization%3A+Harbor+Unit');
	});

	it('builds calendar file content and a matching download URL', () => {
		const event = makeEvent({ ends_at: null });
		const ics = buildEventCalendarIcs(event, { organizationName: 'Harbor Unit' });
		const dataUrl = buildEventCalendarDataUrl(event, { organizationName: 'Harbor Unit' });

		expect(ics).toContain('BEGIN:VCALENDAR');
		expect(ics).toContain('SUMMARY:Neighborhood dinner');
		expect(ics).toContain('LOCATION:North Hall');
		expect(ics).toContain('DTEND:20260417T023000Z');
		expect(dataUrl.startsWith('data:text/calendar;charset=utf-8,')).toBe(true);
		expect(decodeURIComponent(dataUrl.slice('data:text/calendar;charset=utf-8,'.length))).toContain(
			'BEGIN:VEVENT'
		);
	});

	it('generates a stable file name from the event title', () => {
		expect(buildEventCalendarFileName(makeEvent({ title: 'Prayer & Planning Night' }))).toBe(
			'prayer-planning-night.ics'
		);
	});
});