// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	EventAttendanceOutcomeSummary,
	EventAttendanceRoster
} from '$lib/models/eventAttendanceModel';
import type { EventResponseRoster } from '$lib/models/eventResponseModel';
import type { EventReminderSummary } from '$lib/models/eventReminderModel';
import type { ScheduledDeliveryStatus } from '$lib/models/scheduledDeliveryModel';
import type { EventRow } from '$lib/repositories/hubRepository';

const {
	mockCurrentHub,
	mockCurrentOrganization,
	mockGoto,
	mockOpenConversationForProfile,
	mockToast
} = vi.hoisted(() => ({
	mockCurrentHub: {
		getEventAttendanceSummary: vi.fn(),
		getOwnEventResponse: vi.fn(),
		eventResponseTargetId: '',
		setEventResponse: vi.fn(),
		getEventDeliveryStatus: vi.fn(),
		getEventReminderSummary: vi.fn(),
		getEventResponseRoster: vi.fn(),
		getEventAttendanceRoster: vi.fn(),
		getEventAttendanceOutcomeSummary: vi.fn(),
		eventAttendanceTargetId: '',
		setEventAttendance: vi.fn(),
		clearEventAttendance: vi.fn(),
		setEventAttendanceForProfiles: vi.fn()
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

import EventDetailCard from './EventDetailCard.svelte';

function makeEvent(overrides: Partial<EventRow> = {}): EventRow {
	const startsAt = overrides.starts_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
	const publishAt = overrides.publish_at ?? new Date(Date.now() - 60 * 60 * 1000).toISOString();

	return {
		id: overrides.id ?? 'event-1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Community lunch',
		description: overrides.description ?? 'Bring a side dish if you can.',
		starts_at: startsAt,
		ends_at: overrides.ends_at ?? null,
		location: overrides.location ?? 'Cafe',
		created_at: overrides.created_at ?? new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
		updated_at: overrides.updated_at ?? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		publish_at: publishAt,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null,
		delivery_state: overrides.delivery_state ?? 'published',
		delivered_at: overrides.delivered_at ?? publishAt,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeDeliveryStatus(overrides: Partial<ScheduledDeliveryStatus> = {}): ScheduledDeliveryStatus {
	return {
		state: overrides.state ?? 'published',
		label: overrides.label ?? 'Published',
		copy: overrides.copy ?? 'Visible on schedule 1 hour ago.',
		needsAttention: overrides.needsAttention ?? false,
		failureReason: overrides.failureReason ?? null,
		deliveredAt: overrides.deliveredAt ?? '2026-04-16T10:00:00.000Z',
		canRecover: overrides.canRecover ?? false
	};
}

function makeReminderSummary(overrides: Partial<EventReminderSummary> = {}): EventReminderSummary {
	return {
		count: overrides.count ?? 2,
		offsets: overrides.offsets ?? [1440, 120],
		schedule: overrides.schedule ?? [],
		nextReminderAt: overrides.nextReminderAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
		nextReminderOffsetMinutes: overrides.nextReminderOffsetMinutes ?? 120,
		hasUpcomingReminder: overrides.hasUpcomingReminder ?? true
	};
}

function makeResponseRoster(overrides: Partial<EventResponseRoster> = {}): EventResponseRoster {
	return {
		totalMembers: overrides.totalMembers ?? 3,
		respondedCount: overrides.respondedCount ?? 2,
		nonResponderCount: overrides.nonResponderCount ?? 1,
		externalResponseCount: overrides.externalResponseCount ?? 0,
		responders: overrides.responders ?? [],
		nonResponders: overrides.nonResponders ?? []
	};
}

function makeAttendanceRoster(): EventAttendanceRoster {
	return {
		totalMembers: 3,
		expectedCount: 2,
		pendingCount: 0,
		recordedCount: 2,
		attendedCount: 2,
		absentCount: 0,
		noResponseCount: 0,
		cannotAttendCount: 0,
		externalAttendanceCount: 0,
		pendingEntries: [],
		recordedEntries: []
	};
}

function makeAttendanceOutcomeSummary(
	overrides: Partial<EventAttendanceOutcomeSummary> = {}
): EventAttendanceOutcomeSummary {
	return {
		attended: overrides.attended ?? 2,
		absent: overrides.absent ?? 0,
		recorded: overrides.recorded ?? 2,
		recentProfileIds: overrides.recentProfileIds ?? ['member-1'],
		latestUpdatedAt: overrides.latestUpdatedAt ?? '2026-04-16T10:30:00.000Z'
	};
}

describe('EventDetailCard', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mockCurrentOrganization.isAdmin = false;
		mockCurrentOrganization.isLoadingMembers = false;
		mockCurrentOrganization.members = [];
		mockCurrentHub.getEventAttendanceSummary.mockReturnValue({
			going: 2,
			maybe: 1,
			cannotAttend: 0,
			total: 3,
			recentProfileIds: [],
			latestUpdatedAt: null
		});
		mockCurrentHub.getOwnEventResponse.mockReturnValue('going');
		mockCurrentHub.getEventDeliveryStatus.mockReturnValue(makeDeliveryStatus());
		mockCurrentHub.getEventReminderSummary.mockReturnValue(makeReminderSummary());
		mockCurrentHub.getEventResponseRoster.mockReturnValue(makeResponseRoster());
		mockCurrentHub.getEventAttendanceRoster.mockReturnValue(makeAttendanceRoster());
		mockCurrentHub.getEventAttendanceOutcomeSummary.mockReturnValue(
			makeAttendanceOutcomeSummary()
		);
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('keeps admin-only context hidden for non-admin members', () => {
		render(EventDetailCard, {
			props: {
				event: makeEvent()
			}
		});

		expect(screen.queryByText('Admin context')).toBeNull();
		expect(screen.queryByRole('link', { name: 'Open in manage' })).toBeNull();
		expect(screen.queryByText('Day-of attendance')).toBeNull();
	});

	it('shows delivery, reminder, roster, and manage context for admins', () => {
		mockCurrentOrganization.isAdmin = true;
		mockCurrentOrganization.members = [{ profile_id: 'member-1' }];

		render(EventDetailCard, {
			props: {
				event: makeEvent()
			}
		});

		expect(screen.getByText('Admin context')).toBeTruthy();
		expect(screen.getByText('Visibility')).toBeTruthy();
		expect(screen.getByText('Visible on schedule 1 hour ago.')).toBeTruthy();
		expect(screen.getByText('Reminders')).toBeTruthy();
		expect(screen.getByText('2 reminders planned')).toBeTruthy();
		expect(screen.getByText('RSVP follow-up')).toBeTruthy();
		expect(screen.getByText('2 of 3 current members replied. 1 still needs follow-up.')).toBeTruthy();
		expect(
			(screen.getByRole('link', { name: 'Open in manage' }) as HTMLAnchorElement).getAttribute('href')
		).toBe('/hub/manage/content#event-event-1');
		expect(screen.getByText('Day-of attendance')).toBeTruthy();
	});
});