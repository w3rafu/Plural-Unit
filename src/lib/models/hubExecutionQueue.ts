import type {
	BroadcastRow,
	EventRow,
	HubExecutionJobKind,
	HubExecutionLedgerRow
} from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';
import { getHubExecutionLedgerBucket, groupHubExecutionLedger } from './hubExecutionLedger';
import {
	getHubExecutionRecoveryGuidance,
	type HubExecutionRecoveryGuidance
} from './hubRecoveryGuidance';

export type HubExecutionQueueSubjectKind = 'broadcast' | 'event';
export type HubExecutionQueueBucketFilter = 'all' | 'due' | 'recovery' | 'processed';
export type HubExecutionQueueJobFilter = 'all' | HubExecutionJobKind;
export type HubExecutionQueueSubjectFilter = 'all' | HubExecutionQueueSubjectKind;

export type HubExecutionQueueFocus = {
	bucket: HubExecutionQueueBucketFilter;
	jobKind: HubExecutionQueueJobFilter;
	subjectKind: HubExecutionQueueSubjectFilter;
	includeUpcoming: boolean;
};

export const DEFAULT_HUB_EXECUTION_QUEUE_FOCUS: HubExecutionQueueFocus = {
	bucket: 'all',
	jobKind: 'all',
	subjectKind: 'all',
	includeUpcoming: false
};

const HUB_EXECUTION_QUEUE_SEARCH_PARAM = {
	bucket: 'queueBucket',
	jobKind: 'queueJob',
	subjectKind: 'queueSubject',
	includeUpcoming: 'queueUpcoming'
} as const;

const HUB_EXECUTION_QUEUE_BUCKET_FILTERS = new Set<HubExecutionQueueBucketFilter>([
	'all',
	'due',
	'recovery',
	'processed'
]);
const HUB_EXECUTION_QUEUE_JOB_FILTERS = new Set<HubExecutionQueueJobFilter>([
	'all',
	'broadcast_publish',
	'event_publish',
	'event_reminder'
]);
const HUB_EXECUTION_QUEUE_SUBJECT_FILTERS = new Set<HubExecutionQueueSubjectFilter>([
	'all',
	'broadcast',
	'event'
]);

export type HubExecutionQueueItem = {
	id: string;
	jobKind: HubExecutionJobKind;
	bucket: 'due' | 'upcoming' | 'failed' | 'skipped' | 'processed';
	jobLabel: string;
	subjectKind: HubExecutionQueueSubjectKind;
	sourceId: string;
	subjectTitle: string;
	sectionId: 'manage-broadcasts' | 'manage-events';
	searchParamKey: 'broadcast' | 'event';
	statusLabel: string;
	timingCopy: string;
	detailCopy: string;
	recoveryGuidance: HubExecutionRecoveryGuidance | null;
	canRetry: boolean;
	canRunNow: boolean;
};

export type HubExecutionQueueSections = {
	due: HubExecutionQueueItem[];
	upcoming: HubExecutionQueueItem[];
	recovery: HubExecutionQueueItem[];
	processed: HubExecutionQueueItem[];
};

function setSearchParam(searchParams: URLSearchParams, key: string, value: string, defaultValue: string) {
	if (value === defaultValue) {
		searchParams.delete(key);
		return;
	}

	searchParams.set(key, value);
}

function isTruthySearchParam(value: string | null) {
	return value === '1' || value === 'true';
}

function shouldIncludeQueueItem(
	item: HubExecutionQueueItem,
	focus: HubExecutionQueueFocus,
	allowedBuckets: HubExecutionQueueItem['bucket'][]
) {
	if (!allowedBuckets.includes(item.bucket)) {
		return false;
	}

	if (focus.jobKind !== 'all' && item.jobKind !== focus.jobKind) {
		return false;
	}

	if (focus.subjectKind !== 'all' && item.subjectKind !== focus.subjectKind) {
		return false;
	}

	return true;
}

function shouldLimitProcessedQueueItems(focus: HubExecutionQueueFocus) {
	return !isHubExecutionQueueFocusActive(focus);
}

export function normalizeHubExecutionQueueFocus(
	focus: Partial<HubExecutionQueueFocus> = {}
): HubExecutionQueueFocus {
	const bucket = HUB_EXECUTION_QUEUE_BUCKET_FILTERS.has(focus.bucket ?? 'all')
		? (focus.bucket ?? 'all')
		: 'all';
	const jobKind = HUB_EXECUTION_QUEUE_JOB_FILTERS.has(focus.jobKind ?? 'all')
		? (focus.jobKind ?? 'all')
		: 'all';
	const subjectKind = HUB_EXECUTION_QUEUE_SUBJECT_FILTERS.has(focus.subjectKind ?? 'all')
		? (focus.subjectKind ?? 'all')
		: 'all';

	return {
		bucket,
		jobKind,
		subjectKind,
		includeUpcoming: bucket === 'all' ? Boolean(focus.includeUpcoming) : false
	};
}

export function parseHubExecutionQueueFocus(searchParams: URLSearchParams | URL) {
	const params = searchParams instanceof URL ? searchParams.searchParams : searchParams;
	const bucket = params.get(HUB_EXECUTION_QUEUE_SEARCH_PARAM.bucket) ?? undefined;
	const jobKind = params.get(HUB_EXECUTION_QUEUE_SEARCH_PARAM.jobKind) ?? undefined;
	const subjectKind = params.get(HUB_EXECUTION_QUEUE_SEARCH_PARAM.subjectKind) ?? undefined;

	return normalizeHubExecutionQueueFocus({
		bucket: bucket as HubExecutionQueueBucketFilter | undefined,
		jobKind: jobKind as HubExecutionQueueJobFilter | undefined,
		subjectKind: subjectKind as HubExecutionQueueSubjectFilter | undefined,
		includeUpcoming: isTruthySearchParam(
			params.get(HUB_EXECUTION_QUEUE_SEARCH_PARAM.includeUpcoming)
		)
	});
}

export function isHubExecutionQueueFocusActive(focus: Partial<HubExecutionQueueFocus>) {
	const normalizedFocus = normalizeHubExecutionQueueFocus(focus);

	return (
		normalizedFocus.bucket !== DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.bucket ||
		normalizedFocus.jobKind !== DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.jobKind ||
		normalizedFocus.subjectKind !== DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.subjectKind ||
		normalizedFocus.includeUpcoming !== DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.includeUpcoming
	);
}

export function buildHubExecutionQueueFocusHref(input: {
	url: URL;
	focus?: Partial<HubExecutionQueueFocus>;
	pathname?: string;
	hash?: string | null;
}) {
	const currentFocus = parseHubExecutionQueueFocus(input.url);
	const nextFocus = normalizeHubExecutionQueueFocus({
		...currentFocus,
		...input.focus
	});
	const nextUrl = new URL(input.pathname ?? input.url.pathname, input.url);
	const searchParams = new URLSearchParams(input.url.searchParams);

	setSearchParam(
		searchParams,
		HUB_EXECUTION_QUEUE_SEARCH_PARAM.bucket,
		nextFocus.bucket,
		DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.bucket
	);
	setSearchParam(
		searchParams,
		HUB_EXECUTION_QUEUE_SEARCH_PARAM.jobKind,
		nextFocus.jobKind,
		DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.jobKind
	);
	setSearchParam(
		searchParams,
		HUB_EXECUTION_QUEUE_SEARCH_PARAM.subjectKind,
		nextFocus.subjectKind,
		DEFAULT_HUB_EXECUTION_QUEUE_FOCUS.subjectKind
	);
	if (nextFocus.includeUpcoming) {
		searchParams.set(HUB_EXECUTION_QUEUE_SEARCH_PARAM.includeUpcoming, '1');
	} else {
		searchParams.delete(HUB_EXECUTION_QUEUE_SEARCH_PARAM.includeUpcoming);
	}

	const nextSearch = searchParams.toString();
	nextUrl.search = nextSearch ? `?${nextSearch}` : '';

	if (input.hash !== undefined) {
		nextUrl.hash = input.hash ? (input.hash.startsWith('#') ? input.hash : `#${input.hash}`) : '';
	} else {
		nextUrl.hash = input.url.hash;
	}

	return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

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
		case 'upcoming':
			return 'Upcoming';
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

	if (bucket === 'upcoming') {
		switch (row.job_kind) {
			case 'broadcast_publish':
				return `${subjectTitle} is scheduled to go live later.`;
			case 'event_publish':
				return `${subjectTitle} is scheduled for member visibility.`;
			default:
				return `${subjectTitle} has a reminder window scheduled later.`;
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
}): HubExecutionQueueItem {
	const now = input.now ?? Date.now();
	const bucket = getHubExecutionLedgerBucket(input.row, now);

	const subject = getSubjectMeta(input.row, input.broadcasts, input.events);
	const recoveryGuidance = getHubExecutionRecoveryGuidance({
		jobKind: input.row.job_kind,
		executionState: input.row.execution_state,
		reason: input.row.last_failure_reason
	});

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
		recoveryGuidance,
		canRetry:
			(bucket === 'failed' || bucket === 'skipped') && (recoveryGuidance?.allowsRetry ?? true),
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
	focus?: Partial<HubExecutionQueueFocus>;
}): HubExecutionQueueSections {
	const now = input.now ?? Date.now();
	const processedLimit = input.processedLimit ?? 3;
	const focus = normalizeHubExecutionQueueFocus(input.focus ?? {});
	const groups = groupHubExecutionLedger(input.rows, now);
	const toItem = (row: HubExecutionLedgerRow) =>
		buildHubExecutionQueueItem({
			row,
			broadcasts: input.broadcasts,
			events: input.events,
			now
		});
	const due = groups.due
		.map(toItem)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['due']));
	const upcoming = groups.upcoming
		.map(toItem)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['upcoming']));
	const recovery = [...groups.failed, ...groups.skipped]
		.map(toItem)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['failed', 'skipped']));
	const processed = groups.processed
		.map(toItem)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['processed']));
	const limitedProcessed = shouldLimitProcessedQueueItems(focus)
		? processed.slice(0, processedLimit)
		: processed;

	return {
		due: focus.bucket === 'all' || focus.bucket === 'due' ? due : [],
		upcoming: focus.bucket === 'all' && focus.includeUpcoming ? upcoming : [],
		recovery: focus.bucket === 'all' || focus.bucket === 'recovery' ? recovery : [],
		processed: focus.bucket === 'all' || focus.bucket === 'processed' ? limitedProcessed : []
	};
}