/**
 * Repository error helper — wraps raw Supabase errors with human-readable messages.
 *
 * Every repository `throw` should use this instead of re-throwing the raw
 * Supabase error object, so toasts and other UI feedback always show
 * an understandable message.
 */

import { getHubSchemaDriftRecoveryCopy } from '$lib/models/hubRecoveryGuidance';

const SCHEMA_DRIFT_CODES = new Set(['42703', '42P01', '42704', '42883']);
const SCHEMA_DRIFT_MESSAGE_PATTERN =
	/\b(column|relation|function|constraint)\b[\s\S]*\bdoes not exist\b/i;
const SCHEMA_CACHE_MESSAGE_PATTERN =
	/could not find the ['"][^'"]+['"] column of ['"][^'"]+['"] in the schema cache/i;

function buildRepositoryErrorMessage(fallback: string, message: string, code?: string | null) {
	if (
		SCHEMA_DRIFT_CODES.has(code ?? '') ||
		SCHEMA_DRIFT_MESSAGE_PATTERN.test(message) ||
		SCHEMA_CACHE_MESSAGE_PATTERN.test(message)
	) {
		return `${message} ${getHubSchemaDriftRecoveryCopy(message)}`;
	}

	return message || fallback;
}

/**
 * Extract a readable message from an unknown error and throw a new Error.
 *
 * If the original error contains a `.message` string, that message is kept.
 * Otherwise the provided fallback is used.
 */
export function throwRepositoryError(error: unknown, fallback: string): never {
	if (error instanceof Error) {
		throw new Error(buildRepositoryErrorMessage(fallback, error.message));
	}

	if (typeof error === 'object' && error !== null) {
		const message = 'message' in error ? String((error as { message: unknown }).message) : '';
		const code = 'code' in error ? String((error as { code: unknown }).code) : null;
		if (message) throw new Error(buildRepositoryErrorMessage(fallback, message, code));
	}

	throw new Error(fallback);
}
