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

export type LoginFieldName = 'email' | 'password' | 'confirmPassword' | 'phoneNumber' | 'otpCode';

class AuthBoundary {
	// Login state
	authChannel = $state<AuthChannel>('email');
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

	// ── Login actions ──

	async onEmailLoginSubmit() {
		if (this.isAuthSubmitting) return;
		this.isAuthSubmitting = true;
		this.clearFieldErrors();
		this.setFeedback('');

		const v = validateLoginInput({ email: this.email, password: this.password });
		if (!v.ok) {
			this.setFieldError(v.field as LoginFieldName, v.feedback);
			this.isAuthSubmitting = false;
			return;
		}

		try {
			await currentUser.loginWithEmail(v.normalizedEmail, this.password);
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		} finally {
			this.isAuthSubmitting = false;
		}
	}

	async onEmailRegisterSubmit() {
		if (this.isAuthSubmitting) return;
		this.isAuthSubmitting = true;
		this.clearFieldErrors();
		this.setFeedback('');

		const v = validateRegistrationInput({
			email: this.email,
			password: this.password,
			confirmPassword: this.confirmPassword
		});
		if (!v.ok) {
			this.setFieldError(v.field as LoginFieldName, v.feedback);
			this.isAuthSubmitting = false;
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
			this.isAuthSubmitting = false;
		}
	}

	async onRequestCodeSubmit() {
		if (this.isAuthSubmitting) return;
		this.isAuthSubmitting = true;
		this.clearFieldErrors();
		this.setFeedback('');

		const v = validatePhoneNumberInput(this.phone);
		if (!v.ok) {
			this.setFieldError('phoneNumber', v.feedback);
			this.isAuthSubmitting = false;
			return;
		}

		try {
			await currentUser.requestPhoneCode(v.normalizedPhoneNumber);
			this.authStep = 'verify_code';
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		} finally {
			this.isAuthSubmitting = false;
		}
	}

	async onVerifyCodeSubmit() {
		if (this.isAuthSubmitting) return;
		this.isAuthSubmitting = true;
		this.clearFieldErrors();
		this.setFeedback('');

		const v = validateOtpCodeInput(this.otpCode);
		if (!v.ok) {
			this.setFieldError('otpCode', v.feedback);
			this.isAuthSubmitting = false;
			return;
		}

		try {
			await currentUser.verifyPhoneCode(this.phone.trim(), v.normalizedOtpCode);
		} catch (e) {
			this.setFeedback(mapLoginErrorMessage(e));
		} finally {
			this.isAuthSubmitting = false;
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
		if (this.resetEmailSent || this.isAuthSubmitting) return;
		this.isAuthSubmitting = true;

		this.clearFieldErrors();
		this.setFeedback('');

		const v = validatePasswordResetEmail(this.email);
		if (!v.ok) {
			this.setFieldError('email', v.feedback);
			this.isAuthSubmitting = false;
			return;
		}

		try {
			await currentUser.requestPasswordResetEmail(v.normalizedEmail);
			this.resetEmailSent = true;
			this.setFeedback('Check your email for a password reset link.', 'success');
		} catch (e) {
			this.setFeedback(mapPasswordResetErrorMessage(e));
		} finally {
			this.isAuthSubmitting = false;
		}
	}

	async onResetPasswordSubmit() {
		if (this.isAuthSubmitting) return;
		this.isAuthSubmitting = true;
		this.clearFieldErrors();
		this.setFeedback('');

		const v = validateNewPassword({
			password: this.password,
			confirmPassword: this.confirmPassword
		});
		if (!v.ok) {
			this.setFieldError(v.field as LoginFieldName, v.feedback);
			this.isAuthSubmitting = false;
			return;
		}

		try {
			await currentUser.setNewPassword(this.password);
			this.setFeedback('Password updated. You can now sign in.', 'success');
			this.authMode = 'login';
			this.password = '';
			this.confirmPassword = '';
		} catch (e) {
			this.setFeedback(mapPasswordResetErrorMessage(e));
		} finally {
			this.isAuthSubmitting = false;
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
		this.clearFieldErrors();
		this.setFeedback('');
		this.authStep = 'request_code';
	}

	setAuthMode(mode: 'login' | 'register' | 'forgot_password' | 'reset_password') {
		this.authMode = mode;
		this.resetEmailSent = false;
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
