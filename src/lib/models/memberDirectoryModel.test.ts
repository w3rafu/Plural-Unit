import { describe, expect, it } from 'vitest';
import type { OrganizationMember } from '$lib/models/organizationModel';
import {
	buildMemberDirectorySummary,
	filterMemberDirectory,
	getMemberDirectoryContactFields,
	getMemberDirectoryEmptyState,
	getMemberDirectoryMeta,
	getMemberDirectoryRoleLabel,
	getMemberDirectoryRoleOptions
} from './memberDirectoryModel';

const members: OrganizationMember[] = [
	{
		profile_id: 'user-1',
		name: 'Jamie Rivera',
		email: 'jamie@example.com',
		phone_number: '',
		avatar_url: '',
		role: 'member',
		joined_via: 'code',
		joined_at: '2026-01-10T00:00:00.000Z'
	},
	{
		profile_id: 'user-2',
		name: 'Alex Morgan',
		email: 'alex@example.com',
		phone_number: '555-0100',
		avatar_url: '',
		role: 'admin',
		joined_via: 'created',
		joined_at: '2026-01-01T00:00:00.000Z'
	}
];

describe('memberDirectoryModel', () => {
	it('returns human readable role labels', () => {
		expect(getMemberDirectoryRoleLabel('admin')).toBe('Admin');
		expect(getMemberDirectoryRoleLabel('member')).toBe('Member');
	});

	it('sorts role options with admins first', () => {
		expect(getMemberDirectoryRoleOptions(members)).toEqual(['Admin', 'Member']);
	});

	it('filters by search and keeps the current user first', () => {
		const result = filterMemberDirectory(members, {
			query: '',
			currentUserId: 'user-1'
		});

		expect(result.map((member) => member.profile_id)).toEqual(['user-1', 'user-2']);
	});

	it('filters by contact detail and role label', () => {
		expect(
			filterMemberDirectory(members, {
				query: '555',
				currentUserId: 'user-1'
			}).map((member) => member.profile_id)
		).toEqual(['user-2']);

		expect(
			filterMemberDirectory(members, {
				query: '',
				roleFilter: 'Admin',
				currentUserId: 'user-1'
			}).map((member) => member.profile_id)
		).toEqual(['user-2']);
	});

	it('builds summaries and empty states', () => {
		expect(buildMemberDirectorySummary('', 2, 2)).toBe('2 members');
		expect(buildMemberDirectorySummary('jamie', 1, 2)).toBe('1 result for "jamie"');
		expect(getMemberDirectoryEmptyState('jamie').title).toBe('No matches found');
		expect(getMemberDirectoryEmptyState('').title).toBe('No members yet');
	});

	it('builds detail metadata and contact fields', () => {
		expect(getMemberDirectoryMeta(members[0], 'user-1')).toBe('You • Member • Joined by code');
		expect(getMemberDirectoryContactFields(members[1])).toEqual([
			{ label: 'Email', value: 'alex@example.com' },
			{ label: 'Phone', value: '555-0100' }
		]);
	});
});