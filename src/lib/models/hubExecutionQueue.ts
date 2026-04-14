import type {
	BroadcastRow,
	EventRow,
	HubExecutionJobKind,
	HubExecutionLedgerRow
} from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';
import { getHubExecutionLedgerBucket, groupHubExecutionLedger } from './hubExecutionLedger';

export type HubExecutionQueueSubjectKind = 'broadcast' | 'event';

export type HubExecutionQueueItem = {
	id: string;
	jobKind: HubExecutionJobKind;
	bucket: 'due' | 'failed' | 'skipped' | 'processed';
	jobLabel: string;
	subjectKind: HubExecutionQueueSubjectKind;
	sourceId: string;
	subjectTitle: string;
	sectionId: 'manage-broadcasts' | 'manage-events';
	searchParamKey: 'broadcast' | 'event';
	statusLabel: string;
	timingCopy: string;
	detailCopy: string;
	canRetry: boolean;
	canRunNow: boolean;
};

export type HubExecutionQueueSections = {
	due: HubExecutionQueueItem[];
	recovery: HubExecutionQueueItem[];
	processed: HubExecutionQueueItem[];
};

function getJobLabel(jobKind: HubExecutionJobKind) {
	switch (jobKind) {
		case 'broadcast_publish':
			return 'Broadcast publish';
		case 'event_publish':
			return 'Event publish';
		default:
			return 'Event reminder';
	}
}

function getSubjectMeta(
	row: Pick<HubExecutionLedgerRow, 'job_kind' | 'source_id'>,
	broadcasts: BroadcastRow[],
	events: EventRow[]
) {
	if (row.job_kind === 'broadcast_publish') {
		const broadcast = broadcasts.find((entry) => entry.id === row.source_id);

		return {
			subjectKind: 'broadcast' as const,
			sourceId: row.source_id,
			subjectTitle: broadcast?.title ?? 'Deleted broadcast',
			sectionId: 'manage-broadcasts' as const,
			searchParamKey: 'broadcast' as const
		};
	}

	const event = events.find((entry) => entry.id === row.source_id);

	return {
		subjectKind: 'event' as const,
		sourceId: row.source_id,
		subjectTitle: event?.title ?? 'Deleted event',
		sectionId: 'manage-events' as const,
		searchParamKey: 'event' as const
	};
}

function getStatusLabel(bucket: HubExecutionQueueItem['bucket']) {
	switch (bucket) {
		case 'due':
			return 'Due now';
		case 'failed':
			return 'Failed';
		case 'skipped':
			return 'Skipped';
		default:
			return 'Processed';
	}
}

function getTimingCopy(
	row: Pick<HubExecutionLedgerRow, 'due_at' | 'processed_at'>,
	bucket: HubExecutionQueueItem['bucket'],
	now: number
) {
	if (bucket === 'processed') {
		return `Processed ${formatRelativeDateTime(row.processed_at ?? row.due_at, now)}.`;
	}

	if (bucket === 'failed' || bucket === 'skipped') {
		return `Originally due ${formatRelativeDateTime(row.due_at, now)}.`;
	}

	return `Due ${formatRelativeDateTime(row.due_at, now)}.`;
}

function getDefaultDetailCopy(
	row: Pick<HubExecutionLedgerRow, 'job_kind'>,
	bucket: HubExecutionQueueItem['bucket'],
	subjectTitle: string
) {
	if (bucket === 'processed') {
		switch (row.job_kind) {
			case 'broadcast_publish':
				return `${subjectTitle} was published to members.`;
			case 'event_publish':
				return `${subjectTitle} is visible to members.`;
			default:
				return `${subjectTitle} has a recorded reminder execution.`;
		}
	}

	if (bucket === 'due') {
		switch (row.job_kind) {
			case 'broadcast_publish':
				return `${subjectTitle} is ready to go live.`;
			case 'event_publish':
				return `${subjectTitle} is ready for member visibility.`;
			default:
				return `${subjectTitle} has a reminder window ready to process.`;
		}
	}

	switch (row.job_kind) {
		case 'broadcast_publish':
			return `${subjectTitle} needs delivery recovery.`;
		case 'event_publish':
			return `${subjectTitle} needs visibility recovery.`;
		default:
			return `${subjectTitle} needs reminder recovery.`;
	}
}

export function buildHubExecutionQueueItem(input: {
	row: HubExecutionLedgerRow;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	now?: number;
}): HubExecutionQueueItem | null {
	const now = input.now ?? Date.now();
	const bucket = getHubExecutionLedgerBucket(input.row, now);

	if (bucket === 'upcoming') {
		return null;
	}

	const subject = getSubjectMeta(input.row, input.broadcasts, input.events);

	return {
		id: input.row.id,
		jobKind: input.row.job_kind,
		bucket,
		jobLabel: getJobLabel(input.row.job_kind),
		statusLabel: getStatusLabel(bucket),
		timingCopy: getTimingCopy(input.row, bucket, now),
		detailCopy:
			input.row.last_failure_reason ??
			getDefaultDetailCopy(input.row, bucket, subject.subjectTitle),
		canRetry: bucket === 'failed' || bucket === 'skipped',
		canRunNow: input.row.job_kind !== 'event_reminder' && bucket !== 'processed',
		...subject
	};
}

export function buildHubExecutionQueueSections(input: {
	rows: HubExecutionLedgerRow[];
	broadcasts: BroadcastRow[];
	events: EventRow[];
	now?: number;
	processedLimit?: number;
}): HubExecutionQueueSections {
	const now = input.now ?? Date.now();
	const processedLimit = input.processedLimit ?? 3;
	const groups = groupHubExecutionLedger(input.rows, now);
	const toItem = (row: HubExecutionLedgerRow) =>
		buildHubExecutionQueueItem({
			row,
			broadcasts: input.broadcasts,
			events: input.events,
			now
		});

	return {
		due: groups.due.map(toItem).filter((entry): entry is HubExecutionQueueItem => entry !== null),
		recovery: [...groups.failed, ...groups.skipped]
			.map(toItem)
			.filter((entry): entry is HubExecutionQueueItem => entry !== null),
		processed: groups.processed
			.slice(0, processedLimit)
			.map(toItem)
			.filter((entry): entry is HubExecutionQueueItem => entry !== null)
	};
}