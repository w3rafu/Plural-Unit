import { describe, expect, it } from 'vitest';
import {
	buildEventResponseMap,
	formatEventAttendanceSummary,
	formatEventResponseTotal,
	getOwnEventResponseForProfile,
	summarizeEventResponses,
	upsertEventResponseMap
} from './eventResponseModel';

const baseRows = [
	{
		id: 'r1',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-1',
		response: 'going' as const,
		created_at: '2026-04-12T10:00:00.000Z',
		updated_at: '2026-04-12T10:00:00.000Z'
	},
	{
		id: 'r2',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-2',
		response: 'maybe' as const,
		created_at: '2026-04-12T11:00:00.000Z',
		updated_at: '2026-04-12T11:00:00.000Z'
	},
	{
		id: 'r3',
		event_id: 'event-2',
		organization_id: 'org-1',
		profile_id: 'profile-3',
		response: 'cannot_attend' as const,
		created_at: '2026-04-12T09:00:00.000Z',
		updated_at: '2026-04-12T09:00:00.000Z'
	}
];

describe('eventResponseModel', () => {
	it('groups rows by event and sorts each event by most recent update', () => {
		const map = buildEventResponseMap(baseRows);

		expect(Object.keys(map)).toEqual(['event-1', 'event-2']);
		expect(map['event-1'].map((row) => row.id)).toEqual(['r2', 'r1']);
		expect(map['event-2'].map((row) => row.id)).toEqual(['r3']);
	});

	it('summarizes event counts and recent profiles', () => {
		const summary = summarizeEventResponses(buildEventResponseMap(baseRows)['event-1']);

		expect(summary).toEqual({
			going: 1,
			maybe: 1,
			cannotAttend: 0,
			total: 2,
			recentProfileIds: ['profile-2', 'profile-1'],
			latestUpdatedAt: '2026-04-12T11:00:00.000Z'
		});
	});

	it('returns the current member response for an event', () => {
		const rows = buildEventResponseMap(baseRows)['event-1'];

		expect(getOwnEventResponseForProfile(rows, 'profile-1')).toBe('going');
		expect(getOwnEventResponseForProfile(rows, 'profile-missing')).toBeNull();
	});

	it('upserts a response row without duplicating the member response', () => {
		const map = buildEventResponseMap(baseRows);
		const nextMap = upsertEventResponseMap(map, {
			id: 'r1b',
			event_id: 'event-1',
			organization_id: 'org-1',
			profile_id: 'profile-1',
			response: 'cannot_attend',
			created_at: '2026-04-12T10:00:00.000Z',
			updated_at: '2026-04-12T12:30:00.000Z'
		});

		expect(nextMap['event-1']).toHaveLength(2);
		expect(nextMap['event-1'][0]).toMatchObject({
			id: 'r1b',
			profile_id: 'profile-1',
			response: 'cannot_attend'
		});
		expect(summarizeEventResponses(nextMap['event-1'])).toMatchObject({
			going: 0,
			maybe: 1,
			cannotAttend: 1,
			total: 2
		});
	});

	it('formats attendance helper copy', () => {
		expect(
			formatEventAttendanceSummary({
				going: 3,
				maybe: 2,
				cannotAttend: 1,
				total: 6,
				recentProfileIds: ['profile-1'],
				latestUpdatedAt: '2026-04-12T12:30:00.000Z'
			})
		).toBe("3 going · 2 maybe · 1 can't make it");
		expect(formatEventResponseTotal(1)).toBe('1 response so far');
		expect(formatEventResponseTotal(4)).toBe('4 responses so far');
	});
});
