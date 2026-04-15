import { describe, expect, it } from 'vitest';
import {
	DEFAULT_HUB_EXECUTION_QUEUE_FOCUS,
	buildHubExecutionQueueFocusHref,
	buildHubExecutionQueueItem,
	buildHubExecutionQueueSections,
	isHubExecutionQueueFocusActive,
	parseHubExecutionQueueFocus
} from './hubExecutionQueue';

function makeBroadcast(
	overrides: Partial<{
		id: string;
		title: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'b1',
		organization_id: 'org-1',
		title: overrides.title ?? 'Weekly update',
		body: 'Body',
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z',
		is_pinned: false,
		is_draft: false,
		publish_at: '2026-04-18T12:00:00.000Z',
		archived_at: null,
		expires_at: null,
		delivery_state: 'scheduled' as const,
		delivered_at: null,
		delivery_failure_reason: null
	};
}

function makeEvent(
	overrides: Partial<{
		id: string;
		title: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'e1',
		organization_id: 'org-1',
		title: overrides.title ?? 'Volunteer night',
		description: '',
		starts_at: '2026-04-20T16:00:00.000Z',
		ends_at: null,
		location: '',
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z',
		publish_at: '2026-04-18T10:00:00.000Z',
		canceled_at: null,
		archived_at: null,
		delivery_state: 'scheduled' as const,
		delivered_at: null,
		delivery_failure_reason: null
	};
}

function makeExecutionRow(
	overrides: Partial<{
		id: string;
		job_kind: 'broadcast_publish' | 'event_publish' | 'event_reminder';
		source_id: string;
		execution_key: string;
		due_at: string;
		execution_state: 'pending' | 'processed' | 'failed' | 'skipped';
		processed_at: string | null;
		last_failure_reason: string | null;
	}> = {}
) {
	return {
		id: overrides.id ?? 'exec-1',
		organization_id: 'org-1',
		job_kind: overrides.job_kind ?? 'event_reminder',
		source_id: overrides.source_id ?? 'e1',
		execution_key: overrides.execution_key ?? '120',
		due_at: overrides.due_at ?? '2026-04-20T14:00:00.000Z',
		execution_state: overrides.execution_state ?? 'pending',
		processed_at: overrides.processed_at ?? null,
		last_attempted_at: null,
		attempt_count: 0,
		last_failure_reason: overrides.last_failure_reason ?? null,
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z'
	};
}

describe('hubExecutionQueue', () => {
	it('builds queue items with action flags and target metadata', () => {
		const item = buildHubExecutionQueueItem({
			row: makeExecutionRow({
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-14T11:30:00.000Z'
			}),
			broadcasts: [makeBroadcast({ id: 'b1', title: 'Sunday notes' })],
			events: [],
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(item).toMatchObject({
			jobLabel: 'Broadcast publish',
			statusLabel: 'Due now',
			subjectKind: 'broadcast',
			subjectTitle: 'Sunday notes',
			sectionId: 'manage-broadcasts',
			searchParamKey: 'broadcast',
			canRunNow: true,
			canRetry: false
		});
		expect(item?.timingCopy).toBe('Due 30 minutes ago.');
	});

	it('builds due, recovery, and processed sections from ledger rows', () => {
		const sections = buildHubExecutionQueueSections({
			rows: [
				makeExecutionRow({
					id: 'due-reminder',
					job_kind: 'event_reminder',
					source_id: 'e1',
					due_at: '2026-04-14T11:45:00.000Z'
				}),
				makeExecutionRow({
					id: 'failed-publish',
					job_kind: 'event_publish',
					source_id: 'e1',
					execution_key: 'publish',
					execution_state: 'failed',
					last_failure_reason:
						'The scheduled publish time lands at or after the event start. Edit the timing before retrying.'
				}),
				makeExecutionRow({
					id: 'processed-broadcast',
					job_kind: 'broadcast_publish',
					source_id: 'b1',
					execution_key: 'publish',
					execution_state: 'processed',
					processed_at: '2026-04-14T10:30:00.000Z'
				})
			],
			broadcasts: [makeBroadcast({ id: 'b1', title: 'Weekly notes' })],
			events: [makeEvent({ id: 'e1', title: 'Volunteer night' })],
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(sections.due.map((item) => item.id)).toEqual(['due-reminder']);
		expect(sections.upcoming).toEqual([]);
		expect(sections.recovery.map((item) => item.id)).toEqual(['failed-publish']);
		expect(sections.processed.map((item) => item.id)).toEqual(['processed-broadcast']);
		expect(sections.recovery[0]).toMatchObject({
			jobLabel: 'Event publish',
			canRetry: false,
			canRunNow: true,
			recoveryGuidance: {
				label: 'Fix timing',
				openLabel: 'Edit timing',
				allowsRetry: false,
				tone: 'attention'
			},
			detailCopy:
				'The scheduled publish time lands at or after the event start. Edit the timing before retrying.'
		});
		expect(sections.processed[0]?.timingCopy).toBe('Processed 1 hour ago.');
	});

	it('includes upcoming rows when the queue focus enables them', () => {
		const sections = buildHubExecutionQueueSections({
			rows: [
				makeExecutionRow({
					id: 'upcoming-broadcast',
					job_kind: 'broadcast_publish',
					source_id: 'b1',
					execution_key: 'publish',
					due_at: '2026-04-14T13:30:00.000Z'
				})
			],
			broadcasts: [makeBroadcast({ id: 'b1', title: 'Weekly notes' })],
			events: [],
			now: new Date('2026-04-14T12:00:00.000Z').getTime(),
			focus: { includeUpcoming: true }
		});

		expect(sections.upcoming).toHaveLength(1);
		expect(sections.upcoming[0]).toMatchObject({
			id: 'upcoming-broadcast',
			statusLabel: 'Upcoming',
			detailCopy: 'Weekly notes is scheduled to go live later.'
		});
	});

	it('filters queue sections by bucket, job kind, and subject kind', () => {
		const sections = buildHubExecutionQueueSections({
			rows: [
				makeExecutionRow({
					id: 'due-broadcast',
					job_kind: 'broadcast_publish',
					source_id: 'b1',
					execution_key: 'publish',
					due_at: '2026-04-14T11:45:00.000Z'
				}),
				makeExecutionRow({
					id: 'due-reminder',
					job_kind: 'event_reminder',
					source_id: 'e1',
					due_at: '2026-04-14T11:30:00.000Z'
				}),
				makeExecutionRow({
					id: 'processed-event',
					job_kind: 'event_publish',
					source_id: 'e1',
					execution_key: 'publish',
					execution_state: 'processed',
					processed_at: '2026-04-14T10:30:00.000Z'
				})
			],
			broadcasts: [makeBroadcast({ id: 'b1', title: 'Weekly notes' })],
			events: [makeEvent({ id: 'e1', title: 'Volunteer night' })],
			now: new Date('2026-04-14T12:00:00.000Z').getTime(),
			focus: {
				bucket: 'due',
				jobKind: 'broadcast_publish',
				subjectKind: 'broadcast'
			}
		});

		expect(sections.due.map((item) => item.id)).toEqual(['due-broadcast']);
		expect(sections.recovery).toEqual([]);
		expect(sections.processed).toEqual([]);
		expect(sections.upcoming).toEqual([]);
	});

	it('parses and serializes queue focus state in URLs', () => {
		const url = new URL(
			'http://localhost/hub/manage/content?queueBucket=recovery&queueJob=event_publish&queueSubject=event&queueUpcoming=1#manage-operations'
		);

		expect(parseHubExecutionQueueFocus(url)).toEqual({
			bucket: 'recovery',
			jobKind: 'event_publish',
			subjectKind: 'event',
			includeUpcoming: false
		});
		expect(isHubExecutionQueueFocusActive(DEFAULT_HUB_EXECUTION_QUEUE_FOCUS)).toBe(false);
		expect(
			buildHubExecutionQueueFocusHref({
				url,
				pathname: '/hub/manage/content',
				hash: 'manage-operations',
				focus: {
					bucket: 'all',
					jobKind: 'all',
					subjectKind: 'all',
					includeUpcoming: true
				}
			})
		).toBe('/hub/manage/content?queueUpcoming=1#manage-operations');
	});
});