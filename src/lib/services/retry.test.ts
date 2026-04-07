import { describe, it, expect, vi } from 'vitest';
import { withRetry, isRetryableError, getRetryDelayMs } from '$lib/services/retry';

describe('getRetryDelayMs', () => {
	it('returns exponential delays', () => {
		expect(getRetryDelayMs(0)).toBe(250);
		expect(getRetryDelayMs(1)).toBe(500);
		expect(getRetryDelayMs(2)).toBe(1000);
	});
	it('caps at maxDelayMs', () => {
		expect(getRetryDelayMs(10)).toBe(2000);
	});
});

describe('isRetryableError', () => {
	it('retries network errors', () => {
		expect(isRetryableError(new Error('network error'))).toBe(true);
		expect(isRetryableError(new Error('Failed to fetch'))).toBe(true);
		expect(isRetryableError(new Error('connection refused'))).toBe(true);
	});
	it('does not retry auth errors', () => {
		expect(isRetryableError(new Error('Invalid login credentials'))).toBe(false);
		expect(isRetryableError(new Error('User already registered'))).toBe(false);
	});
	it('handles non-error values', () => {
		expect(isRetryableError('string')).toBe(false);
		expect(isRetryableError(null)).toBe(false);
	});
});

describe('withRetry', () => {
	it('returns result on first success', async () => {
		const result = await withRetry(() => Promise.resolve(42));
		expect(result).toBe(42);
	});

	it('throws non-retryable errors immediately', async () => {
		const op = vi.fn().mockRejectedValue(new Error('Invalid login credentials'));
		await expect(withRetry(op)).rejects.toThrow('Invalid login credentials');
		expect(op).toHaveBeenCalledTimes(1);
	});

	it('retries retryable errors up to the attempt limit', async () => {
		const op = vi.fn().mockRejectedValue(new Error('network error'));
		await expect(withRetry(op, 2)).rejects.toThrow('network error');
		expect(op).toHaveBeenCalledTimes(2);
	});

	it('succeeds after transient failures', async () => {
		const op = vi
			.fn()
			.mockRejectedValueOnce(new Error('network error'))
			.mockResolvedValueOnce('ok');
		const result = await withRetry(op);
		expect(result).toBe('ok');
		expect(op).toHaveBeenCalledTimes(2);
	});
});
