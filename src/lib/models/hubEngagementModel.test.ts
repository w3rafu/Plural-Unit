import { describe, expect, it } from 'vitest';
import type { BroadcastRow, EventRow } from '$lib/repositories/hubRepository';
import type { EventAttendanceSummary } from './eventResponseModel';
import {
	buildHubAdminEngagementSummary,
	getBroadcastEngagementSignal,
	getEventEngagementSignal,
	getHubEngagementCoverageCopy,
	getHubEngagementFollowUpCopy
} from './hubEngagementModel';

function makeBroadcast(
	overrides: Partial<BroadcastRow> = {}
): BroadcastRow {
	return {
		id: overrides.id ?? 'b1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Broadcast',
		body: overrides.body ?? 'Body',
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z',
		is_pinned: overrides.is_pinned ?? false,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? null,
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null
	};
}

function makeEvent(overrides: Partial<EventRow> = {}): EventRow {
	return {
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Event',
		description: overrides.description ?? 'Details',
		starts_at: overrides.starts_at ?? '2026-04-20T16:30:00.000Z',
		ends_at: overrides.ends_at ?? null,
		location: overrides.location ?? 'Main Hall',
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z',
		publish_at: overrides.publish_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null
	};
}

function makeAttendance(
	overrides: Partial<EventAttendanceSummary> = {}
): EventAttendanceSummary {
	return {
		going: overrides.going ?? 0,
		maybe: overrides.maybe ?? 0,
		cannotAttend: overrides.cannotAttend ?? 0,
		total: overrides.total ?? 0,
		recentProfileIds: overrides.recentProfileIds ?? [],
		latestUpdatedAt: overrides.latestUpdatedAt ?? null
	};
}

describe('hubEngagementModel', () => {
	it('summarizes coverage and follow-up counts across live and scheduled content', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();
		const summary = buildHubAdminEngagementSummary(
			{
				events: [
					makeEvent({ id: 'live-replied' }),
					makeEvent({ id: 'live-stale', starts_at: '2026-04-19T16:30:00.000Z' }),
					makeEvent({ id: 'live-silent', starts_at: '2026-04-18T16:30:00.000Z' }),
					makeEvent({ id: 'scheduled-event', publish_at: '2026-04-13T18:00:00.000Z' }),
					makeEvent({ id: 'past-event', starts_at: '2026-04-10T16:30:00.000Z' })
				],
				broadcasts: [
					makeBroadcast({ id: 'scheduled-broadcast', publish_at: '2026-04-13T20:00:00.000Z' }),
					makeBroadcast({ id: 'draft-broadcast', is_draft: true })
				],
				eventAttendances: {
					'live-replied': makeAttendance({ total: 4, going: 3, maybe: 1, latestUpdatedAt: '2026-04-13T10:30:00.000Z' }),
					'live-stale': makeAttendance({ total: 2, going: 1, maybe: 1, latestUpdatedAt: '2026-04-08T10:30:00.000Z' }),
					'live-silent': makeAttendance(),
					'scheduled-event': makeAttendance(),
					'past-event': makeAttendance({ total: 1, going: 1, latestUpdatedAt: '2026-04-10T10:30:00.000Z' })
				}
			},
			now
		);

		expect(summary).toMatchObject({
			liveEventCount: 3,
			respondedLiveEventCount: 2,
			noResponseLiveEventCount: 1,
			staleLiveEventCount: 1,
			latestResponseAt: '2026-04-13T10:30:00.000Z',
			scheduledEventCount: 1,
			scheduledBroadcastCount: 1,
			scheduledItemCount: 2,
			approachingPublishCount: 2,
			deliveryIssueCount: 0,
			followUpCount: 3
		});
	});

	it('builds compact coverage and follow-up copy', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();
		const summary = {
			liveEventCount: 3,
			respondedLiveEventCount: 2,
			noResponseLiveEventCount: 1,
			staleLiveEventCount: 1,
			latestResponseAt: '2026-04-13T10:00:00.000Z',
			scheduledEventCount: 1,
			scheduledBroadcastCount: 1,
			scheduledItemCount: 2,
			approachingPublishCount: 2,
			deliveryIssueCount: 1,
			failedDeliveryCount: 1,
			skippedDeliveryCount: 0,
			followUpCount: 3
		};

		expect(getHubEngagementCoverageCopy(summary, now)).toContain('2 of 3 live events have replies.');
		expect(getHubEngagementCoverageCopy(summary, now)).toContain('Latest reply 2 hours ago.');
		expect(getHubEngagementFollowUpCopy(summary)).toContain('1 live event still needs a first RSVP.');
		expect(getHubEngagementFollowUpCopy(summary)).toContain('2 scheduled items publish within a day.');
		expect(getHubEngagementFollowUpCopy(summary)).toContain('1 scheduled item needs delivery recovery.');
	});

	it('counts skipped and failed scheduled delivery outcomes in follow-up totals', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();
		const summary = buildHubAdminEngagementSummary(
			{
				events: [
					makeEvent({
						id: 'skipped-event',
						publish_at: '2026-04-13T18:00:00.000Z',
						starts_at: '2026-04-14T18:00:00.000Z',
						canceled_at: '2026-04-13T13:00:00.000Z'
					})
				],
				broadcasts: [
					makeBroadcast({
						id: 'failed-broadcast',
						publish_at: '2026-04-13T18:00:00.000Z',
						expires_at: '2026-04-13T17:00:00.000Z'
					})
				],
				eventAttendances: {}
			},
			now
		);

		expect(summary).toMatchObject({
			deliveryIssueCount: 2,
			failedDeliveryCount: 1,
			skippedDeliveryCount: 1,
			followUpCount: 2
		});
	});

	it('flags live events with no responses and stale reply activity', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(getEventEngagementSignal(makeEvent(), makeAttendance(), null, now)).toMatchObject({
			needsAttention: true,
			copy: 'This event still needs a first RSVP.'
		});

		expect(
			getEventEngagementSignal(
				makeEvent({ id: 'stale-live' }),
				makeAttendance({ total: 2, latestUpdatedAt: '2026-04-08T12:00:00.000Z' }),
				null,
				now
			)
		).toMatchObject({
			needsAttention: true
		});
		expect(
			getEventEngagementSignal(
				makeEvent({ id: 'scheduled-live', publish_at: '2026-04-13T18:00:00.000Z' }),
				makeAttendance(),
				null,
				now
			).copy
		).toContain('Publishes in 6 hours.');
	});

	it('adds reminder context when an upcoming reminder is still queued', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(
			getEventEngagementSignal(
				makeEvent({ id: 'reminder-live', starts_at: '2026-04-13T16:00:00.000Z' }),
				makeAttendance(),
				{
					count: 1,
					offsets: [120],
					schedule: [
						{
							offsetMinutes: 120,
							label: '2 hours before',
							sendAt: '2026-04-13T14:00:00.000Z',
							isUpcoming: true
						}
					],
					nextReminderAt: '2026-04-13T14:00:00.000Z',
					nextReminderOffsetMinutes: 120,
					hasUpcomingReminder: true
				},
				now
			).copy
		).toContain('Next reminder in 2 hours.');
	});

	it('builds draft, scheduled, and live broadcast signals', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(getBroadcastEngagementSignal(makeBroadcast({ is_draft: true }), now).copy).toContain(
			'Last edited'
		);
		expect(
			getBroadcastEngagementSignal(
				makeBroadcast({ publish_at: '2026-04-13T16:00:00.000Z' }),
				now
			)
		).toMatchObject({ needsAttention: true });
		expect(
			getBroadcastEngagementSignal(makeBroadcast({ is_pinned: true }), now).copy
		).toBe('Pinned at the top of the live member view.');
	});
});