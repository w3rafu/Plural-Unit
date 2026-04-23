// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BroadcastAcknowledgmentRoster } from '$lib/models/broadcastAcknowledgmentModel';
import type { ScheduledDeliveryStatus } from '$lib/models/scheduledDeliveryModel';
import type { BroadcastRow } from '$lib/repositories/hubRepository';

const {
	mockCurrentHub,
	mockCurrentOrganization,
	mockGoto,
	mockOpenConversationForProfile,
	mockToast
} = vi.hoisted(() => ({
	mockCurrentHub: {
		getBroadcastDeliveryStatus: vi.fn(),
		getBroadcastEngagementSignal: vi.fn(),
		getBroadcastAcknowledgmentRoster: vi.fn(),
		hasAcknowledged: vi.fn(),
		getAcknowledgmentCount: vi.fn(),
		broadcastAcknowledgmentTargetId: '',
		acknowledgeBroadcast: vi.fn(),
		unacknowledgeBroadcast: vi.fn()
	},
	mockCurrentOrganization: {
		organization: { id: 'org-1', name: 'Plural Unit' },
		isAdmin: false,
		isLoadingMembers: false,
		members: [] as any[]
	},
	mockGoto: vi.fn(),
	mockOpenConversationForProfile: vi.fn(),
	mockToast: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	goto: (...args: any[]) => mockGoto(...args)
}));

vi.mock('$lib/stores/currentHub.svelte', () => ({
	currentHub: mockCurrentHub
}));

vi.mock('$lib/stores/currentOrganization.svelte', () => ({
	currentOrganization: mockCurrentOrganization
}));

vi.mock('$lib/stores/currentMessages.svelte', () => ({
	currentMessages: {
		openConversationForProfile: (...args: any[]) => mockOpenConversationForProfile(...args)
	}
}));

vi.mock('$lib/stores/currentUser.svelte', () => ({
	currentUser: {
		details: { id: 'viewer-1' }
	}
}));

vi.mock('$lib/stores/toast.svelte', () => ({
	toast: (...args: any[]) => mockToast(...args)
}));

import BroadcastDetailCard from './BroadcastDetailCard.svelte';

function makeBroadcast(overrides: Partial<BroadcastRow> = {}): BroadcastRow {
	return {
		id: overrides.id ?? 'broadcast-1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Storm shelter update',
		body:
			overrides.body ?? 'The lower hall is open tonight if anyone needs a warm place to gather.',
		created_at: overrides.created_at ?? '2026-04-16T08:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-16T10:00:00.000Z',
		is_pinned: overrides.is_pinned ?? true,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? '2026-04-16T09:00:00.000Z',
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? '2026-04-17T09:00:00.000Z',
		delivery_state: overrides.delivery_state ?? 'published',
		delivered_at: overrides.delivered_at ?? '2026-04-16T09:00:00.000Z',
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeDeliveryStatus(overrides: Partial<ScheduledDeliveryStatus> = {}): ScheduledDeliveryStatus {
	return {
		state: overrides.state ?? 'published',
		label: overrides.label ?? 'Published',
		copy: overrides.copy ?? 'Visible on schedule 2 hours ago.',
		needsAttention: overrides.needsAttention ?? false,
		failureReason: overrides.failureReason ?? null,
		deliveredAt: overrides.deliveredAt ?? '2026-04-16T09:00:00.000Z',
		canRecover: overrides.canRecover ?? false
	};
}

function makeAcknowledgmentRoster(
	overrides: Partial<BroadcastAcknowledgmentRoster> = {}
): BroadcastAcknowledgmentRoster {
	return {
		totalMembers: overrides.totalMembers ?? 3,
		acknowledgedCount: overrides.acknowledgedCount ?? 2,
		pendingCount: overrides.pendingCount ?? 1,
		externalAcknowledgmentCount: overrides.externalAcknowledgmentCount ?? 0,
		pendingEntries:
			overrides.pendingEntries ?? [
				{
					member: {
						profile_id: 'member-2',
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
		acknowledgedEntries:
			overrides.acknowledgedEntries ?? [
				{
					member: {
						profile_id: 'viewer-1',
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

describe('BroadcastDetailCard', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mockCurrentOrganization.isAdmin = false;
		mockCurrentOrganization.isLoadingMembers = false;
		mockCurrentOrganization.members = [];
		mockCurrentHub.getBroadcastDeliveryStatus.mockReturnValue(makeDeliveryStatus());
		mockCurrentHub.getBroadcastEngagementSignal.mockReturnValue({
			copy: 'Published 2 hours ago.',
			tone: 'neutral',
			needsAttention: false
		});
		mockCurrentHub.getBroadcastAcknowledgmentRoster.mockReturnValue(makeAcknowledgmentRoster());
		mockCurrentHub.hasAcknowledged.mockReturnValue(false);
		mockCurrentHub.getAcknowledgmentCount.mockReturnValue(3);
		mockCurrentHub.broadcastAcknowledgmentTargetId = '';
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('renders the full broadcast detail with delivery and acknowledgment context', () => {
		render(BroadcastDetailCard, {
			props: {
				broadcast: makeBroadcast()
			}
		});

		expect(screen.getByText('Storm shelter update')).toBeTruthy();
		expect(
			screen.getByText('The lower hall is open tonight if anyone needs a warm place to gather.')
		).toBeTruthy();
		expect(screen.getByText('Visibility')).toBeTruthy();
		expect(screen.getByText('Visible on schedule 2 hours ago.')).toBeTruthy();
		expect(screen.getByText('Acknowledgments')).toBeTruthy();
		expect(screen.getByText('3 members acknowledged')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeTruthy();
	});

	it('shows admin delivery and follow-up context only for admins', () => {
		mockCurrentOrganization.isAdmin = true;
		mockCurrentOrganization.members = [{ profile_id: 'viewer-1' }, { profile_id: 'member-2' }];

		render(BroadcastDetailCard, {
			props: {
				broadcast: makeBroadcast()
			}
		});

		expect(screen.getByText('Admin context')).toBeTruthy();
		expect(screen.getByText('Lifecycle')).toBeTruthy();
		expect(screen.getAllByText('Acknowledgment follow-up').length).toBeGreaterThan(0);
		expect(screen.getByText('2 acknowledged, 1 pending on the current roster.')).toBeTruthy();
		expect(
			(screen.getByRole('link', { name: 'Open in manage' }) as HTMLAnchorElement).getAttribute('href')
		).toBe('/hub/manage/content#broadcast-broadcast-1');
	});

	it('acknowledges the broadcast when the member has not acknowledged it yet', async () => {
		render(BroadcastDetailCard, {
			props: {
				broadcast: makeBroadcast()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));

		expect(mockCurrentHub.acknowledgeBroadcast).toHaveBeenCalledWith('broadcast-1');
		expect(mockCurrentHub.unacknowledgeBroadcast).not.toHaveBeenCalled();
	});

	it('removes the acknowledgment when the member already acknowledged the broadcast', async () => {
		mockCurrentHub.hasAcknowledged.mockReturnValue(true);

		render(BroadcastDetailCard, {
			props: {
				broadcast: makeBroadcast()
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Acknowledged ✓' }));

		expect(mockCurrentHub.unacknowledgeBroadcast).toHaveBeenCalledWith('broadcast-1');
		expect(mockCurrentHub.acknowledgeBroadcast).not.toHaveBeenCalled();
	});
});