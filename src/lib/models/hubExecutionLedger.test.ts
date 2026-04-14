import { describe, expect, it } from 'vitest';
import {
	buildExpectedHubExecutionLedgerRows,
	buildHubExecutionLedgerSyncPlan,
	countDueHubExecutionLedgerRows,
	getEventReminderExecutionKey,
	groupHubExecutionLedger
} from './hubExecutionLedger';

function makeBroadcast(
	overrides: Partial<{
		id: string;
		organization_id: string;
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
		organization_id: overrides.organization_id ?? 'org-1',
		title: 'Broadcast',
		body: 'Body',
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z',
		is_pinned: false,
		is_draft: false,
		publish_at: overrides.publish_at ?? null,
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeEvent(
	overrides: Partial<{
		id: string;
		organization_id: string;
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
		organization_id: overrides.organization_id ?? 'org-1',
		title: 'Event',
		description: '',
		starts_at: overrides.starts_at ?? '2026-04-20T16:00:00.000Z',
		ends_at: null,
		location: '',
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z',
		publish_at: overrides.publish_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeExecutionRow(
	overrides: Partial<{
		id: string;
		organization_id: string;
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
		organization_id: overrides.organization_id ?? 'org-1',
		job_kind: overrides.job_kind ?? 'event_reminder',
		source_id: overrides.source_id ?? 'e1',
		execution_key: overrides.execution_key ?? '120',
		due_at: overrides.due_at ?? '2026-04-20T14:00:00.000Z',
		execution_state: overrides.execution_state ?? 'pending',
		processed_at: overrides.processed_at ?? null,
		last_attempted_at: overrides.last_attempted_at ?? null,
		attempt_count: overrides.attempt_count ?? 0,
		last_failure_reason: overrides.last_failure_reason ?? null,
		created_at: '2026-04-14T08:00:00.000Z',
		updated_at: '2026-04-14T08:00:00.000Z'
	};
}

describe('hubExecutionLedger', () => {
	it('builds publish and reminder ledger rows from scheduled content', () => {
		const rows = buildExpectedHubExecutionLedgerRows({
			broadcasts: [makeBroadcast({ publish_at: '2026-04-18T12:00:00.000Z' })],
			events: [
				makeEvent({
					id: 'e1',
					publish_at: '2026-04-18T10:00:00.000Z',
					starts_at: '2026-04-20T16:00:00.000Z'
				})
			],
			eventReminderSettings: [
				{
					id: 'rem-1',
					event_id: 'e1',
					organization_id: 'org-1',
					delivery_channel: 'in_app',
					reminder_offsets: [1440, 120],
					created_at: '2026-04-14T08:00:00.000Z',
					updated_at: '2026-04-14T08:00:00.000Z'
				}
			],
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(rows.map((row) => `${row.job_kind}:${row.source_id}:${row.execution_key}`)).toEqual([
			'event_publish:e1:publish',
			'broadcast_publish:b1:publish',
			'event_reminder:e1:1440',
			'event_reminder:e1:120'
		]);
		expect(rows.every((row) => row.execution_state === 'pending')).toBe(true);
	});

	it('marks reminder rows failed when the reminder would fire before event visibility', () => {
		const rows = buildExpectedHubExecutionLedgerRows({
			broadcasts: [],
			events: [
				makeEvent({
					id: 'e1',
					publish_at: '2026-04-20T15:00:00.000Z',
					starts_at: '2026-04-20T16:00:00.000Z'
				})
			],
			eventReminderSettings: [
				{
					id: 'rem-1',
					event_id: 'e1',
					organization_id: 'org-1',
					delivery_channel: 'in_app',
					reminder_offsets: [120],
					created_at: '2026-04-14T08:00:00.000Z',
					updated_at: '2026-04-14T08:00:00.000Z'
				}
			],
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(rows.find((row) => row.job_kind === 'event_reminder')).toMatchObject({
			execution_key: getEventReminderExecutionKey(120),
			execution_state: 'failed',
			last_failure_reason:
				'Reminder window lands before event visibility. Adjust the publish time or reminder plan.'
		});
	});

	it('preserves processed rows, prunes stale pending rows, and resets rows whose due time changed', () => {
		const syncPlan = buildHubExecutionLedgerSyncPlan({
			broadcasts: [],
			events: [makeEvent({ id: 'e1', starts_at: '2026-04-20T16:00:00.000Z' })],
			eventReminderSettings: [
				{
					id: 'rem-1',
					event_id: 'e1',
					organization_id: 'org-1',
					delivery_channel: 'in_app',
					reminder_offsets: [120, 30],
					created_at: '2026-04-14T08:00:00.000Z',
					updated_at: '2026-04-14T08:00:00.000Z'
				}
			],
			currentRows: [
				makeExecutionRow({
					id: 'processed-row',
					execution_key: '120',
					execution_state: 'processed',
					processed_at: '2026-04-20T14:00:00.000Z',
					last_attempted_at: '2026-04-20T14:00:00.000Z',
					attempt_count: 1
				}),
				makeExecutionRow({
					id: 'stale-pending',
					execution_key: '1440',
					due_at: '2026-04-19T16:00:00.000Z',
					execution_state: 'pending'
				}),
				makeExecutionRow({
					id: 'changed-due',
					execution_key: '30',
					due_at: '2026-04-20T15:00:00.000Z',
					execution_state: 'failed',
					last_failure_reason: 'Old failure',
					attempt_count: 2
				})
			],
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(syncPlan.upsertEntries).toEqual([
			{
				organization_id: 'org-1',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '30',
				due_at: '2026-04-20T15:30:00.000Z',
				execution_state: 'pending',
				processed_at: null,
				last_attempted_at: null,
				attempt_count: 0,
				last_failure_reason: null
			}
		]);
		expect(syncPlan.deleteEntryIds).toEqual(['stale-pending']);
	});

	it('groups pending rows into due and upcoming buckets', () => {
		const rows = [
			makeExecutionRow({ id: 'due', due_at: '2026-04-14T09:00:00.000Z' }),
			makeExecutionRow({ id: 'upcoming', due_at: '2026-04-14T13:00:00.000Z' }),
			makeExecutionRow({ id: 'processed', execution_state: 'processed', processed_at: '2026-04-14T08:30:00.000Z' }),
			makeExecutionRow({ id: 'failed', execution_state: 'failed', last_failure_reason: 'Failure' }),
			makeExecutionRow({ id: 'skipped', execution_state: 'skipped', last_failure_reason: 'Skipped' })
		];

		const groups = groupHubExecutionLedger(
			rows,
			new Date('2026-04-14T12:00:00.000Z').getTime()
		);

		expect(groups.due.map((row) => row.id)).toEqual(['due']);
		expect(groups.upcoming.map((row) => row.id)).toEqual(['upcoming']);
		expect(groups.processed.map((row) => row.id)).toEqual(['processed']);
		expect(groups.failed.map((row) => row.id)).toEqual(['failed']);
		expect(groups.skipped.map((row) => row.id)).toEqual(['skipped']);
		expect(countDueHubExecutionLedgerRows(rows, new Date('2026-04-14T12:00:00.000Z').getTime())).toBe(1);
	});
});