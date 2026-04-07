/**
 * Profile repository — all Supabase operations for auth and profiles.
 *
 * Only this file should know table names, column shapes, or RPC names
 * related to auth and profiles. Stores call these functions instead
 * of touching Supabase directly.
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from '$lib/supabaseClient';
import type { UserDetails } from '$lib/models/userModel';
import { withRetry } from '$lib/services/retry';

export type RegistrationResult = {
	user: SupabaseUser | null;
	requiresEmailConfirmation: boolean;
};

export type EmailChangeResult = {
	changed: boolean;
	requiresConfirmation: boolean;
};

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

// ── Auth ──

export async function signInWithPassword(email: string, password: string): Promise<SupabaseUser> {
	return withRetry(async () => {
		const { data, error } = await getSupabaseClient().auth.signInWithPassword({
			email: email.trim(),
			password
		});
		if (error || !data.user) throw error ?? new Error('Could not resolve authenticated user.');
		return data.user;
	});
}

export async function signUpWithPassword(
	email: string,
	password: string
): Promise<RegistrationResult> {
	return withRetry(async () => {
		const { data, error } = await getSupabaseClient().auth.signUp({
			email: email.trim(),
			password
		});
		if (error) throw error;

		return {
			user: data.user ?? null,
			requiresEmailConfirmation: !data.session
		};
	});
}

export async function requestPhoneOtp(phone: string) {
	return withRetry(async () => {
		const { error } = await getSupabaseClient().auth.signInWithOtp({
			phone: phone.trim(),
			options: { shouldCreateUser: true }
		});
		if (error) throw error;
	});
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<SupabaseUser> {
	return withRetry(async () => {
		const { data, error } = await getSupabaseClient().auth.verifyOtp({
			phone: phone.trim(),
			token: token.trim(),
			type: 'sms'
		});
		if (error || !data.user) throw error ?? new Error('Could not verify the SMS code.');
		return data.user;
	});
}

export async function requestPasswordReset(email: string) {
	const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim());
	if (error) throw error;
}

export async function updatePassword(newPassword: string) {
	const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
	if (error) throw error;
}

export async function requestEmailChange(nextEmail: string): Promise<EmailChangeResult> {
	const user = await getAuthenticatedUser();
	if (!user) {
		throw new Error('No authenticated user.');
	}

	const normalizedNextEmail = normalizeEmail(nextEmail);
	if (!normalizedNextEmail) {
		throw new Error('Email is required.');
	}

	if (normalizedNextEmail === normalizeEmail(user.email ?? '')) {
		return {
			changed: false,
			requiresConfirmation: false
		};
	}

	const { data, error } = await getSupabaseClient().auth.updateUser({
		email: normalizedNextEmail
	});
	if (error) throw error;

	return {
		changed: true,
		requiresConfirmation: normalizeEmail(data.user?.email ?? '') !== normalizedNextEmail
	};
}

export async function signOut() {
	const { error } = await getSupabaseClient().auth.signOut();
	if (error) throw error;
}

export async function getAuthenticatedUser(): Promise<SupabaseUser | null> {
	return withRetry(async () => {
		const { data } = await getSupabaseClient().auth.getUser();
		return data.user ?? null;
	});
}

export function subscribeToAuthStateChange(
	callback: (user: SupabaseUser | null) => void
): () => void {
	const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
		callback(session?.user ?? null);
	});
	return () => data.subscription.unsubscribe();
}

// ── Profile CRUD ──

export async function fetchOwnProfile(userId: string): Promise<Partial<UserDetails> | null> {
	return withRetry(async () => {
		const { data, error } = await getSupabaseClient()
			.from('profiles')
			.select('id, name, email, phone_number')
			.eq('id', userId)
			.maybeSingle();

		if (error) throw error;
		return data;
	});
}

export async function upsertOwnProfile(userId: string, updates: Partial<UserDetails>) {
	return withRetry(async () => {
		const { error } = await getSupabaseClient()
			.from('profiles')
			.upsert({ id: userId, ...updates }, { onConflict: 'id' });

		if (error) throw error;
	});
}
