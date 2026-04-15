// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	EventAttendanceOutcomeSummary,
	EventAttendanceRoster
} from '$lib/models/eventAttendanceModel';
import type { EventRow } from '$lib/repositories/hubRepository';

const { mockGoto, mockOpenConversationForProfile, mockToast, mockCurrentOrganization } = vi.hoisted(
	() => ({
		mockGoto: vi.fn(),
		mockOpenConversationForProfile: vi.fn(),
		mockToast: vi.fn(),
		mockCurrentOrganization: {
			members: [] as any[],
			isLoadingMembers: false,
			isAdmin: true
		}
	})
);

vi.mock('$app/navigation', () => ({
	goto: (...args: any[]) => mockGoto(...args)
}));

vi.mock('$lib/stores/currentMessages.svelte', () => ({
	currentMessages: {
		openConversationForProfile: (...args: any[]) => mockOpenConversationForProfile(...args)
	}
}));

vi.mock('$lib/stores/currentOrganization.svelte', () => ({
	currentOrganization: mockCurrentOrganization
}));

vi.mock('$lib/stores/currentUser.svelte', () => ({
	currentUser: {
		details: {
			id: 'profile-1'
		}
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

import EventAttendanceRosterPanel from './EventAttendanceRosterPanel.svelte';
import { currentHub } from '$lib/stores/currentHub.svelte';

function makeOpenEvent(overrides: Partial<EventRow> = {}): EventRow {
	const startsAt = overrides.starts_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
	const publishAt = overrides.publish_at ?? new Date(Date.now() - 60 * 60 * 1000).toISOString();

	return {
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Event',
		description: overrides.description ?? '',
		starts_at: startsAt,
		ends_at: overrides.ends_at ?? null,
		location: overrides.location ?? '',
		created_at: overrides.created_at ?? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		updated_at: overrides.updated_at ?? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		publish_at: publishAt,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeOutcomeSummary(overrides: Partial<EventAttendanceOutcomeSummary> = {}): EventAttendanceOutcomeSummary {
	return {
		attended: overrides.attended ?? 0,
		absent: overrides.absent ?? 0,
		recorded: overrides.recorded ?? 0,
		recentProfileIds: overrides.recentProfileIds ?? [],
		latestUpdatedAt: overrides.latestUpdatedAt ?? null
	};
}

function makeRoster(pendingProfileIds: string[]): EventAttendanceRoster {
	return {
		totalMembers: 3,
		expectedCount: pendingProfileIds.length,
		pendingCount: pendingProfileIds.length,
		recordedCount: 0,
		attendedCount: 0,
		absentCount: 0,
		noResponseCount: 0,
		cannotAttendCount: 0,
		externalAttendanceCount: 0,
		pendingEntries: pendingProfileIds.map((profileId, index) => ({
			member: {
				profile_id: profileId,
				name: `Member ${index + 1}`,
				email: `member${index + 1}@example.com`,
				phone_number: '',
				avatar_url: '',
				role: 'member',
				joined_via: 'invitation',
				joined_at: '2026-04-01T10:00:00.000Z'
			},
			response: 'going',
			responseUpdatedAt: '2026-04-15T10:00:00.000Z',
			attendanceStatus: null,
			attendanceUpdatedAt: null,
			markedByProfileId: null,
			isCurrentUser: profileId === 'profile-1'
		})),
		recordedEntries: []
	};
}

describe('EventAttendanceRosterPanel', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		currentHub.reset();
		currentHub.eventAttendanceTargetId = '';
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		currentHub.reset();
	});

	it('shows bulk controls only when multiple attendees still need closeout', () => {
		vi.spyOn(currentHub, 'getEventAttendanceRoster').mockReturnValue(makeRoster(['profile-2']));
		vi.spyOn(currentHub, 'getEventAttendanceOutcomeSummary').mockReturnValue(makeOutcomeSummary());

		render(EventAttendanceRosterPanel, {
			props: {
				event: makeOpenEvent()
			}
		});

		expect(screen.queryByRole('button', { name: /Mark all .* attended/i })).toBeNull();
		expect(screen.queryByRole('button', { name: /Mark all .* absent/i })).toBeNull();
	});

	it('records a bulk attendance action for unresolved attendees', async () => {
		vi.spyOn(currentHub, 'getEventAttendanceRoster').mockReturnValue(
			makeRoster(['profile-2', 'profile-3'])
		);
		vi.spyOn(currentHub, 'getEventAttendanceOutcomeSummary').mockReturnValue(makeOutcomeSummary());

		let resolveBulkMutation = () => {};
		const bulkMutation = new Promise<void>((resolve) => {
			resolveBulkMutation = resolve;
		});

		const bulkSpy = vi
			.spyOn(currentHub, 'setEventAttendanceForProfiles')
			.mockImplementation(async (eventId, profileIds, status) => {
				currentHub.eventAttendanceTargetId = `${eventId}:bulk:${status}`;
				await bulkMutation;
				currentHub.eventAttendanceTargetId = '';
				return undefined;
			});

		render(EventAttendanceRosterPanel, {
			props: {
				event: makeOpenEvent()
			}
		});

		const bulkButton = screen.getByRole('button', { name: 'Mark all 2 attended' });
		await fireEvent.click(bulkButton);

		await waitFor(() => {
			expect(bulkSpy).toHaveBeenCalledWith('e1', ['profile-2', 'profile-3'], 'attended');
		});

		await waitFor(() => {
			const status = screen.queryByRole('status');
			expect(status).not.toBeNull();
			expect(status?.textContent).toContain('Recording attendance for 2 expected attendees...');
		});

		const individualButton = screen.getAllByRole('button', { name: 'Attended' })[0] as HTMLButtonElement;
		expect(individualButton.disabled).toBe(true);

		resolveBulkMutation();
		await bulkMutation;

		await waitFor(() => {
			expect(screen.queryByRole('status')).toBeNull();
		});
	});
});