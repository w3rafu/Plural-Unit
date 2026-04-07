/**
 * currentHub — reactive store for hub content and plugin state.
 *
 * Responsibilities:
 *  - Load plugin activation state for the current organization
 *  - Load live data (broadcasts, events) for active plugins
 *  - Expose admin CRUD actions
 *  - Expose plugin toggle actions
 *
 * The hub coordinator page reads from this store. No route
 * component should call hubRepository directly.
 */

import {
	type PluginKey,
	type PluginStateMap,
	buildPluginStateMap
} from './pluginRegistry';
import type { BroadcastRow, EventRow } from '$lib/repositories/hubRepository';
import {
	fetchBroadcasts,
	fetchEvents,
	fetchActivePlugins,
	togglePlugin,
	createBroadcast,
	deleteBroadcast,
	createEvent,
	deleteEvent
} from '$lib/repositories/hubRepository';
import { currentOrganization } from './currentOrganization.svelte';

class CurrentHub {
	isLoading = $state(false);
	plugins = $state<PluginStateMap>({ broadcasts: false, events: false });
	broadcasts = $state<BroadcastRow[]>([]);
	events = $state<EventRow[]>([]);

	get orgId(): string | null {
		return currentOrganization.organization?.id ?? null;
	}

	async load() {
		if (!this.orgId) return;
		this.isLoading = true;
		try {
			const rows = await fetchActivePlugins(this.orgId);
			this.plugins = buildPluginStateMap(rows);

			// Only fetch data for active plugins.
			const [broadcasts, events] = await Promise.all([
				this.plugins.broadcasts ? fetchBroadcasts(this.orgId) : Promise.resolve([]),
				this.plugins.events ? fetchEvents(this.orgId) : Promise.resolve([])
			]);
			this.broadcasts = broadcasts;
			this.events = events;
		} finally {
			this.isLoading = false;
		}
	}

	async toggle(key: PluginKey, enabled: boolean) {
		if (!this.orgId) return;
		await togglePlugin(this.orgId, key, enabled);
		this.plugins = { ...this.plugins, [key]: enabled };
	}

	// ── Broadcast actions ──

	async addBroadcast(title: string, body: string) {
		if (!this.orgId) return;
		const row = await createBroadcast(this.orgId, { title, body });
		this.broadcasts = [row, ...this.broadcasts];
	}

	async removeBroadcast(id: string) {
		await deleteBroadcast(id);
		this.broadcasts = this.broadcasts.filter((b) => b.id !== id);
	}

	// ── Event actions ──

	async addEvent(payload: { title: string; description: string; starts_at: string; location: string }) {
		if (!this.orgId) return;
		const row = await createEvent(this.orgId, payload);
		this.events = [...this.events, row].sort(
			(a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
		);
	}

	async removeEvent(id: string) {
		await deleteEvent(id);
		this.events = this.events.filter((e) => e.id !== id);
	}
}

export const currentHub = new CurrentHub();
