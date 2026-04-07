/**
 * authBoundary — reactive store that decides the current auth/onboarding state.
 *
 * Responsibilities:
 *  - Dual-channel login state (phone OTP or email/password)
 *  - Onboarding form state (name, then organization)
 *  - Field-level and form-level validation feedback
 *
 * Components read derived booleans like `needsNameOnboarding`
 * instead of re-solving access control independently.
 */

import { currentUser } from './currentUser.svelte';
import { currentOrganization } from './currentOrganization.svelte';
import {
	type AuthChannel,
	type AuthStep,
	type OrganizationOnboardingMode,
	validateLoginInput,
	validateOtpCode,
	validateOnboardingName,
	validateOrganizationInput,
	mapAuthErrorMessage
} from '$lib/models/authHelpers';

class AuthBoundary {
	// Login state
	authChannel = $state<AuthChannel>('email');
	authStep = $state<AuthStep>('request_code');
	authMode = $state<'login' | 'register'>('login');
	email = $state('');
	password = $state('');
	confirmPassword = $state('');
	phone = $state('');
	otpCode = $state('');
	loginFeedback = $state('');

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

	// ── Login actions ──

	async submitLogin() {
		this.loginFeedback = '';

		if (this.authChannel === 'phone' && this.authStep === 'verify_code') {
			const v = validateOtpCode(this.otpCode);
			if (!v.ok) { this.loginFeedback = v.feedback; return; }

			try {
				await currentUser.verifyPhoneCode(this.phone, this.otpCode.trim());
			} catch (e) {
				this.loginFeedback = mapAuthErrorMessage(e);
			}
			return;
		}

		if (this.authChannel === 'phone') {
			const v = validateLoginInput('phone', '', this.phone);
			if (!v.ok) { this.loginFeedback = v.feedback; return; }

			try {
				await currentUser.requestPhoneCode(this.phone.trim());
				this.authStep = 'verify_code';
			} catch (e) {
				this.loginFeedback = mapAuthErrorMessage(e);
			}
			return;
		}

		// Email channel
		const v = validateLoginInput('email', this.email, '');
		if (!v.ok) { this.loginFeedback = v.feedback; return; }

		if (!this.password.trim()) { this.loginFeedback = 'Enter your password.'; return; }

		try {
			if (this.authMode === 'register') {
				if (this.password !== this.confirmPassword) {
					this.loginFeedback = 'Passwords do not match.';
					return;
				}
				await currentUser.registerWithEmail(this.email.trim(), this.password);
			} else {
				await currentUser.loginWithEmail(this.email.trim(), this.password);
			}
		} catch (e) {
			this.loginFeedback = mapAuthErrorMessage(e);
		}
	}

	// ── Name onboarding ──

	async submitName() {
		this.onboardingFeedback = '';
		const v = validateOnboardingName(this.onboardingName);
		if (!v.ok) { this.onboardingFeedback = v.feedback; return; }

		try {
			await currentUser.updateName(this.onboardingName.trim());
		} catch (e) {
			this.onboardingFeedback = mapAuthErrorMessage(e);
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
			if (this.orgMode === 'create') {
				await currentOrganization.create(this.orgName.trim());
			} else if (this.orgMode === 'join') {
				await currentOrganization.joinByCode(this.orgJoinCode.trim().toUpperCase());
			} else {
				await currentOrganization.acceptInvite(this.orgInviteToken.trim());
			}
		} catch (e) {
			this.orgFeedback = mapAuthErrorMessage(e);
		}
	}

	setAuthChannel(channel: AuthChannel) {
		this.authChannel = channel;
		this.loginFeedback = '';
		this.authStep = 'request_code';
	}

	setOrgMode(mode: OrganizationOnboardingMode) {
		this.orgMode = mode;
		this.orgFeedback = '';
	}
}

export const authBoundary = new AuthBoundary();
