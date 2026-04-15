/**
 * currentHub/state — shared state-shape helpers for the hub store.
 *
 * The coordinator store still owns the live reactive fields, but this file
 * centralizes the boring parts: default values, reset behavior, and applying
 * hydrated load results back onto the store instance.
 */

import {
	createDefaultHubNotificationPreferences,
	type HubNotificationPreferences
} from '$lib/models/hubNotifications';
import type { HubExecutionTriageMap } from '$lib/models/hubExecutionQueue';
import type {
	BroadcastRow,
	EventAttendanceRow,
	EventReminderSettingsRow,
	EventResponseRow,
	EventRow,
	HubExecutionLedgerRow,
	HubOperatorWorkflowStateRow,
	ResourceRow
} from '$lib/repositories/hubRepository';
import type { PluginStateMap } from '../pluginRegistry';
import type { CurrentHubLoadResult } from './load';

export type CurrentHubHydratedState = {
	loadedOrgId: string;
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
};

type CurrentHubResettableState = CurrentHubHydratedState & {
	lastError: Error | null;
	isLoading: boolean;
	broadcastTargetId: string;
	eventTargetId: string;
	resourceTargetId: string;
	executionTargetId: string;
	eventResponseTargetId: string;
	eventAttendanceTargetId: string;
	isSavingNotificationPreferences: boolean;
	notificationReadTargetId: string;
	isMarkingAllActivityRead: boolean;
};

const DEFAULT_PLUGIN_STATE = {
	broadcasts: false,
	events: false,
	resources: false
} satisfies PluginStateMap;

export function createDefaultCurrentHubPluginState(): PluginStateMap {
	return { ...DEFAULT_PLUGIN_STATE };
}

export function applyCurrentHubLoadedState(
	store: CurrentHubHydratedState,
	state: CurrentHubLoadResult
) {
	store.plugins = state.plugins;
	store.broadcasts = state.broadcasts;
	store.events = state.events;
	store.resources = state.resources;
	store.eventResponseMap = state.eventResponseMap;
	store.eventAttendanceMap = state.eventAttendanceMap;
	store.eventReminderSettingsMap = state.eventReminderSettingsMap;
	store.executionLedger = state.executionLedger;
	store.workflowStateRows = state.workflowStateRows;
	store.queueTriageMap = state.queueTriageMap;
	store.notificationPreferences = state.notificationPreferences;
	store.notificationReadMap = state.notificationReadMap;
	store.loadedOrgId = state.loadedOrgId;
}

export function resetCurrentHubState(store: CurrentHubResettableState) {
	store.lastError = null;
	store.isLoading = false;
	store.loadedOrgId = '';
	store.plugins = createDefaultCurrentHubPluginState();
	store.broadcasts = [];
	store.events = [];
	store.resources = [];
	store.broadcastTargetId = '';
	store.eventTargetId = '';
	store.resourceTargetId = '';
	store.eventResponseMap = {};
	store.eventAttendanceMap = {};
	store.eventReminderSettingsMap = {};
	store.executionLedger = [];
	store.workflowStateRows = [];
	store.executionTargetId = '';
	store.eventResponseTargetId = '';
	store.eventAttendanceTargetId = '';
	store.notificationPreferences = createDefaultHubNotificationPreferences();
	store.notificationReadMap = {};
	store.isSavingNotificationPreferences = false;
	store.notificationReadTargetId = '';
	store.isMarkingAllActivityRead = false;
	store.queueTriageMap = {};
}
