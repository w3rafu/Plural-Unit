import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock hub repository ──

const mockFetchActivePlugins = vi.fn();
const mockTogglePlugin = vi.fn();
const mockFetchBroadcasts = vi.fn();
const mockFetchEvents = vi.fn();
const mockCreateBroadcast = vi.fn();
const mockDeleteBroadcast = vi.fn();
const mockCreateEvent = vi.fn();
const mockDeleteEvent = vi.fn();

vi.mock('$lib/repositories/hubRepository', () => ({
	fetchActivePlugins: (...args: any[]) => mockFetchActivePlugins(...args),
	togglePlugin: (...args: any[]) => mockTogglePlugin(...args),
	fetchBroadcasts: (...args: any[]) => mockFetchBroadcasts(...args),
	fetchEvents: (...args: any[]) => mockFetchEvents(...args),
	createBroadcast: (...args: any[]) => mockCreateBroadcast(...args),
	deleteBroadcast: (...args: any[]) => mockDeleteBroadcast(...args),
	createEvent: (...args: any[]) => mockCreateEvent(...args),
	deleteEvent: (...args: any[]) => mockDeleteEvent(...args)
}));

// Mock currentOrganization so orgId resolves
vi.mock('./currentOrganization.svelte', () => ({
	currentOrganization: { organization: { id: 'org-1' } }
}));

// Mock pluginRegistry
vi.mock('./pluginRegistry', () => ({
	buildPluginStateMap: (rows: any[]) => {
		const map: Record<string, boolean> = { broadcasts: false, events: false };
		for (const row of rows) {
			if (row.plugin_key in map) map[row.plugin_key] = row.is_enabled;
		}
		return map;
	}
}));

// Mock hubNotifications
vi.mock('$lib/models/hubNotifications', () => ({
	buildHubNotifications: () => []
}));

import { currentHub } from './currentHub.svelte';

beforeEach(() => {
	vi.clearAllMocks();
	currentHub.reset();
});

describe('currentHub.load', () => {
	it('fetches plugins and active data', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: true },
			{ plugin_key: 'events', is_enabled: true }
		]);
		mockFetchBroadcasts.mockResolvedValueOnce([{ id: 'b1', title: 'Hello' }]);
		mockFetchEvents.mockResolvedValueOnce([{ id: 'e1', title: 'Meeting' }]);

		await currentHub.load();

		expect(currentHub.plugins.broadcasts).toBe(true);
		expect(currentHub.plugins.events).toBe(true);
		expect(currentHub.broadcasts).toEqual([{ id: 'b1', title: 'Hello' }]);
		expect(currentHub.events).toEqual([{ id: 'e1', title: 'Meeting' }]);
		expect(currentHub.isLoading).toBe(false);
	});

	it('skips fetching data for disabled plugins', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: false },
			{ plugin_key: 'events', is_enabled: false }
		]);

		await currentHub.load();

		expect(mockFetchBroadcasts).not.toHaveBeenCalled();
		expect(mockFetchEvents).not.toHaveBeenCalled();
		expect(currentHub.broadcasts).toEqual([]);
		expect(currentHub.events).toEqual([]);
	});

	it('captures error and re-throws on failure', async () => {
		mockFetchActivePlugins.mockRejectedValueOnce(new Error('network'));

		await expect(currentHub.load()).rejects.toThrow('network');
		expect(currentHub.lastError?.message).toBe('network');
		expect(currentHub.isLoading).toBe(false);
	});
});

describe('currentHub.toggle', () => {
	it('toggles a plugin and updates local state', async () => {
		mockTogglePlugin.mockResolvedValueOnce(undefined);

		await currentHub.toggle('broadcasts', true);

		expect(mockTogglePlugin).toHaveBeenCalledWith('org-1', 'broadcasts', true);
		expect(currentHub.plugins.broadcasts).toBe(true);
	});
});

describe('currentHub.addBroadcast', () => {
	it('creates a broadcast and prepends to the list', async () => {
		const row = { id: 'b2', organization_id: 'org-1', title: 'New', body: 'Body', created_at: '2026-01-01' };
		mockCreateBroadcast.mockResolvedValueOnce(row);

		await currentHub.addBroadcast('New', 'Body');

		expect(mockCreateBroadcast).toHaveBeenCalledWith('org-1', { title: 'New', body: 'Body' });
		expect(currentHub.broadcasts[0]).toEqual(row);
	});
});

describe('currentHub.removeBroadcast', () => {
	it('removes a broadcast from the list', async () => {
		currentHub.broadcasts = [
			{ id: 'b1', organization_id: 'org-1', title: 'A', body: '', created_at: '' },
			{ id: 'b2', organization_id: 'org-1', title: 'B', body: '', created_at: '' }
		];
		mockDeleteBroadcast.mockResolvedValueOnce(undefined);

		await currentHub.removeBroadcast('b1');

		expect(currentHub.broadcasts).toHaveLength(1);
		expect(currentHub.broadcasts[0].id).toBe('b2');
	});
});

describe('currentHub.addEvent', () => {
	it('creates an event and inserts it sorted by starts_at', async () => {
		currentHub.events = [
			{ id: 'e1', organization_id: 'org-1', title: 'Earlier', description: '', starts_at: '2026-04-01', location: '', created_at: '' }
		];
		const row = { id: 'e2', organization_id: 'org-1', title: 'Later', description: '', starts_at: '2026-05-01', location: '', created_at: '' };
		mockCreateEvent.mockResolvedValueOnce(row);

		await currentHub.addEvent({ title: 'Later', description: '', starts_at: '2026-05-01', location: '' });

		expect(currentHub.events).toHaveLength(2);
		expect(currentHub.events[0].id).toBe('e1');
		expect(currentHub.events[1].id).toBe('e2');
	});
});

describe('currentHub.removeEvent', () => {
	it('removes an event from the list', async () => {
		currentHub.events = [
			{ id: 'e1', organization_id: 'org-1', title: 'A', description: '', starts_at: '', location: '', created_at: '' }
		];
		mockDeleteEvent.mockResolvedValueOnce(undefined);

		await currentHub.removeEvent('e1');

		expect(currentHub.events).toHaveLength(0);
	});
});

describe('currentHub.reset', () => {
	it('clears all state', () => {
		currentHub.broadcasts = [{ id: 'b1', organization_id: 'org-1', title: 'X', body: '', created_at: '' }];
		currentHub.lastError = new Error('old');

		currentHub.reset();

		expect(currentHub.broadcasts).toEqual([]);
		expect(currentHub.events).toEqual([]);
		expect(currentHub.plugins).toEqual({ broadcasts: false, events: false });
		expect(currentHub.lastError).toBeNull();
		expect(currentHub.isLoading).toBe(false);
	});
});
