import { describe, it, expect } from 'vitest';
import {
	isValidEmail,
	isValidPhoneNumber,
	validateLoginInput,
	validateRegistrationInput,
	validatePhoneNumberInput,
	validateOtpCodeInput,
	validatePasswordResetEmail,
	validateNewPassword,
	validateOnboardingName,
	validateOrganizationInput,
	mapLoginErrorMessage,
	mapRegistrationErrorMessage,
	mapPasswordResetErrorMessage
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
	it('requires email', () => {
		const result = validateLoginInput({ email: '', password: 'pass' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('email');
	});
	it('rejects invalid email', () => {
		const result = validateLoginInput({ email: 'bad', password: 'pass' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('email');
	});
	it('requires password', () => {
		const result = validateLoginInput({ email: 'a@b.co', password: '' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('password');
	});
	it('passes with valid email and password', () => {
		const result = validateLoginInput({ email: ' a@b.co ', password: 'secret' });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedEmail).toBe('a@b.co');
	});
});

describe('validateRegistrationInput', () => {
	it('rejects short password', () => {
		const result = validateRegistrationInput({ email: 'a@b.co', password: 'short', confirmPassword: 'short' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('password');
	});
	it('rejects mismatched passwords', () => {
		const result = validateRegistrationInput({ email: 'a@b.co', password: 'longpassword', confirmPassword: 'different' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('confirmPassword');
	});
	it('passes with valid registration input', () => {
		const result = validateRegistrationInput({ email: 'a@b.co', password: 'longpassword', confirmPassword: 'longpassword' });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedEmail).toBe('a@b.co');
	});
});

describe('validatePhoneNumberInput', () => {
	it('rejects empty', () => {
		const result = validatePhoneNumberInput('');
		expect(result.ok).toBe(false);
	});
	it('rejects invalid number', () => {
		const result = validatePhoneNumberInput('12');
		expect(result.ok).toBe(false);
	});
	it('passes with valid number', () => {
		const result = validatePhoneNumberInput('+1 555 1234567');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedPhoneNumber).toBe('+1 555 1234567');
	});
});

describe('validateOtpCodeInput', () => {
	it('rejects empty', () => {
		expect(validateOtpCodeInput('').ok).toBe(false);
	});
	it('rejects non-6-digit codes', () => {
		expect(validateOtpCodeInput('123').ok).toBe(false);
		expect(validateOtpCodeInput('abcdef').ok).toBe(false);
	});
	it('accepts 6-digit codes', () => {
		const result = validateOtpCodeInput('123456');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedOtpCode).toBe('123456');
	});
});

describe('validateOnboardingName', () => {
	it('rejects empty name', () => {
		expect(validateOnboardingName('').ok).toBe(false);
	});
	it('accepts valid name', () => {
		const result = validateOnboardingName('Jo');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedName).toBe('Jo');
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
	it('passes with valid create input and returns normalized value', () => {
		const result = validateOrganizationInput('create', { ...empty, name: 'Org' });
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.action).toBe('create');
			expect(result.normalizedValue).toBe('Org');
		}
	});
	it('uppercases join codes', () => {
		const result = validateOrganizationInput('join', { ...empty, joinCode: 'abc123' });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedValue).toBe('ABC123');
	});
});

describe('mapLoginErrorMessage', () => {
	it('maps invalid credentials', () => {
		expect(mapLoginErrorMessage({ message: 'Invalid login credentials' })).toContain('Invalid');
	});
	it('maps expired OTP', () => {
		expect(mapLoginErrorMessage({ message: 'Token has expired' })).toContain('expired');
	});
	it('passes through unknown errors', () => {
		expect(mapLoginErrorMessage({ message: 'Something weird' })).toBe('Something weird');
	});
});

describe('mapRegistrationErrorMessage', () => {
	it('maps already registered', () => {
		expect(mapRegistrationErrorMessage({ message: 'User already registered' })).toContain('already registered');
	});
	it('maps weak password', () => {
		expect(mapRegistrationErrorMessage({ message: 'Password is too weak' })).toContain('stronger');
	});
	it('passes through unknown errors', () => {
		expect(mapRegistrationErrorMessage({ message: 'Network error' })).toBe('Network error');
	});
});

describe('validatePasswordResetEmail', () => {
	it('rejects empty email', () => {
		const result = validatePasswordResetEmail('');
		expect(result.ok).toBe(false);
	});
	it('rejects invalid email', () => {
		const result = validatePasswordResetEmail('not-an-email');
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('email');
	});
	it('passes and normalizes valid email', () => {
		const result = validatePasswordResetEmail(' a@b.co ');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.normalizedEmail).toBe('a@b.co');
	});
});

describe('validateNewPassword', () => {
	it('rejects empty password', () => {
		const result = validateNewPassword({ password: '', confirmPassword: '' });
		expect(result.ok).toBe(false);
	});
	it('rejects short password', () => {
		const result = validateNewPassword({ password: '1234567', confirmPassword: '1234567' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('password');
	});
	it('rejects mismatched passwords', () => {
		const result = validateNewPassword({ password: 'longpassword', confirmPassword: 'different' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.field).toBe('confirmPassword');
	});
	it('passes with valid matching passwords', () => {
		const result = validateNewPassword({ password: 'longpassword', confirmPassword: 'longpassword' });
		expect(result.ok).toBe(true);
	});
});

describe('mapPasswordResetErrorMessage', () => {
	it('maps rate limit', () => {
		expect(mapPasswordResetErrorMessage({ message: 'Rate limit exceeded' })).toContain('already sent');
	});
	it('maps Supabase security cooldown', () => {
		expect(mapPasswordResetErrorMessage({ message: 'For security purposes, you can only request this once every 60 seconds' })).toContain('already sent');
	});
	it('maps user not found', () => {
		expect(mapPasswordResetErrorMessage({ message: 'User not found' })).toContain('No account');
	});
	it('passes through unknown errors', () => {
		expect(mapPasswordResetErrorMessage({ message: 'Something else' })).toBe('Something else');
	});
});
