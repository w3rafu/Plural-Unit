import type { EventRow } from '$lib/repositories/hubRepository';

export const DEFAULT_EVENT_DURATION_MINUTES = 60;

type EventCalendarOptions = {
	organizationName?: string;
	defaultDurationMinutes?: number;
	productId?: string;
};

function getValidDate(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatUtcCalendarStamp(date: Date) {
	const year = date.getUTCFullYear();
	const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
	const day = `${date.getUTCDate()}`.padStart(2, '0');
	const hour = `${date.getUTCHours()}`.padStart(2, '0');
	const minute = `${date.getUTCMinutes()}`.padStart(2, '0');
	const second = `${date.getUTCSeconds()}`.padStart(2, '0');

	return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function escapeIcsText(value: string) {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/\r?\n/g, '\\n')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,');
}

function getEventTitle(event: Pick<EventRow, 'title'>) {
	return event.title.trim() || 'Plural Unit event';
}

function buildCalendarDescription(event: EventRow, organizationName?: string) {
	const parts: string[] = [];
	const description = event.description.trim();
	const location = getEventLocationLabel(event.location);

	if (description) {
		parts.push(description);
	}

	if (location) {
		parts.push(`Location: ${location}`);
	}

	if (organizationName?.trim()) {
		parts.push(`Organization: ${organizationName.trim()}`);
	}

	return parts.join('\n\n');
}

export function normalizeEventLocation(value: string | null | undefined) {
	return value?.replace(/\s+/g, ' ').trim() ?? '';
}

export function getEventLocationLabel(value: string | null | undefined) {
	return normalizeEventLocation(value);
}

export function resolveEventEndsAt(
	startsAt: string,
	endsAt: string | null | undefined,
	defaultDurationMinutes = DEFAULT_EVENT_DURATION_MINUTES
) {
	const startsAtDate = getValidDate(startsAt);
	if (!startsAtDate) {
		return null;
	}

	const endsAtDate = getValidDate(endsAt);
	if (endsAtDate && endsAtDate.getTime() > startsAtDate.getTime()) {
		return endsAtDate.toISOString();
	}

	return new Date(startsAtDate.getTime() + defaultDurationMinutes * 60_000).toISOString();
}

export function buildGoogleCalendarHref(event: EventRow, options: EventCalendarOptions = {}) {
	const startsAtDate = getValidDate(event.starts_at);
	const resolvedEndsAt = resolveEventEndsAt(
		event.starts_at,
		event.ends_at,
		options.defaultDurationMinutes
	);

	if (!startsAtDate || !resolvedEndsAt) {
		return '';
	}

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: getEventTitle(event),
		dates: `${formatUtcCalendarStamp(startsAtDate)}/${formatUtcCalendarStamp(new Date(resolvedEndsAt))}`,
		details: buildCalendarDescription(event, options.organizationName)
	});

	const location = getEventLocationLabel(event.location);
	if (location) {
		params.set('location', location);
	}

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildEventCalendarFileName(event: Pick<EventRow, 'title'>) {
	const slug = getEventTitle(event)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48);

	return `${slug || 'plural-unit-event'}.ics`;
}

export function buildEventCalendarIcs(event: EventRow, options: EventCalendarOptions = {}) {
	const startsAtDate = getValidDate(event.starts_at);
	const resolvedEndsAt = resolveEventEndsAt(
		event.starts_at,
		event.ends_at,
		options.defaultDurationMinutes
	);

	if (!startsAtDate || !resolvedEndsAt) {
		return '';
	}

	const location = getEventLocationLabel(event.location);
	const description = buildCalendarDescription(event, options.organizationName);
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${options.productId ?? '-//Plural Unit//Hub Events//EN'}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${event.id}@plural-unit`,
		`DTSTAMP:${formatUtcCalendarStamp(new Date())}`,
		`DTSTART:${formatUtcCalendarStamp(startsAtDate)}`,
		`DTEND:${formatUtcCalendarStamp(new Date(resolvedEndsAt))}`,
		`SUMMARY:${escapeIcsText(getEventTitle(event))}`,
		`DESCRIPTION:${escapeIcsText(description)}`,
		location ? `LOCATION:${escapeIcsText(location)}` : '',
		'END:VEVENT',
		'END:VCALENDAR'
	].filter(Boolean);

	return `${lines.join('\r\n')}\r\n`;
}

export function buildEventCalendarDataUrl(event: EventRow, options: EventCalendarOptions = {}) {
	const ics = buildEventCalendarIcs(event, options);
	return ics ? `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` : '';
}