import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: vi.fn()
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: vi.fn(() => false)
}));

import { isPushSupported } from './pushSubscription';
import { triggerPushNotification } from './pushNotification';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';
import { getSupabaseClient } from '$lib/supabaseClient';

describe('isPushSupported', () => {
	it('returns false when serviceWorker is missing', () => {
		const original = navigator.serviceWorker;
		Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
		expect(isPushSupported()).toBe(false);
		Object.defineProperty(navigator, 'serviceWorker', { value: original, configurable: true });
	});
});

describe('triggerPushNotification', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('is a no-op in smoke mode', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(true);
		const mockClient = { functions: { invoke: vi.fn() } };
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		await triggerPushNotification({
			kind: 'broadcast',
			organization_id: 'org-1',
			source_id: 'broadcast-1',
			title: 'Test',
			body: 'Hello'
		});

		expect(mockClient.functions.invoke).not.toHaveBeenCalled();
	});

	it('calls the send-push Edge Function', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const mockInvoke = vi.fn().mockResolvedValue({ error: null });
		const mockClient = { functions: { invoke: mockInvoke } };
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		await triggerPushNotification({
			kind: 'broadcast',
			organization_id: 'org-1',
			source_id: 'broadcast-1',
			title: 'Test',
			body: 'Hello',
			url: '/hub'
		});

		expect(mockInvoke).toHaveBeenCalledWith('send-push', {
			body: {
				kind: 'broadcast',
				organization_id: 'org-1',
				source_id: 'broadcast-1',
				title: 'Test',
				body: 'Hello',
				url: '/hub'
			}
		});
	});

	it('swallows errors without throwing', async () => {
		vi.mocked(isSmokeModeEnabled).mockReturnValue(false);
		const mockInvoke = vi.fn().mockRejectedValue(new Error('Network failure'));
		const mockClient = { functions: { invoke: mockInvoke } };
		vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);

		await expect(
			triggerPushNotification({
				kind: 'broadcast',
				organization_id: 'org-1',
				source_id: 'broadcast-1',
				title: 'Test',
				body: 'Hello'
			})
		).resolves.toBeUndefined();
	});
});
