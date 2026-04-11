/**
 * Profile repository — all Supabase operations for auth and profiles.
 *
 * Only this file should know table names, column shapes, or RPC names
 * related to auth and profiles. Stores call these functions instead
 * of touching Supabase directly.
 */

import type { AuthChangeEvent, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from '$lib/supabaseClient';
import type { UserDetails } from '$lib/models/userModel';
import { withRetry } from '$lib/services/retry';

const PROFILE_AVATAR_BUCKET = 'profile-avatars';
const AUTH_TIMEOUT_MS = 10_000;

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

function buildVersionedPublicUrl(publicUrl: string, version: number | string = Date.now()) {
	const separator = publicUrl.includes('?') ? '&' : '?';
	return `${publicUrl}${separator}v=${version}`;
}

function getAvatarExtension(file: File) {
	const extensionFromName = file.name.includes('.') ? file.name.split('.').pop() : '';
	if (extensionFromName) {
		return extensionFromName.toLowerCase();
	}

	if (file.type === 'image/png') return 'png';
	if (file.type === 'image/webp') return 'webp';
	return 'jpg';
}

async function removeExistingAvatarFiles(userId: string) {
	const { data, error } = await withRetry(() =>
		getSupabaseClient().storage.from(PROFILE_AVATAR_BUCKET).list(userId, {
			limit: 100,
			offset: 0
		})
	);

	if (error) {
		throw error;
	}

	const pathsToRemove = (data ?? [])
		.filter((entry) => entry.name)
		.map((entry) => `${userId}/${entry.name}`);

	if (pathsToRemove.length === 0) {
		return;
	}

	const { error: removeError } = await withRetry(() =>
		getSupabaseClient().storage.from(PROFILE_AVATAR_BUCKET).remove(pathsToRemove)
	);

	if (removeError) {
		throw removeError;
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(message)), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}

function withAuthTimeout<T>(operation: Promise<T>, message: string): Promise<T> {
	return withTimeout(operation, AUTH_TIMEOUT_MS, message);
}

// ── Auth ──

export async function signInWithPassword(email: string, password: string): Promise<SupabaseUser> {
	return withRetry(async () => {
		const { data, error } = await withAuthTimeout(
			getSupabaseClient().auth.signInWithPassword({
				email: normalizeEmail(email),
				password
			}),
			'Sign-in timed out. Check your internet connection and try again.'
		);
		if (error || !data.user) throw error ?? new Error('Could not resolve authenticated user.');
		return data.user;
	});
}

export async function signUpWithPassword(
	email: string,
	password: string
): Promise<RegistrationResult> {
	return withRetry(async () => {
		const { data, error } = await withAuthTimeout(
			getSupabaseClient().auth.signUp({
				email: normalizeEmail(email),
				password
			}),
			'Registration timed out. Check your internet connection and try again.'
		);
		if (error) throw error;

		return {
			user: data.user ?? null,
			requiresEmailConfirmation: !data.session
		};
	});
}

export async function requestPhoneOtp(phone: string) {
	return withRetry(async () => {
		const { error } = await withAuthTimeout(
			getSupabaseClient().auth.signInWithOtp({
				phone: phone.trim(),
				options: { shouldCreateUser: true }
			}),
			'Code request timed out. Check your internet connection and try again.'
		);
		if (error) throw error;
	});
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<SupabaseUser> {
	return withRetry(async () => {
		const { data, error } = await withAuthTimeout(
			getSupabaseClient().auth.verifyOtp({
				phone: phone.trim(),
				token: token.trim(),
				type: 'sms'
			}),
			'Verification timed out. Check your internet connection and try again.'
		);
		if (error || !data.user) throw error ?? new Error('Could not verify the SMS code.');
		return data.user;
	});
}

export async function requestPasswordReset(email: string) {
	const { error } = await withAuthTimeout(
		getSupabaseClient().auth.resetPasswordForEmail(normalizeEmail(email)),
		'Password reset request timed out. Check your internet connection and try again.'
	);
	if (error) throw error;
}

export async function updatePassword(newPassword: string) {
	const { error } = await withAuthTimeout(
		getSupabaseClient().auth.updateUser({ password: newPassword }),
		'Password update timed out. Check your internet connection and try again.'
	);
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

	const { data, error } = await withAuthTimeout(
		getSupabaseClient().auth.updateUser({
			email: normalizedNextEmail
		}),
		'Email update timed out. Check your internet connection and try again.'
	);
	if (error) throw error;

	return {
		changed: true,
		requiresConfirmation: normalizeEmail(data.user?.email ?? '') !== normalizedNextEmail
	};
}

export async function signOut() {
	const { error } = await withAuthTimeout(
		getSupabaseClient().auth.signOut(),
		'Sign-out timed out. Check your internet connection and try again.'
	);
	if (error) throw error;
}

export async function getAuthenticatedUser(): Promise<SupabaseUser | null> {
	return withRetry(async () => {
		const { data } = await withAuthTimeout(
			getSupabaseClient().auth.getUser(),
			'Session lookup timed out. Check your internet connection and try again.'
		);
		return data.user ?? null;
	});
}

export function subscribeToAuthStateChange(
	callback: (event: AuthChangeEvent, user: SupabaseUser | null) => void
): () => void {
	const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
		callback(event, session?.user ?? null);
	});
	return () => data.subscription.unsubscribe();
}

// ── Profile CRUD ──

export async function fetchOwnProfile(userId: string): Promise<Partial<UserDetails> | null> {
	return withRetry(async () => {
		const { data, error } = await getSupabaseClient()
			.from('profiles')
			.select('id, name, email, phone_number, avatar_url')
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

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
	const extension = getAvatarExtension(file);
	const path = `${userId}/avatar.${extension}`;

	await removeExistingAvatarFiles(userId);

	const { error: uploadError } = await withRetry(() =>
		getSupabaseClient().storage.from(PROFILE_AVATAR_BUCKET).upload(path, file, {
			upsert: true,
			contentType: file.type || 'application/octet-stream'
		})
	);

	if (uploadError) {
		throw uploadError;
	}

	const { data } = getSupabaseClient().storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(path);
	if (!data.publicUrl) {
		throw new Error('Could not generate public avatar URL.');
	}

	return buildVersionedPublicUrl(data.publicUrl);
}

export async function deleteProfileAvatar(userId: string) {
	await removeExistingAvatarFiles(userId);
}
