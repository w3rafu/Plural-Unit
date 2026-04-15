/**
 * Hub broadcasts repository — Supabase operations for broadcast lifecycle data.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

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
