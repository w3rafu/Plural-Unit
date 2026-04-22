/**
 * Hub plugin repository — Supabase operations for per-organization plugin activation.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

export type PluginVisibilityModeRow = 'all_members' | 'admins_only';

/** Row shape for a hub plugin toggle plus role-aware member visibility. */
export type PluginRow = {
	plugin_key: string;
	is_enabled: boolean;
	visibility_mode: PluginVisibilityModeRow | null;
};

/** Return all plugin rows for an organization (enabled and disabled). */
export async function fetchActivePlugins(organizationId: string): Promise<PluginRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_plugins')
		.select('plugin_key, is_enabled, visibility_mode')
		.eq('organization_id', organizationId);

	if (error) throwRepositoryError(error, 'Could not load hub plugins.');
	return (data ?? []) as PluginRow[];
}

/** Save the enabled state and member-visibility mode for a plugin. */
export async function togglePlugin(
	organizationId: string,
	pluginKey: string,
	input: { isEnabled: boolean; visibilityMode: PluginVisibilityModeRow }
) {
	const { error } = await getSupabaseClient()
		.from('hub_plugins')
		.upsert(
			{
				organization_id: organizationId,
				plugin_key: pluginKey,
				is_enabled: input.isEnabled,
				visibility_mode: input.visibilityMode
			},
			{ onConflict: 'organization_id,plugin_key' }
		);

	if (error) throwRepositoryError(error, 'Could not update the plugin setting.');
}
