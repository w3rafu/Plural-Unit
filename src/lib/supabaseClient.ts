import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

let client: SupabaseClient | null = null;

/**
 * Returns a browser-side Supabase client.
 * Throws if env vars are missing — there is no demo mode.
 */
export function getSupabaseClient(): SupabaseClient {
	if (client) return client;

	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error(
			'Supabase is not configured. Add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY to your .env file.'
		);
	}

	client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	return client;
}
