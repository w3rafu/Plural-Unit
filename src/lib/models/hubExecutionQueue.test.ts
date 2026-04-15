import { describe, expect, it } from 'vitest';
import {
	DEFAULT_HUB_EXECUTION_QUEUE_FOCUS,
	buildHubExecutionQueueFocusHref,
	buildHubExecutionQueueFollowUpSignals,
	buildHubExecutionFollowUpReviewSignature,
	buildHubExecutionQueueItem,
	buildHubExecutionQueueItemTriageKey,
	buildHubExecutionQueueTriageMapFromWorkflowStateRows,
	buildHubExecutionQueueSections,
	buildHubExecutionFollowUpTriageKey,
	clearHubExecutionQueueTriage,
	isHubExecutionQueueFocusActive,
	parseHubExecutionQueueFocus,
	resolveHubExecutionReviewState,
	setHubExecutionQueueTriage
} from './hubExecutionQueue';
import { HUB_EXECUTION_FAILURE_REASONS } from './hubRecoveryGuidance';

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

	it('hides triaged recovery and processed rows by default', () => {
		const failedRow = makeExecutionRow({
			id: 'failed-publish',
			job_kind: 'event_publish',
			source_id: 'e1',
			execution_key: 'publish',
			execution_state: 'failed',
			last_failure_reason:
				'The scheduled publish time lands at or after the event start. Edit the timing before retrying.'
		});
		const processedRow = makeExecutionRow({
			id: 'processed-broadcast',
			job_kind: 'broadcast_publish',
			source_id: 'b1',
			execution_key: 'publish',
			execution_state: 'processed',
			processed_at: '2026-04-14T10:30:00.000Z'
		});
		const broadcasts = [makeBroadcast({ id: 'b1', title: 'Weekly notes' })];
		const events = [makeEvent({ id: 'e1', title: 'Volunteer night' })];
		const now = new Date('2026-04-14T12:00:00.000Z').getTime();
		const triageMap = setHubExecutionQueueTriage(
			setHubExecutionQueueTriage(
				{},
				buildHubExecutionQueueItemTriageKey('failed-publish'),
				'reviewed',
				'2026-04-14T12:00:00.000Z',
				buildHubExecutionQueueItem({
					row: failedRow,
					broadcasts,
					events,
					now
				}).reviewSignature
			),
			buildHubExecutionQueueItemTriageKey('processed-broadcast'),
			'deferred',
			'2026-04-14T12:05:00.000Z',
			buildHubExecutionQueueItem({
				row: processedRow,
				broadcasts,
				events,
				now
			}).reviewSignature
		);

		const hiddenSections = buildHubExecutionQueueSections({
			rows: [failedRow, processedRow],
			broadcasts,
			events,
			triageMap,
			now
		});

		expect(hiddenSections.recovery).toEqual([]);
		expect(hiddenSections.processed).toEqual([]);

		const visibleSections = buildHubExecutionQueueSections({
			rows: [failedRow, processedRow],
			broadcasts,
			events,
			triageMap,
			includeTriaged: true,
			now
		});

		expect(visibleSections.recovery[0]).toMatchObject({
			id: 'failed-publish',
			triageStatus: 'reviewed'
		});
		expect(visibleSections.processed[0]).toMatchObject({
			id: 'processed-broadcast',
			triageStatus: 'deferred'
		});
	});

	it('filters triaged follow-up signals unless surfaced', () => {
		const signal = {
			eventId: 'e1',
			eventTitle: 'Volunteer night',
			kind: 'attendance_review' as const,
			statusLabel: 'Attendance review',
			copy: '2 RSVP-positive attendees still need attendance decisions.',
			timingCopy: 'Ended 3 hours ago.',
			tone: 'attention' as const,
			completedAt: '2026-04-14T09:00:00.000Z',
			expectedAttendanceCount: 3,
			recordedAttendanceCount: 1,
			attendedCount: 1,
			absentCount: 0
		};
		const triageKey = buildHubExecutionFollowUpTriageKey(signal);
		const triageMap = setHubExecutionQueueTriage(
			{},
			triageKey,
			'reviewed',
			'2026-04-14T12:00:00.000Z',
			buildHubExecutionFollowUpReviewSignature(signal)
		);

		expect(buildHubExecutionQueueFollowUpSignals({ signals: [signal], triageMap })).toEqual([]);
		expect(
			buildHubExecutionQueueFollowUpSignals({
				signals: [signal],
				triageMap,
				includeTriaged: true
			})[0]
		).toMatchObject({
			eventId: 'e1',
			triageStatus: 'reviewed'
		});
		expect(clearHubExecutionQueueTriage(triageMap, triageKey)).toEqual({});
	});

	it('builds a triage map from shared workflow rows', () => {
		expect(
			buildHubExecutionQueueTriageMapFromWorkflowStateRows([
				{
					workflow_key: 'execution:failed-publish',
					status: 'reviewed',
					updated_at: '2026-04-14T12:00:00.000Z',
					reviewed_against_signature: 'sig-1'
				},
				{
					workflow_key: 'followup:e1:attendance_review',
					status: 'deferred',
					updated_at: '2026-04-14T12:05:00.000Z',
					reviewed_against_signature: null
				}
			])
		).toEqual({
			'execution:failed-publish': {
				status: 'reviewed',
				updatedAt: '2026-04-14T12:00:00.000Z',
				reviewedAgainstSignature: 'sig-1'
			},
			'followup:e1:attendance_review': {
				status: 'deferred',
				updatedAt: '2026-04-14T12:05:00.000Z',
				reviewedAgainstSignature: null
			}
		});
	});

	it('resurfaces stale reviewed recovery rows when their signature changes', () => {
		const now = new Date('2026-04-14T12:00:00.000Z').getTime();
		const broadcasts = [makeBroadcast({ id: 'b1', title: 'Weekly notes' })];
		const events = [makeEvent({ id: 'e1', title: 'Volunteer night' })];
		const previousRow = makeExecutionRow({
			id: 'failed-publish',
			job_kind: 'event_publish',
			source_id: 'e1',
			execution_key: 'publish',
			due_at: '2026-04-14T08:00:00.000Z',
			execution_state: 'failed',
			last_failure_reason:
				'The scheduled publish time lands at or after the event start. Edit the timing before retrying.'
		});
		const currentRow = makeExecutionRow({
			...previousRow,
			due_at: '2026-04-14T09:30:00.000Z'
		});
		const triageMap = setHubExecutionQueueTriage(
			{},
			buildHubExecutionQueueItemTriageKey(previousRow.id),
			'reviewed',
			'2026-04-14T12:00:00.000Z',
			buildHubExecutionQueueItem({
				row: previousRow,
				broadcasts,
				events,
				now
			}).reviewSignature
		);

		const sections = buildHubExecutionQueueSections({
			rows: [currentRow],
			broadcasts,
			events,
			triageMap,
			now
		});

		expect(sections.recovery).toHaveLength(1);
		expect(sections.recovery[0]).toMatchObject({
			id: 'failed-publish',
			triageStatus: 'reviewed',
			isStaleReview: true,
			staleReviewReason: 'due_time_changed',
			staleReviewCopy: 'Due time changed since review.'
		});
	});

	it('flags execution-state changes as stale review work', () => {
		const now = new Date('2026-04-14T12:00:00.000Z').getTime();
		const previousSignature = buildHubExecutionQueueItem({
			row: makeExecutionRow({
				id: 'exec-1',
				execution_state: 'failed',
				last_failure_reason: HUB_EXECUTION_FAILURE_REASONS.eventPublishAfterStart,
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish'
			}),
			broadcasts: [],
			events: [makeEvent({ id: 'e1', title: 'Volunteer night' })],
			now
		}).reviewSignature;
		const currentSignature = buildHubExecutionQueueItem({
			row: makeExecutionRow({
				id: 'exec-1',
				execution_state: 'processed',
				processed_at: '2026-04-14T12:00:00.000Z',
				last_failure_reason: null,
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish'
			}),
			broadcasts: [],
			events: [makeEvent({ id: 'e1', title: 'Volunteer night' })],
			now
		}).reviewSignature;

		expect(
			resolveHubExecutionReviewState({
				triageEntry: {
					status: 'reviewed',
					updatedAt: '2026-04-14T12:05:00.000Z',
					reviewedAgainstSignature: previousSignature
				},
				reviewSignature: currentSignature
			})
		).toMatchObject({
			triageStatus: 'reviewed',
			isStaleReview: true,
			staleReviewReason: 'execution_state_changed',
			staleReviewCopy: 'Execution state changed since review.'
		});
	});

	it('flags recovery-family changes as stale review work', () => {
		const now = new Date('2026-04-14T12:00:00.000Z').getTime();
		const previousSignature = buildHubExecutionQueueItem({
			row: makeExecutionRow({
				id: 'exec-1',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				execution_state: 'failed',
				last_failure_reason: HUB_EXECUTION_FAILURE_REASONS.broadcastPublishAfterExpiry
			}),
			broadcasts: [makeBroadcast({ id: 'b1', title: 'Weekly notes' })],
			events: [],
			now
		}).reviewSignature;
		const currentSignature = buildHubExecutionQueueItem({
			row: makeExecutionRow({
				id: 'exec-1',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				execution_state: 'failed',
				last_failure_reason: HUB_EXECUTION_FAILURE_REASONS.broadcastArchivedBeforeVisibility
			}),
			broadcasts: [makeBroadcast({ id: 'b1', title: 'Weekly notes' })],
			events: [],
			now
		}).reviewSignature;

		expect(
			resolveHubExecutionReviewState({
				triageEntry: {
					status: 'deferred',
					updatedAt: '2026-04-14T12:05:00.000Z',
					reviewedAgainstSignature: previousSignature
				},
				reviewSignature: currentSignature
			})
		).toMatchObject({
			triageStatus: 'deferred',
			isStaleReview: true,
			staleReviewReason: 'recovery_family_changed',
			staleReviewCopy: 'Recovery guidance changed since review.'
		});
	});

	it('resurfaces stale follow-up signals when attendance backlog changes', () => {
		const previousSignal = {
			eventId: 'e1',
			eventTitle: 'Volunteer night',
			kind: 'attendance_review' as const,
			statusLabel: 'Attendance review',
			copy: '2 RSVP-positive attendees still need attendance decisions.',
			timingCopy: 'Ended 3 hours ago.',
			tone: 'attention' as const,
			completedAt: '2026-04-14T09:00:00.000Z',
			expectedAttendanceCount: 3,
			recordedAttendanceCount: 1,
			attendedCount: 1,
			absentCount: 0
		};
		const currentSignal = {
			...previousSignal,
			copy: '2 of 4 expected attendees still need final attendance outcomes.',
			expectedAttendanceCount: 4,
			recordedAttendanceCount: 2
		};
		const triageMap = setHubExecutionQueueTriage(
			{},
			buildHubExecutionFollowUpTriageKey(previousSignal),
			'reviewed',
			'2026-04-14T12:00:00.000Z',
			buildHubExecutionFollowUpReviewSignature(previousSignal)
		);

		const signals = buildHubExecutionQueueFollowUpSignals({
			signals: [currentSignal],
			triageMap
		});

		expect(signals).toHaveLength(1);
		expect(signals[0]).toMatchObject({
			eventId: 'e1',
			triageStatus: 'reviewed',
			isStaleReview: true,
			staleReviewReason: 'attendance_gap_changed',
			staleReviewCopy: 'Attendance backlog changed since review.'
		});
	});

	it('flags follow-up kind changes as stale review work', () => {
		const previousSignal = {
			eventId: 'e1',
			eventTitle: 'Volunteer night',
			kind: 'attendance_review' as const,
			statusLabel: 'Attendance review',
			copy: '2 RSVP-positive attendees still need attendance decisions.',
			timingCopy: 'Ended 3 hours ago.',
			tone: 'attention' as const,
			completedAt: '2026-04-14T09:00:00.000Z',
			expectedAttendanceCount: 3,
			recordedAttendanceCount: 1,
			attendedCount: 1,
			absentCount: 0
		};
		const currentSignal = {
			...previousSignal,
			kind: 'no_show' as const,
			statusLabel: 'No-shows',
			copy: 'All expected attendees were marked absent.',
			recordedAttendanceCount: 3,
			attendedCount: 0,
			absentCount: 3
		};

		expect(
			resolveHubExecutionReviewState({
				triageEntry: {
					status: 'reviewed',
					updatedAt: '2026-04-14T12:05:00.000Z',
					reviewedAgainstSignature: buildHubExecutionFollowUpReviewSignature(previousSignal)
				},
				reviewSignature: buildHubExecutionFollowUpReviewSignature(currentSignal)
			})
		).toMatchObject({
			triageStatus: 'reviewed',
			isStaleReview: true,
			staleReviewReason: 'followup_kind_changed',
			staleReviewCopy: 'Follow-up type changed since review.'
		});
	});

	it('does not cap processed rows when triaged items are explicitly surfaced', () => {
		const rows = ['processed-1', 'processed-2', 'processed-3', 'processed-4'].map((id, index) =>
			makeExecutionRow({
				id,
				job_kind: 'broadcast_publish',
				source_id: `b${index + 1}`,
				execution_key: 'publish',
				execution_state: 'processed',
				processed_at: `2026-04-14T1${index}:00:00.000Z`
			})
		);
		const triageMap = rows.reduce(
			(map, row, index) =>
				setHubExecutionQueueTriage(
					map,
					buildHubExecutionQueueItemTriageKey(row.id),
					index % 2 === 0 ? 'reviewed' : 'deferred',
					`2026-04-14T12:0${index}:00.000Z`,
					buildHubExecutionQueueItem({
						row,
						broadcasts: [
							makeBroadcast({ id: 'b1', title: 'Weekly notes' }),
							makeBroadcast({ id: 'b2', title: 'Volunteer highlights' }),
							makeBroadcast({ id: 'b3', title: 'Community update' }),
							makeBroadcast({ id: 'b4', title: 'Next steps' })
						],
						events: [],
						now: new Date('2026-04-14T12:30:00.000Z').getTime()
					}).reviewSignature
				),
			{} as Record<
				string,
				{
					status: 'reviewed' | 'deferred';
					updatedAt: string;
					reviewedAgainstSignature: string | null;
				}
			>
		);

		const sections = buildHubExecutionQueueSections({
			rows,
			broadcasts: [
				makeBroadcast({ id: 'b1', title: 'Weekly notes' }),
				makeBroadcast({ id: 'b2', title: 'Volunteer highlights' }),
				makeBroadcast({ id: 'b3', title: 'Community update' }),
				makeBroadcast({ id: 'b4', title: 'Next steps' })
			],
			events: [],
			triageMap,
			includeTriaged: true,
			now: new Date('2026-04-14T12:30:00.000Z').getTime()
		});

		expect(sections.processed.map((item) => item.id)).toEqual([
			'processed-4',
			'processed-3',
			'processed-2',
			'processed-1'
		]);
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