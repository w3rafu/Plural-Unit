/**
 * Hub repository — Supabase operations for plugin-owned data.
 *
 * Each plugin key maps to a table. This file is the only place
 * that knows the exact table name and column shape for hub data.
 */

import { getSupabaseClient } from '$lib/supabaseClient';

// ── Broadcasts ──

export type BroadcastRow = {
	id: string;
	organization_id: string;
	title: string;
	body: string;
	created_at: string;
};

export async function fetchBroadcasts(organizationId: string): Promise<BroadcastRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.select('id, organization_id, title, body, created_at')
		.eq('organization_id', organizationId)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as BroadcastRow[];
}

export async function createBroadcast(
	organizationId: string,
	payload: { title: string; body: string }
): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.insert({ organization_id: organizationId, ...payload })
		.select()
		.single();

	if (error) throw error;
	return data as BroadcastRow;
}

export async function deleteBroadcast(id: string) {
	const { error } = await getSupabaseClient().from('hub_broadcasts').delete().eq('id', id);
	if (error) throw error;
}

// ── Events ──

export type EventRow = {
	id: string;
	organization_id: string;
	title: string;
	description: string;
	starts_at: string;
	location: string;
	created_at: string;
};

export async function fetchEvents(organizationId: string): Promise<EventRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.select('id, organization_id, title, description, starts_at, location, created_at')
		.eq('organization_id', organizationId)
		.order('starts_at', { ascending: true });

	if (error) throw error;
	return (data ?? []) as EventRow[];
}

export async function createEvent(
	organizationId: string,
	payload: { title: string; description: string; starts_at: string; location: string }
): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.insert({ organization_id: organizationId, ...payload })
		.select()
		.single();

	if (error) throw error;
	return data as EventRow;
}

export async function deleteEvent(id: string) {
	const { error } = await getSupabaseClient().from('hub_events').delete().eq('id', id);
	if (error) throw error;
}

// ── Plugin activation ──

export type PluginRow = {
	plugin_key: string;
	is_enabled: boolean;
};

export async function fetchActivePlugins(organizationId: string): Promise<PluginRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_plugins')
		.select('plugin_key, is_enabled')
		.eq('organization_id', organizationId);

	if (error) throw error;
	return (data ?? []) as PluginRow[];
}

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

	if (error) throw error;
}
