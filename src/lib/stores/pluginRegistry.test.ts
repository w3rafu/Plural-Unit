import { describe, it, expect } from 'vitest';
import {
	buildPluginStateMap,
	getActivePluginsForMember,
	getAllPluginsForAdmin,
	getPluginAudienceLabel,
	getVisiblePluginsForRole,
	PLUGIN_REGISTRY
} from '$lib/stores/pluginRegistry';

describe('buildPluginStateMap', () => {
	it('defaults all plugins to disabled when no rows', () => {
		const map = buildPluginStateMap([]);
		expect(map.broadcasts).toEqual({ isEnabled: false, visibility: 'all_members' });
		expect(map.events).toEqual({ isEnabled: false, visibility: 'all_members' });
		expect(map.resources).toEqual({ isEnabled: false, visibility: 'all_members' });
	});

	it('enables matching plugins from rows', () => {
		const map = buildPluginStateMap([
			{ plugin_key: 'broadcasts', is_enabled: true, visibility_mode: 'all_members' },
			{ plugin_key: 'events', is_enabled: false, visibility_mode: 'admins_only' },
			{ plugin_key: 'resources', is_enabled: true, visibility_mode: 'admins_only' }
		]);
		expect(map.broadcasts).toEqual({ isEnabled: true, visibility: 'all_members' });
		expect(map.events).toEqual({ isEnabled: false, visibility: 'admins_only' });
		expect(map.resources).toEqual({ isEnabled: true, visibility: 'admins_only' });
	});

	it('ignores unknown plugin keys', () => {
		const map = buildPluginStateMap([{ plugin_key: 'unknown', is_enabled: true }]);
		expect(map.broadcasts).toEqual({ isEnabled: false, visibility: 'all_members' });
		expect(map.events).toEqual({ isEnabled: false, visibility: 'all_members' });
		expect(map.resources).toEqual({ isEnabled: false, visibility: 'all_members' });
	});
});

describe('getActivePluginsForMember', () => {
	it('returns empty when all disabled', () => {
		const result = getActivePluginsForMember({
			broadcasts: { isEnabled: false, visibility: 'all_members' },
			events: { isEnabled: false, visibility: 'all_members' },
			resources: { isEnabled: false, visibility: 'all_members' },
			volunteers: { isEnabled: false, visibility: 'all_members' }
		});
		expect(result).toEqual([]);
	});

	it('returns only enabled plugins in member order', () => {
		const result = getActivePluginsForMember({
			broadcasts: { isEnabled: true, visibility: 'all_members' },
			events: { isEnabled: true, visibility: 'all_members' },
			resources: { isEnabled: true, visibility: 'admins_only' },
			volunteers: { isEnabled: false, visibility: 'all_members' }
		});
		expect(result.map((p) => p.key)).toEqual(['broadcasts', 'events']);
	});

	it('returns subset when only one member-visible plugin is enabled', () => {
		const result = getActivePluginsForMember({
			broadcasts: { isEnabled: false, visibility: 'all_members' },
			events: { isEnabled: false, visibility: 'all_members' },
			resources: { isEnabled: true, visibility: 'all_members' },
			volunteers: { isEnabled: false, visibility: 'all_members' }
		});
		expect(result).toHaveLength(1);
		expect(result[0].key).toBe('resources');
	});
});

describe('getVisiblePluginsForRole', () => {
	it('lets admins see enabled admin-only sections', () => {
		const result = getVisiblePluginsForRole(
			{
				broadcasts: { isEnabled: true, visibility: 'all_members' },
				events: { isEnabled: true, visibility: 'admins_only' },
				resources: { isEnabled: false, visibility: 'all_members' },
				volunteers: { isEnabled: false, visibility: 'all_members' }
			},
			'admin'
		);
		expect(result.map((p) => p.key)).toEqual(['broadcasts', 'events']);
	});

	it('hides admin-only sections from members', () => {
		const result = getVisiblePluginsForRole(
			{
				broadcasts: { isEnabled: true, visibility: 'all_members' },
				events: { isEnabled: true, visibility: 'admins_only' },
				resources: { isEnabled: true, visibility: 'admins_only' },
				volunteers: { isEnabled: false, visibility: 'all_members' }
			},
			'member'
		);
		expect(result.map((p) => p.key)).toEqual(['broadcasts']);
	});
});

describe('getPluginAudienceLabel', () => {
	it('formats audience copy for admins-only mode', () => {
		expect(getPluginAudienceLabel('admins_only')).toBe('Admins only');
	});
});

describe('getAllPluginsForAdmin', () => {
	it('returns all plugins in admin order', () => {
		const result = getAllPluginsForAdmin();
		expect(result.map((p) => p.key)).toEqual(['broadcasts', 'events', 'resources', 'volunteers']);
	});
});

describe('PLUGIN_REGISTRY', () => {
	it('has titles for all plugins', () => {
		for (const def of Object.values(PLUGIN_REGISTRY)) {
			expect(def.title).toBeTruthy();
			expect(def.description).toBeTruthy();
		}
	});
});
