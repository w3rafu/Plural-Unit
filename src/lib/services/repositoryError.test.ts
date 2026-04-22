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
			'column hub_events.delivery_state does not exist Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.'
		);
	});

	it('adds targeted migration guidance for known missing hub relations', () => {
		const pgError = {
			message: 'relation "public"."hub_notification_preferences" does not exist',
			code: '42P01'
		};
		expect(() => throwRepositoryError(pgError, 'fallback')).toThrowError(
			'relation "public"."hub_notification_preferences" does not exist Apply migration 022_add_hub_notification_preferences.sql, then try again.'
		);
	});

	it('adds migration guidance for schema cache column drift errors', () => {
		const pgError = {
			message: "Could not find the 'visibility_mode' column of 'hub_plugins' in the schema cache",
			code: 'PGRST204'
		};

		expect(() => throwRepositoryError(pgError, 'fallback')).toThrowError(
			"Could not find the 'visibility_mode' column of 'hub_plugins' in the schema cache Apply migration 043_add_hub_plugin_visibility.sql, then try again."
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
