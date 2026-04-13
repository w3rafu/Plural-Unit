import { describe, expect, it } from 'vitest';
import {
	getEventStateLabel,
	parseEventDateTimeLocalValue,
	replaceEventRow,
	sortInactiveEvents,
	sortLiveEvents,
	sortScheduledEvents,
	toEventDateTimeLocalValue,
	isEventLive,
	isEventScheduled,
	isEventPast
} from './eventLifecycleModel';

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
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Planning night',
		description: overrides.description ?? 'Details',
		starts_at: overrides.starts_at ?? '2099-04-20T16:30:00.000Z',
		ends_at: overrides.ends_at ?? null,
		location: overrides.location ?? 'Main Hall',
		created_at: overrides.created_at ?? '2099-04-01T12:00:00.000Z',
		updated_at: overrides.updated_at ?? '2099-04-01T12:00:00.000Z',
		publish_at: overrides.publish_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null
	};
}

describe('eventLifecycleModel', () => {
	it('detects live, scheduled, and past events', () => {
		const now = new Date('2099-04-10T12:00:00.000Z').getTime();

		expect(isEventLive(makeEvent(), now)).toBe(true);
		expect(
			isEventScheduled(makeEvent({ publish_at: '2099-04-11T12:00:00.000Z' }), now)
		).toBe(true);
		expect(isEventPast(makeEvent({ starts_at: '2099-04-09T12:00:00.000Z' }), now)).toBe(true);
	});

	it('sorts live events by start time and excludes hidden rows', () => {
		const now = new Date('2099-04-10T12:00:00.000Z').getTime();
		const sorted = sortLiveEvents(
			[
				makeEvent({ id: 'scheduled', publish_at: '2099-04-11T10:00:00.000Z' }),
				makeEvent({ id: 'later', starts_at: '2099-04-22T16:30:00.000Z' }),
				makeEvent({ id: 'sooner', starts_at: '2099-04-18T16:30:00.000Z' }),
				makeEvent({ id: 'archived', archived_at: '2099-04-09T12:00:00.000Z' })
			],
			now
		);

		expect(sorted.map((event) => event.id)).toEqual(['sooner', 'later']);
	});

	it('sorts scheduled events by visibility time', () => {
		const now = new Date('2099-04-10T12:00:00.000Z').getTime();
		const sorted = sortScheduledEvents(
			[
				makeEvent({ id: 'b', publish_at: '2099-04-12T12:00:00.000Z' }),
				makeEvent({ id: 'a', publish_at: '2099-04-11T12:00:00.000Z' })
			],
			now
		);

		expect(sorted.map((event) => event.id)).toEqual(['a', 'b']);
	});

	it('sorts inactive events by the latest lifecycle time', () => {
		const now = new Date('2099-04-10T12:00:00.000Z').getTime();
		const sorted = sortInactiveEvents(
			[
				makeEvent({ id: 'past', starts_at: '2099-04-09T08:00:00.000Z' }),
				makeEvent({ id: 'canceled', canceled_at: '2099-04-10T08:00:00.000Z' }),
				makeEvent({ id: 'archived', archived_at: '2099-04-10T10:00:00.000Z' })
			],
			now
		);

		expect(sorted.map((event) => event.id)).toEqual(['archived', 'canceled', 'past']);
	});

	it('replaces rows and preserves start-time sorting', () => {
		const rows = [
			makeEvent({ id: 'a', starts_at: '2099-04-22T16:30:00.000Z' }),
			makeEvent({ id: 'b', starts_at: '2099-04-24T16:30:00.000Z' })
		];

		const nextRows = replaceEventRow(rows, makeEvent({ id: 'b', starts_at: '2099-04-18T16:30:00.000Z' }));

		expect(nextRows.map((event) => event.id)).toEqual(['b', 'a']);
	});

	it('formats and parses datetime-local values for the editor form', () => {
		expect(toEventDateTimeLocalValue('2099-04-12T10:30:00.000Z')).toMatch(/^2099-04-12T/);
		expect(parseEventDateTimeLocalValue('')).toBeNull();
		expect(() => parseEventDateTimeLocalValue('not-a-date')).toThrow('Pick a valid date and time.');
	});

	it('returns clear lifecycle labels', () => {
		const now = new Date('2099-04-10T12:00:00.000Z').getTime();

		expect(getEventStateLabel(makeEvent(), now)).toBe('Live');
		expect(getEventStateLabel(makeEvent({ publish_at: '2099-04-11T12:00:00.000Z' }), now)).toBe('Scheduled');
		expect(getEventStateLabel(makeEvent({ canceled_at: '2099-04-10T08:00:00.000Z' }), now)).toBe('Canceled');
		expect(getEventStateLabel(makeEvent({ archived_at: '2099-04-10T09:00:00.000Z' }), now)).toBe('Archived');
		expect(getEventStateLabel(makeEvent({ starts_at: '2099-04-09T08:00:00.000Z' }), now)).toBe('Past');
	});
});