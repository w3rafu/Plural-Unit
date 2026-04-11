import { describe, it, expect } from 'vitest';
import { computeAvatarInitials, validateAvatarFile } from './avatarUploadModel';

describe('computeAvatarInitials', () => {
	it('returns initials from a two-word name', () => {
		expect(computeAvatarInitials('Jane Doe')).toBe('JD');
	});

	it('returns single initial from a one-word name', () => {
		expect(computeAvatarInitials('Jane')).toBe('J');
	});

	it('uses the first non-empty source', () => {
		expect(computeAvatarInitials('', null, 'Backup Name')).toBe('BN');
	});

	it('returns ? when all sources are empty', () => {
		expect(computeAvatarInitials('', null, undefined)).toBe('?');
	});

	it('trims whitespace before splitting', () => {
		expect(computeAvatarInitials('  Alice   Bob  ')).toBe('AB');
	});

	it('limits to two initials', () => {
		expect(computeAvatarInitials('Alice Bob Charlie')).toBe('AB');
	});

	it('uses email as fallback source', () => {
		expect(computeAvatarInitials('', 'test@example.com')).toBe('T');
	});
});

describe('validateAvatarFile', () => {
	it('returns empty string for null file', () => {
		expect(validateAvatarFile(null)).toBe('');
	});

	it('returns empty string for a valid image file', () => {
		const file = new File([''], 'photo.png', { type: 'image/png' });
		expect(validateAvatarFile(file)).toBe('');
	});

	it('returns error for non-image file', () => {
		const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
		expect(validateAvatarFile(file)).toBe('Choose a PNG, JPEG, or WebP image.');
	});

	it('accepts JPEG files', () => {
		const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
		expect(validateAvatarFile(file)).toBe('');
	});

	it('accepts WebP files', () => {
		const file = new File([''], 'photo.webp', { type: 'image/webp' });
		expect(validateAvatarFile(file)).toBe('');
	});
});
