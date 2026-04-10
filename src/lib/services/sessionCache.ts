/**
 * Session caching and error recovery helpers for currentUser.
 *
 * Session caching stores a minimal shell (id, name) in localStorage so the
 * app can render immediately on reload instead of flashing the login form.
 *
 * Error recovery helpers classify auth errors so the store can decide
 * whether to transition to signed-out state, defer startup, or clear
 * stale browser storage.
 */

import type { UserDetails } from '$lib/models/userModel';

export const SESSION_CACHE_KEY = 'currentUser';

type CachedSession = {
	details: Pick<UserDetails, 'id' | 'name' | 'avatar_url'>;
};

export function serializeCachedSession(details: UserDetails): string {
	const cached: CachedSession = {
		details: { id: details.id, name: details.name, avatar_url: details.avatar_url }
	};
	return JSON.stringify(cached);
}

export function readCachedSession(
	raw: string | null
): Pick<UserDetails, 'id' | 'name' | 'avatar_url'> | null {
	if (!raw) return null;
	try {
		const parsed: CachedSession = JSON.parse(raw);
		if (parsed?.details?.id) return parsed.details;
		return null;
	} catch {
		return null;
	}
}

// ── Error classification ──

function getNormalizedErrorMessage(error: unknown): string {
	return typeof error === 'object' && error && 'message' in error
		? String(error.message).toLowerCase()
		: '';
}

/** Auth failure that means "no user is logged in" — treat as normal signed-out. */
export function shouldHandleAsSignedOut(error: unknown): boolean {
	const msg = getNormalizedErrorMessage(error);
	return msg.includes('no authenticated user') || msg.includes('auth session missing');
}

/** Network / storage failure — clear cached Supabase tokens so the next load is clean. */
export function shouldResetCachedBrowserSession(error: unknown): boolean {
	const msg = getNormalizedErrorMessage(error);
	return (
		msg.includes('load failed') ||
		msg.includes('failed to fetch') ||
		msg.includes('network request failed') ||
		msg.includes('access control') ||
		msg.includes('timed out')
	);
}

/**
 * Remove all Supabase auth tokens from both storages.
 * Called when network errors leave the token cache in an inconsistent state.
 */
export function clearCachedBrowserSession() {
	if (typeof window === 'undefined') return;

	localStorage.removeItem(SESSION_CACHE_KEY);

	for (const storage of [localStorage, sessionStorage]) {
		const keys: string[] = [];
		for (let i = 0; i < storage.length; i++) {
			const key = storage.key(i);
			if (key) keys.push(key);
		}
		for (const key of keys) {
			if (key.startsWith('sb-') && (key.includes('auth-token') || key.includes('code-verifier'))) {
				storage.removeItem(key);
			}
		}
	}
}
