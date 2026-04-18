/**
 * Plugin registry — the canonical list of hub plugins.
 *
 * HOW PLUGINS WORK
 * ================
 * A plugin is a named feature that an admin can turn on or off.
 * The registry defines every known plugin and its metadata.
 * The hub coordinator page reads this registry to decide which
 * section components to render for members and which editor
 * cards to render for admins.
 *
 * HOW TO ADD A NEW PLUGIN
 * =======================
 * 1. Add a new key to the `PluginKey` union type below.
 * 2. Add a new entry to `PLUGIN_REGISTRY`.
 * 3. Create a member section component in `src/lib/components/hub/member/`.
 * 4. Create an admin editor component in `src/lib/components/hub/admin/`.
 * 5. Register the components in the hub coordinator pages.
 * 6. Add a Supabase migration for the plugin's data table (if any).
 * 7. Add repository functions in `src/lib/repositories/hubRepository.ts`.
 *
 * The registry is the ONLY place that decides order, titles, and
 * descriptions. Components should read from here rather than
 * hardcoding copy.
 */

export type PluginKey = 'broadcasts' | 'events' | 'resources';

export type PluginDefinition = {
	key: PluginKey;
	title: string;
	description: string;
	memberOrder: number;
	adminOrder: number;
};

export type PluginVisibilityMode = 'all_members' | 'admins_only';

export type PluginState = {
	isEnabled: boolean;
	visibility: PluginVisibilityMode;
};

export type PluginViewerRole = 'admin' | 'member';

export type PluginStateMap = Record<PluginKey, PluginState>;

/**
 * Canonical registry. Order is controlled by `memberOrder` / `adminOrder`.
 */
export const PLUGIN_REGISTRY: Record<PluginKey, PluginDefinition> = {
	broadcasts: {
		key: 'broadcasts',
		title: 'Broadcasts',
		description: 'Send messages to all members through their preferred channel.',
		memberOrder: 10,
		adminOrder: 10
	},
	events: {
		key: 'events',
		title: 'Events',
		description: 'Upcoming gatherings people can plan around.',
		memberOrder: 20,
		adminOrder: 20
	},
	resources: {
		key: 'resources',
		title: 'Resources',
		description: 'Reference links, forms, documents, and contact points members can reopen anytime.',
		memberOrder: 30,
		adminOrder: 30
	}
};

export const ALL_PLUGIN_KEYS: PluginKey[] = Object.keys(PLUGIN_REGISTRY) as PluginKey[];

function normalizePluginVisibilityMode(value: string | null | undefined): PluginVisibilityMode {
	return value === 'admins_only' ? 'admins_only' : 'all_members';
}

/**
 * Build a state map from plugin activation rows.
 * Missing rows are treated as disabled.
 */
export function buildPluginStateMap(
	rows: Array<{ plugin_key: string; is_enabled: boolean; visibility_mode?: string | null }>
): PluginStateMap {
	const map: PluginStateMap = {
		broadcasts: { isEnabled: false, visibility: 'all_members' },
		events: { isEnabled: false, visibility: 'all_members' },
		resources: { isEnabled: false, visibility: 'all_members' }
	};
	for (const row of rows) {
		if (row.plugin_key in map) {
			map[row.plugin_key as PluginKey] = {
				isEnabled: row.is_enabled,
				visibility: normalizePluginVisibilityMode(row.visibility_mode)
			};
		}
	}
	return map;
}

export function isPluginEnabled(stateMap: PluginStateMap, key: PluginKey) {
	return stateMap[key].isEnabled;
}

export function isPluginVisibleToRole(state: PluginState, role: PluginViewerRole) {
	return state.isEnabled && (role === 'admin' || state.visibility === 'all_members');
}

export function getPluginAudienceLabel(visibility: PluginVisibilityMode) {
	return visibility === 'admins_only' ? 'Admins only' : 'Everyone';
}

/**
	* Return enabled plugin definitions sorted by `memberOrder`.
 */
export function getActivePluginsForMember(stateMap: PluginStateMap): PluginDefinition[] {
	return getVisiblePluginsForRole(stateMap, 'member');
}

export function getVisiblePluginsForRole(
	stateMap: PluginStateMap,
	role: PluginViewerRole
): PluginDefinition[] {
	return ALL_PLUGIN_KEYS
		.filter((key) => isPluginVisibleToRole(stateMap[key], role))
		.map((key) => PLUGIN_REGISTRY[key])
		.sort((a, b) => a.memberOrder - b.memberOrder);
}

export function getEnabledPlugins(stateMap: PluginStateMap): PluginDefinition[] {
	return ALL_PLUGIN_KEYS
		.filter((key) => stateMap[key].isEnabled)
		.map((key) => PLUGIN_REGISTRY[key])
		.sort((a, b) => a.adminOrder - b.adminOrder);
}

/**
 * Return all plugin definitions sorted by `adminOrder`.
 */
export function getAllPluginsForAdmin(): PluginDefinition[] {
	return ALL_PLUGIN_KEYS
		.map((key) => PLUGIN_REGISTRY[key])
		.sort((a, b) => a.adminOrder - b.adminOrder);
}
