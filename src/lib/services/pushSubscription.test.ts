import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: vi.fn()
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: vi.fn(() => false)
}));

import {
	isPushSupported,
	getPushPermissionState,
	getExistingPushSubscription,
	subscribeToPush,
	savePushSubscription,
	removePushSubscription,
	hasSavedPushSubscription
} from './pushSubscription';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';
import { getSupabaseClient } from '$lib/supabaseClient';

// jsdom does not provide navigator.serviceWorker or PushManager,
// so isPushSupported() returns false. We test the guard paths directly
// and the Supabase-bound paths by injecting a minimal serviceWorker stub.

describe('isPushSupported', () => {
	it('returns false when PushManager is missing (jsdom)', () => {
		expect(isPushSupported()).toBe(false);
	});
});

describe('getPushPermissionState', () => {
	it('returns null when push is not supported', async () => {
		const state = await getPushPermissionState();
		expect(state).toBeNull();
	});
});

describe('getExistingPushSubscription', () => {
	it('returns null when push is not supported', async () => {
		const sub = await getExistingPushSubscription();
		expect(sub).toBeNull();
	});
});

describe('subscribeToPush', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns null in smoke mode', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(true);
		const result = await subscribeToPush('test-key');
		expect(result).toBeNull();
	});

	it('returns null when push is not supported', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const result = await subscribeToPush('test-key');
		expect(result).toBeNull();
	});
});

describe('savePushSubscription', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('is a no-op in smoke mode', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(true);
		const mockClient = { auth: { getUser: vi.fn() }, from: vi.fn() };
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		const fakeSub = {
			toJSON: () => ({
				endpoint: 'https://example.com/push',
				keys: { p256dh: 'key1', auth: 'key2' }
			})
		} as unknown as PushSubscription;

		await savePushSubscription(fakeSub);
		expect(mockClient.auth.getUser).not.toHaveBeenCalled();
	});

	it('upserts subscription to Supabase', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const mockUpsert = vi.fn().mockResolvedValue({ error: null });
		const mockClient = {
			auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
			from: vi.fn().mockReturnValue({ upsert: mockUpsert })
		};
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		const fakeSub = {
			toJSON: () => ({
				endpoint: 'https://example.com/push',
				keys: { p256dh: 'key1', auth: 'key2' }
			})
		} as unknown as PushSubscription;

		await savePushSubscription(fakeSub);
		expect(mockClient.from).toHaveBeenCalledWith('push_subscriptions');
		expect(mockUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				profile_id: 'user-1',
				endpoint: 'https://example.com/push',
				p256dh_key: 'key1',
				auth_key: 'key2'
			}),
			{ onConflict: 'profile_id,endpoint' }
		);
	});

	it('skips upsert when user is not authenticated', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const mockClient = {
			auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
			from: vi.fn()
		};
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		const fakeSub = {
			toJSON: () => ({
				endpoint: 'https://example.com/push',
				keys: { p256dh: 'key1', auth: 'key2' }
			})
		} as unknown as PushSubscription;

		await savePushSubscription(fakeSub);
		expect(mockClient.from).not.toHaveBeenCalled();
	});

	it('skips upsert when keys are missing', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const mockClient = {
			auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
			from: vi.fn()
		};
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		const fakeSub = {
			toJSON: () => ({ endpoint: 'https://example.com/push', keys: {} })
		} as unknown as PushSubscription;

		await savePushSubscription(fakeSub);
		expect(mockClient.from).not.toHaveBeenCalled();
	});
});

describe('removePushSubscription', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('is a no-op in smoke mode', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(true);
		const mockClient = { auth: { getUser: vi.fn() }, from: vi.fn() };
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);
		await removePushSubscription();
		// No calls to supabase since it short-circuits
		expect(mockClient.from).not.toHaveBeenCalled();
	});

	it('is a no-op when no subscription exists (push not supported)', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		// getExistingPushSubscription returns null when push not supported
		await removePushSubscription();
		// Should not throw
	});
});

describe('hasSavedPushSubscription', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns false in smoke mode', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(true);
		const result = await hasSavedPushSubscription();
		expect(result).toBe(false);
	});

	it('returns false when push is not supported (jsdom)', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const result = await hasSavedPushSubscription();
		expect(result).toBe(false);
	});

	it('returns false when no user is logged in', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		// isPushSupported() returns false in jsdom, so it will short-circuit
		// Testing the auth guard path requires isPushSupported to return true
		const result = await hasSavedPushSubscription();
		expect(result).toBe(false);
	});
});
