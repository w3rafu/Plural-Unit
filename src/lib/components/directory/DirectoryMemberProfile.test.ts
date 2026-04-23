// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { OrganizationMember } from '$lib/models/organizationModel';
import DirectoryMemberProfile from './DirectoryMemberProfile.svelte';

function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
	return {
		profile_id: 'member-1',
		name: 'Avery Brooks',
		email: 'ariana@example.com',
		phone_number: '+1 415 555 0101',
		avatar_url: '',
		bio: 'Coordinates volunteer scheduling and keeps operating notes current.',
		role: 'member',
		joined_via: 'invitation',
		joined_at: '2026-04-10T10:00:00.000Z',
		...overrides
	};
}

afterEach(() => {
	cleanup();
});

describe('DirectoryMemberProfile', () => {
	it('renders the full bio when present', () => {
		render(DirectoryMemberProfile, {
			props: {
				member: makeMember(),
				currentUserId: 'viewer-1'
			}
		});

		expect(screen.getByText('Bio')).toBeTruthy();
		expect(
			screen.getByText('Coordinates volunteer scheduling and keeps operating notes current.')
		).toBeTruthy();
	});

	it('renders a quiet fallback when the member has no bio', () => {
		render(DirectoryMemberProfile, {
			props: {
				member: makeMember({ bio: null }),
				currentUserId: 'viewer-1'
			}
		});

		expect(screen.getByText('This member has not added a bio yet.')).toBeTruthy();
	});
});