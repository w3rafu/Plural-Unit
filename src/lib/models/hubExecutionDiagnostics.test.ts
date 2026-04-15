import { describe, expect, it } from 'vitest';
import {
	buildBroadcastExecutionDiagnostics,
	buildEventExecutionDiagnostics
} from './hubExecutionDiagnostics';

function makeBroadcast(
	overrides: Partial<{
		id: string;
		title: string;
		publish_at: string | null;
		archived_at: string | null;
		expires_at: string | null;
		delivery_state: 'scheduled' | 'published' | 'failed' | 'skipped' | null;
		delivered_at: string | null;
		delivery_failure_reason: string | null;
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
		publish_at: overrides.publish_at ?? '2026-04-18T12:00:00.000Z',
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? 'scheduled',
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeEvent(
	overrides: Partial<{
		id: string;
		title: string;
		starts_at: string;
		publish_at: string | null;
		archived_at: string | null;
		canceled_at: string | null;
		delivery_state: 'scheduled' | 'published' | 'failed' | 'skipped' | null;
		delivered_at: string | null;
		delivery_failure_reason: string | null;
	}> = {}
) {
	return {
		id: overrides.id ?? 'e1',
		organization_id: 'org-1',
		title: overrides.title ?? 'Volunteer night',
		description: '',
		starts_at: overrides.starts_at ?? '2026-04-20T16:00:00.000Z',
		ends_at: null,
		location: '',
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z',
		publish_at: overrides.publish_at ?? '2026-04-18T10:00:00.000Z',
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null,
		delivery_state: overrides.delivery_state ?? 'scheduled',
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
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
		last_attempted_at: string | null;
		attempt_count: number;
		last_failure_reason: string | null;
	}> = {}
) {
	return {
		id: overrides.id ?? 'exec-1',
		organization_id: 'org-1',
		job_kind: overrides.job_kind ?? 'event_publish',
		source_id: overrides.source_id ?? 'e1',
		execution_key: overrides.execution_key ?? 'publish',
		due_at: overrides.due_at ?? '2026-04-18T10:00:00.000Z',
		execution_state: overrides.execution_state ?? 'pending',
		processed_at: overrides.processed_at ?? null,
		last_attempted_at: overrides.last_attempted_at ?? null,
		attempt_count: overrides.attempt_count ?? 0,
		last_failure_reason: overrides.last_failure_reason ?? null,
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z'
	};
}

describe('hubExecutionDiagnostics', () => {
	it('builds broadcast execution diagnostics with timing and recovery context', () => {
		const entries = buildBroadcastExecutionDiagnostics({
			broadcast: makeBroadcast({ id: 'b1', title: 'Weekly notes' }),
			executionLedger: [
				makeExecutionRow({
					id: 'broadcast-failed',
					job_kind: 'broadcast_publish',
					source_id: 'b1',
					execution_key: 'publish',
					execution_state: 'failed',
					last_attempted_at: '2026-04-18T12:05:00.000Z',
					attempt_count: 2,
					last_failure_reason:
						'The scheduled publish time lands at or after the expiry time. Edit the timing before retrying.'
				})
			],
			now: new Date('2026-04-18T12:15:00.000Z').getTime()
		});

		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({
			label: 'Publish execution',
			statusLabel: 'Failed',
			guidanceLabel: 'Fix timing',
			guidanceVariant: 'destructive',
			nextStepCopy:
				'Open the content, move its publish timing into a valid window, then re-check the queue or run it now if that still makes sense.',
			attemptCountCopy: '2 attempts recorded.'
		});
		expect(entries[0]?.lastAttemptCopy).toMatch(/^Last checked /);
	});

	it('builds event execution diagnostics with publish first and reminder entries after it', () => {
		const entries = buildEventExecutionDiagnostics({
			event: makeEvent({ id: 'e1', title: 'Volunteer night' }),
			executionLedger: [
				makeExecutionRow({
					id: 'reminder-120',
					job_kind: 'event_reminder',
					source_id: 'e1',
					execution_key: '120',
					due_at: '2026-04-20T14:00:00.000Z',
					execution_state: 'processed',
					processed_at: '2026-04-20T14:01:00.000Z',
					attempt_count: 1
				}),
				makeExecutionRow({
					id: 'publish',
					job_kind: 'event_publish',
					source_id: 'e1',
					execution_key: 'publish',
					due_at: '2026-04-18T10:00:00.000Z',
					execution_state: 'processed',
					processed_at: '2026-04-18T10:00:00.000Z',
					attempt_count: 1
				}),
				makeExecutionRow({
					id: 'reminder-30',
					job_kind: 'event_reminder',
					source_id: 'e1',
					execution_key: '30',
					due_at: '2026-04-20T15:30:00.000Z',
					execution_state: 'skipped',
					last_failure_reason: 'Reminder window passed before the event started.'
				})
			],
			now: new Date('2026-04-20T16:15:00.000Z').getTime()
		});

		expect(entries.map((entry) => entry.id)).toEqual(['publish', 'reminder-120', 'reminder-30']);
		expect(entries[0]).toMatchObject({
			label: 'Visibility execution',
			statusLabel: 'Processed'
		});
		expect(entries[1]).toMatchObject({
			label: 'Reminder · 2 hours before',
			statusLabel: 'Processed'
		});
		expect(entries[1]?.processedCopy).toMatch(/^Processed /);
		expect(entries[2]).toMatchObject({
			label: 'Reminder · 30 minutes before',
			statusLabel: 'Skipped',
			guidanceLabel: 'Window passed',
			guidanceVariant: 'outline'
		});
	});
});