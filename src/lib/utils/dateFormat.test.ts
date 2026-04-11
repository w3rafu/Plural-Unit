import { describe, it, expect } from 'vitest';
import { formatShortDate, formatShortDateTime, formatEventDateTime } from './dateFormat';

describe('formatShortDate', () => {
	it('formats a valid ISO date', () => {
		const result = formatShortDate('2026-04-11T14:30:00Z');
		expect(result).toContain('Apr');
		expect(result).toContain('11');
		expect(result).toContain('2026');
	});

	it('formats a midnight UTC date', () => {
		const result = formatShortDate('2026-06-15T00:00:00Z');
		expect(result).toContain('2026');
	});

	it('formats a far-future date', () => {
		const result = formatShortDate('2099-12-31T23:59:59Z');
		expect(result).toContain('2099');
	});

	it('returns empty string for an invalid date', () => {
		expect(formatShortDate('not-a-date')).toBe('');
	});
});

describe('formatShortDateTime', () => {
	it('formats a valid ISO date with time', () => {
		const result = formatShortDateTime('2026-04-11T14:30:00Z');
		expect(result).toContain('Apr');
		expect(result).toContain('11');
	});

	it('formats a midnight UTC date', () => {
		const result = formatShortDateTime('2026-01-01T00:00:00Z');
		expect(result).toBeTruthy();
	});

	it('returns empty string for an invalid date', () => {
		expect(formatShortDateTime('invalid')).toBe('');
	});
});

describe('formatEventDateTime', () => {
	it('includes a weekday abbreviation', () => {
		// 2026-04-11 is a Saturday
		const result = formatEventDateTime('2026-04-11T14:30:00Z');
		expect(result).toContain('Sat');
	});

	it('formats a valid ISO date with weekday and time', () => {
		const result = formatEventDateTime('2026-04-11T14:30:00Z');
		expect(result).toContain('Apr');
		expect(result).toContain('11');
	});

	it('returns empty string for an invalid date', () => {
		expect(formatEventDateTime('garbage')).toBe('');
	});
});
