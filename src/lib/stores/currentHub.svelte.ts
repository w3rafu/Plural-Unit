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
	type EventAttendanceOutcomeSummary
} from '$lib/models/eventAttendanceModel';
import type {
	HubAdminEngagementSummary,
	HubEventFollowUpSignal,
	HubEngagementSignal
} from '$lib/models/hubEngagementModel';
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
import { togglePlugin } from '$lib/repositories/hubRepository';
import {
	getCurrentHubActivityFeed,
	getCurrentHubAllActivityFeed,
	getCurrentHubBroadcastDeliveryStatus,
	getCurrentHubBroadcastEngagementSignal,
	getCurrentHubEngagementSummary,
	getCurrentHubEventAttendanceOutcomeSummary,
	getCurrentHubEventAttendanceRoster,
	getCurrentHubEventAttendanceStatus,
	getCurrentHubEventAttendanceSummary,
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
	eventReminderSettingsMap = $state<Record<string, EventReminderSettingsRow>>({});
	executionLedger = $state<HubExecutionLedgerRow[]>([]);
	executionTargetId = $state('');
	eventResponseTargetId = $state('');
	eventAttendanceTargetId = $state('');
	notificationPreferences = $state<HubNotificationPreferences>(
		createDefaultHubNotificationPreferences()
	);
	notificationReadMap = $state<Record<string, string>>({});
	isSavingNotificationPreferences = $state(false);
	notificationReadTargetId = $state('');
	isMarkingAllActivityRead = $state(false);
	lastError = $state<Error | null>(null);

	clearError() {
		this.lastError = null;
	}

	private loadPromise: Promise<void> | null = null;
	private loadingOrgId: string | null = null;

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
			eventAttendanceMap: this.eventAttendanceMap
		});
	}

	get hubEventFollowUpSignals(): HubEventFollowUpSignal[] {
		return getCurrentHubEventFollowUpSignals({
			events: this.events,
			eventResponseMap: this.eventResponseMap,
			eventAttendanceMap: this.eventAttendanceMap
		});
	}

	get orderedResources() {
		return sortResourceRows(this.resources);
	}

	get executionLedgerGroups() {
		return groupHubExecutionLedger(this.executionLedger);
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
	}

	async load() {
		const orgId = this.orgId;
		if (!orgId) return;

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

			applyCurrentHubLoadedState(this, nextState);
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
		if (!this.orgId) return;
		await togglePlugin(this.orgId, key, enabled);
		this.plugins = { ...this.plugins, [key]: enabled };
	}

	async updateNotificationPreferences(nextPreferences: HubNotificationPreferences) {
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

	getBroadcastDeliveryStatus(broadcastId: string): ScheduledDeliveryStatus | null {
		return getCurrentHubBroadcastDeliveryStatus(this.broadcasts, broadcastId);
	}

	getEventDeliveryStatus(eventId: string): ScheduledDeliveryStatus | null {
		return getCurrentHubEventDeliveryStatus(this.events, eventId);
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
		});
	}

	async setEventAttendance(eventId: string, profileId: string, status: EventAttendanceStatus) {
		if (!this.orgId || !this.ownProfileId || !currentOrganization.isAdmin) return;
		if (this.getEventAttendanceStatus(eventId, profileId) === status) return;

		const targetId = `${eventId}:${profileId}`;

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
		});
	}

	async clearEventAttendance(eventId: string, profileId: string) {
		if (!currentOrganization.isAdmin) return;
		if (this.getEventAttendanceStatus(eventId, profileId) === null) return;

		const targetId = `${eventId}:${profileId}`;

		await this.withEventAttendanceTarget(targetId, async () => {
			this.eventAttendanceMap = await this.withCapturedError(() =>
				clearCurrentHubEventAttendance({
					eventId,
					profileId,
					currentMap: this.eventAttendanceMap
				})
			);
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
		return syncCurrentHubBroadcastDeliveryRow(row);
	}

	private async syncEventDeliveryRow(row: EventRow) {
		return syncCurrentHubEventDeliveryRow(row);
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
}

export const currentHub = new CurrentHub();
