/**
 * Hub events repository — Supabase operations for events, responses, attendance, and reminders.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';
import type { ScheduledDeliveryMetadataPatch, ScheduledDeliveryState } from './broadcasts';

const HUB_EVENT_SELECT =
	'id, organization_id, title, description, starts_at, ends_at, location, created_at, updated_at, publish_at, canceled_at, archived_at, member_signal_kind, member_signal_at, delivery_state, delivered_at, delivery_failure_reason';

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
	member_signal_kind?: EventMemberSignalKind;
	member_signal_at?: string;
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

export type EventMemberSignalKind = 'default' | 'canceled' | 'restored';

export type EventReminderChannel = 'in_app' | 'push' | 'in_app_and_push';

export type EventUpdatePayload = EventMutationPayload & {
	member_signal_kind?: EventMemberSignalKind;
	member_signal_at?: string;
};

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
export async function updateEvent(eventId: string, payload: EventUpdatePayload): Promise<EventRow> {
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
	const canceledAt = new Date().toISOString();
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update({
			canceled_at: canceledAt,
			member_signal_kind: 'canceled',
			member_signal_at: canceledAt
		})
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
	const restoredAt = new Date().toISOString();
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.update({
			canceled_at: null,
			archived_at: null,
			member_signal_kind: 'restored',
			member_signal_at: restoredAt
		})
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
