/**
 * Organization — the top-level group a user belongs to.
 *
 * Kept intentionally minimal: id, name, join_code.
 * No types, no tiers, no branding — those live in plugins.
 */
export type OrganizationPayload = {
	id: string;
	name: string;
	join_code: string;
	created_at: string;
};

export type OrganizationMembership = {
	organization_id: string;
	profile_id: string;
	role: 'admin' | 'member';
	joined_via: 'created' | 'invitation' | 'code';
};

export type OrganizationInvitation = {
	id: string;
	organization_id: string;
	email: string | null;
	phone: string | null;
	status: 'pending' | 'accepted' | 'revoked' | 'expired';
	created_at: string;
};

/**
 * Normalize a join code to uppercase, trimmed.
 */
export function normalizeJoinCode(raw: string): string {
	return raw.trim().toUpperCase();
}

/**
 * Normalize an invitation token (trimmed, lowercase).
 */
export function normalizeInviteToken(raw: string): string {
	return raw.trim().toLowerCase();
}
