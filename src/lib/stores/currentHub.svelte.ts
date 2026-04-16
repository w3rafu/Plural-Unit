/**
 * currentHub — reactive store for hub content and plugin state.
 *
 * Responsibilities:
 *  - Load plugin activation state for the current organization
 *  - Load live data (broadcasts, events) for active plugins
 *  - Expose admin CRUD actions
 *  - Expose plugin toggle actions
 *
 * The hub coordinator page reads from this store. No route
 * component should call hubRepository directly.
 */

import {
	sortDraftBroadcasts,
	sortScheduledBroadcasts,
	replaceBroadcastRow,
	sortActiveBroadcasts,
	sortInactiveBroadcasts
} from '$lib/models/broadcastLifecycleModel';
import {
	replaceEventRow,
	sortInactiveEvents,
	sortLiveEvents,
	sortScheduledEvents
} from '$lib/models/eventLifecycleModel';
import { type EventReminderSummary } from '$lib/models/eventReminderModel';
import { type EventAttendanceSummary } from '$lib/models/eventResponseModel';
import {
	type EventAttendanceRoster,
	type EventAttendanceOutcomeSummary,
	removeEventAttendanceFromMap,
	upsertEventAttendanceMap
} from '$lib/models/eventAttendanceModel';
import {
	type BroadcastAcknowledgmentMap,
	addAcknowledgmentToMap,
	removeAcknowledgmentFromMap as removeAcknowledgmentFromMapModel,
	getBroadcastAcknowledgmentCount,
	hasMemberAcknowledgedBroadcast
} from '$lib/models/broadcastAcknowledgmentModel';
import type {
	HubAdminEngagementSummary,
	HubEventFollowUpSignal,
	HubEngagementSignal
} from '$lib/models/hubEngagementModel';
import {
	buildHubExecutionFollowUpTriageKey,
	buildHubExecutionQueueItemTriageKey,
	buildHubExecutionQueueSections,
	buildHubExecutionQueueTriageMapFromWorkflowStateRows,
	type HubExecutionQueueFocus,
	type HubExecutionQueueFollowUpSignal,
	type HubExecutionQueueSections,
	type HubExecutionTriageMap,
	type HubExecutionTriageStatus
} from '$lib/models/hubExecutionQueue';
import {
	buildHubOperatorWorkflowSummary,
	normalizeHubOperatorWorkflowNote
} from '$lib/models/hubOperatorWorkflowModel';
import {
	sortResourceRows,
	type ResourceMoveDirection
} from '$lib/models/resourcesModel';
import {
	type PluginKey,
	type PluginStateMap
} from './pluginRegistry';
import {
	countDueHubExecutionLedgerRows,
	countRecoverableHubExecutionLedgerRows,
	groupHubExecutionLedger
} from '$lib/models/hubExecutionLedger';
import {
	createDefaultHubNotificationPreferences,
	type HubNotificationItem,
	type HubNotificationPreferences
} from '$lib/models/hubNotifications';
import type {
	BroadcastMutationPayload,
	BroadcastRow,
	HubExecutionLedgerMutationPayload,
	HubExecutionLedgerRow,
	HubOperatorWorkflowStateKind,
	HubOperatorWorkflowStateMutationPayload,
	HubOperatorWorkflowStateRow,
	EventMutationPayload,
	EventAttendanceRow,
	EventAttendanceStatus,
	EventReminderSettingsRow,
	EventResponseRow,
	EventResponseStatus,
	EventRow,
	ResourceRow,
	ResourceType
} from '$lib/repositories/hubRepository';
import {
	deleteHubOperatorWorkflowStateEntries,
	togglePlugin,
	upsertHubOperatorWorkflowStateEntries,
	acknowledgeBroadcast as acknowledgeBroadcastRepo,
	unacknowledgeBroadcast as unacknowledgeBroadcastRepo
} from '$lib/repositories/hubRepository';
import {
	getCurrentHubActivityFeed,
	getCurrentHubAllActivityFeed,
	getCurrentHubBroadcastExecutionDiagnostics,
	getCurrentHubBroadcastDeliveryStatus,
	getCurrentHubBroadcastEngagementSignal,
	getCurrentHubEngagementSummary,
	getCurrentHubEventAttendanceOutcomeSummary,
	getCurrentHubEventAttendanceRoster,
	getCurrentHubEventAttendanceStatus,
	getCurrentHubEventAttendanceSummary,
	getCurrentHubEventExecutionDiagnostics,
	getCurrentHubEventDeliveryStatus,
	getCurrentHubEventEngagementSignal,
	getCurrentHubEventFollowUpSignals,
	getCurrentHubEventReminderOffsets,
	getCurrentHubEventReminderSettings,
	getCurrentHubEventReminderSummary,
	getCurrentHubEventResponseRoster,
	getCurrentHubOwnEventAttendance,
	getCurrentHubOwnEventResponse,
	getCurrentHubUnreadActivityCount
} from './currentHub/derived';
import {
	deleteCurrentHubExecutionLedgerEntry,
	getCurrentHubExpectedExecutionLedgerRow,
	syncCurrentHubBroadcastDeliveryRow,
	syncCurrentHubEventDeliveryRow,
	syncCurrentHubExecutionLedgerRows,
	upsertCurrentHubExecutionLedgerEntry
} from './currentHub/sync';
import {
	addCurrentHubBroadcast,
	archiveCurrentHubBroadcast,
	publishCurrentHubBroadcastNow,
	removeCurrentHubBroadcast,
	restoreCurrentHubBroadcast,
	saveCurrentHubBroadcastDraft,
	scheduleCurrentHubBroadcast,
	setCurrentHubBroadcastPinned,
	updateCurrentHubBroadcast
} from './currentHub/broadcasts';
import {
	addCurrentHubEvent,
	archiveCurrentHubEvent,
	cancelCurrentHubEvent,
	clearCurrentHubEventAttendance,
	persistCurrentHubEventReminderSettings,
	removeCurrentHubEvent,
	restoreCurrentHubEvent,
	setCurrentHubEventAttendance,
	setCurrentHubEventResponse,
	updateCurrentHubEvent
} from './currentHub/events';
import {
	markAllCurrentHubActivityRead,
	markCurrentHubActivityRead,
	updateCurrentHubNotificationPreferences
} from './currentHub/notifications';
import {
	addCurrentHubResource,
	moveCurrentHubResource,
	removeCurrentHubResource,
	updateCurrentHubResource
} from './currentHub/resources';
import {
	loadCurrentHubState,
	type CurrentHubLoadResult
} from './currentHub/load';
import {
	applyCurrentHubLoadedState,
	createDefaultCurrentHubPluginState,
	resetCurrentHubState
} from './currentHub/state';
import { currentOrganization } from './currentOrganization.svelte';
import type { ScheduledDeliveryStatus } from '$lib/models/scheduledDeliveryModel';
import type { EventResponseRoster } from '$lib/models/eventResponseModel';
import type { HubExecutionDiagnosticEntry } from '$lib/models/hubExecutionDiagnostics';
import { buildSmokeHubState } from '$lib/demo/smokeFixtures';
import {
	getSmokeModeHubLoadError,
	isSmokeModeEnabled,
	shouldHydrateSmokeHubState
} from '$lib/demo/smokeMode';
import { triggerPushNotification } from '$lib/services/pushNotification';

const HUB_EXECUTION_QUEUE_TRIAGE_STORAGE_KEY_PREFIX = 'plural-unit:hub-queue-triage:';
const HUB_EXECUTION_QUEUE_TRIAGE_IMPORT_STORAGE_KEY_PREFIX =
	'plural-unit:hub-queue-triage-imported:';

function getHubExecutionQueueTriageStorageKey(orgId: string) {
	return `${HUB_EXECUTION_QUEUE_TRIAGE_STORAGE_KEY_PREFIX}${orgId}`;
}

function getHubExecutionQueueTriageImportStorageKey(orgId: string) {
	return `${HUB_EXECUTION_QUEUE_TRIAGE_IMPORT_STORAGE_KEY_PREFIX}${orgId}`;
}

function loadLegacyHubExecutionQueueTriageMap(orgId: string | null): HubExecutionTriageMap {
	if (typeof window === 'undefined' || !orgId) {
		return {};
	}

	try {
		const rawValue = window.localStorage.getItem(getHubExecutionQueueTriageStorageKey(orgId));
		if (!rawValue) {
			return {};
		}

		const parsed = JSON.parse(rawValue);
		if (!parsed || typeof parsed !== 'object') {
			return {};
		}

		return Object.fromEntries(
			Object.entries(parsed)
				.filter((entry): entry is [string, { status: HubExecutionTriageStatus; updatedAt: string }] => {
					const value = entry[1];
					const triageValue = value as { status?: unknown; updatedAt?: unknown } | null;
					return (
						value !== null &&
						typeof value === 'object' &&
						(triageValue?.status === 'reviewed' || triageValue?.status === 'deferred') &&
						typeof triageValue?.updatedAt === 'string'
					);
				})
				.map(([key, value]) => [
					key,
					{
						status: value.status,
						updatedAt: value.updatedAt,
						reviewedAgainstSignature: null
					}
				])
		);
	} catch {
		return {};
	}
}

function clearLegacyHubExecutionQueueTriageMap(orgId: string | null) {
	if (typeof window === 'undefined' || !orgId) {
		return;
	}

	window.localStorage.removeItem(getHubExecutionQueueTriageStorageKey(orgId));
}

function hasImportedLegacyHubExecutionQueueTriage(orgId: string | null) {
	if (typeof window === 'undefined' || !orgId) {
		return false;
	}

	return window.localStorage.getItem(getHubExecutionQueueTriageImportStorageKey(orgId)) === '1';
}

function markLegacyHubExecutionQueueTriageImported(orgId: string | null) {
	if (typeof window === 'undefined' || !orgId) {
		return;
	}

	window.localStorage.setItem(getHubExecutionQueueTriageImportStorageKey(orgId), '1');
}

function resolveHubOperatorWorkflowStateKind(
	workflowKey: string
): HubOperatorWorkflowStateKind | null {
	if (workflowKey.startsWith('execution:')) {
		return 'execution_item';
	}

	if (workflowKey.startsWith('followup:')) {
		return 'followup_signal';
	}

	return null;
}

function upsertHubOperatorWorkflowStateRow(
	rows: HubOperatorWorkflowStateRow[],
	row: HubOperatorWorkflowStateRow
) {
	const existingIndex = rows.findIndex((entry) => entry.workflow_key === row.workflow_key);
	if (existingIndex === -1) {
		return [row, ...rows];
	}

	const nextRows = [...rows];
	nextRows[existingIndex] = row;
	return nextRows;
}

function removeHubOperatorWorkflowStateRow(
	rows: HubOperatorWorkflowStateRow[],
	workflowKey: string
) {
	return rows.filter((entry) => entry.workflow_key !== workflowKey);
}

function buildSmokeEventAttendanceRow(input: {
	currentMap: Record<string, EventAttendanceRow[]>;
	orgId: string;
	ownProfileId: string;
	eventId: string;
	profileId: string;
	status: EventAttendanceStatus;
}): EventAttendanceRow {
	const existingRow = input.currentMap[input.eventId]?.find(
		(row) => row.profile_id === input.profileId
	);
	const timestamp = new Date().toISOString();

	return {
		id: existingRow?.id ?? `smoke-attendance:${input.eventId}:${input.profileId}`,
		event_id: input.eventId,
		organization_id: input.orgId,
		profile_id: input.profileId,
		status: input.status,
		marked_by_profile_id: input.ownProfileId,
		created_at: existingRow?.created_at ?? timestamp,
		updated_at: timestamp
	};
}

function buildBulkAttendanceMutationError(
	error: unknown,
	completedCount: number,
	totalCount: number
) {
	if (completedCount === 0) {
		return error instanceof Error
			? error
			: new Error('Failed to record attendance for this group.');
	}

	const baseMessage =
		error instanceof Error ? error.message : 'Failed to record attendance for this group.';

	return new Error(
		`Saved ${completedCount} of ${totalCount} attendance updates before the bulk action stopped. ${baseMessage}`
	);
}

class CurrentHub {
	isLoading = $state(false);
	loadedOrgId = $state('');
	plugins = $state<PluginStateMap>(createDefaultCurrentHubPluginState());
	broadcasts = $state<BroadcastRow[]>([]);
	events = $state<EventRow[]>([]);
	resources = $state<ResourceRow[]>([]);
	broadcastTargetId = $state('');
	eventTargetId = $state('');
	resourceTargetId = $state('');
	eventResponseMap = $state<Record<string, EventResponseRow[]>>({});
	eventAttendanceMap = $state<Record<string, EventAttendanceRow[]>>({});
	broadcastAcknowledgmentMap = $state<BroadcastAcknowledgmentMap>({});
	eventReminderSettingsMap = $state<Record<string, EventReminderSettingsRow>>({});
	executionLedger = $state<HubExecutionLedgerRow[]>([]);
	executionTargetId = $state('');
	eventResponseTargetId = $state('');
	eventAttendanceTargetId = $state('');
	broadcastAcknowledgmentTargetId = $state('');
	notificationPreferences = $state<HubNotificationPreferences>(
		createDefaultHubNotificationPreferences()
	);
	notificationReadMap = $state<Record<string, string>>({});
	isSavingNotificationPreferences = $state(false);
	notificationReadTargetId = $state('');
	isMarkingAllActivityRead = $state(false);
	workflowStateRows = $state<HubOperatorWorkflowStateRow[]>([]);
	queueTriageMap = $state<HubExecutionTriageMap>({});
	lastError = $state<Error | null>(null);

	clearError() {
		this.lastError = null;
	}

	private loadPromise: Promise<void> | null = null;
	private loadingOrgId: string | null = null;
	private workflowMutationTokens = new Map<string, string>();
	private smokeFixtureNow = Date.now();

	private buildSmokeHydratedState() {
		const smokeState = buildSmokeHubState(this.smokeFixtureNow);
		const workflowStateRows =
			this.workflowStateRows.length > 0 ? this.workflowStateRows : smokeState.workflowStateRows;

		return {
			...smokeState,
			workflowStateRows,
			queueTriageMap: buildHubExecutionQueueTriageMapFromWorkflowStateRows(workflowStateRows)
		};
	}

	constructor() {
		if (typeof window !== 'undefined' && shouldHydrateSmokeHubState()) {
			applyCurrentHubLoadedState(this, this.buildSmokeHydratedState());
		}
	}

	private applyWorkflowStateRows(rows: HubOperatorWorkflowStateRow[]) {
		this.workflowStateRows = rows;
		this.queueTriageMap = buildHubExecutionQueueTriageMapFromWorkflowStateRows(rows);
	}

	private getWorkflowStateRow(workflowKey: string) {
		return this.workflowStateRows.find((row) => row.workflow_key === workflowKey) ?? null;
	}

	private getActiveFollowUpWorkflowKeys() {
		return new Set(
			this.getHubEventFollowUpSignals({ includeTriaged: true }).map((signal) =>
				buildHubExecutionFollowUpTriageKey(signal)
			)
		);
	}

	private getOrphanedFollowUpWorkflowKeys(rows: HubOperatorWorkflowStateRow[] = this.workflowStateRows) {
		const activeFollowUpWorkflowKeys = this.getActiveFollowUpWorkflowKeys();

		return rows
			.filter(
				(row) =>
					row.workflow_kind === 'followup_signal' &&
					!activeFollowUpWorkflowKeys.has(row.workflow_key)
			)
			.map((row) => row.workflow_key);
	}

	private async cleanupOrphanedFollowUpWorkflowStateRows(options?: { persist?: boolean }) {
		const orphanedWorkflowKeys = this.getOrphanedFollowUpWorkflowKeys();
		if (orphanedWorkflowKeys.length === 0) {
			return;
		}

		const orphanedWorkflowKeySet = new Set(orphanedWorkflowKeys);
		this.applyWorkflowStateRows(
			this.workflowStateRows.filter((row) => !orphanedWorkflowKeySet.has(row.workflow_key))
		);

		if (options?.persist === false || isSmokeModeEnabled()) {
			return;
		}

		const orgId = this.orgId;
		if (!orgId) {
			return;
		}

		try {
			await deleteHubOperatorWorkflowStateEntries(orgId, orphanedWorkflowKeys);
		} catch (error) {
			this.captureError(error);
		}
	}

	private getWorkflowReviewSignature(workflowKey: string) {
		const executionSections = this.getExecutionQueueSections(
			{ includeUpcoming: true },
			{ includeTriaged: true }
		);
		const executionItem = [
			...executionSections.due,
			...executionSections.upcoming,
			...executionSections.recovery,
			...executionSections.processed
		].find((item) => buildHubExecutionQueueItemTriageKey(item) === workflowKey);

		if (executionItem) {
			return executionItem.reviewSignature;
		}

		return (
			this.getHubEventFollowUpSignals({ includeTriaged: true }).find(
				(signal) => buildHubExecutionFollowUpTriageKey(signal) === workflowKey
			)?.reviewSignature ?? null
		);
	}

	private buildWorkflowStateMutationPayload(
		workflowKey: string,
		status: HubExecutionTriageStatus,
		note?: string | null
	): HubOperatorWorkflowStateMutationPayload | null {
		const orgId = this.orgId;
		const ownProfileId = this.ownProfileId;
		const existingRow = this.getWorkflowStateRow(workflowKey);
		const workflowKind =
			existingRow?.workflow_kind ?? resolveHubOperatorWorkflowStateKind(workflowKey);

		if (!orgId || !ownProfileId || !workflowKind) {
			return null;
		}

		return {
			organization_id: orgId,
			workflow_key: workflowKey,
			workflow_kind: workflowKind,
			status,
			reviewed_by_profile_id: ownProfileId,
			note: normalizeHubOperatorWorkflowNote(
				note === undefined ? existingRow?.note ?? '' : note
			),
			reviewed_against_signature: this.getWorkflowReviewSignature(workflowKey)
		};
	}

	private createWorkflowMutationToken(workflowKey: string) {
		const token = `${Date.now()}:${Math.random()}`;
		this.workflowMutationTokens.set(workflowKey, token);
		return token;
	}

	private isCurrentWorkflowMutation(workflowKey: string, token: string) {
		return this.workflowMutationTokens.get(workflowKey) === token;
	}

	private finishWorkflowMutation(workflowKey: string, token: string) {
		if (this.isCurrentWorkflowMutation(workflowKey, token)) {
			this.workflowMutationTokens.delete(workflowKey);
		}
	}

	private restoreWorkflowStateRow(
		workflowKey: string,
		previousRow: HubOperatorWorkflowStateRow | null
	) {
		this.applyWorkflowStateRows(
			previousRow
				? upsertHubOperatorWorkflowStateRow(this.workflowStateRows, previousRow)
				: removeHubOperatorWorkflowStateRow(this.workflowStateRows, workflowKey)
		);
	}

	private async importLegacyQueueTriageIfNeeded(
		orgId: string,
		workflowStateRows: HubOperatorWorkflowStateRow[]
	) {
		if (
			workflowStateRows.length > 0 ||
			hasImportedLegacyHubExecutionQueueTriage(orgId) ||
			!currentOrganization.isAdmin ||
			!this.ownProfileId
		) {
			return workflowStateRows;
		}

		const legacyTriageMap = loadLegacyHubExecutionQueueTriageMap(orgId);
		if (Object.keys(legacyTriageMap).length === 0) {
			return workflowStateRows;
		}

		const legacyEntries = Object.entries(legacyTriageMap).flatMap(([workflowKey, entry]) => {
			const workflowKind = resolveHubOperatorWorkflowStateKind(workflowKey);
			if (!workflowKind) {
				return [];
			}

			return [
				{
					organization_id: orgId,
					workflow_key: workflowKey,
					workflow_kind: workflowKind,
					status: entry.status,
					reviewed_by_profile_id: this.ownProfileId as string,
					note: '',
					reviewed_against_signature: null
				} satisfies HubOperatorWorkflowStateMutationPayload
			];
		});

		if (legacyEntries.length === 0) {
			markLegacyHubExecutionQueueTriageImported(orgId);
			clearLegacyHubExecutionQueueTriageMap(orgId);
			return workflowStateRows;
		}

		try {
			const importedRows = await upsertHubOperatorWorkflowStateEntries(legacyEntries);
			markLegacyHubExecutionQueueTriageImported(orgId);
			clearLegacyHubExecutionQueueTriageMap(orgId);
			return importedRows;
		} catch {
			return workflowStateRows;
		}
	}

	private async setQueueTriageStatus(
		workflowKey: string,
		status: HubExecutionTriageStatus,
		options?: { note?: string | null }
	) {
		const payload = this.buildWorkflowStateMutationPayload(workflowKey, status, options?.note);
		if (!payload) {
			return;
		}

		const previousRow = this.getWorkflowStateRow(workflowKey);
		const timestamp = new Date().toISOString();
		const optimisticRow: HubOperatorWorkflowStateRow = {
			...payload,
			created_at: previousRow?.created_at ?? timestamp,
			updated_at: timestamp
		};

		this.applyWorkflowStateRows(
			upsertHubOperatorWorkflowStateRow(this.workflowStateRows, optimisticRow)
		);

		if (isSmokeModeEnabled()) {
			return;
		}

		const token = this.createWorkflowMutationToken(workflowKey);

		try {
			const [persistedRow] = await upsertHubOperatorWorkflowStateEntries([payload]);
			if (!persistedRow || !this.isCurrentWorkflowMutation(workflowKey, token)) {
				return;
			}

			this.applyWorkflowStateRows(
				upsertHubOperatorWorkflowStateRow(this.workflowStateRows, persistedRow)
			);
		} catch (error) {
			if (this.isCurrentWorkflowMutation(workflowKey, token)) {
				this.restoreWorkflowStateRow(workflowKey, previousRow);
			}
			this.captureError(error);
		} finally {
			this.finishWorkflowMutation(workflowKey, token);
		}
	}

	private async clearQueueTriageStatus(workflowKey: string) {
		const orgId = this.orgId;
		const previousRow = this.getWorkflowStateRow(workflowKey);

		if (!previousRow) {
			return;
		}

		this.applyWorkflowStateRows(
			removeHubOperatorWorkflowStateRow(this.workflowStateRows, workflowKey)
		);

		if (isSmokeModeEnabled()) {
			return;
		}

		if (!orgId) {
			this.restoreWorkflowStateRow(workflowKey, previousRow);
			return;
		}

		const token = this.createWorkflowMutationToken(workflowKey);

		try {
			await deleteHubOperatorWorkflowStateEntries(orgId, [workflowKey]);
		} catch (error) {
			if (this.isCurrentWorkflowMutation(workflowKey, token)) {
				this.restoreWorkflowStateRow(workflowKey, previousRow);
			}
			this.captureError(error);
		} finally {
			this.finishWorkflowMutation(workflowKey, token);
		}
	}

	private captureError(error: unknown) {
		this.lastError = error instanceof Error ? error : new Error(String(error));
	}

	private async withCapturedError<T>(work: () => Promise<T>) {
		this.lastError = null;

		try {
			return await work();
		} catch (error) {
			this.captureError(error);
			throw error;
		}
	}

	private async withBroadcastTarget<T>(targetId: string, work: () => Promise<T>) {
		this.broadcastTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.broadcastTargetId === targetId) {
				this.broadcastTargetId = '';
			}
		}
	}

	private async withEventTarget<T>(targetId: string, work: () => Promise<T>) {
		this.eventTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.eventTargetId === targetId) {
				this.eventTargetId = '';
			}
		}
	}

	private async withResourceTarget<T>(targetId: string, work: () => Promise<T>) {
		this.resourceTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.resourceTargetId === targetId) {
				this.resourceTargetId = '';
			}
		}
	}

	private async withExecutionTarget<T>(targetId: string, work: () => Promise<T>) {
		this.executionTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.executionTargetId === targetId) {
				this.executionTargetId = '';
			}
		}
	}

	private async withEventResponseTarget<T>(targetId: string, work: () => Promise<T>) {
		this.eventResponseTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.eventResponseTargetId === targetId) {
				this.eventResponseTargetId = '';
			}
		}
	}

	private async withEventAttendanceTarget<T>(targetId: string, work: () => Promise<T>) {
		this.eventAttendanceTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.eventAttendanceTargetId === targetId) {
				this.eventAttendanceTargetId = '';
			}
		}
	}

	private async withNotificationReadTarget<T>(targetId: string, work: () => Promise<T>) {
		this.notificationReadTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.notificationReadTargetId === targetId) {
				this.notificationReadTargetId = '';
			}
		}
	}

	private async withBroadcastAcknowledgmentTarget<T>(targetId: string, work: () => Promise<T>) {
		this.broadcastAcknowledgmentTargetId = targetId;

		try {
			return await work();
		} finally {
			if (this.broadcastAcknowledgmentTargetId === targetId) {
				this.broadcastAcknowledgmentTargetId = '';
			}
		}
	}

	get orgId(): string | null {
		return currentOrganization.organization?.id ?? null;
	}

	get ownProfileId(): string | null {
		return currentOrganization.membership?.profile_id ?? null;
	}

	get hasLoadedForCurrentOrg() {
		return this.orgId !== null && this.loadedOrgId === this.orgId;
	}

	get draftBroadcasts() {
		return sortDraftBroadcasts(this.broadcasts);
	}

	get scheduledBroadcasts() {
		return sortScheduledBroadcasts(this.broadcasts);
	}

	get activeBroadcasts() {
		return sortActiveBroadcasts(this.broadcasts);
	}

	get inactiveBroadcasts() {
		return sortInactiveBroadcasts(this.broadcasts);
	}

	get liveEvents() {
		return sortLiveEvents(this.events);
	}

	get scheduledEvents() {
		return sortScheduledEvents(this.events);
	}

	get inactiveEvents() {
		return sortInactiveEvents(this.events);
	}

	get hubEngagementSummary(): HubAdminEngagementSummary {
		return getCurrentHubEngagementSummary({
			events: this.events,
			broadcasts: this.broadcasts,
			eventResponseMap: this.eventResponseMap,
			eventAttendanceMap: this.eventAttendanceMap,
			queueTriageMap: this.queueTriageMap
		});
	}

	get hubEventFollowUpSignals(): HubExecutionQueueFollowUpSignal[] {
		return this.getHubEventFollowUpSignals();
	}

	getHubEventFollowUpSignals(options?: { includeTriaged?: boolean }): HubExecutionQueueFollowUpSignal[] {
		return getCurrentHubEventFollowUpSignals({
			events: this.events,
			eventResponseMap: this.eventResponseMap,
			eventAttendanceMap: this.eventAttendanceMap,
			queueTriageMap: this.queueTriageMap,
			includeTriaged: options?.includeTriaged
		});
	}

	getWorkflowSummary(workflowKey: string) {
		const workflowRow = this.getWorkflowStateRow(workflowKey);
		if (!workflowRow) {
			return null;
		}

		return buildHubOperatorWorkflowSummary({
			row: workflowRow,
			members: currentOrganization.members,
			ownProfileId: this.ownProfileId
		});
	}

	get orderedResources() {
		return sortResourceRows(this.resources);
	}

	get executionLedgerGroups() {
		return groupHubExecutionLedger(this.executionLedger);
	}

	getExecutionQueueSections(
		focus?: Partial<HubExecutionQueueFocus>,
		options?: { includeTriaged?: boolean }
	): HubExecutionQueueSections {
		return buildHubExecutionQueueSections({
			rows: this.executionLedger,
			broadcasts: this.broadcasts,
			events: this.events,
			focus,
			triageMap: this.queueTriageMap,
			includeTriaged: options?.includeTriaged
		});
	}

	get dueExecutionItems() {
		return this.executionLedgerGroups.due;
	}

	get upcomingExecutionItems() {
		return this.executionLedgerGroups.upcoming;
	}

	get processedExecutionItems() {
		return this.executionLedgerGroups.processed;
	}

	get failedExecutionItems() {
		return this.executionLedgerGroups.failed;
	}

	get skippedExecutionItems() {
		return this.executionLedgerGroups.skipped;
	}

	get dueExecutionCount() {
		return countDueHubExecutionLedgerRows(this.executionLedger);
	}

	get recoverableExecutionCount() {
		return countRecoverableHubExecutionLedgerRows(this.executionLedger);
	}

	get visibleRecoverableExecutionCount() {
		return this.getExecutionQueueSections().recovery.length;
	}

	get staleExecutionItemCount() {
		const sections = this.getExecutionQueueSections(undefined, { includeTriaged: true });

		return [...sections.due, ...sections.upcoming, ...sections.recovery, ...sections.processed].filter(
			(item) => item.triageStatus !== null && item.isStaleReview
		).length;
	}

	get triagedExecutionItemCount() {
		const sections = this.getExecutionQueueSections(undefined, { includeTriaged: true });

		return [...sections.recovery, ...sections.processed].filter(
			(item) => item.triageStatus !== null && !item.isStaleReview
		).length;
	}

	get staleFollowUpSignalCount() {
		return this.getHubEventFollowUpSignals({ includeTriaged: true }).filter(
			(signal) => signal.triageStatus !== null && signal.isStaleReview
		).length;
	}

	get triagedFollowUpSignalCount() {
		return this.getHubEventFollowUpSignals({ includeTriaged: true }).filter(
			(signal) => signal.triageStatus !== null && !signal.isStaleReview
		).length;
	}

	get staleQueueItemCount() {
		return this.staleExecutionItemCount + this.staleFollowUpSignalCount;
	}

	get triagedQueueItemCount() {
		return this.triagedExecutionItemCount + this.triagedFollowUpSignalCount;
	}

	get processedReminderExecutionItems() {
		return this.processedExecutionItems.filter((row) => row.job_kind === 'event_reminder');
	}

	get allActivityFeed() {
		return getCurrentHubAllActivityFeed({
			activeBroadcasts: this.activeBroadcasts,
			events: this.events,
			processedReminderExecutionItems: this.processedReminderExecutionItems,
			notificationReadMap: this.notificationReadMap
		});
	}

	get activityFeed() {
		return getCurrentHubActivityFeed(this.allActivityFeed, this.notificationPreferences);
	}

	get unreadActivityCount() {
		return getCurrentHubUnreadActivityCount(this.activityFeed);
	}

	/** Clear all state. Called on logout. */
	reset() {
		resetCurrentHubState(this);
		this.loadPromise = null;
		this.loadingOrgId = null;
		this.workflowMutationTokens.clear();
		this.smokeFixtureNow = Date.now();
	}

	async load() {
		const orgId = this.orgId;
		if (!orgId) return;

		if (isSmokeModeEnabled()) {
			const smokeLoadError = getSmokeModeHubLoadError();
			if (smokeLoadError) {
				resetCurrentHubState(this);
				this.lastError = smokeLoadError;
				this.loadPromise = null;
				this.loadingOrgId = null;
				throw smokeLoadError;
			}

			this.lastError = null;
			applyCurrentHubLoadedState(this, this.buildSmokeHydratedState());
			await this.cleanupOrphanedFollowUpWorkflowStateRows({ persist: false });
			this.isLoading = false;
			this.loadPromise = null;
			this.loadingOrgId = null;
			return;
		}

		if (this.loadPromise) {
			if (this.loadingOrgId === orgId) {
				return this.loadPromise;
			}

			try {
				await this.loadPromise;
			} catch {
				// Ignore the previous org load failure and continue with the current org.
			}

			if (this.orgId !== orgId) {
				return;
			}
		}

		this.lastError = null;
		this.isLoading = true;
		this.loadingOrgId = orgId;

		const loadPromise = (async () => {
			const nextState = await loadCurrentHubState({
				orgId,
				profileId: this.ownProfileId,
				isAdmin: currentOrganization.isAdmin,
				currentOrgStillMatches: () => this.orgId === orgId,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row),
				syncEventDeliveryRow: (row) => this.syncEventDeliveryRow(row)
			});

			if (!nextState) {
				return;
			}

			const workflowStateRows = await this.importLegacyQueueTriageIfNeeded(
				orgId,
				nextState.workflowStateRows
			);

			applyCurrentHubLoadedState(this, {
				...nextState,
				workflowStateRows,
				queueTriageMap: buildHubExecutionQueueTriageMapFromWorkflowStateRows(
					workflowStateRows
				)
			});
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		})();

		this.loadPromise = loadPromise;

		try {
			await loadPromise;
		} catch (error) {
			this.captureError(error);
			throw error;
		} finally {
			if (this.loadPromise === loadPromise) {
				this.loadPromise = null;
			}
			if (this.loadingOrgId === orgId) {
				this.loadingOrgId = null;
			}
			if (!this.loadPromise) {
				this.isLoading = false;
			}
		}
	}

	async toggle(key: PluginKey, enabled: boolean) {
		if (isSmokeModeEnabled()) {
			this.plugins = { ...this.plugins, [key]: enabled };
			return;
		}

		if (!this.orgId) return;
		await togglePlugin(this.orgId, key, enabled);
		this.plugins = { ...this.plugins, [key]: enabled };
	}

	async updateNotificationPreferences(nextPreferences: HubNotificationPreferences) {
		if (isSmokeModeEnabled()) {
			this.notificationPreferences = { ...nextPreferences };
			return;
		}

		if (!this.orgId || !this.ownProfileId) return;

		this.isSavingNotificationPreferences = true;

		try {
			this.notificationPreferences = await this.withCapturedError(() =>
				updateCurrentHubNotificationPreferences({
					orgId: this.orgId as string,
					ownProfileId: this.ownProfileId as string,
					nextPreferences
				})
			);
		} finally {
			this.isSavingNotificationPreferences = false;
		}
	}

	async markActivityRead(
		notification: Pick<
			HubNotificationItem,
			'id' | 'kind' | 'sourceId' | 'notificationKey' | 'isRead'
		>
	) {
		if (isSmokeModeEnabled()) {
			if (notification.isRead) {
				return;
			}

			this.notificationReadMap = {
				...this.notificationReadMap,
				[notification.id]: new Date().toISOString()
			};
			return;
		}

		if (!this.orgId || !this.ownProfileId || notification.isRead) {
			return;
		}

		await this.withNotificationReadTarget(notification.id, async () => {
			this.notificationReadMap = await this.withCapturedError(() =>
				markCurrentHubActivityRead({
					orgId: this.orgId as string,
					ownProfileId: this.ownProfileId as string,
					notification,
					currentReadMap: this.notificationReadMap
				})
			);
		});
	}

	async markAllActivityRead(items: HubNotificationItem[] = this.activityFeed) {
		if (isSmokeModeEnabled()) {
			const readAt = new Date().toISOString();
			this.notificationReadMap = {
				...this.notificationReadMap,
				...Object.fromEntries(items.map((item) => [item.id, readAt]))
			};
			return;
		}

		if (!this.orgId || !this.ownProfileId) {
			return;
		}
		this.isMarkingAllActivityRead = true;

		try {
			this.notificationReadMap = await this.withCapturedError(() =>
				markAllCurrentHubActivityRead({
					orgId: this.orgId as string,
					ownProfileId: this.ownProfileId as string,
					items,
					currentReadMap: this.notificationReadMap
				})
			);
		} finally {
			this.isMarkingAllActivityRead = false;
		}
	}

	// ── Broadcast actions ──

	async addBroadcast(payload: BroadcastMutationPayload) {
		if (!this.orgId) return;

		await this.withBroadcastTarget('draft', async () => {
			this.broadcasts = await addCurrentHubBroadcast({
				orgId: this.orgId as string,
				payload,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async updateBroadcast(broadcastId: string, payload: BroadcastMutationPayload) {
		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await updateCurrentHubBroadcast({
				broadcastId,
				payload,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async saveBroadcastDraft(broadcastId: string) {
		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await saveCurrentHubBroadcastDraft({
				broadcastId,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async scheduleBroadcast(broadcastId: string, publishAt: string) {
		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await scheduleCurrentHubBroadcast({
				broadcastId,
				publishAt,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async publishBroadcastNow(broadcastId: string) {
		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await publishCurrentHubBroadcastNow({
				broadcastId,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();

			const published = this.broadcasts.find((b) => b.id === broadcastId);
			if (published && this.orgId) {
				void triggerPushNotification({
					kind: 'broadcast',
					organization_id: this.orgId,
					source_id: broadcastId,
					title: published.title || 'New broadcast',
					body: (published.body || '').slice(0, 200),
					url: `/hub`
				});
			}
		});
	}

	async setBroadcastPinned(broadcastId: string, isPinned: boolean) {
		if (!this.orgId) return;

		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await setCurrentHubBroadcastPinned({
				orgId: this.orgId as string,
				broadcastId,
				isPinned,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async archiveBroadcast(broadcastId: string) {
		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await archiveCurrentHubBroadcast({
				broadcastId,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async restoreBroadcast(broadcastId: string) {
		await this.withBroadcastTarget(broadcastId, async () => {
			this.broadcasts = await restoreCurrentHubBroadcast({
				broadcastId,
				currentRows: this.broadcasts,
				syncBroadcastDeliveryRow: (row) => this.syncBroadcastDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
		});
	}

	async removeBroadcast(id: string) {
		await this.withBroadcastTarget(id, async () => {
			this.broadcasts = await removeCurrentHubBroadcast({
				broadcastId: id,
				currentRows: this.broadcasts
			});
			await this.reconcileExecutionLedger();
		});
	}

	// ── Event actions ──

	async addEvent(payload: EventMutationPayload, reminderOffsets?: number[]) {
		if (!this.orgId) return;

		await this.withEventTarget('draft', async () => {
			const nextEventState = await addCurrentHubEvent({
				orgId: this.orgId as string,
				payload,
				currentRows: this.events,
				syncEventDeliveryRow: (row) => this.syncEventDeliveryRow(row)
			});

			this.events = nextEventState.events;

			if (reminderOffsets) {
				await this.persistEventReminderSettings(nextEventState.createdEventId, reminderOffsets);
			}

			await this.reconcileExecutionLedger();
			await this.cleanupOrphanedFollowUpWorkflowStateRows();

			const created = this.events.find((e) => e.id === nextEventState.createdEventId);
			if (created && created.delivery_state === 'published' && this.orgId) {
				void triggerPushNotification({
					kind: 'event',
					organization_id: this.orgId,
					source_id: created.id,
					title: created.title || 'New event',
					body: created.location ? `Location: ${created.location}` : '',
					url: `/hub/event/${created.id}`
				});
			}
		});
	}

	async updateEvent(eventId: string, payload: EventMutationPayload, reminderOffsets?: number[]) {
		await this.withEventTarget(eventId, async () => {
			this.events = await updateCurrentHubEvent({
				eventId,
				payload,
				currentRows: this.events,
				syncEventDeliveryRow: (row) => this.syncEventDeliveryRow(row)
			});

			if (reminderOffsets !== undefined) {
				await this.persistEventReminderSettings(eventId, reminderOffsets);
			}

			await this.reconcileExecutionLedger();
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	async cancelEvent(eventId: string) {
		await this.withEventTarget(eventId, async () => {
			this.events = await cancelCurrentHubEvent({
				eventId,
				currentRows: this.events,
				syncEventDeliveryRow: (row) => this.syncEventDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	async archiveEvent(eventId: string) {
		await this.withEventTarget(eventId, async () => {
			this.events = await archiveCurrentHubEvent({
				eventId,
				currentRows: this.events,
				syncEventDeliveryRow: (row) => this.syncEventDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	async restoreEvent(eventId: string) {
		await this.withEventTarget(eventId, async () => {
			this.events = await restoreCurrentHubEvent({
				eventId,
				currentRows: this.events,
				syncEventDeliveryRow: (row) => this.syncEventDeliveryRow(row)
			});
			await this.reconcileExecutionLedger();
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	async removeEvent(id: string) {
		await this.withEventTarget(id, async () => {
			const nextEventState = await removeCurrentHubEvent({
				eventId: id,
				currentRows: this.events,
				eventResponseMap: this.eventResponseMap,
				eventAttendanceMap: this.eventAttendanceMap,
				eventReminderSettingsMap: this.eventReminderSettingsMap
			});
			this.events = nextEventState.events;
			this.eventResponseMap = nextEventState.eventResponseMap;
			this.eventAttendanceMap = nextEventState.eventAttendanceMap;
			this.eventReminderSettingsMap = nextEventState.eventReminderSettingsMap;
			await this.reconcileExecutionLedger();
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	getEventReminderSettings(eventId: string): EventReminderSettingsRow | null {
		return getCurrentHubEventReminderSettings(this.eventReminderSettingsMap, eventId);
	}

	getEventReminderOffsets(eventId: string) {
		return getCurrentHubEventReminderOffsets(this.eventReminderSettingsMap, eventId);
	}

	getEventReminderSummary(eventId: string): EventReminderSummary | null {
		return getCurrentHubEventReminderSummary({
			events: this.events,
			eventReminderSettingsMap: this.eventReminderSettingsMap,
			eventId
		});
	}

	async retryExecutionEntry(entryId: string) {
		const row = this.executionLedger.find((entry) => entry.id === entryId);
		if (!row) return;

		await this.withExecutionTarget(entryId, async () => {
			if (row.job_kind === 'broadcast_publish') {
				const broadcast = this.broadcasts.find((entry) => entry.id === row.source_id);
				if (broadcast) {
					const syncedRow = await this.syncBroadcastDeliveryRow(broadcast);
					this.broadcasts = replaceBroadcastRow(this.broadcasts, syncedRow);
				}
			} else if (row.job_kind === 'event_publish') {
				const event = this.events.find((entry) => entry.id === row.source_id);
				if (event) {
					const syncedRow = await this.syncEventDeliveryRow(event);
					this.events = replaceEventRow(this.events, syncedRow);
				}
			}

			const expectedRow = this.getExpectedExecutionLedgerRow(row);
			if (!expectedRow) {
				await this.deleteExecutionLedgerEntry(row.id);
				return;
			}

			const attemptedAt = new Date().toISOString();
			await this.upsertExecutionLedgerEntry({
				organization_id: expectedRow.organization_id,
				job_kind: expectedRow.job_kind,
				source_id: expectedRow.source_id,
				execution_key: expectedRow.execution_key,
				due_at: expectedRow.due_at,
				execution_state: expectedRow.execution_state,
				processed_at:
					expectedRow.execution_state === 'processed'
						? expectedRow.processed_at ?? attemptedAt
						: null,
				last_attempted_at: attemptedAt,
				attempt_count: Math.max(row.attempt_count + 1, expectedRow.execution_state === 'processed' ? 1 : 0),
				last_failure_reason: expectedRow.last_failure_reason
			});
		});
	}

	async runExecutionEntryNow(entryId: string) {
		const row = this.executionLedger.find((entry) => entry.id === entryId);
		if (!row || row.job_kind === 'event_reminder') return;

		await this.withExecutionTarget(entryId, async () => {
			if (row.job_kind === 'broadcast_publish') {
				await this.publishBroadcastNow(row.source_id);
			} else {
				const event = this.events.find((entry) => entry.id === row.source_id);
				if (!event) {
					await this.deleteExecutionLedgerEntry(row.id);
					return;
				}

				if (event.archived_at || event.canceled_at) {
					await this.restoreEvent(event.id);
				}

				const nextEvent = this.events.find((entry) => entry.id === event.id) ?? event;
				const reminderOffsets = this.getEventReminderSettings(nextEvent.id)?.reminder_offsets;

				await this.updateEvent(
					nextEvent.id,
					{
						title: nextEvent.title,
						description: nextEvent.description,
						starts_at: nextEvent.starts_at,
						ends_at: nextEvent.ends_at,
						location: nextEvent.location,
						publish_at: null
					},
					reminderOffsets
				);
			}

			const processedAt = new Date().toISOString();
			await this.upsertExecutionLedgerEntry({
				organization_id: row.organization_id,
				job_kind: row.job_kind,
				source_id: row.source_id,
				execution_key: row.execution_key,
				due_at: row.due_at,
				execution_state: 'processed',
				processed_at: processedAt,
				last_attempted_at: processedAt,
				attempt_count: Math.max(row.attempt_count + 1, 1),
				last_failure_reason: null
			});
		});
	}

	async markExecutionQueueItemReviewed(entryId: string, options?: { note?: string | null }) {
		await this.setQueueTriageStatus(
			buildHubExecutionQueueItemTriageKey(entryId),
			'reviewed',
			options
		);
	}

	async deferExecutionQueueItem(entryId: string, options?: { note?: string | null }) {
		await this.setQueueTriageStatus(
			buildHubExecutionQueueItemTriageKey(entryId),
			'deferred',
			options
		);
	}

	async surfaceExecutionQueueItem(entryId: string) {
		await this.clearQueueTriageStatus(buildHubExecutionQueueItemTriageKey(entryId));
	}

	async markFollowUpSignalReviewed(
		eventId: string,
		kind: HubEventFollowUpSignal['kind'],
		options?: { note?: string | null }
	) {
		await this.setQueueTriageStatus(
			buildHubExecutionFollowUpTriageKey({ eventId, kind }),
			'reviewed',
			options
		);
	}

	async deferFollowUpSignal(
		eventId: string,
		kind: HubEventFollowUpSignal['kind'],
		options?: { note?: string | null }
	) {
		await this.setQueueTriageStatus(
			buildHubExecutionFollowUpTriageKey({ eventId, kind }),
			'deferred',
			options
		);
	}

	async surfaceFollowUpSignal(eventId: string, kind: HubEventFollowUpSignal['kind']) {
		await this.clearQueueTriageStatus(buildHubExecutionFollowUpTriageKey({ eventId, kind }));
	}

	getBroadcastDeliveryStatus(broadcastId: string): ScheduledDeliveryStatus | null {
		return getCurrentHubBroadcastDeliveryStatus(this.broadcasts, broadcastId);
	}

	getBroadcastExecutionDiagnostics(broadcastId: string): HubExecutionDiagnosticEntry[] {
		return getCurrentHubBroadcastExecutionDiagnostics({
			broadcasts: this.broadcasts,
			executionLedger: this.executionLedger,
			broadcastId
		});
	}

	getEventDeliveryStatus(eventId: string): ScheduledDeliveryStatus | null {
		return getCurrentHubEventDeliveryStatus(this.events, eventId);
	}

	getEventExecutionDiagnostics(eventId: string): HubExecutionDiagnosticEntry[] {
		return getCurrentHubEventExecutionDiagnostics({
			events: this.events,
			executionLedger: this.executionLedger,
			eventId
		});
	}

	getEventAttendanceSummary(eventId: string): EventAttendanceSummary {
		return getCurrentHubEventAttendanceSummary(this.eventResponseMap, eventId);
	}

	getEventAttendanceOutcomeSummary(eventId: string): EventAttendanceOutcomeSummary {
		return getCurrentHubEventAttendanceOutcomeSummary(this.eventAttendanceMap, eventId);
	}

	getEventAttendanceRoster(eventId: string): EventAttendanceRoster | null {
		return getCurrentHubEventAttendanceRoster({
			events: this.events,
			members: currentOrganization.members,
			eventResponseMap: this.eventResponseMap,
			eventAttendanceMap: this.eventAttendanceMap,
			eventId,
			ownProfileId: this.ownProfileId
		});
	}

	getEventResponseRoster(eventId: string): EventResponseRoster | null {
		return getCurrentHubEventResponseRoster({
			events: this.events,
			members: currentOrganization.members,
			eventResponseMap: this.eventResponseMap,
			eventId,
			ownProfileId: this.ownProfileId
		});
	}

	getEventEngagementSignal(eventId: string): HubEngagementSignal | null {
		return getCurrentHubEventEngagementSignal({
			events: this.events,
			eventResponseMap: this.eventResponseMap,
			eventReminderSettingsMap: this.eventReminderSettingsMap,
			eventId
		});
	}

	getBroadcastEngagementSignal(broadcastId: string): HubEngagementSignal | null {
		return getCurrentHubBroadcastEngagementSignal(this.broadcasts, broadcastId);
	}

	getEventAttendanceStatus(eventId: string, profileId: string): EventAttendanceStatus | null {
		return getCurrentHubEventAttendanceStatus(this.eventAttendanceMap, eventId, profileId);
	}

	getOwnEventAttendance(eventId: string): EventAttendanceStatus | null {
		return getCurrentHubOwnEventAttendance({
			eventAttendanceMap: this.eventAttendanceMap,
			eventId,
			ownProfileId: this.ownProfileId
		});
	}

	getOwnEventResponse(eventId: string): EventResponseStatus | null {
		return getCurrentHubOwnEventResponse({
			eventResponseMap: this.eventResponseMap,
			eventId,
			ownProfileId: this.ownProfileId
		});
	}

	async setEventResponse(eventId: string, response: EventResponseStatus) {
		if (!this.orgId || !this.ownProfileId) return;
		if (this.getOwnEventResponse(eventId) === response) return;

		await this.withEventResponseTarget(eventId, async () => {
			this.eventResponseMap = await this.withCapturedError(() =>
				setCurrentHubEventResponse({
					orgId: this.orgId as string,
					ownProfileId: this.ownProfileId as string,
					eventId,
					response,
					currentMap: this.eventResponseMap
				})
			);
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	async setEventAttendance(eventId: string, profileId: string, status: EventAttendanceStatus) {
		if (!this.orgId || !this.ownProfileId || !currentOrganization.isAdmin) return;
		if (this.getEventAttendanceStatus(eventId, profileId) === status) return;

		const targetId = `${eventId}:${profileId}`;

		if (isSmokeModeEnabled()) {
			await this.withEventAttendanceTarget(targetId, async () => {
				this.eventAttendanceMap = upsertEventAttendanceMap(
					this.eventAttendanceMap,
					buildSmokeEventAttendanceRow({
						currentMap: this.eventAttendanceMap,
						orgId: this.orgId as string,
						ownProfileId: this.ownProfileId as string,
						eventId,
						profileId,
						status
					})
				);
				await this.cleanupOrphanedFollowUpWorkflowStateRows({ persist: false });
			});
			return;
		}

		await this.withEventAttendanceTarget(targetId, async () => {
			this.eventAttendanceMap = await this.withCapturedError(() =>
				setCurrentHubEventAttendance({
					orgId: this.orgId as string,
					ownProfileId: this.ownProfileId as string,
					eventId,
					profileId,
					status,
					currentMap: this.eventAttendanceMap
				})
			);
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}


	async setEventAttendanceForProfiles(
		eventId: string,
		profileIds: string[],
		status: EventAttendanceStatus
	) {
		if (!this.orgId || !this.ownProfileId || !currentOrganization.isAdmin) return;

		const nextProfileIds = [...new Set(profileIds)].filter(
			(profileId) => this.getEventAttendanceStatus(eventId, profileId) !== status
		);

		if (nextProfileIds.length === 0) return;

		const targetId = `${eventId}:bulk:${status}`;

		if (isSmokeModeEnabled()) {
			await this.withEventAttendanceTarget(targetId, async () => {
				for (const profileId of nextProfileIds) {
					this.eventAttendanceMap = upsertEventAttendanceMap(
						this.eventAttendanceMap,
						buildSmokeEventAttendanceRow({
							currentMap: this.eventAttendanceMap,
							orgId: this.orgId as string,
							ownProfileId: this.ownProfileId as string,
							eventId,
							profileId,
							status
						})
					);
				}
				await this.cleanupOrphanedFollowUpWorkflowStateRows({ persist: false });
			});
			return;
		}

		await this.withEventAttendanceTarget(targetId, async () => {
			this.lastError = null;
			let completedCount = 0;

			for (const profileId of nextProfileIds) {
				try {
					this.eventAttendanceMap = await setCurrentHubEventAttendance({
						orgId: this.orgId as string,
						ownProfileId: this.ownProfileId as string,
						eventId,
						profileId,
						status,
						currentMap: this.eventAttendanceMap
					});
					completedCount += 1;
				} catch (error) {
					const bulkError = buildBulkAttendanceMutationError(
						error,
						completedCount,
						nextProfileIds.length
					);
					this.captureError(bulkError);
					throw bulkError;
				}
			}
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	async clearEventAttendance(eventId: string, profileId: string) {
		if (!currentOrganization.isAdmin) return;
		if (this.getEventAttendanceStatus(eventId, profileId) === null) return;

		const targetId = `${eventId}:${profileId}`;

		if (isSmokeModeEnabled()) {
			await this.withEventAttendanceTarget(targetId, async () => {
				this.eventAttendanceMap = removeEventAttendanceFromMap(
					this.eventAttendanceMap,
					eventId,
					profileId
				);
				await this.cleanupOrphanedFollowUpWorkflowStateRows({ persist: false });
			});
			return;
		}

		await this.withEventAttendanceTarget(targetId, async () => {
			this.eventAttendanceMap = await this.withCapturedError(() =>
				clearCurrentHubEventAttendance({
					eventId,
					profileId,
					currentMap: this.eventAttendanceMap
				})
			);
			await this.cleanupOrphanedFollowUpWorkflowStateRows();
		});
	}

	private async persistEventReminderSettings(eventId: string, reminderOffsets: number[]) {
		if (!this.orgId || !currentOrganization.isAdmin) {
			return;
		}

		this.eventReminderSettingsMap = await persistCurrentHubEventReminderSettings({
			orgId: this.orgId,
			eventId,
			reminderOffsets,
			currentMap: this.eventReminderSettingsMap
		});
	}

	private async reconcileExecutionLedger() {
		this.executionLedger = await syncCurrentHubExecutionLedgerRows({
			orgId: this.orgId,
			isAdmin: currentOrganization.isAdmin,
			broadcasts: this.broadcasts,
			events: this.events,
			eventReminderSettingsMap: this.eventReminderSettingsMap,
			currentRows: this.executionLedger
		});
	}

	private getExpectedExecutionLedgerRow(
		row: Pick<HubExecutionLedgerRow, 'job_kind' | 'source_id' | 'execution_key'>
	) {
		return getCurrentHubExpectedExecutionLedgerRow({
			broadcasts: this.broadcasts,
			events: this.events,
			eventReminderSettingsMap: this.eventReminderSettingsMap,
			row
		});
	}

	private async upsertExecutionLedgerEntry(entry: HubExecutionLedgerMutationPayload) {
		this.executionLedger = await upsertCurrentHubExecutionLedgerEntry(this.executionLedger, entry);
	}

	private async deleteExecutionLedgerEntry(entryId: string) {
		this.executionLedger = await deleteCurrentHubExecutionLedgerEntry(this.executionLedger, entryId);
	}

	private async syncBroadcastDeliveryRow(row: BroadcastRow) {
		const previousState = row.delivery_state;
		const synced = await syncCurrentHubBroadcastDeliveryRow(row);

		if (previousState !== 'published' && synced.delivery_state === 'published' && this.orgId) {
			void triggerPushNotification({
				kind: 'broadcast',
				organization_id: this.orgId,
				source_id: synced.id,
				title: synced.title || 'New broadcast',
				body: (synced.body || '').slice(0, 200),
				url: `/hub`
			});
		}

		return synced;
	}

	private async syncEventDeliveryRow(row: EventRow) {
		const previousState = row.delivery_state;
		const synced = await syncCurrentHubEventDeliveryRow(row);

		if (previousState !== 'published' && synced.delivery_state === 'published' && this.orgId) {
			void triggerPushNotification({
				kind: 'event',
				organization_id: this.orgId,
				source_id: synced.id,
				title: synced.title || 'New event',
				body: synced.location ? `Location: ${synced.location}` : '',
				url: `/hub/event/${synced.id}`
			});
		}

		return synced;
	}

	// ── Resource actions ──

	async addResource(payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
	}) {
		if (!this.orgId) return;

		await this.withResourceTarget('draft', async () => {
			this.resources = await addCurrentHubResource({
				orgId: this.orgId as string,
				currentRows: this.resources,
				payload
			});
		});
	}

	async updateResource(
		resourceId: string,
		payload: {
			title: string;
			description: string;
			href: string;
			resource_type: ResourceType;
		}
	) {
		await this.withResourceTarget(resourceId, async () => {
			this.resources = await updateCurrentHubResource({
				resourceId,
				currentRows: this.resources,
				payload
			});
		});
	}

	async moveResource(resourceId: string, direction: ResourceMoveDirection) {
		await this.withResourceTarget(resourceId, async () => {
			this.resources = await moveCurrentHubResource({
				resourceId,
				direction,
				currentRows: this.resources
			});
		});
	}

	async removeResource(resourceId: string) {
		await this.withResourceTarget(resourceId, async () => {
			this.resources = await removeCurrentHubResource({
				resourceId,
				currentRows: this.resources
			});
		});
	}

	// --- Broadcast acknowledgments ---

	getAcknowledgmentCount(broadcastId: string): number {
		return getBroadcastAcknowledgmentCount(this.broadcastAcknowledgmentMap, broadcastId);
	}

	hasAcknowledged(broadcastId: string): boolean {
		if (!this.ownProfileId) {
			return false;
		}

		return hasMemberAcknowledgedBroadcast(
			this.broadcastAcknowledgmentMap,
			broadcastId,
			this.ownProfileId
		);
	}

	get isBroadcastAcknowledgmentBusy(): boolean {
		return this.broadcastAcknowledgmentTargetId !== '';
	}

	async acknowledgeBroadcast(broadcastId: string) {
		if (!this.orgId || !this.ownProfileId) return;
		if (this.hasAcknowledged(broadcastId)) return;

		if (isSmokeModeEnabled()) {
			await this.withBroadcastAcknowledgmentTarget(broadcastId, async () => {
				this.broadcastAcknowledgmentMap = addAcknowledgmentToMap(
					this.broadcastAcknowledgmentMap,
					{
						id: `smoke-ack-${broadcastId}-${this.ownProfileId}`,
						organization_id: this.orgId as string,
						broadcast_id: broadcastId,
						profile_id: this.ownProfileId as string,
						acknowledged_at: new Date().toISOString()
					}
				);
			});
			return;
		}

		await this.withBroadcastAcknowledgmentTarget(broadcastId, async () => {
			const row = await this.withCapturedError(() =>
				acknowledgeBroadcastRepo({
					organizationId: this.orgId as string,
					broadcastId,
					profileId: this.ownProfileId as string
				})
			);
			this.broadcastAcknowledgmentMap = addAcknowledgmentToMap(
				this.broadcastAcknowledgmentMap,
				row
			);
		});
	}

	async unacknowledgeBroadcast(broadcastId: string) {
		if (!this.orgId || !this.ownProfileId) return;
		if (!this.hasAcknowledged(broadcastId)) return;

		if (isSmokeModeEnabled()) {
			await this.withBroadcastAcknowledgmentTarget(broadcastId, async () => {
				this.broadcastAcknowledgmentMap = removeAcknowledgmentFromMapModel(
					this.broadcastAcknowledgmentMap,
					broadcastId,
					this.ownProfileId as string
				);
			});
			return;
		}

		await this.withBroadcastAcknowledgmentTarget(broadcastId, async () => {
			await this.withCapturedError(() =>
				unacknowledgeBroadcastRepo({
					organizationId: this.orgId as string,
					broadcastId,
					profileId: this.ownProfileId as string
				})
			);
			this.broadcastAcknowledgmentMap = removeAcknowledgmentFromMapModel(
				this.broadcastAcknowledgmentMap,
				broadcastId,
				this.ownProfileId as string
			);
		});
	}
}

export const currentHub = new CurrentHub();
