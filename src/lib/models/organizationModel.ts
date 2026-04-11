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

/** The user's link to an organization: role and how they joined. */
export type OrganizationMembership = {
	organization_id: string;
	profile_id: string;
	role: 'admin' | 'member';
	joined_via: 'created' | 'invitation' | 'code';
};

/** A pending or resolved invitation record visible to admins. */
export type OrganizationInvitation = {
	id: string;
	organization_id: string;
	email: string | null;
	phone: string | null;
	status: 'pending' | 'accepted' | 'revoked' | 'expired';
	created_at: string;
};

/** Denormalized member row returned by the get_organization_members RPC. */
export type OrganizationMember = {
	profile_id: string;
	name: string;
	email: string;
	phone_number: string;
	avatar_url: string;
	role: 'admin' | 'member';
	joined_via: 'created' | 'invitation' | 'code';
	joined_at: string;
};

/** Convenience alias for the role union used in member management. */
export type OrganizationMemberRole = OrganizationMember['role'];

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
