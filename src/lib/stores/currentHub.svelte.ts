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
	removeBroadcastRow,
	sortActiveBroadcasts,
	sortInactiveBroadcasts
} from '$lib/models/broadcastLifecycleModel';
import {
	removeEventRow,
	replaceEventRow,
	sortEventRows,
	sortInactiveEvents,
	sortLiveEvents,
	sortScheduledEvents
	} from '$lib/models/eventLifecycleModel';
import {
	normalizeEventReminderOffsets,
	summarizeEventReminderSchedule,
	type EventReminderSummary
} from '$lib/models/eventReminderModel';
import {
	getBroadcastDeliveryPatch,
	getBroadcastDeliveryStatus,
	getEventDeliveryPatch,
	getEventDeliveryStatus,
	type ScheduledDeliveryStatus
} from '$lib/models/scheduledDeliveryModel';
import {
	buildEventResponseRoster,
	buildEventResponseMap,
	type EventResponseRoster,
	getOwnEventResponseForProfile,
	summarizeEventResponses,
	upsertEventResponseMap,
	type EventAttendanceSummary
} from '$lib/models/eventResponseModel';
import {
	buildHubAdminEngagementSummary,
	getBroadcastEngagementSignal as buildBroadcastEngagementSignal,
	getEventEngagementSignal as buildEventEngagementSignal,
	type HubAdminEngagementSummary,
	type HubEngagementSignal
} from '$lib/models/hubEngagementModel';
import {
	moveResourceRows,
	removeResourceRow,
	replaceResourceRow,
	sortResourceRows,
	type ResourceMoveDirection
} from '$lib/models/resourcesModel';
import {
	type PluginKey,
	type PluginStateMap,
	buildPluginStateMap
} from './pluginRegistry';
import {
	buildHubNotificationReadMap,
	buildHubNotifications,
	countUnreadHubNotifications,
	createDefaultHubNotificationPreferences,
	upsertHubNotificationReadMap,
	type HubNotificationItem,
	type HubNotificationPreferences
} from '$lib/models/hubNotifications';
import type {
	BroadcastMutationPayload,
	BroadcastRow,
	EventMutationPayload,
	EventReminderSettingsRow,
	EventResponseRow,
	EventResponseStatus,
	EventRow,
	HubNotificationReadRow,
	ResourceRow,
	ResourceType
} from '$lib/repositories/hubRepository';
import {
	fetchBroadcasts,
	fetchEvents,
	fetchEventReminderSettings,
	fetchEventResponses,
	fetchHubNotificationPreferences,
	fetchHubNotificationReads,
	fetchResources,
	fetchActivePlugins,
	togglePlugin,
	createBroadcast,
	saveBroadcastDraft,
	scheduleBroadcast,
	publishBroadcastNow,
	updateBroadcastDeliveryState,
	updateBroadcast,
	setBroadcastPinned,
	archiveBroadcast,
	restoreBroadcast,
	deleteBroadcast,
	createEvent,
	saveEventReminderSettings,
	updateEventDeliveryState,
	updateEvent,
	cancelEvent,
	archiveEvent,
	restoreEvent,
	deleteEvent,
	upsertOwnEventResponse,
	markHubNotificationRead,
	saveHubNotificationPreferences,
	createResource,
	updateResource,
	saveResourceOrder,
	deleteResource
} from '$lib/repositories/hubRepository';
import { currentOrganization } from './currentOrganization.svelte';

class CurrentHub {
	isLoading = $state(false);
	loadedOrgId = $state('');
	plugins = $state<PluginStateMap>({ broadcasts: false, events: false, resources: false });
	broadcasts = $state<BroadcastRow[]>([]);
	events = $state<EventRow[]>([]);
	resources = $state<ResourceRow[]>([]);
	broadcastTargetId = $state('');
	eventTargetId = $state('');
	resourceTargetId = $state('');
	eventResponseMap = $state<Record<string, EventResponseRow[]>>({});
	eventReminderSettingsMap = $state<Record<string, EventReminderSettingsRow>>({});
	eventResponseTargetId = $state('');
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
		const eventAttendances = Object.fromEntries(
			this.events.map((event) => [event.id, this.getEventAttendanceSummary(event.id)])
		);

		return buildHubAdminEngagementSummary({
			events: this.events,
			broadcasts: this.broadcasts,
			eventAttendances
		});
	}

	get orderedResources() {
		return sortResourceRows(this.resources);
	}

	get allActivityFeed() {
		return buildHubNotifications({
			broadcasts: this.activeBroadcasts,
			events: this.liveEvents,
			readMap: this.notificationReadMap
		});
	}

	get activityFeed() {
		return this.allActivityFeed.filter((item) => this.notificationPreferences[item.kind]);
	}

	get unreadActivityCount() {
		return countUnreadHubNotifications(this.activityFeed);
	}

	/** Clear all state. Called on logout. */
	reset() {
		this.lastError = null;
		this.isLoading = false;
		this.loadedOrgId = '';
		this.plugins = { broadcasts: false, events: false, resources: false };
		this.broadcasts = [];
		this.events = [];
		this.resources = [];
		this.broadcastTargetId = '';
		this.eventTargetId = '';
		this.resourceTargetId = '';
		this.eventResponseMap = {};
		this.eventReminderSettingsMap = {};
		this.eventResponseTargetId = '';
		this.notificationPreferences = createDefaultHubNotificationPreferences();
		this.notificationReadMap = {};
		this.isSavingNotificationPreferences = false;
		this.notificationReadTargetId = '';
		this.isMarkingAllActivityRead = false;
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
			const profileId = this.ownProfileId;
			const rows = await fetchActivePlugins(orgId);
			const plugins = buildPluginStateMap(rows);

			// Only fetch data for active plugins.
			const [
				broadcasts,
				events,
				eventResponses,
				eventReminderSettings,
				resources,
				notificationPreferenceRow,
				notificationReadRows
			] = await Promise.all([
				plugins.broadcasts ? fetchBroadcasts(orgId) : Promise.resolve([]),
				plugins.events ? fetchEvents(orgId) : Promise.resolve([]),
				plugins.events ? fetchEventResponses(orgId) : Promise.resolve([]),
				plugins.events && currentOrganization.isAdmin
					? fetchEventReminderSettings(orgId)
					: Promise.resolve([]),
				plugins.resources ? fetchResources(orgId) : Promise.resolve([]),
				profileId ? fetchHubNotificationPreferences(orgId, profileId) : Promise.resolve(null),
				profileId
					? fetchHubNotificationReads(orgId, profileId)
					: Promise.resolve([] as HubNotificationReadRow[])
			]);

			const [syncedBroadcasts, syncedEvents] =
				plugins.broadcasts || plugins.events
					? await Promise.all([
						plugins.broadcasts && currentOrganization.isAdmin
							? Promise.all(broadcasts.map((broadcast) => this.syncBroadcastDeliveryRow(broadcast)))
							: Promise.resolve(broadcasts),
						plugins.events && currentOrganization.isAdmin
							? Promise.all(events.map((event) => this.syncEventDeliveryRow(event)))
							: Promise.resolve(events)
					])
					: [broadcasts, events];

			if (this.orgId !== orgId) {
				return;
			}

			this.plugins = plugins;
			this.broadcasts = syncedBroadcasts;
			this.events = sortEventRows(syncedEvents);
			this.eventResponseMap = buildEventResponseMap(eventResponses);
			this.eventReminderSettingsMap = Object.fromEntries(
				eventReminderSettings.map((settings) => [settings.event_id, settings])
			);
			this.resources = resources;
			this.notificationPreferences = notificationPreferenceRow
				? {
					broadcast: notificationPreferenceRow.broadcast_enabled,
					event: notificationPreferenceRow.event_enabled
				}
				: createDefaultHubNotificationPreferences();
			this.notificationReadMap = buildHubNotificationReadMap(notificationReadRows);
			this.loadedOrgId = orgId;
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

		this.lastError = null;
		this.isSavingNotificationPreferences = true;

		try {
			const row = await saveHubNotificationPreferences(this.orgId, this.ownProfileId, {
				broadcast_enabled: nextPreferences.broadcast,
				event_enabled: nextPreferences.event
			});

			this.notificationPreferences = {
				broadcast: row.broadcast_enabled,
				event: row.event_enabled
			};
		} catch (error) {
			this.captureError(error);
			throw error;
		} finally {
			this.isSavingNotificationPreferences = false;
		}
	}

	async markActivityRead(notification: Pick<HubNotificationItem, 'id' | 'kind' | 'sourceId' | 'isRead'>) {
		if (!this.orgId || !this.ownProfileId || notification.isRead) {
			return;
		}

		this.lastError = null;
		this.notificationReadTargetId = notification.id;

		try {
			const row = await markHubNotificationRead({
				organizationId: this.orgId,
				profileId: this.ownProfileId,
				notificationKind: notification.kind,
				sourceId: notification.sourceId
			});

			this.notificationReadMap = upsertHubNotificationReadMap(this.notificationReadMap, row);
		} catch (error) {
			this.captureError(error);
			throw error;
		} finally {
			if (this.notificationReadTargetId === notification.id) {
				this.notificationReadTargetId = '';
			}
		}
	}

	async markAllActivityRead(items: HubNotificationItem[] = this.activityFeed) {
		if (!this.orgId || !this.ownProfileId) {
			return;
		}

		const unreadItems = items.filter((item) => !item.isRead);
		if (unreadItems.length === 0) {
			return;
		}

		this.lastError = null;
		this.isMarkingAllActivityRead = true;

		try {
			const readAt = new Date().toISOString();
			const rows = await Promise.all(
				unreadItems.map((item) =>
					markHubNotificationRead({
						organizationId: this.orgId as string,
						profileId: this.ownProfileId as string,
						notificationKind: item.kind,
						sourceId: item.sourceId,
						readAt
					})
				)
			);

			let nextReadMap = this.notificationReadMap;
			for (const row of rows) {
				nextReadMap = upsertHubNotificationReadMap(nextReadMap, row);
			}

			this.notificationReadMap = nextReadMap;
		} catch (error) {
			this.captureError(error);
			throw error;
		} finally {
			this.isMarkingAllActivityRead = false;
		}
	}

	// ── Broadcast actions ──

	async addBroadcast(payload: BroadcastMutationPayload) {
		if (!this.orgId) return;
		this.broadcastTargetId = 'draft';

		try {
			const row = await createBroadcast(this.orgId, payload);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async updateBroadcast(broadcastId: string, payload: BroadcastMutationPayload) {
		this.broadcastTargetId = broadcastId;

		try {
			const row = await updateBroadcast(broadcastId, payload);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async saveBroadcastDraft(broadcastId: string) {
		this.broadcastTargetId = broadcastId;

		try {
			const row = await saveBroadcastDraft(broadcastId);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async scheduleBroadcast(broadcastId: string, publishAt: string) {
		this.broadcastTargetId = broadcastId;

		try {
			const row = await scheduleBroadcast(broadcastId, publishAt);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async publishBroadcastNow(broadcastId: string) {
		this.broadcastTargetId = broadcastId;

		try {
			const row = await publishBroadcastNow(broadcastId);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async setBroadcastPinned(broadcastId: string, isPinned: boolean) {
		if (!this.orgId) return;
		this.broadcastTargetId = broadcastId;

		try {
			const row = await setBroadcastPinned(this.orgId, broadcastId, isPinned);
			const nextRows = this.broadcasts.map((broadcast) =>
				broadcast.organization_id === this.orgId ? { ...broadcast, is_pinned: false } : broadcast
			);
			this.broadcasts = replaceBroadcastRow(nextRows, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async archiveBroadcast(broadcastId: string) {
		this.broadcastTargetId = broadcastId;

		try {
			const row = await archiveBroadcast(broadcastId);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async restoreBroadcast(broadcastId: string) {
		this.broadcastTargetId = broadcastId;

		try {
			const row = await restoreBroadcast(broadcastId);
			this.broadcasts = replaceBroadcastRow(this.broadcasts, row);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	async removeBroadcast(id: string) {
		this.broadcastTargetId = id;

		try {
			await deleteBroadcast(id);
			this.broadcasts = removeBroadcastRow(this.broadcasts, id);
		} finally {
			this.broadcastTargetId = '';
		}
	}

	// ── Event actions ──

	async addEvent(payload: EventMutationPayload, reminderOffsets?: number[]) {
		if (!this.orgId) return;
		this.eventTargetId = 'draft';

		try {
			const row = await createEvent(this.orgId, payload);
			this.events = replaceEventRow(this.events, row);

			if (reminderOffsets) {
				await this.persistEventReminderSettings(row.id, reminderOffsets);
			}
		} finally {
			if (this.eventTargetId === 'draft') {
				this.eventTargetId = '';
			}
		}
	}

	async updateEvent(eventId: string, payload: EventMutationPayload, reminderOffsets?: number[]) {
		this.eventTargetId = eventId;

		try {
			const row = await updateEvent(eventId, payload);
			this.events = replaceEventRow(this.events, row);

			if (reminderOffsets !== undefined) {
				await this.persistEventReminderSettings(eventId, reminderOffsets);
			}
		} finally {
			this.eventTargetId = '';
		}
	}

	async cancelEvent(eventId: string) {
		this.eventTargetId = eventId;

		try {
			const row = await cancelEvent(eventId);
			this.events = replaceEventRow(this.events, row);
		} finally {
			this.eventTargetId = '';
		}
	}

	async archiveEvent(eventId: string) {
		this.eventTargetId = eventId;

		try {
			const row = await archiveEvent(eventId);
			this.events = replaceEventRow(this.events, row);
		} finally {
			this.eventTargetId = '';
		}
	}

	async restoreEvent(eventId: string) {
		this.eventTargetId = eventId;

		try {
			const row = await restoreEvent(eventId);
			this.events = replaceEventRow(this.events, row);
		} finally {
			this.eventTargetId = '';
		}
	}

	async removeEvent(id: string) {
		this.eventTargetId = id;

		try {
			await deleteEvent(id);
			this.events = removeEventRow(this.events, id);
			const nextEventResponseMap = { ...this.eventResponseMap };
			const nextEventReminderSettingsMap = { ...this.eventReminderSettingsMap };
			delete nextEventResponseMap[id];
			delete nextEventReminderSettingsMap[id];
			this.eventResponseMap = nextEventResponseMap;
			this.eventReminderSettingsMap = nextEventReminderSettingsMap;
		} finally {
			this.eventTargetId = '';
		}
	}

	getEventReminderSettings(eventId: string): EventReminderSettingsRow | null {
		return this.eventReminderSettingsMap[eventId] ?? null;
	}

	getEventReminderOffsets(eventId: string) {
		return this.getEventReminderSettings(eventId)?.reminder_offsets ?? [];
	}

	getEventReminderSummary(eventId: string): EventReminderSummary | null {
		const event = this.events.find((entry) => entry.id === eventId);
		if (!event) {
			return null;
		}

		return summarizeEventReminderSchedule(event, this.getEventReminderOffsets(eventId));
	}

	getBroadcastDeliveryStatus(broadcastId: string): ScheduledDeliveryStatus | null {
		const broadcast = this.broadcasts.find((entry) => entry.id === broadcastId);
		return broadcast ? getBroadcastDeliveryStatus(broadcast) : null;
	}

	getEventDeliveryStatus(eventId: string): ScheduledDeliveryStatus | null {
		const event = this.events.find((entry) => entry.id === eventId);
		return event ? getEventDeliveryStatus(event) : null;
	}

	getEventAttendanceSummary(eventId: string): EventAttendanceSummary {
		return summarizeEventResponses(this.eventResponseMap[eventId] ?? []);
	}

	getEventResponseRoster(eventId: string): EventResponseRoster | null {
		const event = this.events.find((entry) => entry.id === eventId);
		if (!event) {
			return null;
		}

		return buildEventResponseRoster(
			currentOrganization.members,
			this.eventResponseMap[eventId] ?? [],
			this.ownProfileId ?? ''
		);
	}

	getEventEngagementSignal(eventId: string): HubEngagementSignal | null {
		const event = this.events.find((entry) => entry.id === eventId);
		if (!event) {
			return null;
		}

		return buildEventEngagementSignal(
			event,
			this.getEventAttendanceSummary(eventId),
			this.getEventReminderSummary(eventId)
		);
	}

	getBroadcastEngagementSignal(broadcastId: string): HubEngagementSignal | null {
		const broadcast = this.broadcasts.find((entry) => entry.id === broadcastId);
		if (!broadcast) {
			return null;
		}

		return buildBroadcastEngagementSignal(broadcast);
	}

	getOwnEventResponse(eventId: string): EventResponseStatus | null {
		if (!this.ownProfileId) {
			return null;
		}

		return getOwnEventResponseForProfile(this.eventResponseMap[eventId] ?? [], this.ownProfileId);
	}

	async setEventResponse(eventId: string, response: EventResponseStatus) {
		if (!this.orgId || !this.ownProfileId) return;
		if (this.getOwnEventResponse(eventId) === response) return;

		this.lastError = null;
		this.eventResponseTargetId = eventId;

		try {
			const row = await upsertOwnEventResponse({
				eventId,
				organizationId: this.orgId,
				profileId: this.ownProfileId,
				response
			});

			this.eventResponseMap = upsertEventResponseMap(this.eventResponseMap, row);
		} catch (error) {
			this.captureError(error);
			throw error;
		} finally {
			if (this.eventResponseTargetId === eventId) {
				this.eventResponseTargetId = '';
			}
		}
	}

	private async persistEventReminderSettings(eventId: string, reminderOffsets: number[]) {
		if (!this.orgId || !currentOrganization.isAdmin) {
			return;
		}

		const row = await saveEventReminderSettings(eventId, this.orgId, {
			delivery_channel: 'in_app',
			reminder_offsets: normalizeEventReminderOffsets(reminderOffsets)
		});

		this.eventReminderSettingsMap = {
			...this.eventReminderSettingsMap,
			[eventId]: row
		};
	}

	private async syncBroadcastDeliveryRow(row: BroadcastRow) {
		const patch = getBroadcastDeliveryPatch(row);
		if (!patch) {
			return row;
		}

		return updateBroadcastDeliveryState(row.id, patch);
	}

	private async syncEventDeliveryRow(row: EventRow) {
		const patch = getEventDeliveryPatch(row);
		if (!patch) {
			return row;
		}

		return updateEventDeliveryState(row.id, patch);
	}

	// ── Resource actions ──

	async addResource(payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
	}) {
		if (!this.orgId) return;
		this.resourceTargetId = 'draft';

		try {
			const row = await createResource(this.orgId, {
				...payload,
				sort_order: this.orderedResources.length
			});
			this.resources = replaceResourceRow(this.resources, row);
		} finally {
			this.resourceTargetId = '';
		}
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
		this.resourceTargetId = resourceId;

		try {
			const sortOrder = this.resources.find((resource) => resource.id === resourceId)?.sort_order ?? 0;
			const row = await updateResource(resourceId, { ...payload, sort_order: sortOrder });
			this.resources = replaceResourceRow(this.resources, row);
		} finally {
			this.resourceTargetId = '';
		}
	}

	async moveResource(resourceId: string, direction: ResourceMoveDirection) {
		this.resourceTargetId = resourceId;

		try {
			const currentRows = this.orderedResources;
			const nextRows = moveResourceRows(currentRows, resourceId, direction);
			if (currentRows.map((row) => row.id).join('|') === nextRows.map((row) => row.id).join('|')) {
				return;
			}

			await saveResourceOrder(
				nextRows.map((row) => ({ id: row.id, sort_order: row.sort_order }))
			);
			this.resources = nextRows;
		} finally {
			this.resourceTargetId = '';
		}
	}

	async removeResource(resourceId: string) {
		this.resourceTargetId = resourceId;

		try {
			await deleteResource(resourceId);
			const nextRows = removeResourceRow(this.resources, resourceId).map((row, index) => ({
				...row,
				sort_order: index
			}));
			await saveResourceOrder(
				nextRows.map((row) => ({ id: row.id, sort_order: row.sort_order }))
			);
			this.resources = nextRows;
		} finally {
			this.resourceTargetId = '';
		}
	}
}

export const currentHub = new CurrentHub();
