import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./currentUser.svelte', () => ({
	currentUser: {
		isLoggedIn: false,
		details: { name: '' },
		loginWithEmail: vi.fn(),
		registerWithEmail: vi.fn(),
		requestPhoneCode: vi.fn(),
		verifyPhoneCode: vi.fn(),
		requestPasswordResetEmail: vi.fn(),
		setNewPassword: vi.fn(),
		updateName: vi.fn(),
		logout: vi.fn()
	}
}));

vi.mock('./currentOrganization.svelte', () => ({
	currentOrganization: {
		hasResolvedMembership: false,
		isMember: false,
		create: vi.fn(),
		joinByCode: vi.fn(),
		acceptInvite: vi.fn()
	}
}));

vi.mock('$lib/demo/smokeMode', () => ({
	syncSmokeModeFromUrl: vi.fn(() => false)
}));

vi.mock('$lib/repositories/profileRepository', () => ({
	subscribeToAuthStateChange: vi.fn(() => () => {})
}));

import { authBoundary } from './authBoundary.svelte';
import { currentUser } from './currentUser.svelte';
import { currentOrganization } from './currentOrganization.svelte';

describe('authBoundary', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		// Reset state
		authBoundary.setAuthChannel('phone');
		authBoundary.setAuthMode('login');
		authBoundary.email = '';
		authBoundary.password = '';
		authBoundary.confirmPassword = '';
		authBoundary.phone = '';
		authBoundary.otpCode = '';
		authBoundary.onboardingName = '';
		authBoundary.orgName = '';
		authBoundary.orgJoinCode = '';
		authBoundary.orgInviteToken = '';
	});

	describe('setAuthChannel', () => {
		it('switches between phone and email', () => {
			authBoundary.setAuthChannel('email');
			expect(authBoundary.authChannel).toBe('email');

			authBoundary.setAuthChannel('phone');
			expect(authBoundary.authChannel).toBe('phone');
		});

		it('resets the auth step to request_code', () => {
			authBoundary.authStep = 'verify_code';
			authBoundary.setAuthChannel('email');
			expect(authBoundary.authStep).toBe('request_code');
		});

		it('clears field errors and feedback', () => {
			authBoundary.loginFeedback = 'some error';
			authBoundary.setAuthChannel('phone');
			expect(authBoundary.loginFeedback).toBe('');
		});
	});

	describe('setAuthMode', () => {
		it('switches between login and register', () => {
			authBoundary.setAuthMode('register');
			expect(authBoundary.authMode).toBe('register');
		});

		it('clears password on mode change (except reset_password)', () => {
			authBoundary.password = 'secret';
			authBoundary.setAuthMode('register');
			expect(authBoundary.password).toBe('');
		});

		it('preserves password when switching to reset_password', () => {
			authBoundary.password = 'secret';
			authBoundary.setAuthMode('reset_password');
			expect(authBoundary.password).toBe('secret');
		});
	});

	describe('resetAuthFlow', () => {
		it('resets step and clears feedback', () => {
			authBoundary.authStep = 'verify_code';
			authBoundary.loginFeedback = 'error';
			authBoundary.otpCode = '123456';
			authBoundary.resetAuthFlow();
			expect(authBoundary.authStep).toBe('request_code');
			expect(authBoundary.otpCode).toBe('');
			expect(authBoundary.loginFeedback).toBe('');
		});
	});

	describe('setOrgMode', () => {
		it('switches between create and join', () => {
			authBoundary.setOrgMode('join');
			expect(authBoundary.orgMode).toBe('join');
			authBoundary.setOrgMode('create');
			expect(authBoundary.orgMode).toBe('create');
		});

		it('clears org feedback', () => {
			authBoundary.orgFeedback = 'some error';
			authBoundary.setOrgMode('join');
			expect(authBoundary.orgFeedback).toBe('');
		});
	});

	describe('onEmailLoginSubmit', () => {
		it('sets field error for empty email', async () => {
			authBoundary.setAuthChannel('email');
			authBoundary.email = '';
			authBoundary.password = 'password123';
			await authBoundary.onEmailLoginSubmit();
			expect(authBoundary.loginFieldErrors.email).not.toBe('');
		});

		it('calls loginWithEmail on valid input', async () => {
			authBoundary.setAuthChannel('email');
			authBoundary.email = 'test@example.com';
			authBoundary.password = 'password123';
			await authBoundary.onEmailLoginSubmit();
			expect(currentUser.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
		});

		it('sets feedback on login failure', async () => {
			authBoundary.setAuthChannel('email');
			authBoundary.email = 'test@example.com';
			authBoundary.password = 'password123';
			vi.mocked(currentUser.loginWithEmail).mockRejectedValue(new Error('auth error'));
			await authBoundary.onEmailLoginSubmit();
			expect(authBoundary.loginFeedback).not.toBe('');
		});
	});

	describe('onRequestCodeSubmit', () => {
		it('sets field error for empty phone', async () => {
			authBoundary.phone = '';
			await authBoundary.onRequestCodeSubmit();
			expect(authBoundary.loginFieldErrors.phoneNumber).not.toBe('');
		});

		it('advances to verify_code step on success', async () => {
			authBoundary.phone = '+15551234567';
			await authBoundary.onRequestCodeSubmit();
			expect(authBoundary.authStep).toBe('verify_code');
			expect(currentUser.requestPhoneCode).toHaveBeenCalled();
		});
	});

	describe('onVerifyCodeSubmit', () => {
		it('sets field error for empty OTP', async () => {
			authBoundary.otpCode = '';
			await authBoundary.onVerifyCodeSubmit();
			expect(authBoundary.loginFieldErrors.otpCode).not.toBe('');
		});

		it('calls verifyPhoneCode with trimmed values', async () => {
			authBoundary.phone = '+15551234567';
			authBoundary.otpCode = '123456';
			await authBoundary.onVerifyCodeSubmit();
			expect(currentUser.verifyPhoneCode).toHaveBeenCalledWith('+15551234567', '123456');
		});
	});

	describe('submitName', () => {
		it('sets feedback for empty name', async () => {
			authBoundary.onboardingName = '';
			await authBoundary.submitName();
			expect(authBoundary.onboardingFeedback).not.toBe('');
		});

		it('calls updateName for valid name', async () => {
			authBoundary.onboardingName = '  Jane Doe  ';
			await authBoundary.submitName();
			expect(currentUser.updateName).toHaveBeenCalledWith('Jane Doe');
		});
	});

	describe('submitOrganization', () => {
		it('sets feedback for empty org name', async () => {
			authBoundary.orgMode = 'create';
			authBoundary.orgName = '';
			await authBoundary.submitOrganization();
			expect(authBoundary.orgFeedback).not.toBe('');
		});

		it('calls create for valid org name', async () => {
			authBoundary.orgMode = 'create';
			authBoundary.orgName = 'Acme Corp';
			await authBoundary.submitOrganization();
			expect(currentOrganization.create).toHaveBeenCalledWith('Acme Corp');
		});

		it('calls joinByCode for join mode', async () => {
			authBoundary.orgMode = 'join';
			authBoundary.orgJoinCode = 'ABC123';
			await authBoundary.submitOrganization();
			expect(currentOrganization.joinByCode).toHaveBeenCalledWith('ABC123');
		});

		it('calls acceptInvite for invite mode', async () => {
			authBoundary.orgMode = 'invite';
			authBoundary.orgInviteToken = 'token-xyz';
			await authBoundary.submitOrganization();
			expect(currentOrganization.acceptInvite).toHaveBeenCalledWith('token-xyz');
		});
	});

	describe('concurrent submit protection', () => {
		it('rejects concurrent submit calls', async () => {
			authBoundary.setAuthChannel('email');
			authBoundary.email = 'test@example.com';
			authBoundary.password = 'password123';

			let resolveLogin: () => void;
			vi.mocked(currentUser.loginWithEmail).mockImplementation(
				() => new Promise<void>((resolve) => { resolveLogin = resolve; })
			);

			const first = authBoundary.onEmailLoginSubmit();
			const second = authBoundary.onEmailLoginSubmit();

			resolveLogin!();
			await first;
			await second;

			expect(currentUser.loginWithEmail).toHaveBeenCalledTimes(1);
		});
	});
});
