// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrganizationMember } from '$lib/models/organizationModel';
import ContactPicker from './ContactPicker.svelte';

function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
	return {
		profile_id: 'member-1',
		name: 'Ariana Lopez',
		email: 'ariana@example.com',
		phone_number: '+1 415 555 0101',
		avatar_url: '',
		bio: 'Coordinates volunteers.',
		role: 'admin',
		joined_via: 'created',
		joined_at: '2026-01-06T15:20:00.000Z',
		...overrides
	};
}

describe('ContactPicker', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.stubGlobal(
			'ResizeObserver',
			class ResizeObserver {
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('excludes the current member and filters by search query', async () => {
		render(ContactPicker, {
			props: {
				open: true,
				members: [
					makeMember({ profile_id: 'current-user', name: 'Ariana Lopez', email: 'ariana@example.com' }),
					makeMember({ profile_id: 'member-2', name: 'Elena Rossi', email: 'elena@example.com', role: 'member' }),
					makeMember({ profile_id: 'member-3', name: 'Malik Johnson', email: 'malik@example.com', role: 'member' })
				],
				currentProfileId: 'current-user',
				onSelectMember: () => {}
			}
		});

		expect(screen.queryByText('Ariana Lopez')).toBeNull();
		expect(screen.getByText('Elena Rossi')).toBeTruthy();
		expect(screen.getByText('Malik Johnson')).toBeTruthy();

		await fireEvent.input(screen.getByPlaceholderText('Search by name or email'), {
			target: { value: 'malik' }
		});

		expect(screen.queryByText('Elena Rossi')).toBeNull();
		expect(screen.getByText('Malik Johnson')).toBeTruthy();
	});

	it('calls onSelectMember when a member is picked', async () => {
		const onSelectMember = vi.fn();

		render(ContactPicker, {
			props: {
				open: true,
				members: [
					makeMember({ profile_id: 'member-2', name: 'Elena Rossi', email: 'elena@example.com', role: 'member' })
				],
				currentProfileId: 'current-user',
				onSelectMember
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /Elena Rossi/i }));
		expect(onSelectMember).toHaveBeenCalledWith('member-2');
	});

	it('shows the empty search state when nothing matches', async () => {
		render(ContactPicker, {
			props: {
				open: true,
				members: [
					makeMember({ profile_id: 'member-2', name: 'Elena Rossi', email: 'elena@example.com', role: 'member' })
				],
				currentProfileId: 'current-user',
				onSelectMember: () => {}
			}
		});

		await fireEvent.input(screen.getByPlaceholderText('Search by name or email'), {
			target: { value: 'nobody' }
		});

		expect(screen.getByText('No members match your search.')).toBeTruthy();
	});
});