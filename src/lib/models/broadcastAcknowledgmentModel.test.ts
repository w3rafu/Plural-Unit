import { describe, expect, it } from 'vitest';
import {
	buildBroadcastAcknowledgmentRoster,
	getBroadcastAcknowledgmentRosterSummaryCopy
} from './broadcastAcknowledgmentModel';

function makeMember(profile_id: string, name: string) {
	return {
		profile_id,
		name,
		email: `${profile_id}@example.com`,
		phone_number: '',
		avatar_url: '',
		bio: null,
		role: 'member' as const,
		joined_via: 'invitation' as const,
		joined_at: '2026-04-01T10:00:00.000Z'
	};
}

function makeAcknowledgment(profile_id: string, acknowledged_at: string) {
	return {
		id: `ack-${profile_id}`,
		organization_id: 'org-1',
		broadcast_id: 'broadcast-1',
		profile_id,
		acknowledged_at
	};
}

describe('buildBroadcastAcknowledgmentRoster', () => {
	it('splits current members into acknowledged and pending entries', () => {
		const roster = buildBroadcastAcknowledgmentRoster(
			[makeMember('member-1', 'Alex'), makeMember('member-2', 'Bea')],
			[makeAcknowledgment('member-2', '2026-04-16T10:00:00.000Z')],
			'member-1'
		);

		expect(roster.acknowledgedCount).toBe(1);
		expect(roster.pendingCount).toBe(1);
		expect(roster.acknowledgedEntries[0]?.member.profile_id).toBe('member-2');
		expect(roster.pendingEntries[0]?.member.profile_id).toBe('member-1');
		expect(roster.pendingEntries[0]?.isCurrentUser).toBe(true);
	});

	it('tracks acknowledgments for people no longer on the current roster', () => {
		const roster = buildBroadcastAcknowledgmentRoster(
			[makeMember('member-1', 'Alex')],
			[
				makeAcknowledgment('member-1', '2026-04-16T10:00:00.000Z'),
				makeAcknowledgment('former-member', '2026-04-16T09:00:00.000Z')
			],
			'member-1'
		);

		expect(roster.externalAcknowledgmentCount).toBe(1);
		expect(getBroadcastAcknowledgmentRosterSummaryCopy(roster)).toContain(
			'1 saved acknowledgment belongs to people no longer on the current roster.'
		);
	});
});