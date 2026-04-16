import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIsSmokeModeEnabled } = vi.hoisted(() => ({
	mockIsSmokeModeEnabled: vi.fn(() => false)
}));

// ── Mock profile repository ──

const mockSignInWithPassword = vi.fn();
const mockSignUpWithPassword = vi.fn();
const mockRequestPhoneOtp = vi.fn();
const mockVerifyPhoneOtp = vi.fn();
const mockRequestPasswordReset = vi.fn();
const mockUpdatePassword = vi.fn();
const mockRequestEmailChange = vi.fn();
const mockSignOut = vi.fn();
const mockGetAuthenticatedUser = vi.fn().mockResolvedValue(null);
const mockFetchOwnProfile = vi.fn();
const mockUpsertOwnProfile = vi.fn();
const mockUploadProfileAvatar = vi.fn();
const mockDeleteProfileAvatar = vi.fn();
const mockRequestAccountDeletion = vi.fn();

vi.mock('$lib/repositories/profileRepository', () => ({
	signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
	signUpWithPassword: (...args: any[]) => mockSignUpWithPassword(...args),
	requestPhoneOtp: (...args: any[]) => mockRequestPhoneOtp(...args),
	verifyPhoneOtp: (...args: any[]) => mockVerifyPhoneOtp(...args),
	requestPasswordReset: (...args: any[]) => mockRequestPasswordReset(...args),
	updatePassword: (...args: any[]) => mockUpdatePassword(...args),
	requestEmailChange: (...args: any[]) => mockRequestEmailChange(...args),
	signOut: (...args: any[]) => mockSignOut(...args),
	getAuthenticatedUser: (...args: any[]) => mockGetAuthenticatedUser(...args),
	subscribeToAuthStateChange: () => () => {},
	fetchOwnProfile: (...args: any[]) => mockFetchOwnProfile(...args),
	upsertOwnProfile: (...args: any[]) => mockUpsertOwnProfile(...args),
	uploadProfileAvatar: (...args: any[]) => mockUploadProfileAvatar(...args),
	deleteProfileAvatar: (...args: any[]) => mockDeleteProfileAvatar(...args),
	requestAccountDeletion: (...args: any[]) => mockRequestAccountDeletion(...args)
}));

// Mock session cache
vi.mock('$lib/services/sessionCache', () => ({
	SESSION_CACHE_KEY: 'test-session',
	serializeCachedSession: () => '{}',
	readCachedSession: () => null,
	shouldHandleAsSignedOut: () => false,
	shouldResetCachedBrowserSession: () => false,
	clearCachedBrowserSession: () => {}
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: () => mockIsSmokeModeEnabled(),
	shouldHydrateSmokeHubState: () => false,
	getSmokeModeHubLoadError: () => null
}));

// Mock dependent stores
const mockOrgReset = vi.fn();
const mockHubReset = vi.fn();
const mockMessagesReset = vi.fn();
vi.mock('./currentOrganization.svelte', () => ({
	currentOrganization: { reset: () => mockOrgReset() }
}));
vi.mock('./currentHub.svelte', () => ({
	currentHub: { reset: () => mockHubReset() }
}));
vi.mock('./currentMessages.svelte', () => ({
	currentMessages: { reset: () => mockMessagesReset() }
}));

import { currentUser } from './currentUser.svelte';
import { INITIAL_DETAILS } from '$lib/models/userModel';

beforeEach(() => {
	vi.clearAllMocks();
	mockIsSmokeModeEnabled.mockReturnValue(false);
	// Reset to logged-out state
	(currentUser as any).isLoggedIn = false;
	(currentUser as any).isLoggingIn = false;
	(currentUser as any).details = { ...INITIAL_DETAILS };
	(currentUser as any).lastError = null;
});

describe('currentUser.loginWithEmail', () => {
	it('sets isLoggedIn and syncs details on success', async () => {
		const user = { id: 'u1', email: 'a@b.com' };
		mockSignInWithPassword.mockResolvedValueOnce(user);
		mockFetchOwnProfile.mockResolvedValueOnce({ id: 'u1', name: 'Alice' });

		await currentUser.loginWithEmail('a@b.com', 'pass');

		expect(currentUser.isLoggedIn).toBe(true);
		expect(currentUser.details.id).toBe('u1');
		expect(currentUser.details.name).toBe('Alice');
		expect(currentUser.isLoggingIn).toBe(false);
	});

	it('clears lastError before attempting login', async () => {
		currentUser.lastError = new Error('old');
		const user = { id: 'u1', email: 'a@b.com' };
		mockSignInWithPassword.mockResolvedValueOnce(user);
		mockFetchOwnProfile.mockResolvedValueOnce(null);

		await currentUser.loginWithEmail('a@b.com', 'pass');

		expect(currentUser.lastError).toBeNull();
	});

	it('resets isLoggingIn on failure', async () => {
		mockSignInWithPassword.mockRejectedValueOnce(new Error('bad'));

		await expect(currentUser.loginWithEmail('a@b.com', 'bad')).rejects.toThrow('bad');
		expect(currentUser.isLoggingIn).toBe(false);
	});
});

describe('currentUser.registerWithEmail', () => {
	it('sets context when no confirmation needed', async () => {
		const result = { user: { id: 'u1', email: 'a@b.com' }, requiresEmailConfirmation: false };
		mockSignUpWithPassword.mockResolvedValueOnce(result);
		mockFetchOwnProfile.mockResolvedValueOnce(null);

		const reg = await currentUser.registerWithEmail('a@b.com', 'pass');

		expect(reg.requiresEmailConfirmation).toBe(false);
		expect(currentUser.isLoggedIn).toBe(true);
	});

	it('does not set context when confirmation is required', async () => {
		const result = { user: { id: 'u1', email: 'a@b.com' }, requiresEmailConfirmation: true };
		mockSignUpWithPassword.mockResolvedValueOnce(result);

		const reg = await currentUser.registerWithEmail('a@b.com', 'pass');

		expect(reg.requiresEmailConfirmation).toBe(true);
		expect(currentUser.isLoggedIn).toBe(false);
	});
});

describe('currentUser.requestPhoneCode', () => {
	it('calls requestPhoneOtp', async () => {
		mockRequestPhoneOtp.mockResolvedValueOnce(undefined);

		await currentUser.requestPhoneCode('+1555');

		expect(mockRequestPhoneOtp).toHaveBeenCalledWith('+1555');
		expect(currentUser.isLoggingIn).toBe(false);
	});
});

describe('currentUser.verifyPhoneCode', () => {
	it('sets logged in state on success', async () => {
		const user = { id: 'u1', email: '' };
		mockVerifyPhoneOtp.mockResolvedValueOnce(user);
		mockFetchOwnProfile.mockResolvedValueOnce(null);

		await currentUser.verifyPhoneCode('+1555', '123456');

		expect(currentUser.isLoggedIn).toBe(true);
		expect(currentUser.isLoggingIn).toBe(false);
	});
});

describe('currentUser.requestPasswordResetEmail', () => {
	it('delegates to the repository', async () => {
		mockRequestPasswordReset.mockResolvedValueOnce(undefined);

		await currentUser.requestPasswordResetEmail('a@b.com');

		expect(mockRequestPasswordReset).toHaveBeenCalledWith('a@b.com');
	});
});

describe('currentUser.setNewPassword', () => {
	it('delegates to the repository', async () => {
		mockUpdatePassword.mockResolvedValueOnce(undefined);

		await currentUser.setNewPassword('newpass');

		expect(mockUpdatePassword).toHaveBeenCalledWith('newpass');
	});
});

describe('currentUser.requestEmailChange', () => {
	it('updates local email when change is immediate', async () => {
		(currentUser as any).isLoggedIn = true;
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1', email: 'old@b.com' };

		mockRequestEmailChange.mockResolvedValueOnce({ changed: true, requiresConfirmation: false });

		const result = await currentUser.requestEmailChange('new@b.com');

		expect(result.changed).toBe(true);
		expect(currentUser.details.email).toBe('new@b.com');
	});

	it('does not update local email when confirmation required', async () => {
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1', email: 'old@b.com' };

		mockRequestEmailChange.mockResolvedValueOnce({ changed: true, requiresConfirmation: true });

		await currentUser.requestEmailChange('new@b.com');

		expect(currentUser.details.email).toBe('old@b.com');
	});
});

describe('currentUser.updateProfileDetails', () => {
	it('upserts and updates local state', async () => {
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1' };
		mockUpsertOwnProfile.mockResolvedValueOnce(undefined);

		await currentUser.updateProfileDetails({ name: 'Bob', phone_number: '+1555', avatar_url: '', bio: 'Hello' });

		expect(mockUpsertOwnProfile).toHaveBeenCalledWith('u1', { name: 'Bob', phone_number: '+1555', avatar_url: '', bio: 'Hello' });
		expect(currentUser.details.name).toBe('Bob');
	});

	it('stays local in smoke mode', async () => {
		mockIsSmokeModeEnabled.mockReturnValue(true);
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1' };

		await currentUser.updateProfileDetails({
			name: 'Smoke Bob',
			phone_number: '+1555',
			avatar_url: '',
			bio: 'Local smoke bio'
		});

		expect(mockUpsertOwnProfile).not.toHaveBeenCalled();
		expect(currentUser.details.name).toBe('Smoke Bob');
		expect(currentUser.details.bio).toBe('Local smoke bio');
	});
});

describe('currentUser.uploadProfileAvatar', () => {
	it('uploads and updates avatar_url', async () => {
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1' };
		mockUploadProfileAvatar.mockResolvedValueOnce('https://example.com/avatar.png?v=1');

		const url = await currentUser.uploadProfileAvatar(new File(['x'], 'a.png', { type: 'image/png' }));

		expect(url).toContain('avatar.png');
		expect(currentUser.details.avatar_url).toBe(url);
	});

	it('throws when no user id', async () => {
		(currentUser as any).details = { ...INITIAL_DETAILS, id: '' };

		await expect(
			currentUser.uploadProfileAvatar(new File(['x'], 'a.png', { type: 'image/png' }))
		).rejects.toThrow('No authenticated user');
	});
});

describe('currentUser.removeProfileAvatar', () => {
	it('clears avatar_url after deletion', async () => {
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1', avatar_url: 'https://old.png' };
		mockDeleteProfileAvatar.mockResolvedValueOnce(undefined);

		const url = await currentUser.removeProfileAvatar();

		expect(url).toBe('');
		expect(currentUser.details.avatar_url).toBe('');
	});
});

describe('currentUser.requestAccountDeletion', () => {
	it('stores the pending deletion timestamp locally', async () => {
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1' };
		mockRequestAccountDeletion.mockResolvedValueOnce('2026-04-16T10:00:00.000Z');

		await currentUser.requestAccountDeletion();

		expect(currentUser.details.deletion_requested_at).toBe('2026-04-16T10:00:00.000Z');
		expect(currentUser.details.deletion_reviewed_at).toBeNull();
	});

	it('stays local in smoke mode', async () => {
		mockIsSmokeModeEnabled.mockReturnValue(true);
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-16T12:30:00.000Z'));
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1' };

		try {
			await currentUser.requestAccountDeletion();

			expect(mockRequestAccountDeletion).not.toHaveBeenCalled();
			expect(currentUser.details.deletion_requested_at).toBe('2026-04-16T12:30:00.000Z');
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('currentUser.logout', () => {
	it('signs out and resets all stores', async () => {
		(currentUser as any).isLoggedIn = true;
		(currentUser as any).details = { ...INITIAL_DETAILS, id: 'u1', name: 'Alice' };
		mockSignOut.mockResolvedValueOnce(undefined);

		await currentUser.logout();

		expect(currentUser.isLoggedIn).toBe(false);
		expect(currentUser.details.id).toBe('');
		expect(mockOrgReset).toHaveBeenCalled();
		expect(mockHubReset).toHaveBeenCalled();
		expect(mockMessagesReset).toHaveBeenCalled();
	});

	it('captures error but still resets on signOut failure', async () => {
		(currentUser as any).isLoggedIn = true;
		mockSignOut.mockRejectedValueOnce(new Error('network'));

		await currentUser.logout();

		expect(currentUser.isLoggedIn).toBe(false);
		expect(currentUser.lastError?.message).toBe('network');
		expect(mockOrgReset).toHaveBeenCalled();
		expect(mockHubReset).toHaveBeenCalled();
		expect(mockMessagesReset).toHaveBeenCalled();
	});
});
