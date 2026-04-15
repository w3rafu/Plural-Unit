/**
 * authBoundary — reactive store that decides the current auth/onboarding state.
 *
 * Responsibilities:
 *  - Dual-channel login state (phone OTP or email/password)
 *  - Separate login vs registration flows with field-level errors
 *  - Onboarding form state (name, then organization)
 *
 * Components read derived booleans like `needsNameOnboarding`
 * instead of re-solving access control independently.
 */

import { currentUser } from './currentUser.svelte';
import { currentOrganization } from './currentOrganization.svelte';
import {
	type AuthChannel,
	type AuthStep,
	type FeedbackType,
	type OrganizationOnboardingMode,
	readAuthFlowLocationState,
	validateLoginInput,
	validateRegistrationInput,
	validatePhoneNumberInput,
	validateOtpCodeInput,
	validatePasswordResetEmail,
	validateNewPassword,
	validateOnboardingName,
	validateOrganizationInput,
	mapLoginErrorMessage,
	mapRegistrationErrorMessage,
	mapPasswordResetErrorMessage,
	mapOrganizationErrorMessage
} from '$lib/models/authHelpers';
import { syncSmokeModeFromUrl } from '$lib/demo/smokeMode';
import { subscribeToAuthStateChange } from '$lib/repositories/profileRepository';

export type LoginFieldName = 'email' | 'password' | 'confirmPassword' | 'phoneNumber' | 'otpCode';

class AuthBoundary {
	// Login state
	authChannel = $state<AuthChannel>('phone');
	authStep = $state<AuthStep>('request_code');
	authMode = $state<'login' | 'register' | 'forgot_password' | 'reset_password'>('login');
	email = $state('');
	password = $state('');
	confirmPassword = $state('');
	phone = $state('');
	otpCode = $state('');
	loginFeedback = $state('');
	loginFeedbackType = $state<FeedbackType>('error');
	isAuthSubmitting = $state(false);
	loginFieldErrors = $state<Record<LoginFieldName, string>>({
		email: '',
		password: '',
		confirmPassword: '',
		phoneNumber: '',
		otpCode: ''
	});
	resetEmailSent = $state(false);

	// Onboarding state
	onboardingName = $state('');
	onboardingFeedback = $state('');

	// Organization onboarding state
	orgMode = $state<OrganizationOnboardingMode>('create');
	orgName = $state('');
	orgJoinCode = $state('');
	orgInviteToken = $state('');
	orgFeedback = $state('');
	private stopAuth: (() => void) | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			const isSmokeMode = syncSmokeModeFromUrl(window.location);
			this.syncAuthModeFromLocation();
			if (isSmokeMode) {
				return;
			}

			this.stopAuth = subscribeToAuthStateChange((event) => {
				if (event === 'PASSWORD_RECOVERY') {
					this.enterPasswordRecoveryMode();
					return;
				}

				if (event === 'SIGNED_OUT' && this.authMode === 'reset_password') {
					this.authMode = 'login';
				}
			});
		}
	}

	// Derived gates — components check these instead of re-solving logic.
	needsNameOnboarding = $derived(
		currentUser.isLoggedIn && !(currentUser.details.name || '').trim()
	);
	needsOrganizationOnboarding = $derived(
		currentUser.isLoggedIn &&
		!this.needsNameOnboarding &&
		currentOrganization.hasResolvedMembership &&
		!currentOrganization.isMember
	);
	isPasswordRecovery = $derived(this.authMode === 'reset_password');

	// ── Private helpers ──

	private clearFieldErrors() {
		this.loginFieldErrors = {
			email: '',
			password: '',
			confirmPassword: '',
			phoneNumber: '',
			otpCode: ''
		};
	}

	private setFieldError(field: LoginFieldName, message: string) {
		this.loginFieldErrors = { ...this.loginFieldErrors, [field]: message };
	}

	private setFeedback(message: string, type: FeedbackType = 'error') {
		this.loginFeedback = message;
		this.loginFeedbackType = type;
	}

	/** Start a submit attempt. Returns false if already submitting. */
	private beginSubmit(): boolean {
		if (this.isAuthSubmitting) return false;
		this.isAuthSubmitting = true;
		this.clearFieldErrors();
		this.setFeedback('');
		return true;
	}

	private endSubmit() {
		this.isAuthSubmitting = false;
	}

	private stripAuthHashFromUrl() {
		if (typeof window === 'undefined' || !window.location.hash) return;
		window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
	}

	private enterPasswordRecoveryMode() {
		this.authChannel = 'email';
		this.authMode = 'reset_password';
		this.authStep = 'request_code';
		this.otpCode = '';
		this.password = '';
		this.confirmPassword = '';
		this.resetEmailSent = false;
		this.clearFieldErrors();
		this.setFeedback('Choose a new password to finish recovering your account.', 'success');
		this.stripAuthHashFromUrl();
	}

	private syncAuthModeFromLocation() {
		if (typeof window === 'undefined') return;

		const locationState = readAuthFlowLocationState({
			search: window.location.search,
			hash: window.location.hash
		});

		if (locationState.errorMessage) {
			this.authChannel = 'email';
			this.authMode = 'login';
			this.setFeedback(locationState.errorMessage);
			this.stripAuthHashFromUrl();
			return;
		}

		if (locationState.isPasswordRecovery) {
			this.enterPasswordRecoveryMode();
		}
	}

	// ── Login actions ──

	async onEmailLoginSubmit() {
		if (!this.beginSubmit()) return;

		const v = validateLoginInput({ email: this.email, password: this.password });
		if (!v.ok) {
			this.setFieldError(v.field as LoginFieldName, v.feedback);
			this.endSubmit();
			return;
		}

		try {
			await currentUser.loginWithEmail(v.normalizedEmail, this.password);
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		} finally {
			this.endSubmit();
		}
	}

	async onEmailRegisterSubmit() {
		if (!this.beginSubmit()) return;

		const v = validateRegistrationInput({
			email: this.email,
			password: this.password,
			confirmPassword: this.confirmPassword
		});
		if (!v.ok) {
			this.setFieldError(v.field as LoginFieldName, v.feedback);
			this.endSubmit();
			return;
		}

		try {
			const result = await currentUser.registerWithEmail(v.normalizedEmail, this.password);
			if (result.requiresEmailConfirmation) {
				this.setFeedback('Check your email to confirm your account.', 'success');
			}
		} catch (e) {
			this.setFeedback(mapRegistrationErrorMessage(e));
		} finally {
			this.endSubmit();
		}
	}

	async onRequestCodeSubmit() {
		if (!this.beginSubmit()) return;

		const v = validatePhoneNumberInput(this.phone);
		if (!v.ok) {
			this.setFieldError('phoneNumber', v.feedback);
			this.endSubmit();
			return;
		}

		try {
			await currentUser.requestPhoneCode(v.normalizedPhoneNumber);
			this.authStep = 'verify_code';
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		} finally {
			this.endSubmit();
		}
	}

	async onVerifyCodeSubmit() {
		if (!this.beginSubmit()) return;

		const v = validateOtpCodeInput(this.otpCode);
		if (!v.ok) {
			this.setFieldError('otpCode', v.feedback);
			this.endSubmit();
			return;
		}

		try {
			await currentUser.verifyPhoneCode(this.phone.trim(), v.normalizedOtpCode);
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		} finally {
			this.endSubmit();
		}
	}

	async resendPhoneCode() {
		this.setFeedback('');
		try {
			await currentUser.requestPhoneCode(this.phone.trim());
			this.setFeedback('A new code has been sent.', 'success');
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		}
	}

	// ── Password recovery ──

	async onForgotPasswordSubmit() {
		if (this.resetEmailSent) return;
		if (!this.beginSubmit()) return;

		const v = validatePasswordResetEmail(this.email);
		if (!v.ok) {
			this.setFieldError('email', v.feedback);
			this.endSubmit();
			return;
		}

		try {
			await currentUser.requestPasswordResetEmail(v.normalizedEmail);
			this.resetEmailSent = true;
			this.email = v.normalizedEmail;
			this.setFeedback('If that email is connected to an account, a reset link is on the way.', 'success');
		} catch (e) {
			this.setFeedback(mapPasswordResetErrorMessage(e));
		} finally {
			this.endSubmit();
		}
	}

	async onResetPasswordSubmit() {
		if (!this.beginSubmit()) return;

		const v = validateNewPassword({
			password: this.password,
			confirmPassword: this.confirmPassword
		});
		if (!v.ok) {
			this.setFieldError(v.field as LoginFieldName, v.feedback);
			this.endSubmit();
			return;
		}

		try {
			await currentUser.setNewPassword(this.password);
			const recoveryEmail = this.email.trim().toLowerCase();
			this.password = '';
			this.confirmPassword = '';
			this.authMode = 'login';
			await currentUser.logout();
			this.email = recoveryEmail;
			this.setFeedback('Password updated. Sign in with your new password.', 'success');
		} catch (e) {
			this.setFeedback(mapPasswordResetErrorMessage(e));
		} finally {
			this.endSubmit();
		}
	}

	// ── Name onboarding ──

	async submitName() {
		this.onboardingFeedback = '';
		const v = validateOnboardingName(this.onboardingName);
		if (!v.ok) { this.onboardingFeedback = v.feedback; return; }

		try {
			await currentUser.updateName(v.normalizedName);
		} catch (e) {
			this.onboardingFeedback = mapLoginErrorMessage(e);
		}
	}

	// ── Organization onboarding ──

	async submitOrganization() {
		this.orgFeedback = '';
		const v = validateOrganizationInput(this.orgMode, {
			name: this.orgName,
			joinCode: this.orgJoinCode,
			inviteToken: this.orgInviteToken
		});
		if (!v.ok) { this.orgFeedback = v.feedback; return; }

		try {
			if (v.action === 'create') {
				await currentOrganization.create(v.normalizedValue);
			} else if (v.action === 'join') {
				await currentOrganization.joinByCode(v.normalizedValue);
			} else {
				await currentOrganization.acceptInvite(v.normalizedValue);
			}
		} catch (e) {
			this.orgFeedback = mapOrganizationErrorMessage(e);
		}
	}

	// ── Mode toggles ──

	setAuthChannel(channel: AuthChannel) {
		this.authChannel = channel;
		this.authStep = 'request_code';
		this.otpCode = '';
		this.resetEmailSent = false;
		if (this.authMode !== 'reset_password') {
			this.authMode = 'login';
		}
		this.clearFieldErrors();
		this.setFeedback('');
	}

	setAuthMode(mode: 'login' | 'register' | 'forgot_password' | 'reset_password') {
		this.authMode = mode;
		this.resetEmailSent = false;
		if (mode !== 'reset_password') {
			this.password = '';
			this.confirmPassword = '';
		}
		this.clearFieldErrors();
		this.setFeedback('');
	}

	resetAuthFlow() {
		this.authStep = 'request_code';
		this.otpCode = '';
		this.clearFieldErrors();
		this.setFeedback('');
	}

	setOrgMode(mode: OrganizationOnboardingMode) {
		this.orgMode = mode;
		this.orgFeedback = '';
	}
}

export const authBoundary = new AuthBoundary();
