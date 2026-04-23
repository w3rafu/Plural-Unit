import { describe, expect, it } from 'vitest';

import {
	buildHubExecutionQueueItemTriageKey,
	buildHubExecutionQueueSections
} from '$lib/models/hubExecutionQueue';

import {
	buildSmokeHubState,
	buildSmokeInvitations,
	buildSmokeMessages,
	buildSmokeUserDetails,
	summarizeSmokeHubState
} from './smokeFixtures';

describe('smokeFixtures', () => {
	it('builds fixture-backed hub state with queue coverage across key buckets', () => {
		const now = Date.parse('2026-04-15T12:00:00.000Z');
		const state = buildSmokeHubState(now);
		const groups = summarizeSmokeHubState(now);
		const visibleQueue = buildHubExecutionQueueSections({
			rows: state.executionLedger,
			broadcasts: state.broadcasts,
			events: state.events,
			now,
			triageMap: state.queueTriageMap
		});
		const allQueue = buildHubExecutionQueueSections({
			rows: state.executionLedger,
			broadcasts: state.broadcasts,
			events: state.events,
			now,
			triageMap: state.queueTriageMap,
			includeTriaged: true
		});

		expect(state.plugins).toEqual({
			broadcasts: { isEnabled: true, visibility: 'all_members' },
			events: { isEnabled: true, visibility: 'admins_only' },
			resources: { isEnabled: true, visibility: 'all_members' },
			volunteers: { isEnabled: true, visibility: 'all_members' }
		});
		expect(state.broadcasts).toHaveLength(3);
		expect(state.events).toHaveLength(5);
		expect(state.resources).toHaveLength(3);
		expect(state.workflowStateRows).toHaveLength(2);
		expect(state.workflowStateRows.map((row) => row.note)).toEqual(
			expect.arrayContaining([
				'Confirmed after the publish run completed.',
				'Re-open this if the schedule shifts again.'
			])
		);
		expect(Object.keys(state.queueTriageMap)).toHaveLength(2);
		expect(groups.due.length).toBeGreaterThan(0);
		expect(groups.upcoming.length).toBeGreaterThan(0);
		expect(groups.processed.length).toBeGreaterThan(0);
		expect(groups.failed.length).toBeGreaterThan(0);

		const reviewedProcessedItem = allQueue.processed.find(
			(item) => item.triageStatus === 'reviewed' && !item.isStaleReview
		);
		const staleRecoveryItem = visibleQueue.recovery.find((item) => item.isStaleReview);

		if (!reviewedProcessedItem || !staleRecoveryItem) {
			throw new Error('Expected smoke workflow fixtures to seed one hidden triaged item and one stale recovery item.');
		}

		expect(
			visibleQueue.processed.some((item) => item.id === reviewedProcessedItem.id)
		).toBe(false);
		expect(staleRecoveryItem).toMatchObject({
			triageStatus: 'deferred',
			staleReviewCopy: 'Due time changed since review.'
		});
		expect(
			state.queueTriageMap[buildHubExecutionQueueItemTriageKey(reviewedProcessedItem)]
				?.reviewedAgainstSignature
		).toBe(reviewedProcessedItem.reviewSignature);
		expect(
			state.queueTriageMap[buildHubExecutionQueueItemTriageKey(staleRecoveryItem)]
				?.reviewedAgainstSignature
		).not.toBe(staleRecoveryItem.reviewSignature);
	});

	it('exposes current-user and message fixtures for smoke mode', () => {
		const user = buildSmokeUserDetails();
		const threads = buildSmokeMessages();

		expect(user.id).toBeTruthy();
		expect(user.name).toBe('Avery Brooks');
		expect(threads.length).toBeGreaterThan(0);
		expect(threads[0]?.messages.length).toBeGreaterThan(0);
	});

	it('seeds invitation follow-up with active and expired fixtures', () => {
		const now = Date.parse('2026-04-15T12:00:00.000Z');
		const invitations = buildSmokeInvitations(now);
		const activeInvitation = invitations.find((invitation) => invitation.status === 'pending');
		const expiredInvitation = invitations.find((invitation) => invitation.status === 'expired');

		expect(invitations).toHaveLength(2);
		expect(activeInvitation?.email).toBe('new.family@example.com');
		expect(Date.parse(activeInvitation?.expires_at ?? '')).toBeGreaterThan(now);
		expect(expiredInvitation?.phone).toBe('+1 555 123 0099');
		expect(Date.parse(expiredInvitation?.expires_at ?? '')).toBeLessThan(now);
	});
});