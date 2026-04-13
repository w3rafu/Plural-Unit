import type { EventRow } from '$lib/repositories/hubRepository';

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function sortByStartsAt(left: EventRow, right: EventRow) {
	return (getTime(left.starts_at) ?? 0) - (getTime(right.starts_at) ?? 0);
}

export function isEventArchived(event: Pick<EventRow, 'archived_at'>) {
	return !!event.archived_at;
}

export function isEventCanceled(event: Pick<EventRow, 'canceled_at'>) {
	return !!event.canceled_at;
}

export function isEventPast(event: Pick<EventRow, 'starts_at'>, now = Date.now()) {
	const startsAt = getTime(event.starts_at);
	return startsAt !== null && startsAt <= now;
}

export function isEventPublished(event: Pick<EventRow, 'publish_at'>, now = Date.now()) {
	const publishAt = getTime(event.publish_at);
	return publishAt === null || publishAt <= now;
}

export function isEventScheduled(event: EventRow, now = Date.now()) {
	return (
		!isEventArchived(event) &&
		!isEventCanceled(event) &&
		!isEventPast(event, now) &&
		!isEventPublished(event, now)
	);
}

export function isEventLive(event: EventRow, now = Date.now()) {
	return (
		!isEventArchived(event) &&
		!isEventCanceled(event) &&
		!isEventPast(event, now) &&
		isEventPublished(event, now)
	);
}

export function sortEventRows(rows: EventRow[]) {
	return [...rows].sort(sortByStartsAt);
}

export function sortLiveEvents(rows: EventRow[], now = Date.now()) {
	return sortEventRows(rows.filter((event) => isEventLive(event, now)));
}

export function sortScheduledEvents(rows: EventRow[], now = Date.now()) {
	return [...rows.filter((event) => isEventScheduled(event, now))].sort((left, right) => {
		const leftTime = getTime(left.publish_at) ?? getTime(left.starts_at) ?? 0;
		const rightTime = getTime(right.publish_at) ?? getTime(right.starts_at) ?? 0;

		if (leftTime !== rightTime) {
			return leftTime - rightTime;
		}

		return sortByStartsAt(left, right);
	});
}

export function sortInactiveEvents(rows: EventRow[], now = Date.now()) {
	return rows
		.filter((event) => !isEventLive(event, now) && !isEventScheduled(event, now))
		.sort((left, right) => {
			const leftTime =
				getTime(left.archived_at) ??
				getTime(left.canceled_at) ??
				getTime(left.starts_at) ??
				getTime(left.updated_at) ??
				getTime(left.created_at) ??
				0;
			const rightTime =
				getTime(right.archived_at) ??
				getTime(right.canceled_at) ??
				getTime(right.starts_at) ??
				getTime(right.updated_at) ??
				getTime(right.created_at) ??
				0;

			return rightTime - leftTime;
		});
}

export function replaceEventRow(rows: EventRow[], row: EventRow) {
	return sortEventRows([...rows.filter((existingRow) => existingRow.id !== row.id), row]);
}

export function removeEventRow(rows: EventRow[], eventId: string) {
	return rows.filter((row) => row.id !== eventId);
}

export function toEventDateTimeLocalValue(value: string | null | undefined) {
	if (!value) {
		return '';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return offsetDate.toISOString().slice(0, 16);
}

export function parseEventDateTimeLocalValue(value: string, invalidMessage = 'Pick a valid date and time.') {
	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	const date = new Date(trimmedValue);
	if (Number.isNaN(date.getTime())) {
		throw new Error(invalidMessage);
	}

	return date.toISOString();
}

export function getEventStateLabel(event: EventRow, now = Date.now()) {
	if (isEventArchived(event)) {
		return 'Archived';
	}

	if (isEventCanceled(event)) {
		return 'Canceled';
	}

	if (isEventPast(event, now)) {
		return 'Past';
	}

	if (isEventScheduled(event, now)) {
		return 'Scheduled';
	}

	return 'Live';
}