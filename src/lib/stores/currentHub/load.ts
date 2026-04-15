/**
 * currentHub/load — fetch and hydrate all hub state for one organization.
 *
 * This file owns the multi-step load pipeline:
 * - discover enabled plugins
 * - fetch only the data those plugins need
 * - reconcile delivery metadata for scheduled content
 * - process reminder executions and load the execution ledger
 * - return a single hydrated payload for `currentHub.svelte.ts`
 */

import { sortEventRows } from '$lib/models/eventLifecycleModel';
import { buildEventAttendanceMap } from '$lib/models/eventAttendanceModel';
import { buildEventResponseMap } from '$lib/models/eventResponseModel';
import {
	buildHubNotificationReadMap,
	createDefaultHubNotificationPreferences,
	type HubNotificationPreferences
} from '$lib/models/hubNotifications';
import { buildHubExecutionQueueTriageMapFromWorkflowStateRows, type HubExecutionTriageMap } from '$lib/models/hubExecutionQueue';
import { sortHubExecutionLedgerRows } from '$lib/models/hubExecutionLedger';
import type {
	BroadcastRow,
	EventAttendanceRow,
	EventReminderSettingsRow,
	EventResponseRow,
	EventRow,
	HubExecutionLedgerRow,
	HubNotificationPreferenceRow,
	HubNotificationReadRow,
	HubOperatorWorkflowStateRow,
	ResourceRow
} from '$lib/repositories/hubRepository';
import {
	fetchActivePlugins,
	fetchBroadcasts,
	fetchEventAttendanceRecords,
	fetchEventReminderSettings,
	fetchEventResponses,
	fetchEvents,
	fetchHubExecutionLedger,
	fetchHubNotificationPreferences,
	fetchHubNotificationReads,
	fetchHubOperatorWorkflowState,
	fetchResources,
	processDueHubReminderExecutions
} from '$lib/repositories/hubRepository';
import {
	buildPluginStateMap,
	type PluginStateMap
} from '../pluginRegistry';
import { syncCurrentHubExecutionLedgerRows } from './sync';

export type CurrentHubLoadResult = {
	plugins: PluginStateMap;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	resources: ResourceRow[];
	eventResponseMap: Record<string, EventResponseRow[]>;
	eventAttendanceMap: Record<string, EventAttendanceRow[]>;
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
	executionLedger: HubExecutionLedgerRow[];
	workflowStateRows: HubOperatorWorkflowStateRow[];
	queueTriageMap: HubExecutionTriageMap;
	notificationPreferences: HubNotificationPreferences;
	notificationReadMap: Record<string, string>;
	loadedOrgId: string;
};

type CurrentHubRawLoadData = {
	plugins: PluginStateMap;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	eventResponses: EventResponseRow[];
	eventAttendanceRecords: EventAttendanceRow[];
	eventReminderSettings: EventReminderSettingsRow[];
	resources: ResourceRow[];
	notificationPreferenceRow: HubNotificationPreferenceRow | null;
	notificationReadRows: HubNotificationReadRow[];
	workflowStateRows: HubOperatorWorkflowStateRow[];
};

async function fetchCurrentHubRawLoadData(input: {
	orgId: string;
	profileId: string | null;
	isAdmin: boolean;
}): Promise<CurrentHubRawLoadData> {
	const rows = await fetchActivePlugins(input.orgId);
	const plugins = buildPluginStateMap(rows);

	const [
		broadcasts,
		events,
		eventResponses,
		eventAttendanceRecords,
		eventReminderSettings,
		resources,
		notificationPreferenceRow,
		notificationReadRows,
		workflowStateRows
	] = await Promise.all([
		plugins.broadcasts ? fetchBroadcasts(input.orgId) : Promise.resolve([]),
		plugins.events ? fetchEvents(input.orgId) : Promise.resolve([]),
		plugins.events ? fetchEventResponses(input.orgId) : Promise.resolve([]),
		plugins.events && input.profileId ? fetchEventAttendanceRecords(input.orgId) : Promise.resolve([]),
		plugins.events && input.isAdmin ? fetchEventReminderSettings(input.orgId) : Promise.resolve([]),
		plugins.resources ? fetchResources(input.orgId) : Promise.resolve([]),
		input.profileId ? fetchHubNotificationPreferences(input.orgId, input.profileId) : Promise.resolve(null),
		input.profileId
			? fetchHubNotificationReads(input.orgId, input.profileId)
			: Promise.resolve([] as HubNotificationReadRow[]),
		input.isAdmin
			? fetchHubOperatorWorkflowState(input.orgId)
			: Promise.resolve([] as HubOperatorWorkflowStateRow[])
	]);

	return {
		plugins,
		broadcasts,
		events,
		eventResponses,
		eventAttendanceRecords,
		eventReminderSettings,
		resources,
		notificationPreferenceRow,
		notificationReadRows,
		workflowStateRows
	};
}

async function syncCurrentHubLoadedContent(input: {
	plugins: PluginStateMap;
	isAdmin: boolean;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}) {
	if (!input.plugins.broadcasts && !input.plugins.events) {
		return {
			broadcasts: input.broadcasts,
			events: input.events
		};
	}

	const [broadcasts, events] = await Promise.all([
		input.plugins.broadcasts && input.isAdmin
			? Promise.all(input.broadcasts.map((broadcast) => input.syncBroadcastDeliveryRow(broadcast)))
			: Promise.resolve(input.broadcasts),
		input.plugins.events && input.isAdmin
			? Promise.all(input.events.map((event) => input.syncEventDeliveryRow(event)))
			: Promise.resolve(input.events)
	]);

	return { broadcasts, events };
}

async function fetchCurrentHubExecutionLedger(input: {
	orgId: string;
	profileId: string | null;
	isAdmin: boolean;
	plugins: PluginStateMap;
	broadcasts: BroadcastRow[];
	events: EventRow[];
	eventReminderSettingsMap: Record<string, EventReminderSettingsRow>;
	currentOrgStillMatches: () => boolean;
}) {
	if (!input.currentOrgStillMatches()) {
		return null;
	}

	if (input.plugins.events && input.profileId) {
		await processDueHubReminderExecutions(input.orgId);
	}

	const shouldFetchExecutionLedger =
		(input.plugins.broadcasts || input.plugins.events) &&
		(input.isAdmin || (input.plugins.events && Boolean(input.profileId)));

	const executionLedgerRows = shouldFetchExecutionLedger
		? await fetchHubExecutionLedger(input.orgId)
		: ([] as HubExecutionLedgerRow[]);

	if (!input.plugins.broadcasts && !input.plugins.events) {
		return [];
	}

	if (!input.isAdmin) {
		return sortHubExecutionLedgerRows(executionLedgerRows);
	}

	return syncCurrentHubExecutionLedgerRows({
		orgId: input.orgId,
		isAdmin: input.isAdmin,
		broadcasts: input.broadcasts,
		events: input.events,
		eventReminderSettingsMap: input.eventReminderSettingsMap,
		currentRows: executionLedgerRows
	});
}

export async function loadCurrentHubState(input: {
	orgId: string;
	profileId: string | null;
	isAdmin: boolean;
	currentOrgStillMatches: () => boolean;
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
	syncEventDeliveryRow: (row: EventRow) => Promise<EventRow>;
}): Promise<CurrentHubLoadResult | null> {
	const raw = await fetchCurrentHubRawLoadData({
		orgId: input.orgId,
		profileId: input.profileId,
		isAdmin: input.isAdmin
	});

	const syncedContent = await syncCurrentHubLoadedContent({
		plugins: raw.plugins,
		isAdmin: input.isAdmin,
		broadcasts: raw.broadcasts,
		events: raw.events,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow,
		syncEventDeliveryRow: input.syncEventDeliveryRow
	});

	if (!input.currentOrgStillMatches()) {
		return null;
	}

	const sortedEvents = sortEventRows(syncedContent.events);
	const eventReminderSettingsMap = Object.fromEntries(
		raw.eventReminderSettings.map((settings) => [settings.event_id, settings])
	);

	const executionLedger = await fetchCurrentHubExecutionLedger({
		orgId: input.orgId,
		profileId: input.profileId,
		isAdmin: input.isAdmin,
		plugins: raw.plugins,
		broadcasts: syncedContent.broadcasts,
		events: sortedEvents,
		eventReminderSettingsMap,
		currentOrgStillMatches: input.currentOrgStillMatches
	});

	if (executionLedger === null || !input.currentOrgStillMatches()) {
		return null;
	}

	return {
		plugins: raw.plugins,
		broadcasts: syncedContent.broadcasts,
		events: sortedEvents,
		resources: raw.resources,
		eventResponseMap: buildEventResponseMap(raw.eventResponses),
		eventAttendanceMap: buildEventAttendanceMap(raw.eventAttendanceRecords),
		eventReminderSettingsMap,
		executionLedger,
		workflowStateRows: raw.workflowStateRows,
		queueTriageMap: buildHubExecutionQueueTriageMapFromWorkflowStateRows(raw.workflowStateRows),
		notificationPreferences: raw.notificationPreferenceRow
			? {
				broadcast: raw.notificationPreferenceRow.broadcast_enabled,
				event: raw.notificationPreferenceRow.event_enabled
			}
			: createDefaultHubNotificationPreferences(),
		notificationReadMap: buildHubNotificationReadMap(raw.notificationReadRows),
		loadedOrgId: input.orgId
	};
}
