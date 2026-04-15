import { describe, expect, it } from 'vitest';

import {
	buildSmokeHubState,
	buildSmokeMessages,
	buildSmokeUserDetails,
	summarizeSmokeHubState
} from './smokeFixtures';

describe('smokeFixtures', () => {
	it('builds fixture-backed hub state with queue coverage across key buckets', () => {
		const now = Date.parse('2026-04-15T12:00:00.000Z');
		const state = buildSmokeHubState(now);
		const groups = summarizeSmokeHubState(now);

		expect(state.plugins).toEqual({ broadcasts: true, events: true, resources: false });
		expect(state.broadcasts).toHaveLength(3);
		expect(state.events).toHaveLength(4);
		expect(groups.due.length).toBeGreaterThan(0);
		expect(groups.upcoming.length).toBeGreaterThan(0);
		expect(groups.processed.length).toBeGreaterThan(0);
		expect(groups.failed.length).toBeGreaterThan(0);
	});

	it('exposes current-user and message fixtures for smoke mode', () => {
		const user = buildSmokeUserDetails();
		const threads = buildSmokeMessages();

		expect(user.id).toBeTruthy();
		expect(user.name).toBe('Ariana Lopez');
		expect(threads.length).toBeGreaterThan(0);
		expect(threads[0]?.messages.length).toBeGreaterThan(0);
	});
});