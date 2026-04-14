import { describe, expect, it } from 'vitest';
import {
	buildEventAttendanceMap,
	buildEventAttendanceRoster,
	formatEventAttendanceOutcomeSummary,
	getEventAttendanceForProfile,
	getEventAttendanceRosterSummaryCopy,
	isEventAttendanceWindowOpen,
	removeEventAttendanceFromMap,
	summarizeEventAttendance,
	upsertEventAttendanceMap
} from './eventAttendanceModel';

const baseMembers = [
	{
		profile_id: 'profile-1',
		name: 'Alex',
		email: 'alex@example.com',
		phone_number: '',
		avatar_url: '',
		role: 'admin' as const,
		joined_via: 'created' as const,
		joined_at: '2026-04-01T10:00:00.000Z'
	},
	{
		profile_id: 'profile-2',
		name: 'Bea',
		email: 'bea@example.com',
		phone_number: '',
		avatar_url: '',
		role: 'member' as const,
		joined_via: 'invitation' as const,
		joined_at: '2026-04-02T10:00:00.000Z'
	},
	{
		profile_id: 'profile-3',
		name: 'Casey',
		email: 'casey@example.com',
		phone_number: '',
		avatar_url: '',
		role: 'member' as const,
		joined_via: 'code' as const,
		joined_at: '2026-04-03T10:00:00.000Z'
	},
	{
		profile_id: 'profile-4',
		name: 'Drew',
		email: 'drew@example.com',
		phone_number: '',
		avatar_url: '',
		role: 'member' as const,
		joined_via: 'invitation' as const,
		joined_at: '2026-04-04T10:00:00.000Z'
	}
];

const baseResponseRows = [
	{
		id: 'r1',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-1',
		response: 'going' as const,
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z'
	},
	{
		id: 'r2',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-2',
		response: 'maybe' as const,
		created_at: '2026-04-14T08:30:00.000Z',
		updated_at: '2026-04-14T08:30:00.000Z'
	},
	{
		id: 'r3',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-3',
		response: 'cannot_attend' as const,
		created_at: '2026-04-14T09:00:00.000Z',
		updated_at: '2026-04-14T09:00:00.000Z'
	}
];

const baseRows = [
	{
		id: 'a1',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-1',
		status: 'attended' as const,
		marked_by_profile_id: 'profile-admin',
		created_at: '2026-04-14T10:00:00.000Z',
		updated_at: '2026-04-14T10:00:00.000Z'
	},
	{
		id: 'a2',
		event_id: 'event-1',
		organization_id: 'org-1',
		profile_id: 'profile-2',
		status: 'absent' as const,
		marked_by_profile_id: 'profile-admin',
		created_at: '2026-04-14T11:00:00.000Z',
		updated_at: '2026-04-14T11:00:00.000Z'
	},
	{
		id: 'a3',
		event_id: 'event-2',
		organization_id: 'org-1',
		profile_id: 'profile-3',
		status: 'attended' as const,
		marked_by_profile_id: 'profile-admin',
		created_at: '2026-04-14T09:00:00.000Z',
		updated_at: '2026-04-14T09:00:00.000Z'
	}
];

describe('eventAttendanceModel', () => {
	it('groups rows by event and sorts by most recent update', () => {
		const map = buildEventAttendanceMap(baseRows);

		expect(Object.keys(map)).toEqual(['event-1', 'event-2']);
		expect(map['event-1'].map((row) => row.id)).toEqual(['a2', 'a1']);
		expect(map['event-2'].map((row) => row.id)).toEqual(['a3']);
	});

	it('summarizes recorded attendance outcomes', () => {
		const summary = summarizeEventAttendance(buildEventAttendanceMap(baseRows)['event-1']);

		expect(summary).toEqual({
			attended: 1,
			absent: 1,
			recorded: 2,
			recentProfileIds: ['profile-2', 'profile-1'],
			latestUpdatedAt: '2026-04-14T11:00:00.000Z'
		});
	});

	it('returns the saved attendance status for a member', () => {
		const rows = buildEventAttendanceMap(baseRows)['event-1'];

		expect(getEventAttendanceForProfile(rows, 'profile-1')).toBe('attended');
		expect(getEventAttendanceForProfile(rows, 'profile-missing')).toBeNull();
	});

	it('upserts an attendance row without duplicating the profile', () => {
		const map = buildEventAttendanceMap(baseRows);
		const nextMap = upsertEventAttendanceMap(map, {
			id: 'a2b',
			event_id: 'event-1',
			organization_id: 'org-1',
			profile_id: 'profile-2',
			status: 'attended',
			marked_by_profile_id: 'profile-admin',
			created_at: '2026-04-14T11:00:00.000Z',
			updated_at: '2026-04-14T12:30:00.000Z'
		});

		expect(nextMap['event-1']).toHaveLength(2);
		expect(nextMap['event-1'][0]).toMatchObject({
			id: 'a2b',
			profile_id: 'profile-2',
			status: 'attended'
		});
		expect(summarizeEventAttendance(nextMap['event-1'])).toMatchObject({
			attended: 2,
			absent: 0,
			recorded: 2
		});
	});

	it('removes an attendance row and drops the event key when empty', () => {
		const map = buildEventAttendanceMap(baseRows);
		const partiallyRemovedMap = removeEventAttendanceFromMap(map, 'event-1', 'profile-2');
		const fullyRemovedMap = removeEventAttendanceFromMap(partiallyRemovedMap, 'event-2', 'profile-3');

		expect(partiallyRemovedMap['event-1']).toHaveLength(1);
		expect(fullyRemovedMap['event-2']).toBeUndefined();
	});

	it('formats compact attendance outcome copy', () => {
		expect(
			formatEventAttendanceOutcomeSummary({
				attended: 3,
				absent: 1,
				recorded: 4,
				recentProfileIds: ['profile-1'],
				latestUpdatedAt: '2026-04-14T12:30:00.000Z'
			})
		).toBe('3 attended · 1 absent');
	});

	it('builds a day-of attendance roster with pending and recorded buckets', () => {
		const roster = buildEventAttendanceRoster(baseMembers, baseResponseRows, [
			{
				id: 'a2',
				event_id: 'event-1',
				organization_id: 'org-1',
				profile_id: 'profile-2',
				status: 'absent',
				marked_by_profile_id: 'profile-admin',
				created_at: '2026-04-14T11:00:00.000Z',
				updated_at: '2026-04-14T11:00:00.000Z'
			},
			{
				id: 'a4',
				event_id: 'event-1',
				organization_id: 'org-1',
				profile_id: 'profile-4',
				status: 'attended',
				marked_by_profile_id: 'profile-admin',
				created_at: '2026-04-14T11:30:00.000Z',
				updated_at: '2026-04-14T11:30:00.000Z'
			}
		]);

		expect(roster).toMatchObject({
			totalMembers: 4,
			expectedCount: 3,
			pendingCount: 1,
			recordedCount: 2,
			attendedCount: 1,
			absentCount: 1,
			noResponseCount: 1,
			cannotAttendCount: 1
		});
		expect(roster.pendingEntries.map((entry) => entry.member.profile_id)).toEqual(['profile-1']);
		expect(roster.recordedEntries.map((entry) => entry.member.profile_id)).toEqual([
			'profile-4',
			'profile-2'
		]);
		expect(getEventAttendanceRosterSummaryCopy(roster)).toBe(
			'1 of 3 expected attendees still needs a day-of status. 1 marked attended. 1 marked absent.'
		);
	});

	it('opens the attendance window shortly before start and closes it after the review trail', () => {
		const event = {
			id: 'event-1',
			organization_id: 'org-1',
			title: 'Event',
			description: '',
			starts_at: '2026-04-14T18:00:00.000Z',
			ends_at: '2026-04-14T19:30:00.000Z',
			location: '',
			created_at: '2026-04-14T08:00:00.000Z',
			updated_at: '2026-04-14T08:00:00.000Z',
			publish_at: null,
			canceled_at: null,
			archived_at: null
		};

		expect(isEventAttendanceWindowOpen(event, new Date('2026-04-14T11:59:59.000Z').getTime())).toBe(false);
		expect(isEventAttendanceWindowOpen(event, new Date('2026-04-14T12:00:00.000Z').getTime())).toBe(true);
		expect(isEventAttendanceWindowOpen(event, new Date('2026-04-15T19:30:00.000Z').getTime())).toBe(true);
		expect(isEventAttendanceWindowOpen(event, new Date('2026-04-15T19:30:00.001Z').getTime())).toBe(false);
	});
});
