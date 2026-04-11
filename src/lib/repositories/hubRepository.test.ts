// @ts-nocheck — Supabase mock chain returns are loosely typed by design.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the Supabase client ──

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, order: mockOrder }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({ error: null }));
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle, select: mockSelect, order: mockOrder, eq: mockEq }));
const mockOrder = vi.fn(() => ({ data: [], error: null }));
const mockRpc = vi.fn();

const mockFrom = vi.fn(() => ({
	select: mockSelect,
	insert: mockInsert,
	delete: mockDelete,
	upsert: mockUpsert,
	eq: mockEq
}));

const mockClient = {
	from: mockFrom,
	rpc: mockRpc
};

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: () => mockClient
}));

import {
	fetchBroadcasts,
	createBroadcast,
	deleteBroadcast,
	fetchEvents,
	createEvent,
	deleteEvent,
	fetchActivePlugins,
	togglePlugin
} from './hubRepository';

beforeEach(() => {
	vi.clearAllMocks();
});

// ── Broadcasts ──

describe('fetchBroadcasts', () => {
	it('queries hub_broadcasts filtered by organization_id', async () => {
		mockOrder.mockResolvedValueOnce({ data: [{ id: 'b1', title: 'Hello' }], error: null });

		const result = await fetchBroadcasts('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_broadcasts');
		expect(result).toEqual([{ id: 'b1', title: 'Hello' }]);
	});

	it('throws on Supabase error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'db fail' } });

		await expect(fetchBroadcasts('org-1')).rejects.toThrow('db fail');
	});

	it('returns empty array when data is null', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: null });

		const result = await fetchBroadcasts('org-1');
		expect(result).toEqual([]);
	});
});

describe('createBroadcast', () => {
	it('inserts into hub_broadcasts and returns the row', async () => {
		const row = { id: 'b2', organization_id: 'org-1', title: 'New', body: 'Body', created_at: '2026-01-01' };
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await createBroadcast('org-1', { title: 'New', body: 'Body' });

		expect(mockFrom).toHaveBeenCalledWith('hub_broadcasts');
		expect(mockInsert).toHaveBeenCalledWith({ organization_id: 'org-1', title: 'New', body: 'Body' });
		expect(result).toEqual(row);
	});

	it('throws on insert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'insert fail' } });

		await expect(createBroadcast('org-1', { title: 'X', body: 'Y' })).rejects.toThrow('insert fail');
	});
});

describe('deleteBroadcast', () => {
	it('deletes from hub_broadcasts by id', async () => {
		mockEq.mockResolvedValueOnce({ error: null });

		await deleteBroadcast('b1');

		expect(mockFrom).toHaveBeenCalledWith('hub_broadcasts');
	});

	it('throws on delete error', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'delete fail' } });

		await expect(deleteBroadcast('b1')).rejects.toThrow('delete fail');
	});
});

// ── Events ──

describe('fetchEvents', () => {
	it('queries hub_events filtered by organization_id', async () => {
		mockOrder.mockResolvedValueOnce({ data: [{ id: 'e1', title: 'Meeting' }], error: null });

		const result = await fetchEvents('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_events');
		expect(result).toEqual([{ id: 'e1', title: 'Meeting' }]);
	});

	it('throws on error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'events fail' } });

		await expect(fetchEvents('org-1')).rejects.toThrow('events fail');
	});
});

describe('createEvent', () => {
	it('inserts into hub_events and returns the row', async () => {
		const payload = { title: 'Meeting', description: 'Desc', starts_at: '2026-04-11', location: 'Room A' };
		const row = { id: 'e2', organization_id: 'org-1', ...payload, created_at: '2026-01-01' };
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await createEvent('org-1', payload);

		expect(mockFrom).toHaveBeenCalledWith('hub_events');
		expect(result).toEqual(row);
	});

	it('throws on insert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'event insert fail' } });

		await expect(
			createEvent('org-1', { title: 'X', description: 'Y', starts_at: '2026-01-01', location: 'Z' })
		).rejects.toThrow('event insert fail');
	});
});

describe('deleteEvent', () => {
	it('deletes from hub_events by id', async () => {
		mockEq.mockResolvedValueOnce({ error: null });

		await deleteEvent('e1');

		expect(mockFrom).toHaveBeenCalledWith('hub_events');
	});

	it('throws on delete error', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'event delete fail' } });

		await expect(deleteEvent('e1')).rejects.toThrow('event delete fail');
	});
});

// ── Plugins ──

describe('fetchActivePlugins', () => {
	it('queries hub_plugins by organization_id', async () => {
		mockEq.mockResolvedValueOnce({
			data: [{ plugin_key: 'broadcasts', is_enabled: true }],
			error: null
		});

		const result = await fetchActivePlugins('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_plugins');
		expect(result).toEqual([{ plugin_key: 'broadcasts', is_enabled: true }]);
	});

	it('throws on error', async () => {
		mockEq.mockResolvedValueOnce({ data: null, error: { message: 'plugins fail' } });

		await expect(fetchActivePlugins('org-1')).rejects.toThrow('plugins fail');
	});
});

describe('togglePlugin', () => {
	it('upserts the plugin state', async () => {
		mockUpsert.mockResolvedValueOnce({ error: null });

		await togglePlugin('org-1', 'broadcasts', true);

		expect(mockFrom).toHaveBeenCalledWith('hub_plugins');
	});

	it('throws on upsert error', async () => {
		mockUpsert.mockResolvedValueOnce({ error: { message: 'toggle fail' } });

		await expect(togglePlugin('org-1', 'broadcasts', false)).rejects.toThrow('toggle fail');
	});
});
