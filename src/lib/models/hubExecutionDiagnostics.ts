import type {
	BroadcastRow,
	EventRow,
	HubExecutionJobKind,
	HubExecutionLedgerRow
} from '$lib/repositories/hubRepository';
import { formatEventReminderOffset } from './eventReminderModel';
import { getHubExecutionLedgerBucket } from './hubExecutionLedger';
import { buildHubExecutionQueueItem } from './hubExecutionQueue';
import { formatRelativeDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

export type HubExecutionDiagnosticEntry = {
	id: string;
	jobKind: HubExecutionJobKind;
	label: string;
	statusLabel: string;
	statusVariant: 'secondary' | 'destructive' | 'outline';
	detailCopy: string;
	dueCopy: string;
	lastAttemptCopy: string | null;
	processedCopy: string | null;
	attemptCountCopy: string | null;
	nextStepCopy: string | null;
	guidanceLabel: string | null;
	guidanceVariant: 'destructive' | 'outline' | null;
};

function sortByDueAtAscending(
	left: Pick<HubExecutionLedgerRow, 'due_at'>,
	right: Pick<HubExecutionLedgerRow, 'due_at'>
) {
	return new Date(left.due_at).getTime() - new Date(right.due_at).getTime();
}

function getStatusVariant(bucket: ReturnType<typeof getHubExecutionLedgerBucket>) {
	switch (bucket) {
		case 'failed':
			return 'destructive';
		case 'skipped':
			return 'outline';
		default:
			return 'secondary';
	}
}

function getExecutionLabel(row: Pick<HubExecutionLedgerRow, 'job_kind' | 'execution_key'>) {
	if (row.job_kind === 'broadcast_publish') {
		return 'Publish execution';
	}

	if (row.job_kind === 'event_publish') {
		return 'Visibility execution';
	}

	const offsetMinutes = Number(row.execution_key);
	if (Number.isFinite(offsetMinutes) && offsetMinutes > 0) {
		return `Reminder · ${formatEventReminderOffset(offsetMinutes)}`;
	}

	return 'Reminder execution';
}

function getDueCopy(row: Pick<HubExecutionLedgerRow, 'due_at'>, now: number) {
	return `Due ${formatShortDateTime(row.due_at)} (${formatRelativeDateTime(row.due_at, now)}).`;
}

function getLastAttemptCopy(row: Pick<HubExecutionLedgerRow, 'last_attempted_at'>) {
	if (!row.last_attempted_at) {
		return null;
	}

	return `Last checked ${formatShortDateTime(row.last_attempted_at)}.`;
}

function getProcessedCopy(row: Pick<HubExecutionLedgerRow, 'processed_at'>) {
	if (!row.processed_at) {
		return null;
	}

	return `Processed ${formatShortDateTime(row.processed_at)}.`;
}

function getAttemptCountCopy(row: Pick<HubExecutionLedgerRow, 'attempt_count'>) {
	if (row.attempt_count <= 0) {
		return null;
	}

	return `${row.attempt_count} attempt${row.attempt_count === 1 ? '' : 's'} recorded.`;
}

function buildExecutionDiagnosticEntry(input: {
	row: HubExecutionLedgerRow;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	now?: number;
}): HubExecutionDiagnosticEntry {
	const now = input.now ?? Date.now();
	const queueItem = buildHubExecutionQueueItem({
		row: input.row,
		broadcasts: input.broadcasts,
		events: input.events,
		now
	});
	const bucket = getHubExecutionLedgerBucket(input.row, now);

	return {
		id: input.row.id,
		jobKind: input.row.job_kind,
		label: getExecutionLabel(input.row),
		statusLabel: queueItem.statusLabel,
		statusVariant: getStatusVariant(bucket),
		detailCopy: queueItem.detailCopy,
		dueCopy: getDueCopy(input.row, now),
		lastAttemptCopy: getLastAttemptCopy(input.row),
		processedCopy: getProcessedCopy(input.row),
		attemptCountCopy: getAttemptCountCopy(input.row),
		nextStepCopy: queueItem.recoveryGuidance?.nextStepCopy ?? null,
		guidanceLabel: queueItem.recoveryGuidance?.label ?? null,
		guidanceVariant: queueItem.recoveryGuidance
			? queueItem.recoveryGuidance.tone === 'attention'
				? 'destructive'
				: 'outline'
			: null
	};
}

export function buildBroadcastExecutionDiagnostics(input: {
	broadcast: BroadcastRow;
	executionLedger: HubExecutionLedgerRow[];
	now?: number;
}) {
	return input.executionLedger
		.filter(
			(row) => row.job_kind === 'broadcast_publish' && row.source_id === input.broadcast.id
		)
		.sort(sortByDueAtAscending)
		.map((row) =>
			buildExecutionDiagnosticEntry({
				row,
				broadcasts: [input.broadcast],
				events: [],
				now: input.now
			})
		);
}

export function buildEventExecutionDiagnostics(input: {
	event: EventRow;
	executionLedger: HubExecutionLedgerRow[];
	now?: number;
}) {
	return input.executionLedger
		.filter(
			(row) =>
				(row.job_kind === 'event_publish' || row.job_kind === 'event_reminder') &&
				row.source_id === input.event.id
		)
		.sort((left, right) => {
			if (left.job_kind === right.job_kind) {
				return sortByDueAtAscending(left, right);
			}

			if (left.job_kind === 'event_publish') {
				return -1;
			}

			if (right.job_kind === 'event_publish') {
				return 1;
			}

			return sortByDueAtAscending(left, right);
		})
		.map((row) =>
			buildExecutionDiagnosticEntry({
				row,
				broadcasts: [],
				events: [input.event],
				now: input.now
			})
		);
}