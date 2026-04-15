/**
 * Hub notifications repository — Supabase operations for preferences and read state.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

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
