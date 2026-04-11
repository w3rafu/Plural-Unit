/**
 * Organization repository — all Supabase operations for organizations.
 *
 * Only this file should know table names, column shapes, or RPC names
 * related to organizations. Stores call these functions instead of
 * touching Supabase directly.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';
import type {
	OrganizationPayload,
	OrganizationMembership,
	OrganizationInvitation,
	OrganizationMember,
	OrganizationMemberRole
} from '$lib/models/organizationModel';

// ── Context lookup ──

/** Organization + membership context returned from lookup queries. */
export type OrganizationContext = {
	organization: OrganizationPayload;
	membership: OrganizationMembership;
};

/** Fetch the calling user's organization and membership in one round-trip. */
export async function fetchOwnOrganizationContext(
	userId: string
): Promise<OrganizationContext | null> {
	const { data, error } = await getSupabaseClient()
		.from('organization_memberships')
		.select('organization_id, role, joined_via, organizations(id, name, join_code, created_at)')
		.eq('profile_id', userId)
		.maybeSingle();

	if (error) throwRepositoryError(error, 'Could not load organization context.');
	if (!data || !data.organizations) return null;

	// Supabase types this to-one FK join as an array; at runtime it is a single object.
	const org = data.organizations as unknown as OrganizationPayload;
	return {
		organization: org,
		membership: {
			organization_id: data.organization_id,
			profile_id: userId,
			role: data.role as OrganizationMembership['role'],
			joined_via: data.joined_via as OrganizationMembership['joined_via']
		}
	};
}

// ── Create ──

/** Create a new organization with the given user as its first admin. */
export async function createOrganization(
	userId: string,
	name: string
): Promise<OrganizationContext> {
	const { data, error } = await getSupabaseClient().rpc('create_organization', {
		p_name: name,
		p_creator_id: userId
	});
	if (error) throwRepositoryError(error, 'Could not create the organization.');

	// Re-fetch the full context after creation.
	const ctx = await fetchOwnOrganizationContext(userId);
	if (!ctx) throw new Error('Organization was created but context could not be loaded.');
	return ctx;
}

// ── Join by code ──

/** Join an existing organization using a shareable join code. */
export async function joinOrganizationByCode(
	userId: string,
	joinCode: string
): Promise<OrganizationContext> {
	const { error } = await getSupabaseClient().rpc('join_organization_by_code', {
		p_profile_id: userId,
		p_join_code: joinCode
	});
	if (error) throwRepositoryError(error, 'Could not join the organization by code.');

	const ctx = await fetchOwnOrganizationContext(userId);
	if (!ctx) throw new Error('Joined but context could not be loaded.');
	return ctx;
}

// ── Accept invitation ──

/** Accept a pending invitation by its unique token. */
export async function acceptInvitation(
	userId: string,
	token: string
): Promise<OrganizationContext> {
	const { error } = await getSupabaseClient().rpc('accept_organization_invitation', {
		p_profile_id: userId,
		p_token: token
	});
	if (error) throwRepositoryError(error, 'Could not accept the invitation.');

	const ctx = await fetchOwnOrganizationContext(userId);
	if (!ctx) throw new Error('Invitation accepted but context could not be loaded.');
	return ctx;
}

// ── Invitations (admin) ──

/** Insert a new pending invitation for the given email or phone number. */
export async function createInvitation(
	organizationId: string,
	contact: { email?: string; phone?: string }
): Promise<OrganizationInvitation> {
	const payload = buildInvitationPayload(organizationId, contact);

	const { data, error } = await getSupabaseClient()
		.from('organization_invitations')
		.insert(payload)
		.select()
		.single();

	if (error) {
		if (isUniqueInvitationViolation(error)) {
			throw new Error('An invitation is already pending for that contact.');
		}
		throwRepositoryError(error, 'Could not create the invitation.');
	}
	return data as OrganizationInvitation;
}

function buildInvitationPayload(
	organizationId: string,
	contact: { email?: string; phone?: string }
) {
	const email = contact.email?.trim() ?? '';
	const phone = contact.phone?.trim() ?? '';
	const hasEmail = email.length > 0;
	const hasPhone = phone.length > 0;

	if (hasEmail === hasPhone) {
		throw new Error('Provide exactly one email or phone number.');
	}

	return {
		organization_id: organizationId,
		email: hasEmail ? email : null,
		phone: hasPhone ? phone : null,
		status: 'pending'
	};
}

function isUniqueInvitationViolation(error: { code?: string; status?: number; message?: string }) {
	return error.code === '23505' || error.status === 409 || error.message?.includes('duplicate key value');
}

/** Return all pending (not yet accepted or revoked) invitations for an organization. */
export async function fetchPendingInvitations(
	organizationId: string
): Promise<OrganizationInvitation[]> {
	const { data, error } = await getSupabaseClient()
		.from('organization_invitations')
		.select('id, organization_id, email, phone, status, created_at')
		.eq('organization_id', organizationId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load pending invitations.');
	return (data ?? []) as OrganizationInvitation[];
}

/** Generate a fresh token for an existing pending invitation. */
export async function resendInvitation(invitationId: string) {
	const { error } = await getSupabaseClient().rpc('resend_organization_invitation', {
		p_invitation_id: invitationId
	});

	if (error) throwRepositoryError(error, 'Could not resend the invitation.');
}

/** Mark a pending invitation as revoked so it can no longer be used. */
export async function revokeInvitation(invitationId: string) {
	const { error } = await getSupabaseClient().rpc('revoke_organization_invitation', {
		p_invitation_id: invitationId
	});

	if (error) throwRepositoryError(error, 'Could not revoke the invitation.');
}

// ── Join code (admin) ──

/** Replace the organization's join code with a new random value. */
export async function regenerateJoinCode(organizationId: string): Promise<string> {
	const { data, error } = await getSupabaseClient().rpc('regenerate_organization_join_code', {
		p_organization_id: organizationId
	});
	if (error) throwRepositoryError(error, 'Could not regenerate the join code.');
	return data as string;
}

// ── Member count ──

/** Count how many members belong to the organization (exact). */
export async function fetchMemberCount(organizationId: string): Promise<number> {
	const { count, error } = await getSupabaseClient()
		.from('organization_memberships')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', organizationId);

	if (error) throwRepositoryError(error, 'Could not load the member count.');
	return count ?? 0;
}

/** Fetch all members with their profile info via the get_organization_members RPC. */
export async function fetchOrganizationMembers(
	organizationId: string
): Promise<OrganizationMember[]> {
	const { data, error } = await getSupabaseClient().rpc('get_organization_members', {
		p_organization_id: organizationId
	});

	if (error) throwRepositoryError(error, 'Could not load organization members.');
	return (data ?? []) as OrganizationMember[];
}

/** Change a member's role (admin ↔ member) within the organization. */
export async function setOrganizationMemberRole(
	organizationId: string,
	profileId: string,
	role: OrganizationMemberRole
) {
	const { error } = await getSupabaseClient().rpc('set_organization_member_role', {
		p_organization_id: organizationId,
		p_profile_id: profileId,
		p_role: role
	});

	if (error) throwRepositoryError(error, 'Could not update the member role.');
}

/** Remove a member from the organization entirely. */
export async function removeOrganizationMember(organizationId: string, profileId: string) {
	const { error } = await getSupabaseClient().rpc('remove_organization_member', {
		p_organization_id: organizationId,
		p_profile_id: profileId
	});

	if (error) throwRepositoryError(error, 'Could not remove the member.');
}
