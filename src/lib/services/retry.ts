/**
 * Retry utility with exponential backoff for transient network failures.
 *
 * Only retryable errors (network / fetch / timeout) are retried.
 * Auth and validation errors are thrown immediately.
 */

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;

export function getRetryDelayMs(
	attemptIndex: number,
	baseDelayMs = RETRY_BASE_DELAY_MS,
	maxDelayMs = 2_000
) {
	const exponential = baseDelayMs * 2 ** attemptIndex;
	return Math.min(exponential, maxDelayMs);
}

export function isRetryableError(error: unknown) {
	const message =
		typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
	const lower = message.toLowerCase();

	return (
		lower.includes('network') ||
		lower.includes('fetch failed') ||
		lower.includes('failed to fetch') ||
		lower.includes('timeout') ||
		lower.includes('temporarily unavailable') ||
		lower.includes('connection')
	);
}

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
	operation: () => Promise<T>,
	attempts = RETRY_ATTEMPTS
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt < attempts; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (!isRetryableError(error) || attempt === attempts - 1) {
				throw error;
			}

			await sleep(getRetryDelayMs(attempt));
		}
	}

	throw lastError;
}
