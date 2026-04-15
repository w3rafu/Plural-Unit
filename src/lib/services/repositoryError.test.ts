import { describe, it, expect } from 'vitest';
import { throwRepositoryError } from './repositoryError';

describe('throwRepositoryError', () => {
	it('re-throws an Error instance with its message', () => {
		expect(() => throwRepositoryError(new Error('db timeout'), 'fallback')).toThrowError(
			'db timeout'
		);
	});

	it('uses fallback when Error has an empty message', () => {
		expect(() => throwRepositoryError(new Error(''), 'fallback')).toThrowError('fallback');
	});

	it('extracts .message from a plain object', () => {
		const pgError = { message: 'row-level security violation', code: '42501' };
		expect(() => throwRepositoryError(pgError, 'fallback')).toThrowError(
			'row-level security violation'
		);
	});

	it('adds migration guidance for schema drift errors', () => {
		const pgError = { message: 'column hub_events.delivery_state does not exist', code: '42703' };
		expect(() => throwRepositoryError(pgError, 'fallback')).toThrowError(
			'column hub_events.delivery_state does not exist Run the latest Supabase migrations, then try again.'
		);
	});

	it('uses fallback when plain object has empty message', () => {
		expect(() => throwRepositoryError({ message: '' }, 'fallback')).toThrowError('fallback');
	});

	it('uses fallback for a string input', () => {
		expect(() => throwRepositoryError('something broke', 'fallback')).toThrowError('fallback');
	});

	it('uses fallback for null', () => {
		expect(() => throwRepositoryError(null, 'fallback')).toThrowError('fallback');
	});

	it('uses fallback for undefined', () => {
		expect(() => throwRepositoryError(undefined, 'fallback')).toThrowError('fallback');
	});
});
