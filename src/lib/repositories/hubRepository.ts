/**
 * Hub repository — Supabase operations for plugin-owned data.
 *
 * Each plugin key maps to a table. This file is the only place
 * that knows the exact table name and column shape for hub data.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

// ── Broadcasts ──

/** Row shape returned from the hub_broadcasts table. */
export type BroadcastRow = {
	id: string;
	organization_id: string;
	title: string;
	body: string;
	created_at: string;
};

/** Fetch all broadcasts for an organization, newest first. */
export async function fetchBroadcasts(organizationId: string): Promise<BroadcastRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.select('id, organization_id, title, body, created_at')
		.eq('organization_id', organizationId)
		.order('created_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load broadcasts.');
	return (data ?? []) as BroadcastRow[];
}

/** Insert a new broadcast and return the created row. */
export async function createBroadcast(
	organizationId: string,
	payload: { title: string; body: string }
): Promise<BroadcastRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_broadcasts')
		.insert({ organization_id: organizationId, ...payload })
		.select()
		.single();

	if (error) throwRepositoryError(error, 'Could not create the broadcast.');
	return data as BroadcastRow;
}

/** Permanently delete a broadcast by id. */
export async function deleteBroadcast(id: string) {
	const { error } = await getSupabaseClient().from('hub_broadcasts').delete().eq('id', id);
	if (error) throwRepositoryError(error, 'Could not delete the broadcast.');
}

// ── Events ──

/** Row shape returned from the hub_events table. */
export type EventRow = {
	id: string;
	organization_id: string;
	title: string;
	description: string;
	starts_at: string;
	location: string;
	created_at: string;
};

/** Fetch all events for an organization, soonest first. */
export async function fetchEvents(organizationId: string): Promise<EventRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.select('id, organization_id, title, description, starts_at, location, created_at')
		.eq('organization_id', organizationId)
		.order('starts_at', { ascending: true });

	if (error) throwRepositoryError(error, 'Could not load events.');
	return (data ?? []) as EventRow[];
}

/** Insert a new event and return the created row. */
export async function createEvent(
	organizationId: string,
	payload: { title: string; description: string; starts_at: string; location: string }
): Promise<EventRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_events')
		.insert({ organization_id: organizationId, ...payload })
		.select()
		.single();

	if (error) throwRepositoryError(error, 'Could not create the event.');
	return data as EventRow;
}

/** Permanently delete an event by id. */
export async function deleteEvent(id: string) {
	const { error } = await getSupabaseClient().from('hub_events').delete().eq('id', id);
	if (error) throwRepositoryError(error, 'Could not delete the event.');
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
