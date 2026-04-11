/**
 * Auth helper types and validators.
 *
 * This module keeps all auth-related validation and error mapping
 * in one place so components and stores do not duplicate string matching.
 *
 * Every validator returns a structured result with:
 *  - `ok: true` + normalized values on success
 *  - `ok: false` + `feedback` message + `field` name on failure
 *
 * Error mappers turn raw Supabase errors into user-facing messages.
 */

export type AuthChannel = 'phone' | 'email';
export type AuthStep = 'request_code' | 'verify_code';
export type OrganizationOnboardingMode = 'create' | 'join' | 'invite';
export type FeedbackType = 'error' | 'success';

export type AuthFlowLocationState = {
	isPasswordRecovery: boolean;
	errorMessage: string;
};

type ValidationFailure<Field extends string> = {
	ok: false;
	feedback: string;
	field: Field;
};

// ── Basic format checks ──

export function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhoneNumber(value: string): boolean {
	return /^\+?[0-9() -]{7,20}$/.test(value.trim());
}

// ── Phone validators ──

export function validatePhoneNumberInput(phoneNumber: string) {
	const normalized = phoneNumber.trim();

	if (!normalized) {
		return {
			ok: false as const,
			feedback: 'Please enter your phone number.',
			field: 'phoneNumber'
		} satisfies ValidationFailure<'phoneNumber'>;
	}

	if (!isValidPhoneNumber(normalized)) {
		return {
			ok: false as const,
			feedback: 'Please enter a valid phone number.',
			field: 'phoneNumber'
		} satisfies ValidationFailure<'phoneNumber'>;
	}

	return { ok: true as const, normalizedPhoneNumber: normalized };
}

export function validateOtpCodeInput(otpCode: string) {
	const normalized = otpCode.trim();

	if (!normalized) {
		return {
			ok: false as const,
			feedback: 'Please enter the verification code.',
			field: 'otpCode'
		} satisfies ValidationFailure<'otpCode'>;
	}

	if (!/^[0-9]{6}$/.test(normalized)) {
		return {
			ok: false as const,
			feedback: 'Verification codes must be 6 digits.',
			field: 'otpCode'
		} satisfies ValidationFailure<'otpCode'>;
	}

	return { ok: true as const, normalizedOtpCode: normalized };
}

// ── Email login validator ──

export function validateLoginInput(input: { email: string; password: string }) {
	const normalizedEmail = input.email.trim().toLowerCase();

	if (!normalizedEmail) {
		return {
			ok: false as const,
			feedback: 'Please enter your email.',
			field: 'email'
		} satisfies ValidationFailure<'email'>;
	}

	if (!isValidEmail(normalizedEmail)) {
		return {
			ok: false as const,
			feedback: 'Please enter a valid email address.',
			field: 'email'
		} satisfies ValidationFailure<'email'>;
	}

	if (!input.password) {
		return {
			ok: false as const,
			feedback: 'Please enter your password.',
			field: 'password'
		} satisfies ValidationFailure<'password'>;
	}

	return { ok: true as const, normalizedEmail };
}

// ── Registration validator ──

export function validateRegistrationInput(input: {
	email: string;
	password: string;
	confirmPassword: string;
}) {
	const loginResult = validateLoginInput({ email: input.email, password: input.password });
	if (!loginResult.ok) return loginResult;

	if (input.password.length < 8) {
		return {
			ok: false as const,
			feedback: 'Password must be at least 8 characters.',
			field: 'password'
		} satisfies ValidationFailure<'password'>;
	}

	if (input.password !== input.confirmPassword) {
		return {
			ok: false as const,
			feedback: 'Passwords do not match.',
			field: 'confirmPassword'
		} satisfies ValidationFailure<'confirmPassword'>;
	}

	return loginResult;
}

// ── Password recovery validators ──

export function validatePasswordResetEmail(email: string) {
	const normalizedEmail = email.trim().toLowerCase();

	if (!normalizedEmail) {
		return {
			ok: false as const,
			feedback: 'Please enter your email.',
			field: 'email'
		} satisfies ValidationFailure<'email'>;
	}

	if (!isValidEmail(normalizedEmail)) {
		return {
			ok: false as const,
			feedback: 'Please enter a valid email address.',
			field: 'email'
		} satisfies ValidationFailure<'email'>;
	}

	return { ok: true as const, normalizedEmail };
}

export function validateNewPassword(input: { password: string; confirmPassword: string }) {
	if (!input.password) {
		return {
			ok: false as const,
			feedback: 'Please enter a new password.',
			field: 'password'
		} satisfies ValidationFailure<'password'>;
	}

	if (input.password.length < 8) {
		return {
			ok: false as const,
			feedback: 'Password must be at least 8 characters.',
			field: 'password'
		} satisfies ValidationFailure<'password'>;
	}

	if (input.password !== input.confirmPassword) {
		return {
			ok: false as const,
			feedback: 'Passwords do not match.',
			field: 'confirmPassword'
		} satisfies ValidationFailure<'confirmPassword'>;
	}

	return { ok: true as const };
}

export function readAuthFlowLocationState(input: {
	search: string;
	hash: string;
}): AuthFlowLocationState {
	const searchParams = new URLSearchParams(input.search);
	const hashParams = new URLSearchParams(input.hash.startsWith('#') ? input.hash.slice(1) : input.hash);

	const allParams = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		allParams.set(key, value);
	}
	for (const [key, value] of hashParams.entries()) {
		allParams.set(key, value);
	}

	return {
		isPasswordRecovery: allParams.get('type') === 'recovery',
		errorMessage: allParams.get('error_description') ?? ''
	};
}

// ── Name onboarding validator ──

export function validateOnboardingName(name: string) {
	const normalizedName = name.trim();

	if (!normalizedName) {
		return {
			ok: false as const,
			feedback: 'Please choose a name to continue.',
			field: 'name'
		} satisfies ValidationFailure<'name'>;
	}

	return { ok: true as const, normalizedName };
}

// ── Organization onboarding validator ──

export function validateOrganizationInput(
	mode: OrganizationOnboardingMode,
	fields: { name: string; joinCode: string; inviteToken: string }
) {
	if (mode === 'create') {
		const normalized = fields.name.trim();
		if (!normalized) {
			return {
				ok: false as const,
				feedback: 'Enter an organization name.',
				field: 'name'
			} satisfies ValidationFailure<'name'>;
		}
		return { ok: true as const, action: 'create' as const, normalizedValue: normalized };
	}

	if (mode === 'join') {
		const normalized = fields.joinCode.trim().toUpperCase();
		if (!normalized) {
			return {
				ok: false as const,
				feedback: 'Enter a valid join code.',
				field: 'joinCode'
			} satisfies ValidationFailure<'joinCode'>;
		}
		return { ok: true as const, action: 'join' as const, normalizedValue: normalized };
	}

	const normalized = fields.inviteToken.trim().toLowerCase();
	if (!normalized) {
		return {
			ok: false as const,
			feedback: 'Enter a valid invitation token.',
			field: 'inviteToken'
		} satisfies ValidationFailure<'inviteToken'>;
	}
	return { ok: true as const, action: 'invite' as const, normalizedValue: normalized };
}

// ── Error mappers ──

export function mapLoginErrorMessage(error: unknown): string {
	const message =
		typeof error === 'object' && error && 'message' in error
			? String(error.message)
			: 'Login failed.';
	const normalized = message.toLowerCase();

	if (
		normalized.includes('load failed') ||
		normalized.includes('failed to fetch') ||
		normalized.includes('network request failed') ||
		normalized.includes('network connection was lost') ||
		normalized.includes('access control') ||
		normalized.includes('timed out')
	)
		return 'We could not reach Supabase to sign you in. Check your internet connection, confirm the project is online, and try again.';
	if (normalized.includes('invalid login credentials'))
		return "We couldn't match that email and password. Check for typos, reset your password, or register if this is your first time here.";
	if (
		normalized.includes('token has expired') ||
		normalized.includes('otp expired')
	)
		return 'That verification code has expired. Request a new code.';
	if (normalized.includes('email not confirmed'))
		return 'Check your inbox for the confirmation email, then try signing in again.';
	if (normalized.includes('rate limit') || normalized.includes('too many'))
		return 'Too many attempts were made just now. Wait a moment, then try again.';
	if (normalized.includes('sms'))
		return 'Could not send the text message. Check the phone number and try again.';

	return message;
}

export function mapRegistrationErrorMessage(error: unknown): string {
	const message =
		typeof error === 'object' && error && 'message' in error
			? String(error.message)
			: 'Registration failed.';
	const normalized = message.toLowerCase();

	if (
		normalized.includes('load failed') ||
		normalized.includes('failed to fetch') ||
		normalized.includes('network request failed') ||
		normalized.includes('network connection was lost') ||
		normalized.includes('access control') ||
		normalized.includes('timed out')
	)
		return 'We could not reach Supabase to create the account. Check your internet connection and try again.';
	if (normalized.includes('already registered') || normalized.includes('already been registered'))
		return 'That email is already registered.';
	if (normalized.includes('password') && normalized.includes('least'))
		return 'Choose a stronger password.';
	if (normalized.includes('password') && normalized.includes('weak'))
		return 'Choose a stronger password.';

	return message;
}

export function mapPasswordResetErrorMessage(error: unknown): string {
	const message =
		typeof error === 'object' && error && 'message' in error
			? String(error.message)
			: 'Password reset failed.';
	const normalized = message.toLowerCase();

	if (
		normalized.includes('load failed') ||
		normalized.includes('failed to fetch') ||
		normalized.includes('network request failed') ||
		normalized.includes('network connection was lost') ||
		normalized.includes('access control') ||
		normalized.includes('timed out')
	)
		return 'We could not reach Supabase to complete recovery. Check your internet connection and try again.';
	if (
		normalized.includes('rate limit') ||
		normalized.includes('too many') ||
		normalized.includes('once every') ||
		normalized.includes('security purposes')
	)
		return 'A reset email was already sent. Wait 60 seconds before requesting another.';
	if (normalized.includes('user not found'))
		return 'We could not start recovery for that email. Double-check it or try signing in another way.';
	if (normalized.includes('same password') || normalized.includes('different from the old'))
		return 'New password must be different from the old one.';

	return message;
}

export function mapOrganizationErrorMessage(error: unknown): string {
	const message =
		typeof error === 'object' && error && 'message' in error
			? String(error.message)
			: 'Organization setup failed.';
	const normalized = message.toLowerCase();

	if (normalized.includes('already belongs to an organization'))
		return 'Your account is already linked to an organization.';
	if (normalized.includes('organization code is invalid'))
		return 'That organization code was not recognized.';
	if (normalized.includes('invitation token is invalid'))
		return 'That invitation token was not recognized.';
	if (normalized.includes('invitation has expired'))
		return 'That invitation has expired.';

	return message;
}
