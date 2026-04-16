/**
 * currentUser — reactive store for the signed-in user.
 *
 * Responsibilities:
 *  - Restore and sync with Supabase auth state
 *  - Load and update the user's own profile
 *  - Cache a minimal session shell so the UI doesn't flash the login form on reload
 *  - Password recovery (request reset email, set new password)
 *  - Graceful error recovery for stale sessions and network failures
 *
 * No component should call Supabase directly for auth.
 * All auth actions flow through this store → profileRepository.
 */

import { INITIAL_DETAILS, type UserDetails } from '$lib/models/userModel';
import {
	fetchOwnProfile,
	getAuthenticatedUser,
	signInWithPassword,
	signUpWithPassword,
	requestPhoneOtp,
	verifyPhoneOtp,
	requestPasswordReset,
	requestEmailChange as requestAuthEmailChange,
	updatePassword,
	signOut,
	subscribeToAuthStateChange,
	upsertOwnProfile,
	uploadProfileAvatar as uploadOwnProfileAvatar,
	deleteProfileAvatar,
	requestAccountDeletion as requestAccountDeletionRpc,
	type EmailChangeResult,
	type RegistrationResult
} from '$lib/repositories/profileRepository';
import {
	SESSION_CACHE_KEY,
	serializeCachedSession,
	readCachedSession,
	shouldHandleAsSignedOut,
	shouldResetCachedBrowserSession,
	clearCachedBrowserSession
} from '$lib/services/sessionCache';
import { buildSmokeUserDetails } from '$lib/demo/smokeFixtures';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';
import { currentOrganization } from './currentOrganization.svelte';
import { currentHub } from './currentHub.svelte';
import { currentMessages } from './currentMessages.svelte';

class CurrentUser {
	isLoggedIn = $state(false);
	isLoggingIn = $state(false);
	hasResolvedSession = $state(false);
	details = $state<UserDetails>(INITIAL_DETAILS);
	lastError = $state<Error | null>(null);

	clearError() {
		this.lastError = null;
	}

	private captureError(error: unknown) {
		this.lastError = error instanceof Error ? error : new Error(String(error));
	}

	private stopAuth: (() => void) | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			if (isSmokeModeEnabled()) {
				this.applySmokeSession();
				return;
			}

			this.stopAuth = subscribeToAuthStateChange((_event, user) => {
				if (user) {
					this.syncFromAuthUser(user.id, user.email ?? '');
					void this.loadProfile(user.id);
				} else {
					this.handleSignedOut();
				}
			});
			void this.checkSession();
		}
	}

	private applySmokeSession() {
		this.lastError = null;
		this.isLoggedIn = true;
		this.isLoggingIn = false;
		this.hasResolvedSession = true;
		this.details = buildSmokeUserDetails();
	}

	// ── Internal state helpers ──

	private syncFromAuthUser(id: string, email: string) {
		this.isLoggedIn = true;
		this.hasResolvedSession = true;
		this.details = { ...this.details, id, email };
		this.saveSession();
	}

	private handleSignedOut() {
		this.isLoggedIn = false;
		this.isLoggingIn = false;
		this.hasResolvedSession = true;
		this.details = INITIAL_DETAILS;
		if (typeof window !== 'undefined') {
			localStorage.removeItem(SESSION_CACHE_KEY);
		}
	}

	private saveSession() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(SESSION_CACHE_KEY, serializeCachedSession(this.details));
		} catch {
			// Storage full or blocked — non-critical.
		}
	}

	private async checkSession() {
		if (typeof window === 'undefined') return;

		try {
			// Hydrate a minimal shell immediately so the UI shows the cached name.
			const cached = readCachedSession(localStorage.getItem(SESSION_CACHE_KEY));
			if (cached) {
				this.details = { ...INITIAL_DETAILS, ...cached };
			}

			const user = await getAuthenticatedUser();
			if (user) {
				this.syncFromAuthUser(user.id, user.email ?? '');
				await this.loadProfile(user.id);
			} else {
				this.hasResolvedSession = true;
			}
		} catch (error) {
			if (shouldHandleAsSignedOut(error)) {
				this.handleSignedOut();
				return;
			}
			if (shouldResetCachedBrowserSession(error)) {
				clearCachedBrowserSession();
				this.handleSignedOut();
				return;
			}
			this.captureError(error);
			this.hasResolvedSession = true;
		}
	}

	private async loadProfile(userId: string) {
		try {
			const profile = await fetchOwnProfile(userId);
			if (profile) {
				this.details = { ...this.details, ...profile };
				this.saveSession();
			}
		} catch (error) {
			if (shouldResetCachedBrowserSession(error)) {
				clearCachedBrowserSession();
				this.handleSignedOut();
				return;
			}
			this.captureError(error);
		}
	}

	// ── Public auth actions ──

	async loginWithEmail(email: string, password: string) {
		this.lastError = null;
		this.isLoggingIn = true;
		try {
			const user = await signInWithPassword(email, password);
			this.syncFromAuthUser(user.id, user.email ?? '');
			await this.loadProfile(user.id);
		} finally {
			this.isLoggingIn = false;
		}
	}

	async registerWithEmail(email: string, password: string): Promise<RegistrationResult> {
		this.lastError = null;
		this.isLoggingIn = true;
		try {
			const result = await signUpWithPassword(email, password);
			if (result.user && !result.requiresEmailConfirmation) {
				this.syncFromAuthUser(result.user.id, result.user.email ?? '');
				await this.loadProfile(result.user.id);
			}
			return result;
		} finally {
			this.isLoggingIn = false;
		}
	}

	async requestPhoneCode(phone: string) {
		this.lastError = null;
		this.isLoggingIn = true;
		try {
			await requestPhoneOtp(phone);
		} finally {
			this.isLoggingIn = false;
		}
	}

	async verifyPhoneCode(phone: string, code: string) {
		this.lastError = null;
		this.isLoggingIn = true;
		try {
			const user = await verifyPhoneOtp(phone, code);
			this.syncFromAuthUser(user.id, user.email ?? '');
			await this.loadProfile(user.id);
		} finally {
			this.isLoggingIn = false;
		}
	}

	async requestPasswordResetEmail(email: string) {
		await requestPasswordReset(email);
	}

	async setNewPassword(newPassword: string) {
		await updatePassword(newPassword);
	}

	async requestEmailChange(nextEmail: string): Promise<EmailChangeResult> {
		this.isLoggingIn = true;
		try {
			const result = await requestAuthEmailChange(nextEmail);
			if (result.changed && !result.requiresConfirmation) {
				this.details = { ...this.details, email: nextEmail.trim().toLowerCase() };
				this.saveSession();
			}
			return result;
		} finally {
			this.isLoggingIn = false;
		}
	}

	async updateProfileDetails(updates: Pick<UserDetails, 'name' | 'phone_number' | 'avatar_url' | 'bio'>) {
		this.isLoggingIn = true;
		try {
			await upsertOwnProfile(this.details.id, updates);
			this.details = { ...this.details, ...updates };
			this.saveSession();
		} finally {
			this.isLoggingIn = false;
		}
	}

	async updateName(name: string) {
		await this.updateProfileDetails({
			name,
			phone_number: this.details.phone_number,
			avatar_url: this.details.avatar_url,
			bio: this.details.bio
		});
	}

	async uploadProfileAvatar(file: File) {
		if (!this.details.id) {
			throw new Error('No authenticated user.');
		}

		this.isLoggingIn = true;
		try {
			const avatarUrl = await uploadOwnProfileAvatar(this.details.id, file);
			this.details = { ...this.details, avatar_url: avatarUrl };
			this.saveSession();
			return avatarUrl;
		} finally {
			this.isLoggingIn = false;
		}
	}

	async removeProfileAvatar() {
		if (!this.details.id) {
			throw new Error('No authenticated user.');
		}

		this.isLoggingIn = true;
		try {
			await deleteProfileAvatar(this.details.id);
			this.details = { ...this.details, avatar_url: '' };
			this.saveSession();
			return '';
		} finally {
			this.isLoggingIn = false;
		}
	}

	async requestAccountDeletion() {
		await requestAccountDeletionRpc();
	}

	async logout() {
		this.lastError = null;
		try {
			await signOut();
		} catch (error) {
			this.captureError(error);
		}
		this.handleSignedOut();
		currentOrganization.reset();
		currentHub.reset();
		currentMessages.reset();
	}
}

export const currentUser = new CurrentUser();
