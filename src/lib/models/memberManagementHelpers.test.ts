import { describe, it, expect } from 'vitest';
import type { OrganizationMember } from '$lib/models/organizationModel';
import {
	formatJoinedVia,
	formatJoinedAt,
	formatContact,
	isLastAdmin,
	wouldDemoteLastAdmin,
	getConfirmationTitle,
	getConfirmationDescription,
	getConfirmationDetails,
	getConfirmationLabel,
	getConfirmationBusyLabel,
	getConfirmationVariant
} from './memberManagementHelpers';

function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
	return {
		profile_id: 'user-1',
		name: 'Alice',
		email: 'alice@example.com',
		phone_number: '',
		avatar_url: '',
		bio: null,
		role: 'member',
		joined_via: 'invitation',
		joined_at: '2026-04-11T00:00:00Z',
		...overrides
	};
}

// ── Formatters ──

describe('formatJoinedVia', () => {
	it('returns "Created organization" for created', () => {
		expect(formatJoinedVia(makeMember({ joined_via: 'created' }))).toBe('Created organization');
	});

	it('returns "Invited" for invitation', () => {
		expect(formatJoinedVia(makeMember({ joined_via: 'invitation' }))).toBe('Invited');
	});

	it('returns "Joined by code" for code', () => {
		expect(formatJoinedVia(makeMember({ joined_via: 'code' }))).toBe('Joined by code');
	});
});

describe('formatJoinedAt', () => {
	it('formats a valid date', () => {
		expect(formatJoinedAt('2026-04-11T00:00:00Z')).toContain('Apr');
	});

	it('returns em-dash for invalid date', () => {
		expect(formatJoinedAt('invalid')).toBe('—');
	});
});

describe('formatContact', () => {
	it('prefers email', () => {
		expect(formatContact(makeMember({ email: 'a@b.com', phone_number: '555' }))).toBe('a@b.com');
	});

	it('falls back to phone', () => {
		expect(formatContact(makeMember({ email: '', phone_number: '555' }))).toBe('555');
	});

	it('shows fallback when both empty', () => {
		expect(formatContact(makeMember({ email: '', phone_number: '' }))).toBe('No contact added');
	});
});

// ── Guard helpers ──

describe('isLastAdmin', () => {
	it('is true for the sole admin', () => {
		expect(isLastAdmin(makeMember({ role: 'admin' }), 1)).toBe(true);
	});

	it('is false when there are two admins', () => {
		expect(isLastAdmin(makeMember({ role: 'admin' }), 2)).toBe(false);
	});

	it('is false for a regular member', () => {
		expect(isLastAdmin(makeMember({ role: 'member' }), 1)).toBe(false);
	});
});

describe('wouldDemoteLastAdmin', () => {
	it('is true when demoting the sole admin', () => {
		expect(wouldDemoteLastAdmin(makeMember({ role: 'admin' }), 'member', 1)).toBe(true);
	});

	it('is false when keeping the admin role', () => {
		expect(wouldDemoteLastAdmin(makeMember({ role: 'admin' }), 'admin', 1)).toBe(false);
	});

	it('is false when there are multiple admins', () => {
		expect(wouldDemoteLastAdmin(makeMember({ role: 'admin' }), 'member', 2)).toBe(false);
	});
});

// ── Confirmation text ──

describe('getConfirmationTitle', () => {
	it('returns empty string for null', () => {
		expect(getConfirmationTitle(null)).toBe('');
	});

	it('returns promote title for admin role change', () => {
		expect(
			getConfirmationTitle({ type: 'role', member: makeMember(), nextRole: 'admin' })
		).toBe('Promote to admin?');
	});

	it('returns change title for member role change', () => {
		expect(
			getConfirmationTitle({ type: 'role', member: makeMember(), nextRole: 'member' })
		).toBe('Change member role?');
	});

	it('returns remove title for removal', () => {
		expect(getConfirmationTitle({ type: 'remove', member: makeMember() })).toBe(
			'Remove member?'
		);
	});
});

describe('getConfirmationDescription', () => {
	it('returns empty for null', () => {
		expect(getConfirmationDescription(null)).toBe('');
	});

	it('mentions member name when set', () => {
		expect(
			getConfirmationDescription({
				type: 'remove',
				member: makeMember({ name: 'Bob' })
			})
		).toContain('Bob');
	});

	it('uses fallback when name is empty', () => {
		expect(
			getConfirmationDescription({
				type: 'remove',
				member: makeMember({ name: '' })
			})
		).toContain('This member');
	});
});

describe('getConfirmationDetails', () => {
	it('returns empty for null', () => {
		expect(getConfirmationDetails(null, 'u1', 'Org')).toEqual([]);
	});

	it('includes current and new role for role action', () => {
		const details = getConfirmationDetails(
			{ type: 'role', member: makeMember({ role: 'member' }), nextRole: 'admin' },
			'other-user',
			'Org'
		);
		expect(details).toContain('Current role: member');
		expect(details).toContain('New role: admin');
	});

	it('warns when demoting yourself', () => {
		const details = getConfirmationDetails(
			{
				type: 'role',
				member: makeMember({ profile_id: 'me', role: 'admin' }),
				nextRole: 'member'
			},
			'me',
			'Org'
		);
		expect(details.some((d) => d.includes('your own admin access'))).toBe(true);
	});

	it('includes org name for removal', () => {
		const details = getConfirmationDetails(
			{ type: 'remove', member: makeMember() },
			'other',
			'My Org'
		);
		expect(details.some((d) => d.includes('My Org'))).toBe(true);
	});
});

describe('getConfirmationLabel / busyLabel / variant', () => {
	it('returns defaults for null', () => {
		expect(getConfirmationLabel(null)).toBe('Confirm');
		expect(getConfirmationBusyLabel(null)).toBe('Working...');
		expect(getConfirmationVariant(null)).toBe('default');
	});

	it('returns destructive for removal', () => {
		expect(getConfirmationVariant({ type: 'remove', member: makeMember() })).toBe('destructive');
	});
});
