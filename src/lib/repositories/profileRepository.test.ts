import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase client ──

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
	data: { subscription: { unsubscribe: vi.fn() } }
}));

const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();
const mockEq = vi.fn((): any => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn((): any => ({ eq: mockEq }));

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();
const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.png' } }));

const mockStorageFrom = vi.fn(() => ({
	upload: mockUpload,
	remove: mockRemove,
	list: mockList,
	getPublicUrl: mockGetPublicUrl
}));

const mockFrom = vi.fn((): any => ({
	select: mockSelect,
	upsert: mockUpsert
}));

const mockClient = {
	auth: {
		signInWithPassword: mockSignInWithPassword,
		signUp: mockSignUp,
		signInWithOtp: mockSignInWithOtp,
		verifyOtp: mockVerifyOtp,
		resetPasswordForEmail: mockResetPasswordForEmail,
		updateUser: mockUpdateUser,
		signOut: mockSignOut,
		getUser: mockGetUser,
		onAuthStateChange: mockOnAuthStateChange
	},
	from: mockFrom,
	storage: { from: mockStorageFrom }
};

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: () => mockClient
}));

// Mock retry to just call the function directly (no actual retries in tests)
vi.mock('$lib/services/retry', () => ({
	withRetry: (fn: () => any) => fn()
}));

import {
	signInWithPassword,
	signUpWithPassword,
	requestPhoneOtp,
	verifyPhoneOtp,
	requestPasswordReset,
	updatePassword,
	requestEmailChange,
	signOut,
	getAuthenticatedUser,
	subscribeToAuthStateChange,
	fetchOwnProfile,
	upsertOwnProfile,
	uploadProfileAvatar,
	deleteProfileAvatar
} from './profileRepository';

beforeEach(() => {
	vi.clearAllMocks();
});

// ── Auth ──

describe('signInWithPassword', () => {
	it('returns the authenticated user', async () => {
		const user = { id: 'u1', email: 'a@b.com' };
		mockSignInWithPassword.mockResolvedValueOnce({ data: { user }, error: null });

		const result = await signInWithPassword('a@b.com', 'pass');

		expect(result).toEqual(user);
		expect(mockSignInWithPassword).toHaveBeenCalledWith(
			expect.objectContaining({ email: 'a@b.com', password: 'pass' })
		);
	});

	it('normalizes email to lowercase', async () => {
		const user = { id: 'u1', email: 'a@b.com' };
		mockSignInWithPassword.mockResolvedValueOnce({ data: { user }, error: null });

		await signInWithPassword('  A@B.COM  ', 'pass');

		expect(mockSignInWithPassword).toHaveBeenCalledWith(
			expect.objectContaining({ email: 'a@b.com' })
		);
	});

	it('throws on auth error', async () => {
		mockSignInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid credentials' } });

		await expect(signInWithPassword('a@b.com', 'bad')).rejects.toThrow('Invalid credentials');
	});

	it('throws when user is null without error', async () => {
		mockSignInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: null });

		await expect(signInWithPassword('a@b.com', 'pass')).rejects.toThrow('Could not resolve');
	});
});

describe('signUpWithPassword', () => {
	it('returns user and no confirmation when session exists', async () => {
		const user = { id: 'u1', email: 'a@b.com' };
		mockSignUp.mockResolvedValueOnce({ data: { user, session: {} }, error: null });

		const result = await signUpWithPassword('a@b.com', 'pass');

		expect(result.user).toEqual(user);
		expect(result.requiresEmailConfirmation).toBe(false);
	});

	it('indicates email confirmation when no session', async () => {
		const user = { id: 'u1', email: 'a@b.com' };
		mockSignUp.mockResolvedValueOnce({ data: { user, session: null }, error: null });

		const result = await signUpWithPassword('a@b.com', 'pass');

		expect(result.requiresEmailConfirmation).toBe(true);
	});

	it('throws on signup error', async () => {
		mockSignUp.mockResolvedValueOnce({ data: { user: null }, error: { message: 'exists' } });

		await expect(signUpWithPassword('a@b.com', 'pass')).rejects.toThrow('exists');
	});
});

describe('requestPhoneOtp', () => {
	it('calls signInWithOtp with the phone number', async () => {
		mockSignInWithOtp.mockResolvedValueOnce({ error: null });

		await requestPhoneOtp('+15551234567');

		expect(mockSignInWithOtp).toHaveBeenCalledWith(
			expect.objectContaining({ phone: '+15551234567' })
		);
	});

	it('throws on error', async () => {
		mockSignInWithOtp.mockResolvedValueOnce({ error: { message: 'rate limit' } });

		await expect(requestPhoneOtp('+15551234567')).rejects.toThrow('rate limit');
	});
});

describe('verifyPhoneOtp', () => {
	it('returns the user on successful verification', async () => {
		const user = { id: 'u1' };
		mockVerifyOtp.mockResolvedValueOnce({ data: { user }, error: null });

		const result = await verifyPhoneOtp('+15551234567', '123456');

		expect(result).toEqual(user);
	});

	it('throws when user is null', async () => {
		mockVerifyOtp.mockResolvedValueOnce({ data: { user: null }, error: null });

		await expect(verifyPhoneOtp('+1555', '000')).rejects.toThrow('Could not verify');
	});
});

describe('requestPasswordReset', () => {
	it('calls resetPasswordForEmail with normalized email', async () => {
		mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

		await requestPasswordReset('  User@Test.COM ');

		expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@test.com');
	});

	it('throws on error', async () => {
		mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'reset fail' } });

		await expect(requestPasswordReset('a@b.com')).rejects.toThrow('reset fail');
	});
});

describe('updatePassword', () => {
	it('calls updateUser with the new password', async () => {
		mockUpdateUser.mockResolvedValueOnce({ error: null });

		await updatePassword('newpass123');

		expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass123' });
	});
});

describe('requestEmailChange', () => {
	it('returns changed=false when email is the same', async () => {
		mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'a@b.com' } } });

		const result = await requestEmailChange('A@B.COM');

		expect(result).toEqual({ changed: false, requiresConfirmation: false });
	});

	it('returns changed=true and requiresConfirmation when email differs', async () => {
		mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'old@b.com' } } });
		mockUpdateUser.mockResolvedValueOnce({
			data: { user: { email: 'old@b.com' } },
			error: null
		});

		const result = await requestEmailChange('new@b.com');

		expect(result.changed).toBe(true);
		expect(result.requiresConfirmation).toBe(true);
	});

	it('throws when no authenticated user', async () => {
		mockGetUser.mockResolvedValueOnce({ data: { user: null } });

		await expect(requestEmailChange('new@b.com')).rejects.toThrow('No authenticated user');
	});
});

describe('signOut', () => {
	it('calls auth signOut', async () => {
		mockSignOut.mockResolvedValueOnce({ error: null });

		await signOut();

		expect(mockSignOut).toHaveBeenCalled();
	});

	it('throws on error', async () => {
		mockSignOut.mockResolvedValueOnce({ error: { message: 'signout fail' } });

		await expect(signOut()).rejects.toThrow('signout fail');
	});
});

describe('getAuthenticatedUser', () => {
	it('returns the user when authenticated', async () => {
		mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

		const user = await getAuthenticatedUser();
		expect(user).toEqual({ id: 'u1' });
	});

	it('returns null when no user', async () => {
		mockGetUser.mockResolvedValueOnce({ data: { user: null } });

		const user = await getAuthenticatedUser();
		expect(user).toBeNull();
	});
});

describe('subscribeToAuthStateChange', () => {
	it('returns an unsubscribe function', () => {
		const unsub = subscribeToAuthStateChange(vi.fn());
		expect(typeof unsub).toBe('function');
	});
});

// ── Profile CRUD ──

describe('fetchOwnProfile', () => {
	it('returns profile data for the user', async () => {
		const profile = { id: 'u1', name: 'Alice', email: 'a@b.com', phone_number: null, avatar_url: '' };
		mockMaybeSingle.mockResolvedValueOnce({ data: profile, error: null });

		const result = await fetchOwnProfile('u1');

		expect(mockFrom).toHaveBeenCalledWith('profiles');
		expect(result).toEqual(profile);
	});

	it('returns null when no profile exists', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

		const result = await fetchOwnProfile('u1');
		expect(result).toBeNull();
	});

	it('throws on error', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'profile fail' } });

		await expect(fetchOwnProfile('u1')).rejects.toThrow('profile fail');
	});
});

describe('upsertOwnProfile', () => {
	it('upserts profile data', async () => {
		mockUpsert.mockResolvedValueOnce({ error: null });

		await upsertOwnProfile('u1', { name: 'Updated' });

		expect(mockFrom).toHaveBeenCalledWith('profiles');
		expect(mockUpsert).toHaveBeenCalledWith(
			{ id: 'u1', name: 'Updated' },
			{ onConflict: 'id' }
		);
	});

	it('throws on error', async () => {
		mockUpsert.mockResolvedValueOnce({ error: { message: 'upsert fail' } });

		await expect(upsertOwnProfile('u1', { name: 'X' })).rejects.toThrow('upsert fail');
	});
});

// ── Avatar ──

describe('uploadProfileAvatar', () => {
	it('removes existing files, uploads the new file, and returns a versioned URL', async () => {
		mockList.mockResolvedValueOnce({ data: [{ name: 'old-avatar.png' }], error: null });
		mockRemove.mockResolvedValueOnce({ error: null });
		mockUpload.mockResolvedValueOnce({ error: null });

		const url = await uploadProfileAvatar('u1', new File(['img'], 'photo.png', { type: 'image/png' }));

		expect(mockStorageFrom).toHaveBeenCalledWith('profile-avatars');
		expect(mockRemove).toHaveBeenCalled();
		expect(mockUpload).toHaveBeenCalled();
		expect(url).toContain('https://example.com/avatar.png');
		expect(url).toContain('v=');
	});

	it('throws on upload error', async () => {
		mockList.mockResolvedValueOnce({ data: [], error: null });
		mockUpload.mockResolvedValueOnce({ error: { message: 'upload fail' } });

		await expect(
			uploadProfileAvatar('u1', new File(['img'], 'photo.png', { type: 'image/png' }))
		).rejects.toThrow('upload fail');
	});
});

describe('deleteProfileAvatar', () => {
	it('removes all avatar files for the user', async () => {
		mockList.mockResolvedValueOnce({ data: [{ name: 'avatar.png' }], error: null });
		mockRemove.mockResolvedValueOnce({ error: null });

		await deleteProfileAvatar('u1');

		expect(mockStorageFrom).toHaveBeenCalledWith('profile-avatars');
		expect(mockRemove).toHaveBeenCalled();
	});

	it('does nothing when no files exist', async () => {
		mockList.mockResolvedValueOnce({ data: [], error: null });

		await deleteProfileAvatar('u1');

		expect(mockRemove).not.toHaveBeenCalled();
	});
});
