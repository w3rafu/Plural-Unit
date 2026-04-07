import { describe, it, expect } from 'vitest';
import {
	isValidEmail,
	isValidPhoneNumber,
	validateLoginInput,
	validateOtpCode,
	validateOnboardingName,
	validateOrganizationInput,
	mapAuthErrorMessage
} from '$lib/models/authHelpers';

describe('isValidEmail', () => {
	it('accepts well-formed emails', () => {
		expect(isValidEmail('a@b.co')).toBe(true);
	});
	it('rejects missing @', () => {
		expect(isValidEmail('abc')).toBe(false);
	});
});

describe('isValidPhoneNumber', () => {
	it('accepts +1 format', () => {
		expect(isValidPhoneNumber('+1 (555) 123-4567')).toBe(true);
	});
	it('rejects too short', () => {
		expect(isValidPhoneNumber('12')).toBe(false);
	});
});

describe('validateLoginInput', () => {
	it('requires email when channel is email', () => {
		const result = validateLoginInput('email', '', '');
		expect(result.ok).toBe(false);
	});
	it('passes with valid email', () => {
		const result = validateLoginInput('email', 'a@b.co', '');
		expect(result.ok).toBe(true);
	});
	it('requires phone when channel is phone', () => {
		const result = validateLoginInput('phone', '', '');
		expect(result.ok).toBe(false);
	});
});

describe('validateOtpCode', () => {
	it('rejects empty', () => {
		expect(validateOtpCode('').ok).toBe(false);
	});
	it('rejects short codes', () => {
		expect(validateOtpCode('123').ok).toBe(false);
	});
	it('accepts 6-digit codes', () => {
		expect(validateOtpCode('123456').ok).toBe(true);
	});
});

describe('validateOnboardingName', () => {
	it('rejects empty name', () => {
		expect(validateOnboardingName('').ok).toBe(false);
	});
	it('rejects single char', () => {
		expect(validateOnboardingName('A').ok).toBe(false);
	});
	it('accepts valid name', () => {
		expect(validateOnboardingName('Jo').ok).toBe(true);
	});
});

describe('validateOrganizationInput', () => {
	const empty = { name: '', joinCode: '', inviteToken: '' };

	it('requires name in create mode', () => {
		expect(validateOrganizationInput('create', empty).ok).toBe(false);
	});
	it('requires joinCode in join mode', () => {
		expect(validateOrganizationInput('join', empty).ok).toBe(false);
	});
	it('requires inviteToken in invite mode', () => {
		expect(validateOrganizationInput('invite', empty).ok).toBe(false);
	});
	it('passes with valid create input', () => {
		expect(validateOrganizationInput('create', { ...empty, name: 'Org' }).ok).toBe(true);
	});
});

describe('mapAuthErrorMessage', () => {
	it('maps invalid credentials', () => {
		expect(mapAuthErrorMessage({ message: 'Invalid login credentials' })).toContain('Invalid');
	});
	it('maps expired OTP', () => {
		expect(mapAuthErrorMessage({ message: 'Token has expired' })).toContain('expired');
	});
	it('passes through unknown errors', () => {
		expect(mapAuthErrorMessage({ message: 'Something weird' })).toBe('Something weird');
	});
});
