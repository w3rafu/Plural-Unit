/**
 * Auth helper types and validators.
 *
 * This module keeps all auth-related validation and error mapping
 * in one place so components and stores do not duplicate string matching.
 */

export type AuthChannel = 'phone' | 'email';
export type AuthStep = 'request_code' | 'verify_code';
export type OrganizationOnboardingMode = 'create' | 'join' | 'invite';

export function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhoneNumber(value: string): boolean {
	return /^\+?[0-9() -]{7,20}$/.test(value.trim());
}

export function validateLoginInput(channel: AuthChannel, email: string, phone: string) {
	if (channel === 'email') {
		if (!email.trim()) return { ok: false as const, field: 'email' as const, feedback: 'Enter your email.' };
		if (!isValidEmail(email)) return { ok: false as const, field: 'email' as const, feedback: 'Enter a valid email.' };
	} else {
		if (!phone.trim()) return { ok: false as const, field: 'phone' as const, feedback: 'Enter your phone number.' };
		if (!isValidPhoneNumber(phone)) return { ok: false as const, field: 'phone' as const, feedback: 'Enter a valid phone number.' };
	}
	return { ok: true as const };
}

export function validateOtpCode(code: string) {
	const trimmed = code.trim();
	if (!trimmed) return { ok: false as const, feedback: 'Enter the verification code.' };
	if (trimmed.length < 6) return { ok: false as const, feedback: 'The code should be 6 digits.' };
	return { ok: true as const };
}

export function validateOnboardingName(name: string) {
	const trimmed = name.trim();
	if (!trimmed) return { ok: false as const, feedback: 'Enter your name.' };
	if (trimmed.length < 2) return { ok: false as const, feedback: 'Name must be at least 2 characters.' };
	return { ok: true as const };
}

export function validateOrganizationInput(mode: OrganizationOnboardingMode, fields: { name: string; joinCode: string; inviteToken: string }) {
	if (mode === 'create') {
		if (!fields.name.trim()) return { ok: false as const, field: 'name' as const, feedback: 'Enter an organization name.' };
	} else if (mode === 'join') {
		if (!fields.joinCode.trim()) return { ok: false as const, field: 'joinCode' as const, feedback: 'Enter a join code.' };
	} else {
		if (!fields.inviteToken.trim()) return { ok: false as const, field: 'inviteToken' as const, feedback: 'Paste the invitation token.' };
	}
	return { ok: true as const };
}

export function mapAuthErrorMessage(error: unknown): string {
	const message = typeof error === 'object' && error && 'message' in error
		? String(error.message) : 'Authentication failed.';

	if (message.toLowerCase().includes('invalid login credentials'))
		return 'Invalid credentials.';
	if (message.toLowerCase().includes('token has expired') || message.toLowerCase().includes('otp expired'))
		return 'The code has expired. Request a new one.';
	if (message.toLowerCase().includes('email not confirmed'))
		return 'Please confirm your email first.';
	if (message.toLowerCase().includes('sms'))
		return 'Could not send the text message. Check the phone number.';

	return message;
}
