import { describe, expect, it } from 'vitest';
import type { OrganizationInvitation, OrganizationMember } from '$lib/models/organizationModel';
import {
	buildOrganizationMembersSummary,
	buildPendingInvitationsSummary,
	countRecentOrganizationMembers,
	countStaleOrganizationInvitations,
	filterOrganizationMembers,
	filterPendingInvitations,
	getInvitationChannel,
	getInvitationRecipient,
	getOrganizationMembersEmptyState,
	getPendingInvitationsEmptyState,
	isRecentOrganizationMember,
	isStaleOrganizationInvitation
} from './accessReviewModel';

function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
	return {
		profile_id: 'member-1',
		name: 'Ariana Lopez',
		email: 'ariana@example.com',
		phone_number: '',
		avatar_url: '',
		bio: null,
		role: 'member',
		joined_via: 'invitation',
		joined_at: '2026-04-10T10:00:00.000Z',
		...overrides
	};
}

function makeInvitation(overrides: Partial<OrganizationInvitation> = {}): OrganizationInvitation {
	return {
		id: 'invite-1',
		organization_id: 'org-1',
		email: 'person@example.com',
		phone: null,
		status: 'pending',
		created_at: '2026-04-01T10:00:00.000Z',
		...overrides
	};
}

describe('accessReviewModel', () => {
	it('flags recent members based on joined_at age', () => {
		const now = new Date('2026-04-12T10:00:00.000Z').getTime();

		expect(isRecentOrganizationMember(makeMember(), now)).toBe(true);
		expect(
			isRecentOrganizationMember(makeMember({ joined_at: '2026-03-20T10:00:00.000Z' }), now)
		).toBe(false);
	});

	it('filters members by query and review filter', () => {
		const now = new Date('2026-04-12T10:00:00.000Z').getTime();
		const members = [
			makeMember({ profile_id: 'member-1', role: 'admin', joined_via: 'created' }),
			makeMember({ profile_id: 'member-2', name: 'Lucia Costa', email: '', phone_number: '+1555', role: 'member', joined_via: 'code', joined_at: '2026-03-20T10:00:00.000Z' })
		];

		expect(filterOrganizationMembers(members, { filter: 'admin', now }).map((member) => member.profile_id)).toEqual(['member-1']);
		expect(filterOrganizationMembers(members, { filter: 'recent', now }).map((member) => member.profile_id)).toEqual(['member-1']);
		expect(filterOrganizationMembers(members, { query: '1555', now }).map((member) => member.profile_id)).toEqual(['member-2']);
		expect(countRecentOrganizationMembers(members, now)).toBe(1);
	});

	it('builds member review summaries and empty states', () => {
		expect(
			buildOrganizationMembersSummary({
				query: '',
				filter: 'all',
				visibleCount: 3,
				totalCount: 3
			})
		).toBe('3 members currently have access.');
		expect(
			buildOrganizationMembersSummary({
				query: 'ari',
				filter: 'recent',
				visibleCount: 1,
				totalCount: 3
			})
		).toContain('Showing 1 of 3 recent joins');
		expect(getOrganizationMembersEmptyState('ari', 'all').title).toBe('No matching members');
		expect(getOrganizationMembersEmptyState('', 'recent').title).toBe('No recent joins');
	});

	it('flags stale invitations and exposes channel metadata', () => {
		const now = new Date('2026-04-12T10:00:00.000Z').getTime();
		const emailInvite = makeInvitation();
		const phoneInvite = makeInvitation({ id: 'invite-2', email: null, phone: '+1555', created_at: '2026-04-10T10:00:00.000Z' });

		expect(getInvitationRecipient(emailInvite)).toBe('person@example.com');
		expect(getInvitationChannel(emailInvite)).toBe('email');
		expect(getInvitationChannel(phoneInvite)).toBe('phone');
		expect(isStaleOrganizationInvitation(emailInvite, now)).toBe(true);
		expect(isStaleOrganizationInvitation(phoneInvite, now)).toBe(false);
		expect(countStaleOrganizationInvitations([emailInvite, phoneInvite], now)).toBe(1);
	});

	it('filters invitations by query and review filter', () => {
		const now = new Date('2026-04-12T10:00:00.000Z').getTime();
		const invitations = [
			makeInvitation({ id: 'invite-1', email: 'person@example.com', created_at: '2026-04-01T10:00:00.000Z' }),
			makeInvitation({ id: 'invite-2', email: null, phone: '+1555', created_at: '2026-04-10T10:00:00.000Z' })
		];

		expect(filterPendingInvitations(invitations, { filter: 'stale', now }).map((invitation) => invitation.id)).toEqual(['invite-1']);
		expect(filterPendingInvitations(invitations, { filter: 'phone', now }).map((invitation) => invitation.id)).toEqual(['invite-2']);
		expect(filterPendingInvitations(invitations, { query: 'example', now }).map((invitation) => invitation.id)).toEqual(['invite-1']);
	});

	it('builds invitation summaries and empty states', () => {
		expect(
			buildPendingInvitationsSummary({
				query: '',
				filter: 'all',
				visibleCount: 2,
				totalCount: 2
			})
		).toBe('2 pending invites currently need review.');
		expect(
			buildPendingInvitationsSummary({
				query: 'phone',
				filter: 'phone',
				visibleCount: 1,
				totalCount: 2
			})
		).toContain('Showing 1 of 2 phone invites');
		expect(getPendingInvitationsEmptyState('aria', 'all').title).toBe('No matching invitations');
		expect(getPendingInvitationsEmptyState('', 'stale').title).toBe('No stale invitations');
	});
});
