import { describe, it, expect } from 'vitest';
import { normalizeJoinCode, normalizeInviteToken } from '$lib/models/organizationModel';

describe('normalizeJoinCode', () => {
	it('uppercases and trims', () => {
		expect(normalizeJoinCode('  abc123  ')).toBe('ABC123');
	});
});

describe('normalizeInviteToken', () => {
	it('lowercases and trims', () => {
		expect(normalizeInviteToken('  ABC123  ')).toBe('abc123');
	});
});
