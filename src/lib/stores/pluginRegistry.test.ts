import { describe, it, expect } from 'vitest';
import {
	buildPluginStateMap,
	getActivePluginsForMember,
	getAllPluginsForAdmin,
	PLUGIN_REGISTRY
} from '$lib/stores/pluginRegistry';

describe('buildPluginStateMap', () => {
	it('defaults all plugins to disabled when no rows', () => {
		const map = buildPluginStateMap([]);
		expect(map.broadcasts).toBe(false);
		expect(map.events).toBe(false);
		expect(map.resources).toBe(false);
	});

	it('enables matching plugins from rows', () => {
		const map = buildPluginStateMap([
			{ plugin_key: 'broadcasts', is_enabled: true },
			{ plugin_key: 'events', is_enabled: false },
			{ plugin_key: 'resources', is_enabled: true }
		]);
		expect(map.broadcasts).toBe(true);
		expect(map.events).toBe(false);
		expect(map.resources).toBe(true);
	});

	it('ignores unknown plugin keys', () => {
		const map = buildPluginStateMap([{ plugin_key: 'unknown', is_enabled: true }]);
		expect(map.broadcasts).toBe(false);
		expect(map.events).toBe(false);
		expect(map.resources).toBe(false);
	});
});

describe('getActivePluginsForMember', () => {
	it('returns empty when all disabled', () => {
		const result = getActivePluginsForMember({ broadcasts: false, events: false, resources: false });
		expect(result).toEqual([]);
	});

	it('returns only enabled plugins in member order', () => {
		const result = getActivePluginsForMember({ broadcasts: true, events: true, resources: true });
		expect(result.map((p) => p.key)).toEqual(['broadcasts', 'events', 'resources']);
	});

	it('returns subset when only one is enabled', () => {
		const result = getActivePluginsForMember({ broadcasts: false, events: false, resources: true });
		expect(result).toHaveLength(1);
		expect(result[0].key).toBe('resources');
	});
});

describe('getAllPluginsForAdmin', () => {
	it('returns all plugins in admin order', () => {
		const result = getAllPluginsForAdmin();
		expect(result.map((p) => p.key)).toEqual(['broadcasts', 'events', 'resources']);
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
