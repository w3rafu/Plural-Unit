/**
 * Repository error helper — wraps raw Supabase errors with human-readable messages.
 *
 * Every repository `throw` should use this instead of re-throwing the raw
 * Supabase error object, so toasts and other UI feedback always show
 * an understandable message.
 */

/**
 * Extract a readable message from an unknown error and throw a new Error.
 *
 * If the original error contains a `.message` string, that message is kept.
 * Otherwise the provided fallback is used.
 */
export function throwRepositoryError(error: unknown, fallback: string): never {
	if (error instanceof Error) {
		throw new Error(error.message || fallback);
	}

	if (typeof error === 'object' && error !== null && 'message' in error) {
		const message = String((error as { message: unknown }).message);
		if (message) throw new Error(message);
	}

	throw new Error(fallback);
}
