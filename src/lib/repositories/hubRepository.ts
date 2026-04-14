/**
 * Hub repository — Supabase operations for plugin-owned data.
 *
 * Each plugin key maps to a table. This file is the only place
 * that knows the exact table name and column shape for hub data.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

// ── Broadcasts ──

const HUB_BROADCAST_SELECT =
	'id, organization_id, title, body, created_at, updated_at, is_pinned, is_draft, publish_at, archived_at, expires_at, delivery_state, delivered_at, delivery_failure_reason';

export type ScheduledDeliveryState = 'scheduled' | 'published' | 'failed' | 'skipped';

export type ScheduledDeliveryMetadataPatch = {
	delivery_state: ScheduledDeliveryState | null;
	delivered_at: string | null;
	delivery_failure_reason: string | null;
};

/** Row shape returned from the hub_broadcasts table. */
export type BroadcastRow = {
	id: string;
	organization_id: string;
	title: string;
	body: string;
	created_at: string;
	updated_at: string;
	is_pinned: boolean;
	is_draft: boolean;
	publish_at: string | null;
	archived_at: string | null;
	expires_at: string | null;
	delivery_state?: ScheduledDeliveryState | null;
	delivered_at?: string | null;
	delivery_failure_reason?: string | null;
};

export type BroadcastMutationPayload = {
	title: string;
	body: string;
	expires_at: string | null;
	is_draft: boolean;
	publish_at: string | null;
};

/** Fetch all broadcasts for an organization, newest first. */
export async function fetchBroadcasts(organizationId: string): Promise<BroadcastRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.select(HUB_BROADCAST_SELECT)
		.eq('organization_id', organizationId)
		.order('created_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load broadcasts.');
	return (data ?? []) as BroadcastRow[];
}

/** Insert a new broadcast and return the created row. */
export async function createBroadcast(
	organizationId: string,
	payload: BroadcastMutationPayload
): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.insert({ organization_id: organizationId, ...payload })
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not create the broadcast.');
	return data as BroadcastRow;
}

/** Update a broadcast in place and return the current row. */
export async function updateBroadcast(
	broadcastId: string,
	payload: BroadcastMutationPayload
): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update(payload)
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the broadcast.');
	return data as BroadcastRow;
}

/** Pin or unpin a broadcast for the organization. */
export async function setBroadcastPinned(
	organizationId: string,
	broadcastId: string,
	isPinned: boolean
): Promise<BroadcastRow> {
	if (isPinned) {
		const { error: unpinError } = await getSupabaseClient()
			.from('hub_broadcasts')
			.update({ is_pinned: false })
			.eq('organization_id', organizationId);

		if (unpinError) throwRepositoryError(unpinError, 'Could not update the pinned broadcast.');
	}

	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update(
			isPinned
				? { is_pinned: true, is_draft: false, publish_at: null, archived_at: null }
				: { is_pinned: false }
		)
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the pinned broadcast.');
	return data as BroadcastRow;
}

/** Mark a broadcast inactive without permanently deleting it. */
export async function archiveBroadcast(broadcastId: string): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update({ archived_at: new Date().toISOString(), is_pinned: false })
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not archive the broadcast.');
	return data as BroadcastRow;
}

/** Restore an archived or expired broadcast to the live list. */
export async function restoreBroadcast(broadcastId: string): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update({
			archived_at: null,
			expires_at: null,
			is_pinned: false,
			is_draft: false,
			publish_at: null
		})
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not restore the broadcast.');
	return data as BroadcastRow;
}

/** Move a broadcast back into draft without making it member-visible. */
export async function saveBroadcastDraft(broadcastId: string): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update({ is_draft: true, publish_at: null, archived_at: null, is_pinned: false })
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not save the broadcast as a draft.');
	return data as BroadcastRow;
}

/** Schedule a broadcast for later member visibility. */
export async function scheduleBroadcast(
	broadcastId: string,
	publishAt: string
): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update({
			is_draft: false,
			publish_at: publishAt,
			archived_at: null,
			is_pinned: false
		})
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not schedule the broadcast.');
	return data as BroadcastRow;
}

/** Publish a broadcast immediately. */
export async function publishBroadcastNow(broadcastId: string): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update({ is_draft: false, publish_at: null, archived_at: null })
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not publish the broadcast.');
	return data as BroadcastRow;
}

/** Update delivery metadata for a scheduled broadcast. */
export async function updateBroadcastDeliveryState(
	broadcastId: string,
	patch: ScheduledDeliveryMetadataPatch
): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.update(patch)
		.eq('id', broadcastId)
		.select(HUB_BROADCAST_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the broadcast delivery state.');
	return data as BroadcastRow;
}

/** Permanently delete a broadcast by id. */
export async function deleteBroadcast(id: string) {
	const { error } = await getSupabaseClient().from('hub_broadcasts').delete().eq('id', id);
	if (error) throwRepositoryError(error, 'Could not delete the broadcast.');
}

// ── Events ──

const HUB_EVENT_SELECT =
	'id, organization_id, title, description, starts_at, ends_at, location, created_at, updated_at, publish_at, canceled_at, archived_at, delivery_state, delivered_at, delivery_failure_reason';

const HUB_EVENT_ATTENDANCE_SELECT =
	'id, event_id, organization_id, profile_id, status, marked_by_profile_id, created_at, updated_at';

const HUB_EVENT_REMINDER_SELECT =
	'id, event_id, organization_id, delivery_channel, reminder_offsets, created_at, updated_at';

/** Row shape returned from the hub_events table. */
export type EventRow = {
	id: string;
	organization_id: string;
	title: string;
	description: string;
	starts_at: string;
	ends_at: string | null;
	location: string;
	created_at: string;
	updated_at: string;
	publish_at: string | null;
	canceled_at: string | null;
	archived_at: string | null;
	delivery_state?: ScheduledDeliveryState | null;
	delivered_at?: string | null;
	delivery_failure_reason?: string | null;
};

export type EventMutationPayload = {
	title: string;
	description: string;
	starts_at: string;
	ends_at: string | null;
	location: string;
	publish_at: string | null;
};

export type EventReminderChannel = 'in_app';

export type EventReminderSettingsRow = {
	id: string;
	event_id: string;
	organization_id: string;
	delivery_channel: EventReminderChannel;
	reminder_offsets: number[];
	created_at: string;
	updated_at: string;
};

export type EventResponseStatus = 'going' | 'maybe' | 'cannot_attend';

export type EventResponseRow = {
	id: string;
	event_id: string;
	organization_id: string;
	profile_id: string;
	response: EventResponseStatus;
	created_at: string;
	updated_at: string;
};

export type EventAttendanceStatus = 'attended' | 'absent';

export type EventAttendanceRow = {
	id: string;
	event_id: string;
	organization_id: string;
	profile_id: string;
	status: EventAttendanceStatus;
	marked_by_profile_id: string | null;
	created_at: string;
	updated_at: string;
};

/** Fetch all events for an organization, soonest first. */
export async function fetchEvents(organizationId: string): Promise<EventRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.select(HUB_EVENT_SELECT)
		.eq('organization_id', organizationId)
		.order('starts_at', { ascending: true });

	if (error) throwRepositoryError(error, 'Could not load events.');
	return (data ?? []) as EventRow[];
}

/** Fetch all member event responses for an organization, most recently updated first. */
export async function fetchEventResponses(organizationId: string): Promise<EventResponseRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_event_responses')
		.select('id, event_id, organization_id, profile_id, response, created_at, updated_at')
		.eq('organization_id', organizationId)
		.order('updated_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load event responses.');
	return (data ?? []) as EventResponseRow[];
}

/** Fetch recorded event attendance outcomes for an organization. */
export async function fetchEventAttendanceRecords(
	organizationId: string
): Promise<EventAttendanceRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_event_attendances')
		.select(HUB_EVENT_ATTENDANCE_SELECT)
		.eq('organization_id', organizationId)
		.order('updated_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load event attendance.');
	return (data ?? []) as EventAttendanceRow[];
}

/** Upsert a recorded attendance outcome for a single member and event. */
export async function upsertEventAttendanceRecord(payload: {
	eventId: string;
	organizationId: string;
	profileId: string;
	status: EventAttendanceStatus;
	markedByProfileId: string;
}): Promise<EventAttendanceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_event_attendances')
		.upsert(
			{
				event_id: payload.eventId,
				organization_id: payload.organizationId,
				profile_id: payload.profileId,
				status: payload.status,
				marked_by_profile_id: payload.markedByProfileId
			},
			{ onConflict: 'event_id,profile_id' }
		)
		.select(HUB_EVENT_ATTENDANCE_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not save the event attendance record.');
	return data as EventAttendanceRow;
}

/** Clear a recorded attendance outcome so the event returns to an unrecorded state. */
export async function deleteEventAttendanceRecord(eventId: string, profileId: string) {
	const { error } = await getSupabaseClient()
		.from('hub_event_attendances')
		.delete()
		.eq('event_id', eventId)
		.eq('profile_id', profileId);

	if (error) throwRepositoryError(error, 'Could not clear the event attendance record.');
}

/** Fetch reminder settings for events in an organization. */
export async function fetchEventReminderSettings(
	organizationId: string
): Promise<EventReminderSettingsRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_event_reminders')
		.select(HUB_EVENT_REMINDER_SELECT)
		.eq('organization_id', organizationId)
		.order('updated_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load event reminder settings.');
	return (data ?? []) as EventReminderSettingsRow[];
}

/** Insert a new event and return the created row. */
export async function createEvent(
	organizationId: string,
	payload: EventMutationPayload
): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.insert({ organization_id: organizationId, ...payload })
		.select(HUB_EVENT_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not create the event.');
	return data as EventRow;
}

/** Update an event in place and return the latest row. */
export async function updateEvent(eventId: string, payload: EventMutationPayload): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update(payload)
		.eq('id', eventId)
		.select(HUB_EVENT_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the event.');
	return data as EventRow;
}

/** Mark an event canceled without removing it from admin history. */
export async function cancelEvent(eventId: string): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update({ canceled_at: new Date().toISOString() })
		.eq('id', eventId)
		.select(HUB_EVENT_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not cancel the event.');
	return data as EventRow;
}

/** Move an event out of the member surface while keeping it in admin history. */
export async function archiveEvent(eventId: string): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update({ archived_at: new Date().toISOString() })
		.eq('id', eventId)
		.select(HUB_EVENT_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not archive the event.');
	return data as EventRow;
}

/** Restore a canceled or archived event to the active lifecycle. */
export async function restoreEvent(eventId: string): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update({ canceled_at: null, archived_at: null })
		.eq('id', eventId)
		.select(HUB_EVENT_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not restore the event.');
	return data as EventRow;
}

/** Update delivery metadata for a scheduled event. */
export async function updateEventDeliveryState(
	eventId: string,
	patch: ScheduledDeliveryMetadataPatch
): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update(patch)
		.eq('id', eventId)
		.select(HUB_EVENT_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the event delivery state.');
	return data as EventRow;
}

/** Upsert the signed-in member's response for an event. */
export async function upsertOwnEventResponse(payload: {
	eventId: string;
	organizationId: string;
	profileId: string;
	response: EventResponseStatus;
}): Promise<EventResponseRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_event_responses')
		.upsert(
			{
				event_id: payload.eventId,
				organization_id: payload.organizationId,
				profile_id: payload.profileId,
				response: payload.response
			},
			{ onConflict: 'event_id,profile_id' }
		)
		.select('id, event_id, organization_id, profile_id, response, created_at, updated_at')
		.single();

	if (error) throwRepositoryError(error, 'Could not save the event response.');
	return data as EventResponseRow;
}

/** Save reminder settings for a single event. */
export async function saveEventReminderSettings(
	eventId: string,
	organizationId: string,
	payload: {
		delivery_channel: EventReminderChannel;
		reminder_offsets: number[];
	}
): Promise<EventReminderSettingsRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_event_reminders')
		.upsert(
			{
				event_id: eventId,
				organization_id: organizationId,
				...payload
			},
			{ onConflict: 'event_id' }
		)
		.select(HUB_EVENT_REMINDER_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not save the event reminder settings.');
	return data as EventReminderSettingsRow;
}

/** Permanently delete an event by id. */
export async function deleteEvent(id: string) {
	const { error } = await getSupabaseClient().from('hub_events').delete().eq('id', id);
	if (error) throwRepositoryError(error, 'Could not delete the event.');
}

// ── Execution ledger ──

const HUB_EXECUTION_LEDGER_SELECT =
	'id, organization_id, job_kind, source_id, execution_key, due_at, execution_state, processed_at, last_attempted_at, attempt_count, last_failure_reason, created_at, updated_at';

export type HubExecutionJobKind = 'broadcast_publish' | 'event_publish' | 'event_reminder';

export type HubExecutionState = 'pending' | 'processed' | 'failed' | 'skipped';

export type HubExecutionLedgerRow = {
	id: string;
	organization_id: string;
	job_kind: HubExecutionJobKind;
	source_id: string;
	execution_key: string;
	due_at: string;
	execution_state: HubExecutionState;
	processed_at: string | null;
	last_attempted_at: string | null;
	attempt_count: number;
	last_failure_reason: string | null;
	created_at: string;
	updated_at: string;
};

export type HubExecutionLedgerMutationPayload = {
	organization_id: string;
	job_kind: HubExecutionJobKind;
	source_id: string;
	execution_key: string;
	due_at: string;
	execution_state: HubExecutionState;
	processed_at: string | null;
	last_attempted_at: string | null;
	attempt_count: number;
	last_failure_reason: string | null;
};

export async function fetchHubExecutionLedger(
	organizationId: string
): Promise<HubExecutionLedgerRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_execution_ledger')
		.select(HUB_EXECUTION_LEDGER_SELECT)
		.eq('organization_id', organizationId)
		.order('due_at', { ascending: true });

	if (error) throwRepositoryError(error, 'Could not load the execution ledger.');
	return (data ?? []) as HubExecutionLedgerRow[];
}

export async function upsertHubExecutionLedgerEntries(
	entries: HubExecutionLedgerMutationPayload[]
): Promise<HubExecutionLedgerRow[]> {
	if (entries.length === 0) {
		return [];
	}

	const rows = await Promise.all(
		entries.map(async (entry) => {
			const { data, error } = await getSupabaseClient()
				.from('hub_execution_ledger')
				.upsert(entry, { onConflict: 'job_kind,source_id,execution_key' })
				.select(HUB_EXECUTION_LEDGER_SELECT)
				.single();

			if (error) throwRepositoryError(error, 'Could not sync the execution ledger.');
			return data as HubExecutionLedgerRow;
		})
	);

	return rows;
}

export async function deleteHubExecutionLedgerEntries(entryIds: string[]) {
	if (entryIds.length === 0) {
		return;
	}

	await Promise.all(
		entryIds.map(async (entryId) => {
			const { error } = await getSupabaseClient()
				.from('hub_execution_ledger')
				.delete()
				.eq('id', entryId);

			if (error) throwRepositoryError(error, 'Could not prune stale execution ledger entries.');
		})
	);
}

// ── Notifications ──

const HUB_NOTIFICATION_PREFERENCE_SELECT =
	'id, organization_id, profile_id, broadcast_enabled, event_enabled, created_at, updated_at';

const HUB_NOTIFICATION_READ_SELECT =
	'id, organization_id, profile_id, notification_kind, source_id, notification_key, read_at, created_at, updated_at';

export type HubNotificationKind = 'broadcast' | 'event' | 'event_reminder';

export type HubNotificationPreferenceRow = {
	id: string;
	organization_id: string;
	profile_id: string;
	broadcast_enabled: boolean;
	event_enabled: boolean;
	created_at: string;
	updated_at: string;
};

export type HubNotificationPreferenceMutationPayload = {
	broadcast_enabled: boolean;
	event_enabled: boolean;
};

export type HubNotificationReadRow = {
	id: string;
	organization_id: string;
	profile_id: string;
	notification_kind: HubNotificationKind;
	source_id: string;
	notification_key: string;
	read_at: string;
	created_at: string;
	updated_at: string;
};

export async function processDueHubReminderExecutions(
	organizationId: string
): Promise<HubExecutionLedgerRow[]> {
	const { data, error } = await getSupabaseClient().rpc('process_hub_due_reminder_executions', {
		target_organization_id: organizationId
	});

	if (error) throwRepositoryError(error, 'Could not process due reminder alerts.');
	return (data ?? []) as HubExecutionLedgerRow[];
}

export async function fetchHubNotificationPreferences(
	organizationId: string,
	profileId: string
): Promise<HubNotificationPreferenceRow | null> {
	const { data, error } = await getSupabaseClient()
		.from('hub_notification_preferences')
		.select(HUB_NOTIFICATION_PREFERENCE_SELECT)
		.eq('organization_id', organizationId)
		.eq('profile_id', profileId)
		.maybeSingle();

	if (error) throwRepositoryError(error, 'Could not load notification preferences.');
	return (data ?? null) as HubNotificationPreferenceRow | null;
}

export async function saveHubNotificationPreferences(
	organizationId: string,
	profileId: string,
	payload: HubNotificationPreferenceMutationPayload
): Promise<HubNotificationPreferenceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_notification_preferences')
		.upsert(
			{
				organization_id: organizationId,
				profile_id: profileId,
				...payload
			},
			{ onConflict: 'organization_id,profile_id' }
		)
		.select(HUB_NOTIFICATION_PREFERENCE_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not save notification preferences.');
	return data as HubNotificationPreferenceRow;
}

export async function fetchHubNotificationReads(
	organizationId: string,
	profileId: string
): Promise<HubNotificationReadRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_notification_reads')
		.select(HUB_NOTIFICATION_READ_SELECT)
		.eq('organization_id', organizationId)
		.eq('profile_id', profileId)
		.order('updated_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load alert read state.');
	return (data ?? []) as HubNotificationReadRow[];
}

export async function markHubNotificationRead(payload: {
	organizationId: string;
	profileId: string;
	notificationKind: HubNotificationKind;
	sourceId: string;
	notificationKey?: string;
	readAt?: string;
}): Promise<HubNotificationReadRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_notification_reads')
		.upsert(
			{
				organization_id: payload.organizationId,
				profile_id: payload.profileId,
				notification_kind: payload.notificationKind,
				source_id: payload.sourceId,
				notification_key: payload.notificationKey ?? 'default',
				read_at: payload.readAt ?? new Date().toISOString()
			},
			{ onConflict: 'organization_id,profile_id,notification_kind,source_id,notification_key' }
		)
		.select(HUB_NOTIFICATION_READ_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update alert read state.');
	return data as HubNotificationReadRow;
}

// ── Resources ──

export type ResourceType = 'link' | 'form' | 'document' | 'contact';

export type ResourceRow = {
	id: string;
	organization_id: string;
	title: string;
	description: string;
	href: string;
	resource_type: ResourceType;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

/** Fetch all resources for an organization, ordered for member display. */
export async function fetchResources(organizationId: string): Promise<ResourceRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.select(
			'id, organization_id, title, description, href, resource_type, sort_order, created_at, updated_at'
		)
		.eq('organization_id', organizationId)
		.order('sort_order', { ascending: true });

	if (error) throwRepositoryError(error, 'Could not load resources.');
	return (data ?? []) as ResourceRow[];
}

/** Insert a new resource and return the created row. */
export async function createResource(
	organizationId: string,
	payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
		sort_order: number;
	}
): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.insert({ organization_id: organizationId, ...payload })
		.select(
			'id, organization_id, title, description, href, resource_type, sort_order, created_at, updated_at'
		)
		.single();

	if (error) throwRepositoryError(error, 'Could not create the resource.');
	return data as ResourceRow;
}

/** Update a resource and return the latest row. */
export async function updateResource(
	resourceId: string,
	payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
		sort_order?: number;
	}
): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.update(payload)
		.eq('id', resourceId)
		.select(
			'id, organization_id, title, description, href, resource_type, sort_order, created_at, updated_at'
		)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the resource.');
	return data as ResourceRow;
}

/** Persist a new resource order. */
export async function saveResourceOrder(updates: Array<{ id: string; sort_order: number }>) {
	await Promise.all(
		updates.map(async (update) => {
			const { error } = await getSupabaseClient()
				.from('hub_resources')
				.update({ sort_order: update.sort_order })
				.eq('id', update.id);

			if (error) {
				throwRepositoryError(error, 'Could not save the resource order.');
			}
		})
	);
}

/** Permanently delete a resource by id. */
export async function deleteResource(id: string) {
	const { error } = await getSupabaseClient().from('hub_resources').delete().eq('id', id);
	if (error) throwRepositoryError(error, 'Could not delete the resource.');
}

// ── Plugin activation ──

/** Row shape for a hub plugin toggle (enabled/disabled per org). */
export type PluginRow = {
	plugin_key: string;
	is_enabled: boolean;
};

/** Return all plugin rows for an organization (enabled and disabled). */
export async function fetchActivePlugins(organizationId: string): Promise<PluginRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_plugins')
		.select('plugin_key, is_enabled')
		.eq('organization_id', organizationId);

	if (error) throwRepositoryError(error, 'Could not load hub plugins.');
	return (data ?? []) as PluginRow[];
}

/** Enable or disable a plugin for the organization (upsert). */
export async function togglePlugin(
	organizationId: string,
	pluginKey: string,
	enabled: boolean
) {
	const { error } = await getSupabaseClient()
		.from('hub_plugins')
		.upsert(
			{ organization_id: organizationId, plugin_key: pluginKey, is_enabled: enabled },
			{ onConflict: 'organization_id,plugin_key' }
		);

	if (error) throwRepositoryError(error, 'Could not update the plugin setting.');
}
