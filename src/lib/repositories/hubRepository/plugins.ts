/**
 * Hub plugin repository — Supabase operations for per-organization plugin activation.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

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
