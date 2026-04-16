import { describe, it, expect, beforeEach } from 'vitest';
import {
	serializeCachedSession,
	readCachedSession,
	shouldHandleAsSignedOut,
	shouldResetCachedBrowserSession
} from '$lib/services/sessionCache';

describe('serializeCachedSession / readCachedSession', () => {
	it('round-trips id and name', () => {
		const details = {
			id: 'abc',
			name: 'Jo',
			email: 'a@b.co',
			phone_number: '',
			avatar_url: 'https://cdn.example/avatar.png',
			bio: ''
		};
		const raw = serializeCachedSession(details);
		const restored = readCachedSession(raw);
		expect(restored).toEqual({
			id: 'abc',
			name: 'Jo',
			avatar_url: 'https://cdn.example/avatar.png'
		});
	});

	it('excludes email and phone from cache', () => {
		const details = {
			id: 'abc',
			name: 'Jo',
			email: 'secret@x.co',
			phone_number: '+1555',
			avatar_url: 'https://cdn.example/avatar.png',
			bio: ''
		};
		const raw = serializeCachedSession(details);
		const parsed = JSON.parse(raw);
		expect(parsed.details).not.toHaveProperty('email');
		expect(parsed.details).not.toHaveProperty('phone_number');
	});

	it('returns null for null input', () => {
		expect(readCachedSession(null)).toBeNull();
	});

	it('returns null for invalid JSON', () => {
		expect(readCachedSession('not-json')).toBeNull();
	});

	it('returns null for empty id', () => {
		expect(
			readCachedSession(JSON.stringify({ details: { id: '', name: '', avatar_url: '' } }))
		).toBeNull();
	});
});

describe('shouldHandleAsSignedOut', () => {
	it('returns true for auth session missing', () => {
		expect(shouldHandleAsSignedOut(new Error('Auth session missing'))).toBe(true);
	});
	it('returns true for no authenticated user', () => {
		expect(shouldHandleAsSignedOut(new Error('No authenticated user'))).toBe(true);
	});
	it('returns false for other errors', () => {
		expect(shouldHandleAsSignedOut(new Error('Something else'))).toBe(false);
	});
});

describe('shouldResetCachedBrowserSession', () => {
	it('returns true for network failures', () => {
		expect(shouldResetCachedBrowserSession(new Error('Load failed'))).toBe(true);
		expect(shouldResetCachedBrowserSession(new Error('Failed to fetch'))).toBe(true);
		expect(shouldResetCachedBrowserSession(new Error('network request failed'))).toBe(true);
	});
	it('returns false for auth errors', () => {
		expect(shouldResetCachedBrowserSession(new Error('Invalid credentials'))).toBe(false);
	});
});
