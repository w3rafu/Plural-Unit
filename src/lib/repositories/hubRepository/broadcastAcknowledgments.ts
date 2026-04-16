/**
 * Hub broadcast acknowledgments repository — Supabase operations for member
 * broadcast engagement.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

export type BroadcastAcknowledgmentRow = {
	id: string;
	organization_id: string;
	broadcast_id: string;
	profile_id: string;
	acknowledged_at: string;
};

const BROADCAST_ACK_SELECT =
	'id, organization_id, broadcast_id, profile_id, acknowledged_at';

export async function fetchBroadcastAcknowledgments(
	organizationId: string
): Promise<BroadcastAcknowledgmentRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcast_acknowledgments')
		.select(BROADCAST_ACK_SELECT)
		.eq('organization_id', organizationId);

	if (error) throwRepositoryError(error, 'Could not load broadcast acknowledgments.');
	return (data ?? []) as BroadcastAcknowledgmentRow[];
}

export async function acknowledgeBroadcast(payload: {
	organizationId: string;
	broadcastId: string;
	profileId: string;
}): Promise<BroadcastAcknowledgmentRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcast_acknowledgments')
		.upsert(
			{
				organization_id: payload.organizationId,
				broadcast_id: payload.broadcastId,
				profile_id: payload.profileId
			},
			{ onConflict: 'organization_id,broadcast_id,profile_id' }
		)
		.select(BROADCAST_ACK_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not acknowledge the broadcast.');
	return data as BroadcastAcknowledgmentRow;
}

export async function unacknowledgeBroadcast(payload: {
	organizationId: string;
	broadcastId: string;
	profileId: string;
}): Promise<void> {
	const { error } = await getSupabaseClient()
		.from('hub_broadcast_acknowledgments')
		.delete()
		.eq('organization_id', payload.organizationId)
		.eq('broadcast_id', payload.broadcastId)
		.eq('profile_id', payload.profileId);

	if (error) throwRepositoryError(error, 'Could not remove broadcast acknowledgment.');
}
