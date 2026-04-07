/**
 * currentUser — reactive store for the signed-in user.
 *
 * Responsibilities:
 *  - Restore and sync with Supabase auth state
 *  - Load and update the user's own profile
 *  - Expose identity fields (id, name, email, phone)
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
	signOut,
	subscribeToAuthStateChange,
	upsertOwnProfile
} from '$lib/repositories/profileRepository';

class CurrentUser {
	isLoggedIn = $state(false);
	isLoading = $state(false);
	details = $state<UserDetails>(INITIAL_DETAILS);

	private stopAuth: (() => void) | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.stopAuth = subscribeToAuthStateChange((user) => {
				if (user) {
					this.isLoggedIn = true;
					this.details = { ...this.details, id: user.id, email: user.email ?? '' };
					void this.loadProfile(user.id);
				} else {
					this.isLoggedIn = false;
					this.details = INITIAL_DETAILS;
				}
			});
			void this.checkSession();
		}
	}

	private async checkSession() {
		const user = await getAuthenticatedUser();
		if (user) {
			this.isLoggedIn = true;
			this.details = { ...this.details, id: user.id, email: user.email ?? '' };
			await this.loadProfile(user.id);
		}
	}

	private async loadProfile(userId: string) {
		const profile = await fetchOwnProfile(userId);
		if (profile) {
			this.details = { ...this.details, ...profile };
		}
	}

	async loginWithEmail(email: string, password: string) {
		this.isLoading = true;
		try {
			await signInWithPassword(email, password);
		} finally {
			this.isLoading = false;
		}
	}

	async registerWithEmail(email: string, password: string) {
		this.isLoading = true;
		try {
			await signUpWithPassword(email, password);
		} finally {
			this.isLoading = false;
		}
	}

	async requestPhoneCode(phone: string) {
		this.isLoading = true;
		try {
			await requestPhoneOtp(phone);
		} finally {
			this.isLoading = false;
		}
	}

	async verifyPhoneCode(phone: string, code: string) {
		this.isLoading = true;
		try {
			await verifyPhoneOtp(phone, code);
		} finally {
			this.isLoading = false;
		}
	}

	async updateName(name: string) {
		this.isLoading = true;
		try {
			await upsertOwnProfile(this.details.id, { name });
			this.details = { ...this.details, name };
		} finally {
			this.isLoading = false;
		}
	}

	async logout() {
		await signOut();
	}
}

export const currentUser = new CurrentUser();
