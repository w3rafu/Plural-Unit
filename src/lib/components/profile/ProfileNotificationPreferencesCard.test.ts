// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockCurrentHub,
	mockCurrentOrganization,
	mockToast,
	mockHasSavedPushSubscription,
	mockIsPushSupported,
	mockSubscribeToPush,
	mockSavePushSubscription,
	mockRemovePushSubscription,
	mockTriggerPushNotification
} = vi.hoisted(() => ({
	mockCurrentHub: {
		notificationPreferences: {
			broadcast: true,
			event: true,
			message: true
		},
		hasLoadedForCurrentOrg: true,
		isLoading: false,
		isSavingNotificationPreferences: false,
		load: vi.fn(),
		updateNotificationPreferences: vi.fn().mockResolvedValue(undefined)
	},
	mockCurrentOrganization: {
		organization: { id: 'org-1', name: 'Plural Unit' },
		membership: { profile_id: 'profile-1' }
	},
	mockToast: vi.fn(),
	mockHasSavedPushSubscription: vi.fn().mockResolvedValue(true),
	mockIsPushSupported: vi.fn().mockReturnValue(true),
	mockSubscribeToPush: vi.fn(),
	mockSavePushSubscription: vi.fn(),
	mockRemovePushSubscription: vi.fn(),
	mockTriggerPushNotification: vi.fn()
}));

vi.mock('$lib/stores/currentHub.svelte', () => ({
	currentHub: mockCurrentHub
}));

vi.mock('$lib/stores/currentOrganization.svelte', () => ({
	currentOrganization: mockCurrentOrganization
}));

vi.mock('$lib/stores/toast.svelte', () => ({
	toast: (...args: any[]) => mockToast(...args)
}));

vi.mock('$lib/services/pushSubscription', () => ({
	isPushSupported: () => mockIsPushSupported(),
	subscribeToPush: (...args: any[]) => mockSubscribeToPush(...args),
	savePushSubscription: (...args: any[]) => mockSavePushSubscription(...args),
	removePushSubscription: (...args: any[]) => mockRemovePushSubscription(...args),
	hasSavedPushSubscription: (...args: any[]) => mockHasSavedPushSubscription(...args)
}));

vi.mock('$lib/services/pushNotification', () => ({
	triggerPushNotification: (...args: any[]) => mockTriggerPushNotification(...args)
}));

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_VAPID_KEY: 'test-vapid-key' }
}));

vi.mock('$app/environment', () => ({
	dev: false
}));

import ProfileNotificationPreferencesCard from './ProfileNotificationPreferencesCard.svelte';

describe('ProfileNotificationPreferencesCard', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mockCurrentHub.notificationPreferences = {
			broadcast: true,
			event: true,
			message: true
		};
		mockCurrentHub.hasLoadedForCurrentOrg = true;
		mockCurrentHub.isLoading = false;
		mockCurrentHub.isSavingNotificationPreferences = false;
		mockCurrentHub.updateNotificationPreferences.mockResolvedValue(undefined);
		mockCurrentOrganization.organization = { id: 'org-1', name: 'Plural Unit' };
		mockCurrentOrganization.membership = { profile_id: 'profile-1' };
		mockIsPushSupported.mockReturnValue(true);
		mockHasSavedPushSubscription.mockResolvedValue(true);
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('separates hub alerts, direct-message push, and device push controls', async () => {
		render(ProfileNotificationPreferencesCard);

		expect(screen.getByText('Notifications')).toBeTruthy();
		expect(screen.getByText('Hub alerts in the app')).toBeTruthy();
		expect(screen.getByText('Direct message push')).toBeTruthy();
		expect(
			screen.getByText(
				'Allow push notifications for new direct messages from this organization when push is enabled on this device.'
			)
		).toBeTruthy();

		await waitFor(() => {
			expect(screen.getByText('This device')).toBeTruthy();
		});
		expect(screen.getByText('Enable push on this device')).toBeTruthy();
	});

	it('saves clarified organization notification settings', async () => {
		render(ProfileNotificationPreferencesCard);

		await waitFor(() => {
			expect(screen.getByText('This device')).toBeTruthy();
		});

		await fireEvent.click(document.querySelector('#notification-preferences-events') as Element);
		await fireEvent.click(document.querySelector('#notification-preferences-messages') as Element);
		await fireEvent.click(screen.getByRole('button', { name: 'Save organization settings' }));

		expect(mockCurrentHub.updateNotificationPreferences).toHaveBeenCalledWith({
			broadcast: true,
			event: false,
			message: false
		});
		expect(mockToast).toHaveBeenCalledWith({
			title: 'Notifications updated',
			description: 'Your notification settings for this organization were saved.',
			variant: 'success'
		});
	});
});