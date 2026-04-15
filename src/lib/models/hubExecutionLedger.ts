import type {
	BroadcastRow,
	EventReminderSettingsRow,
	EventRow,
	HubExecutionJobKind,
	HubExecutionLedgerMutationPayload,
	HubExecutionLedgerRow,
	HubExecutionState,
	ScheduledDeliveryState
} from '$lib/repositories/hubRepository';
import { normalizeEventReminderOffsets, resolveEventReminderSendAt } from './eventReminderModel';
import { HUB_EXECUTION_FAILURE_REASONS } from './hubRecoveryGuidance';
import { getBroadcastDeliveryStatus, getEventDeliveryStatus } from './scheduledDeliveryModel';

export type HubExecutionLedgerBucket = 'due' | 'upcoming' | 'processed' | 'failed' | 'skipped';

export type HubExecutionLedgerGroups = Record<HubExecutionLedgerBucket, HubExecutionLedgerRow[]>;

type HubExecutionExpectedRow = Omit<
	HubExecutionLedgerMutationPayload,
	'attempt_count' | 'last_attempted_at'
>;

const PUBLISH_EXECUTION_KEY = 'publish';

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function sortByDueAtAscending(
	left: Pick<HubExecutionLedgerRow, 'due_at'>,
	right: Pick<HubExecutionLedgerRow, 'due_at'>
) {
	return (getTime(left.due_at) ?? 0) - (getTime(right.due_at) ?? 0);
}

function sortByDueAtDescending(
	left: Pick<HubExecutionLedgerRow, 'due_at'>,
	right: Pick<HubExecutionLedgerRow, 'due_at'>
) {
	return (getTime(right.due_at) ?? 0) - (getTime(left.due_at) ?? 0);
}

function mapScheduledStatusToExecutionState(
	state: ScheduledDeliveryState
): HubExecutionState {
	switch (state) {
		case 'published':
			return 'processed';
		case 'failed':
			return 'failed';
		case 'skipped':
			return 'skipped';
		default:
			return 'pending';
	}
}

function getDefaultAttemptCount(expected: HubExecutionExpectedRow) {
	return expected.execution_state === 'processed' ? 1 : 0;
}

function getDefaultLastAttemptedAt(expected: HubExecutionExpectedRow) {
	return expected.execution_state === 'processed' ? expected.processed_at : null;
}

function toReminderSettingsMap(
	eventReminderSettings:
		| EventReminderSettingsRow[]
		| Record<string, EventReminderSettingsRow>
		| undefined
) {
	if (!eventReminderSettings) {
		return {} as Record<string, EventReminderSettingsRow>;
	}

	return Array.isArray(eventReminderSettings)
		? Object.fromEntries(eventReminderSettings.map((entry) => [entry.event_id, entry]))
		: eventReminderSettings;
}

function buildBroadcastPublishExpectedRow(
	broadcast: BroadcastRow,
	now = Date.now()
): HubExecutionExpectedRow | null {
	if (!broadcast.publish_at) {
		return null;
	}

	const status = getBroadcastDeliveryStatus(broadcast, now);
	if (!status) {
		return null;
	}

	return {
		organization_id: broadcast.organization_id,
		job_kind: 'broadcast_publish',
		source_id: broadcast.id,
		execution_key: PUBLISH_EXECUTION_KEY,
		due_at: broadcast.publish_at,
		execution_state: mapScheduledStatusToExecutionState(status.state),
		processed_at: status.deliveredAt,
		last_failure_reason: status.failureReason
	};
}

function buildEventPublishExpectedRow(event: EventRow, now = Date.now()): HubExecutionExpectedRow | null {
	if (!event.publish_at) {
		return null;
	}

	const status = getEventDeliveryStatus(event, now);
	if (!status) {
		return null;
	}

	return {
		organization_id: event.organization_id,
		job_kind: 'event_publish',
		source_id: event.id,
		execution_key: PUBLISH_EXECUTION_KEY,
		due_at: event.publish_at,
		execution_state: mapScheduledStatusToExecutionState(status.state),
		processed_at: status.deliveredAt,
		last_failure_reason: status.failureReason
	};
}

function buildEventReminderExpectedRows(
	event: EventRow,
	reminderOffsets: number[],
	now = Date.now()
): HubExecutionExpectedRow[] {
	const rows: Array<HubExecutionExpectedRow | null> = normalizeEventReminderOffsets(reminderOffsets)
		.map((offsetMinutes) => {
			const dueAt = resolveEventReminderSendAt(event.starts_at, offsetMinutes);
			if (!dueAt) {
				return null;
			}

			const dueAtTime = getTime(dueAt);
			const publishAtTime = getTime(event.publish_at);
			const archivedAtTime = getTime(event.archived_at);
			const canceledAtTime = getTime(event.canceled_at);
			const startsAtTime = getTime(event.starts_at);

			let executionState: HubExecutionState = 'pending';
			let lastFailureReason: string | null = null;

			if (publishAtTime !== null && dueAtTime !== null && publishAtTime > dueAtTime) {
				executionState = 'failed';
				lastFailureReason = HUB_EXECUTION_FAILURE_REASONS.reminderBeforeVisibility;
			} else if (archivedAtTime !== null && archivedAtTime <= now) {
				executionState = 'skipped';
				lastFailureReason = HUB_EXECUTION_FAILURE_REASONS.reminderArchivedBeforeProcessing;
			} else if (canceledAtTime !== null && canceledAtTime <= now) {
				executionState = 'skipped';
				lastFailureReason = HUB_EXECUTION_FAILURE_REASONS.reminderCanceledBeforeProcessing;
			} else if (startsAtTime !== null && startsAtTime <= now) {
				executionState = 'skipped';
				lastFailureReason = HUB_EXECUTION_FAILURE_REASONS.reminderWindowPassed;
			}

			return {
				organization_id: event.organization_id,
				job_kind: 'event_reminder',
				source_id: event.id,
				execution_key: getEventReminderExecutionKey(offsetMinutes),
				due_at: dueAt,
				execution_state: executionState,
				processed_at: null,
				last_failure_reason: lastFailureReason
			};
		});

	return rows.filter((entry): entry is HubExecutionExpectedRow => entry !== null);
}

function toInitialExecutionMutation(expected: HubExecutionExpectedRow): HubExecutionLedgerMutationPayload {
	return {
		...expected,
		attempt_count: getDefaultAttemptCount(expected),
		last_attempted_at: getDefaultLastAttemptedAt(expected)
	};
}

function shouldSyncExistingRow(
	current: HubExecutionLedgerRow,
	expected: HubExecutionExpectedRow
): HubExecutionLedgerMutationPayload | null {
	const dueAtChanged = current.due_at !== expected.due_at;
	if (dueAtChanged) {
		return toInitialExecutionMutation(expected);
	}

	if (current.execution_state === 'processed') {
		if (
			expected.execution_state === 'processed' &&
			(current.processed_at !== expected.processed_at ||
				current.last_failure_reason !== expected.last_failure_reason)
		) {
			return {
				...expected,
				attempt_count: Math.max(current.attempt_count, 1),
				last_attempted_at: current.last_attempted_at ?? expected.processed_at
			};
		}

		return null;
	}

	if (expected.execution_state === 'pending') {
		if (current.execution_state !== 'pending') {
			return null;
		}

		if (
			current.last_failure_reason !== null ||
			current.processed_at !== null ||
			current.last_attempted_at !== null
		) {
			return {
				...expected,
				attempt_count: current.attempt_count,
				last_attempted_at: current.last_attempted_at
			};
		}

		return null;
	}

	if (
		current.execution_state !== expected.execution_state ||
		current.processed_at !== expected.processed_at ||
		current.last_failure_reason !== expected.last_failure_reason
	) {
		return {
			...expected,
			attempt_count:
				expected.execution_state === 'processed'
					? Math.max(current.attempt_count, 1)
					: current.attempt_count,
			last_attempted_at:
				expected.execution_state === 'processed'
					? current.last_attempted_at ?? expected.processed_at
					: current.last_attempted_at
		};
	}

	return null;
}

export function getEventReminderExecutionKey(offsetMinutes: number) {
	return `${offsetMinutes}`;
}

export function getHubExecutionLedgerKey(
	jobKind: HubExecutionJobKind,
	sourceId: string,
	executionKey = PUBLISH_EXECUTION_KEY
) {
	return `${jobKind}:${sourceId}:${executionKey}`;
}

export function buildHubExecutionLedgerMap(rows: HubExecutionLedgerRow[]) {
	return Object.fromEntries(
		rows.map((row) => [getHubExecutionLedgerKey(row.job_kind, row.source_id, row.execution_key), row])
	);
}

export function sortHubExecutionLedgerRows(rows: HubExecutionLedgerRow[]) {
	return [...rows].sort(sortByDueAtAscending);
}

export function buildExpectedHubExecutionLedgerRows(input: {
	broadcasts: BroadcastRow[];
	events: EventRow[];
	eventReminderSettings?: EventReminderSettingsRow[] | Record<string, EventReminderSettingsRow>;
	now?: number;
}) {
	const now = input.now ?? Date.now();
	const reminderSettingsMap = toReminderSettingsMap(input.eventReminderSettings);

	return sortHubExecutionLedgerRows(
		[
			...input.broadcasts
				.map((broadcast) => buildBroadcastPublishExpectedRow(broadcast, now))
				.filter((entry): entry is HubExecutionExpectedRow => entry !== null),
			...input.events
				.map((event) => buildEventPublishExpectedRow(event, now))
				.filter((entry): entry is HubExecutionExpectedRow => entry !== null),
			...input.events.flatMap((event) =>
				buildEventReminderExpectedRows(
					event,
					reminderSettingsMap[event.id]?.reminder_offsets ?? [],
					now
				)
			)
		] as HubExecutionLedgerRow[]
	);
}

export function buildHubExecutionLedgerSyncPlan(input: {
	broadcasts: BroadcastRow[];
	events: EventRow[];
	eventReminderSettings?: EventReminderSettingsRow[] | Record<string, EventReminderSettingsRow>;
	currentRows: HubExecutionLedgerRow[];
	now?: number;
}) {
	const expectedRows = buildExpectedHubExecutionLedgerRows(input);
	const currentMap = buildHubExecutionLedgerMap(input.currentRows);
	const expectedKeys = new Set(
		expectedRows.map((row) => getHubExecutionLedgerKey(row.job_kind, row.source_id, row.execution_key))
	);

	const upsertEntries = expectedRows
		.map((expected) => {
			const key = getHubExecutionLedgerKey(
				expected.job_kind,
				expected.source_id,
				expected.execution_key
			);
			const current = currentMap[key];

			return current ? shouldSyncExistingRow(current, expected) : toInitialExecutionMutation(expected);
		})
		.filter((entry): entry is HubExecutionLedgerMutationPayload => entry !== null);

	const deleteEntryIds = input.currentRows
		.filter(
			(row) =>
				!expectedKeys.has(getHubExecutionLedgerKey(row.job_kind, row.source_id, row.execution_key)) &&
				row.execution_state === 'pending'
		)
		.map((row) => row.id);

	return {
		expectedRows,
		upsertEntries,
		deleteEntryIds
	};
}

export function mergeHubExecutionLedgerRows(
	currentRows: HubExecutionLedgerRow[],
	upsertedRows: HubExecutionLedgerRow[],
	deleteEntryIds: string[]
) {
	const deleteIdSet = new Set(deleteEntryIds);
	const upsertedIdSet = new Set(upsertedRows.map((row) => row.id));
	const upsertedKeySet = new Set(
		upsertedRows.map((row) => getHubExecutionLedgerKey(row.job_kind, row.source_id, row.execution_key))
	);

	return sortHubExecutionLedgerRows([
		...currentRows.filter(
			(row) =>
				!deleteIdSet.has(row.id) &&
				!upsertedIdSet.has(row.id) &&
				!upsertedKeySet.has(
					getHubExecutionLedgerKey(row.job_kind, row.source_id, row.execution_key)
				)
		),
		...upsertedRows
	]);
}

export function getHubExecutionLedgerBucket(
	row: Pick<HubExecutionLedgerRow, 'execution_state' | 'due_at'>,
	now = Date.now()
): HubExecutionLedgerBucket {
	if (row.execution_state === 'processed') {
		return 'processed';
	}

	if (row.execution_state === 'failed') {
		return 'failed';
	}

	if (row.execution_state === 'skipped') {
		return 'skipped';
	}

	return (getTime(row.due_at) ?? 0) <= now ? 'due' : 'upcoming';
}

export function groupHubExecutionLedger(rows: HubExecutionLedgerRow[], now = Date.now()): HubExecutionLedgerGroups {
	const groups: HubExecutionLedgerGroups = {
		due: [],
		upcoming: [],
		processed: [],
		failed: [],
		skipped: []
	};

	for (const row of rows) {
		groups[getHubExecutionLedgerBucket(row, now)].push(row);
	}

	groups.due.sort(sortByDueAtAscending);
	groups.upcoming.sort(sortByDueAtAscending);
	groups.processed.sort((left, right) => {
		const leftTime = getTime(left.processed_at) ?? getTime(left.due_at) ?? 0;
		const rightTime = getTime(right.processed_at) ?? getTime(right.due_at) ?? 0;
		return rightTime - leftTime;
	});
	groups.failed.sort(sortByDueAtDescending);
	groups.skipped.sort(sortByDueAtDescending);

	return groups;
}

export function countDueHubExecutionLedgerRows(rows: HubExecutionLedgerRow[], now = Date.now()) {
	return rows.filter((row) => getHubExecutionLedgerBucket(row, now) === 'due').length;
}

export function countRecoverableHubExecutionLedgerRows(rows: HubExecutionLedgerRow[]) {
	return rows.filter(
		(row) => row.execution_state === 'failed' || row.execution_state === 'skipped'
	).length;
}