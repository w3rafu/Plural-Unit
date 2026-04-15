// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventAttendanceRoster } from '$lib/models/eventAttendanceModel';
import type { EventRow } from '$lib/repositories/hubRepository';

const { mockCurrentOrganization, mockLoadMembers } = vi.hoisted(() => ({
	mockLoadMembers: vi.fn().mockResolvedValue(undefined),
	mockCurrentOrganization: {
		organization: { id: 'org-1', name: 'Harbor Unit' },
		membership: { profile_id: 'profile-1', role: 'admin' as const },
		isAdmin: true,
		members: [],
		isLoadingMembers: false,
		loadMembers: (...args: any[]) => mockLoadMembers(...args)
	}
}));

vi.mock('$lib/stores/currentOrganization.svelte', () => ({
	currentOrganization: mockCurrentOrganization
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: () => false,
	shouldHydrateSmokeHubState: () => false,
	getSmokeModeHubLoadError: () => null
}));

import HubNotificationsSheet from './HubNotificationsSheet.svelte';
import { currentHub } from '$lib/stores/currentHub.svelte';

function makeEvent(overrides: Partial<EventRow> = {}): EventRow {
	return {
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Event',
		description: overrides.description ?? '',
		starts_at: overrides.starts_at ?? '2026-04-15T16:00:00.000Z',
		ends_at: overrides.ends_at ?? '2026-04-15T17:00:00.000Z',
		location: overrides.location ?? '',
		created_at: overrides.created_at ?? '2026-04-14T12:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-14T12:00:00.000Z',
		publish_at: overrides.publish_at ?? '2026-04-14T10:00:00.000Z',
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeRoster(pendingCount: number): EventAttendanceRoster {
	return {
		totalMembers: 4,
		expectedCount: pendingCount + 1,
		pendingCount,
		recordedCount: 1,
		attendedCount: 1,
		absentCount: 0,
		noResponseCount: 0,
		cannotAttendCount: 0,
		externalAttendanceCount: 0,
		pendingEntries: [],
		recordedEntries: []
	};
}

describe('HubNotificationsSheet', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mockCurrentOrganization.members = [];
		mockCurrentOrganization.isLoadingMembers = false;
		vi.stubGlobal(
			'ResizeObserver',
			class ResizeObserver {
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
		currentHub.reset();
		currentHub.loadedOrgId = 'org-1';
		currentHub.events = [
			makeEvent({
				id: 'e1',
				title: 'Volunteer night',
				starts_at: '2026-04-15T16:00:00.000Z',
				ends_at: '2026-04-15T17:00:00.000Z'
			}),
			makeEvent({
				id: 'e2',
				title: 'Dinner service',
				starts_at: '2026-04-15T11:00:00.000Z',
				ends_at: '2026-04-15T12:00:00.000Z'
			}),
			makeEvent({
				id: 'e3',
				title: 'Community meetup',
				starts_at: '2026-04-15T09:00:00.000Z',
				ends_at: '2026-04-15T10:00:00.000Z'
			})
		];
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		currentHub.reset();
	});

	it('shows the admin operator inbox with exact manage shortcuts', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-15T18:00:00.000Z'));

		try {
			vi.spyOn(currentHub, 'getExecutionQueueSections').mockReturnValue({
				due: [],
				upcoming: [],
				recovery: [
					{
						id: 'failed-publish',
						jobKind: 'event_publish',
						bucket: 'failed',
						triageStatus: null,
						jobLabel: 'Event publish',
						subjectKind: 'event',
						sourceId: 'e1',
						subjectTitle: 'Volunteer night',
						sectionId: 'manage-events',
						searchParamKey: 'event',
						statusLabel: 'Failed',
						timingCopy: 'Failed 1 hour ago.',
						detailCopy:
							'The scheduled publish time lands at or after the event start. Edit the timing before retrying.',
						recoveryGuidance: {
							family: 'fix_timing',
							label: 'Fix timing',
							openLabel: 'Fix timing',
							nextStepCopy: 'Edit the timing before retrying.',
							retryLabel: 'Re-check',
							allowsRetry: false,
							tone: 'attention'
						},
						canRetry: false,
						canRunNow: true
					}
				],
				processed: []
			});
			vi.spyOn(currentHub, 'getEventAttendanceRoster').mockImplementation((eventId) => {
				if (eventId === 'e2') {
					return makeRoster(2);
				}

				return null;
			});
			vi.spyOn(currentHub, 'getHubEventFollowUpSignals').mockReturnValue([
				{
					eventId: 'e3',
					eventTitle: 'Community meetup',
					kind: 'no_show',
					statusLabel: 'No-shows',
					copy: 'Everyone who RSVP’d yes ended up absent.',
					timingCopy: 'Completed 8 hours ago.',
					tone: 'attention',
					completedAt: '2026-04-15T10:00:00.000Z',
					triageStatus: null
				}
			]);

			render(HubNotificationsSheet, {
				props: {
					manageContentHref: '/hub/manage/content',
					manageBroadcastsHref: '/hub/manage/content#manage-broadcasts',
					manageEventsHref: '/hub/manage/content#manage-events'
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /Alerts/i }));

			await waitFor(() => {
				expect(screen.getByText('Operator inbox')).toBeTruthy();
			});

			expect(screen.getByText('Published alerts')).toBeTruthy();
			expect((screen.getByRole('link', { name: 'Fix timing' }) as HTMLAnchorElement).getAttribute('href')).toBe(
				'/hub/manage/content#event-e1'
			);
			expect(
				(screen.getByRole('link', { name: 'Review attendance' }) as HTMLAnchorElement).getAttribute('href')
			).toBe('/hub/manage/content#event-e2');
			expect((screen.getByRole('link', { name: 'Review no-shows' }) as HTMLAnchorElement).getAttribute('href')).toBe(
				'/hub/manage/content#event-e3'
			);
		} finally {
			vi.useRealTimers();
		}
	});

	it('loads members when an admin opens alerts from a route that has not loaded the roster yet', async () => {
		render(HubNotificationsSheet, {
			props: {
				manageContentHref: '/hub/manage/content',
				manageBroadcastsHref: '/hub/manage/content#manage-broadcasts',
				manageEventsHref: '/hub/manage/content#manage-events'
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /Alerts/i }));

		await waitFor(() => {
			expect(mockLoadMembers).toHaveBeenCalledTimes(1);
		});
	});

	it('surfaces member roster load failures instead of showing a false empty operator inbox', async () => {
		mockLoadMembers.mockRejectedValueOnce(new Error('Could not load the member roster for attendance closeout.'));

		render(HubNotificationsSheet, {
			props: {
				manageContentHref: '/hub/manage/content',
				manageBroadcastsHref: '/hub/manage/content#manage-broadcasts',
				manageEventsHref: '/hub/manage/content#manage-events'
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /Alerts/i }));

		await waitFor(() => {
			expect(
				screen.getAllByText('Could not load the member roster for attendance closeout.').length
			).toBeGreaterThan(0);
		});

		expect(
			screen.queryByText('No recovery, closeout, or follow-up work needs operator attention right now.')
		).toBeNull();
	});
});
