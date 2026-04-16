// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BroadcastAcknowledgmentRoster } from '$lib/models/broadcastAcknowledgmentModel';
import type { BroadcastRow } from '$lib/repositories/hubRepository';

const { mockGoto, mockOpenConversationForProfile, mockToast } = vi.hoisted(() => ({
	mockGoto: vi.fn(),
	mockOpenConversationForProfile: vi.fn(),
	mockToast: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	goto: (...args: any[]) => mockGoto(...args)
}));

vi.mock('$lib/stores/currentMessages.svelte', () => ({
	currentMessages: {
		openConversationForProfile: (...args: any[]) => mockOpenConversationForProfile(...args)
	}
}));

vi.mock('$lib/stores/currentUser.svelte', () => ({
	currentUser: {
		details: { id: 'profile-admin' }
	}
}));

vi.mock('$lib/stores/toast.svelte', () => ({
	toast: (...args: any[]) => mockToast(...args)
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: () => false,
	shouldHydrateSmokeHubState: () => false,
	getSmokeModeHubLoadError: () => null
}));

import BroadcastAcknowledgmentRosterPanel from './BroadcastAcknowledgmentRosterPanel.svelte';
import { currentHub } from '$lib/stores/currentHub.svelte';

function makeBroadcast(overrides: Partial<BroadcastRow> = {}): BroadcastRow {
	return {
		id: overrides.id ?? 'broadcast-1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Broadcast',
		body: overrides.body ?? 'Body',
		created_at: overrides.created_at ?? '2026-04-16T08:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-16T09:00:00.000Z',
		is_pinned: overrides.is_pinned ?? false,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? '2026-04-16T08:30:00.000Z',
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? 'published',
		delivered_at: overrides.delivered_at ?? '2026-04-16T08:30:00.000Z',
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeRoster(): BroadcastAcknowledgmentRoster {
	return {
		totalMembers: 3,
		acknowledgedCount: 2,
		pendingCount: 1,
		externalAcknowledgmentCount: 0,
		pendingEntries: [
			{
				member: {
					profile_id: 'profile-2',
					name: 'Bea',
					email: 'bea@example.com',
					phone_number: '',
					avatar_url: '',
					bio: null,
					role: 'member',
					joined_via: 'invitation',
					joined_at: '2026-04-01T10:00:00.000Z'
				},
				acknowledgedAt: null,
				isCurrentUser: false
			}
		],
		acknowledgedEntries: [
			{
				member: {
					profile_id: 'profile-admin',
					name: 'Alex',
					email: 'alex@example.com',
					phone_number: '',
					avatar_url: '',
					bio: null,
					role: 'admin',
					joined_via: 'created',
					joined_at: '2026-04-01T09:00:00.000Z'
				},
				acknowledgedAt: '2026-04-16T10:00:00.000Z',
				isCurrentUser: true
			}
		]
	};
}

describe('BroadcastAcknowledgmentRosterPanel', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		currentHub.reset();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		currentHub.reset();
	});

	it('renders follow-up summary and opens a message thread for pending members', async () => {
		vi.spyOn(currentHub, 'getBroadcastAcknowledgmentRoster').mockReturnValue(makeRoster());

		render(BroadcastAcknowledgmentRosterPanel, {
			props: {
				broadcast: makeBroadcast()
			}
		});

		expect(screen.getByText('Acknowledgment follow-up')).toBeTruthy();
		expect(screen.getByText('Still needs follow-up')).toBeTruthy();
		expect(screen.getByText('Recently acknowledged')).toBeTruthy();
		expect(screen.getByText('Bea')).toBeTruthy();
		expect(screen.getByText('Alex')).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Message' }));

		await waitFor(() => {
			expect(mockOpenConversationForProfile).toHaveBeenCalledWith('profile-2', 'profile-admin');
		});
		expect(mockGoto).toHaveBeenCalledWith('/messages');
	});
});