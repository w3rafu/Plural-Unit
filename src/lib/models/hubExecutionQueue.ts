import type {
	BroadcastRow,
	EventRow,
	HubExecutionJobKind,
	HubExecutionLedgerRow
} from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';
import { getHubExecutionLedgerBucket, groupHubExecutionLedger } from './hubExecutionLedger';
import type { HubEventFollowUpSignal } from './hubEngagementModel';
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

export type HubExecutionTriageStatus = 'reviewed' | 'deferred';

export type HubExecutionTriageEntry = {
	status: HubExecutionTriageStatus;
	updatedAt: string;
	reviewedAgainstSignature: string | null;
};

export type HubExecutionTriageMap = Record<string, HubExecutionTriageEntry>;

export type HubExecutionReviewStaleReason =
	| 'execution_state_changed'
	| 'due_time_changed'
	| 'recovery_family_changed'
	| 'followup_kind_changed'
	| 'attendance_gap_changed'
	| 'turnout_changed'
	| 'completion_context_changed';

type HubExecutionQueueItemReviewSignaturePayload = {
	v: 1;
	kind: 'execution_item';
	executionState: HubExecutionLedgerRow['execution_state'];
	dueAt: string;
	processedAt: string | null;
	recoveryKey: string;
};

type HubExecutionFollowUpReviewSignaturePayload = {
	v: 1;
	kind: 'followup_signal';
	signalKind: HubEventFollowUpSignal['kind'];
	completedAt: string;
	expectedAttendanceCount: number;
	recordedAttendanceCount: number;
	attendedCount: number;
	absentCount: number;
};

type HubExecutionReviewSignaturePayload =
	| HubExecutionQueueItemReviewSignaturePayload
	| HubExecutionFollowUpReviewSignaturePayload;

type HubExecutionResolvedReviewState = {
	triageStatus: HubExecutionTriageStatus | null;
	isStaleReview: boolean;
	staleReviewReason: HubExecutionReviewStaleReason | null;
	staleReviewCopy: string | null;
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
	triageStatus: HubExecutionTriageStatus | null;
	reviewSignature: string;
	isStaleReview: boolean;
	staleReviewReason: HubExecutionReviewStaleReason | null;
	staleReviewCopy: string | null;
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

export type HubExecutionQueueFollowUpSignal = HubEventFollowUpSignal & {
	triageStatus: HubExecutionTriageStatus | null;
	reviewSignature: string;
	isStaleReview: boolean;
	staleReviewReason: HubExecutionReviewStaleReason | null;
	staleReviewCopy: string | null;
};

function getHubExecutionQueueTriageEntry(
	triageMap: HubExecutionTriageMap,
	triageKey: string
): HubExecutionTriageEntry | null {
	return triageMap[triageKey] ?? null;
}

function shouldIncludeTriagedQueueItem(
	reviewState: HubExecutionResolvedReviewState,
	includeTriaged: boolean
) {
	return reviewState.triageStatus === null || reviewState.isStaleReview || includeTriaged;
}

export function buildHubExecutionQueueItemTriageKey(
	item: Pick<HubExecutionQueueItem, 'id'> | string
) {
	const id = typeof item === 'string' ? item : item.id;
	return `execution:${id}`;
}

export function buildHubExecutionFollowUpTriageKey(
	signal: Pick<HubEventFollowUpSignal, 'eventId' | 'kind'>
) {
	return `followup:${signal.eventId}:${signal.kind}`;
}

export function setHubExecutionQueueTriage(
	triageMap: HubExecutionTriageMap,
	triageKey: string,
	status: HubExecutionTriageStatus,
	updatedAt = new Date().toISOString(),
	reviewedAgainstSignature: string | null = null
) {
	return {
		...triageMap,
		[triageKey]: {
			status,
			updatedAt,
			reviewedAgainstSignature
		}
	};
}

export function clearHubExecutionQueueTriage(
	triageMap: HubExecutionTriageMap,
	triageKey: string
) {
	if (!(triageKey in triageMap)) {
		return triageMap;
	}

	const nextMap = { ...triageMap };
	delete nextMap[triageKey];
	return nextMap;
}

function getExecutionRecoveryKey(input: {
	recoveryGuidance: HubExecutionRecoveryGuidance | null;
	lastFailureReason: string | null;
}) {
	if (input.lastFailureReason) {
		if (input.recoveryGuidance && input.recoveryGuidance.family !== 'review_issue') {
			return input.recoveryGuidance.family;
		}

		return `reason:${input.lastFailureReason.trim().toLowerCase()}`;
	}

	return input.recoveryGuidance?.family ?? 'none';
}

export function buildHubExecutionQueueItemReviewSignature(input: {
	row: Pick<HubExecutionLedgerRow, 'execution_state' | 'due_at' | 'processed_at' | 'last_failure_reason'>;
	recoveryGuidance: HubExecutionRecoveryGuidance | null;
}) {
	const payload: HubExecutionQueueItemReviewSignaturePayload = {
		v: 1,
		kind: 'execution_item',
		executionState: input.row.execution_state,
		dueAt: input.row.due_at,
		processedAt: input.row.processed_at ?? null,
		recoveryKey: getExecutionRecoveryKey({
			recoveryGuidance: input.recoveryGuidance,
			lastFailureReason: input.row.last_failure_reason
		})
	};

	return JSON.stringify(payload);
}

export function buildHubExecutionFollowUpReviewSignature(
	signal: Pick<
		HubEventFollowUpSignal,
		| 'kind'
		| 'completedAt'
		| 'expectedAttendanceCount'
		| 'recordedAttendanceCount'
		| 'attendedCount'
		| 'absentCount'
	>
) {
	const payload: HubExecutionFollowUpReviewSignaturePayload = {
		v: 1,
		kind: 'followup_signal',
		signalKind: signal.kind,
		completedAt: signal.completedAt,
		expectedAttendanceCount: signal.expectedAttendanceCount,
		recordedAttendanceCount: signal.recordedAttendanceCount,
		attendedCount: signal.attendedCount,
		absentCount: signal.absentCount
	};

	return JSON.stringify(payload);
}

function parseHubExecutionReviewSignature(
	signature: string | null | undefined
): HubExecutionReviewSignaturePayload | null {
	if (!signature) {
		return null;
	}

	try {
		const parsed = JSON.parse(signature) as Partial<HubExecutionReviewSignaturePayload> | null;
		if (!parsed || parsed.v !== 1 || typeof parsed.kind !== 'string') {
			return null;
		}

		if (
			parsed.kind === 'execution_item' &&
			typeof parsed.executionState === 'string' &&
			typeof parsed.dueAt === 'string' &&
			(parsed.processedAt === null || typeof parsed.processedAt === 'string') &&
			typeof parsed.recoveryKey === 'string'
		) {
			return parsed as HubExecutionQueueItemReviewSignaturePayload;
		}

		if (
			parsed.kind === 'followup_signal' &&
			typeof parsed.signalKind === 'string' &&
			typeof parsed.completedAt === 'string' &&
			typeof parsed.expectedAttendanceCount === 'number' &&
			typeof parsed.recordedAttendanceCount === 'number' &&
			typeof parsed.attendedCount === 'number' &&
			typeof parsed.absentCount === 'number'
		) {
			return parsed as HubExecutionFollowUpReviewSignaturePayload;
		}
	} catch {
		return null;
	}

	return null;
}

function resolveExecutionItemStaleReason(
	previous: HubExecutionQueueItemReviewSignaturePayload,
	current: HubExecutionQueueItemReviewSignaturePayload
): HubExecutionReviewStaleReason | null {
	if (
		previous.executionState !== current.executionState ||
		previous.processedAt !== current.processedAt
	) {
		return 'execution_state_changed';
	}

	if (previous.dueAt !== current.dueAt) {
		return 'due_time_changed';
	}

	if (previous.recoveryKey !== current.recoveryKey) {
		return 'recovery_family_changed';
	}

	return null;
}

function resolveFollowUpStaleReason(
	previous: HubExecutionFollowUpReviewSignaturePayload,
	current: HubExecutionFollowUpReviewSignaturePayload
): HubExecutionReviewStaleReason | null {
	if (previous.signalKind !== current.signalKind) {
		return 'followup_kind_changed';
	}

	if (previous.completedAt !== current.completedAt) {
		return 'completion_context_changed';
	}

	if (
		previous.expectedAttendanceCount !== current.expectedAttendanceCount ||
		previous.recordedAttendanceCount !== current.recordedAttendanceCount
	) {
		return 'attendance_gap_changed';
	}

	if (
		previous.attendedCount !== current.attendedCount ||
		previous.absentCount !== current.absentCount
	) {
		return 'turnout_changed';
	}

	return null;
}

function getStaleReviewCopy(reason: HubExecutionReviewStaleReason | null) {
	if (reason === null) {
		return 'Changed since review.';
	}

	switch (reason) {
		case 'execution_state_changed':
			return 'Execution state changed since review.';
		case 'due_time_changed':
			return 'Due time changed since review.';
		case 'recovery_family_changed':
			return 'Recovery guidance changed since review.';
		case 'followup_kind_changed':
			return 'Follow-up type changed since review.';
		case 'attendance_gap_changed':
			return 'Attendance backlog changed since review.';
		case 'turnout_changed':
			return 'Turnout changed since review.';
		case 'completion_context_changed':
			return 'Completion context changed since review.';
	}

	return 'Changed since review.';
}

export function resolveHubExecutionReviewState(input: {
	triageEntry: HubExecutionTriageEntry | null | undefined;
	reviewSignature: string;
}): HubExecutionResolvedReviewState {
	const triageEntry = input.triageEntry ?? null;
	if (!triageEntry) {
		return {
			triageStatus: null,
			isStaleReview: false,
			staleReviewReason: null,
			staleReviewCopy: null
		};
	}

	if (triageEntry.reviewedAgainstSignature === input.reviewSignature) {
		return {
			triageStatus: triageEntry.status,
			isStaleReview: false,
			staleReviewReason: null,
			staleReviewCopy: null
		};
	}

	const previousSignature = parseHubExecutionReviewSignature(triageEntry.reviewedAgainstSignature);
	const currentSignature = parseHubExecutionReviewSignature(input.reviewSignature);
	let staleReviewReason: HubExecutionReviewStaleReason | null = null;

	if (
		previousSignature?.kind === 'execution_item' &&
		currentSignature?.kind === 'execution_item'
	) {
		staleReviewReason = resolveExecutionItemStaleReason(previousSignature, currentSignature);
	} else if (
		previousSignature?.kind === 'followup_signal' &&
		currentSignature?.kind === 'followup_signal'
	) {
		staleReviewReason = resolveFollowUpStaleReason(previousSignature, currentSignature);
	}

	return {
		triageStatus: triageEntry.status,
		isStaleReview: true,
		staleReviewReason,
		staleReviewCopy: getStaleReviewCopy(staleReviewReason)
	};
}

export function buildHubExecutionQueueTriageMapFromWorkflowStateRows(
	rows: Array<{
		workflow_key: string;
		status: HubExecutionTriageStatus;
		updated_at: string;
		reviewed_against_signature?: string | null;
	}>
): HubExecutionTriageMap {
	return Object.fromEntries(
		rows.map((row) => [
			row.workflow_key,
			{
				status: row.status,
				updatedAt: row.updated_at,
				reviewedAgainstSignature: row.reviewed_against_signature ?? null
			}
		])
	);
}

export function buildHubExecutionQueueFollowUpSignals(input: {
	signals: HubEventFollowUpSignal[];
	triageMap?: HubExecutionTriageMap;
	includeTriaged?: boolean;
}): HubExecutionQueueFollowUpSignal[] {
	const triageMap = input.triageMap ?? {};
	const includeTriaged = input.includeTriaged ?? false;

	return input.signals
		.map((signal) => {
			const triageEntry = getHubExecutionQueueTriageEntry(
				triageMap,
				buildHubExecutionFollowUpTriageKey(signal)
			);
			const reviewSignature = buildHubExecutionFollowUpReviewSignature(signal);
			const reviewState = resolveHubExecutionReviewState({
				triageEntry,
				reviewSignature
			});

			return {
				...signal,
				reviewSignature,
				triageStatus: reviewState.triageStatus,
				isStaleReview: reviewState.isStaleReview,
				staleReviewReason: reviewState.staleReviewReason,
				staleReviewCopy: reviewState.staleReviewCopy
			};
		})
		.filter((signal) =>
			shouldIncludeTriagedQueueItem(
				{
					triageStatus: signal.triageStatus,
					isStaleReview: signal.isStaleReview,
					staleReviewReason: signal.staleReviewReason,
					staleReviewCopy: signal.staleReviewCopy
				},
				includeTriaged
			)
		);
}

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

function shouldLimitProcessedQueueItems(
	focus: HubExecutionQueueFocus,
	includeTriaged: boolean
) {
	return !includeTriaged && !isHubExecutionQueueFocusActive(focus);
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
		triageStatus: null,
		reviewSignature: buildHubExecutionQueueItemReviewSignature({
			row: input.row,
			recoveryGuidance
		}),
		isStaleReview: false,
		staleReviewReason: null,
		staleReviewCopy: null,
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
	triageMap?: HubExecutionTriageMap;
	includeTriaged?: boolean;
}): HubExecutionQueueSections {
	const now = input.now ?? Date.now();
	const processedLimit = input.processedLimit ?? 3;
	const focus = normalizeHubExecutionQueueFocus(input.focus ?? {});
	const triageMap = input.triageMap ?? {};
	const includeTriaged = input.includeTriaged ?? false;
	const groups = groupHubExecutionLedger(input.rows, now);
	const toItem = (row: HubExecutionLedgerRow) =>
		buildHubExecutionQueueItem({
			row,
			broadcasts: input.broadcasts,
			events: input.events,
			now
		});
	const applyReviewState = (item: HubExecutionQueueItem) => {
		const reviewState = resolveHubExecutionReviewState({
			triageEntry: getHubExecutionQueueTriageEntry(
				triageMap,
				buildHubExecutionQueueItemTriageKey(item)
			),
			reviewSignature: item.reviewSignature
		});

		return {
			...item,
			triageStatus: reviewState.triageStatus,
			isStaleReview: reviewState.isStaleReview,
			staleReviewReason: reviewState.staleReviewReason,
			staleReviewCopy: reviewState.staleReviewCopy
		};
	};
	const due = groups.due
		.map(toItem)
		.map(applyReviewState)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['due']));
	const upcoming = groups.upcoming
		.map(toItem)
		.map(applyReviewState)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['upcoming']));
	const recovery = [...groups.failed, ...groups.skipped]
		.map(toItem)
		.map(applyReviewState)
		.filter((item) =>
			shouldIncludeTriagedQueueItem(
				{
					triageStatus: item.triageStatus,
					isStaleReview: item.isStaleReview,
					staleReviewReason: item.staleReviewReason,
					staleReviewCopy: item.staleReviewCopy
				},
				includeTriaged
			)
		)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['failed', 'skipped']));
	const processed = groups.processed
		.map(toItem)
		.map(applyReviewState)
		.filter((item) =>
			shouldIncludeTriagedQueueItem(
				{
					triageStatus: item.triageStatus,
					isStaleReview: item.isStaleReview,
					staleReviewReason: item.staleReviewReason,
					staleReviewCopy: item.staleReviewCopy
				},
				includeTriaged
			)
		)
		.filter((item) => shouldIncludeQueueItem(item, focus, ['processed']));
	const limitedProcessed =
		shouldLimitProcessedQueueItems(focus, includeTriaged) &&
		!processed.some((item) => item.isStaleReview)
		? processed.slice(0, processedLimit)
		: processed;

	return {
		due: focus.bucket === 'all' || focus.bucket === 'due' ? due : [],
		upcoming: focus.bucket === 'all' && focus.includeUpcoming ? upcoming : [],
		recovery: focus.bucket === 'all' || focus.bucket === 'recovery' ? recovery : [],
		processed: focus.bucket === 'all' || focus.bucket === 'processed' ? limitedProcessed : []
	};
}