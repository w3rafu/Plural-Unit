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

// ── Auth ──

export async function signInWithPassword(email: string, password: string) {
	const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
	if (error) throw error;
	return data.user;
}

export async function signUpWithPassword(email: string, password: string) {
	const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
	if (error) throw error;
	return data.user;
}

export async function requestPhoneOtp(phone: string) {
	const { error } = await getSupabaseClient().auth.signInWithOtp({ phone });
	if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string) {
	const { data, error } = await getSupabaseClient().auth.verifyOtp({ phone, token, type: 'sms' });
	if (error) throw error;
	return data.user;
}

export async function signOut() {
	const { error } = await getSupabaseClient().auth.signOut();
	if (error) throw error;
}

export async function getAuthenticatedUser(): Promise<SupabaseUser | null> {
	const { data } = await getSupabaseClient().auth.getUser();
	return data.user ?? null;
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
	const { data, error } = await getSupabaseClient()
		.from('profiles')
		.select('id, name, email, phone_number')
		.eq('id', userId)
		.maybeSingle();

	if (error) throw error;
	return data;
}

export async function upsertOwnProfile(userId: string, updates: Partial<UserDetails>) {
	const { error } = await getSupabaseClient()
		.from('profiles')
		.upsert({ id: userId, ...updates }, { onConflict: 'id' });

	if (error) throw error;
}
