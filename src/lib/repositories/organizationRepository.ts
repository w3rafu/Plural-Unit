/**
 * Organization repository — all Supabase operations for organizations.
 *
 * Only this file should know table names, column shapes, or RPC names
 * related to organizations. Stores call these functions instead of
 * touching Supabase directly.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import type {
	OrganizationPayload,
	OrganizationMembership,
	OrganizationInvitation,
	OrganizationMember
} from '$lib/models/organizationModel';

// ── Context lookup ──

export type OrganizationContext = {
	organization: OrganizationPayload;
	membership: OrganizationMembership;
};

export async function fetchOwnOrganizationContext(
	userId: string
): Promise<OrganizationContext | null> {
	const { data, error } = await getSupabaseClient()
		.from('organization_memberships')
		.select('organization_id, role, joined_via, organizations(id, name, join_code, created_at)')
		.eq('profile_id', userId)
		.maybeSingle();

	if (error) throw error;
	if (!data || !data.organizations) return null;

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

export async function createOrganization(
	userId: string,
	name: string
): Promise<OrganizationContext> {
	const { data, error } = await getSupabaseClient().rpc('create_organization', {
		p_name: name,
		p_creator_id: userId
	});
	if (error) throw error;

	// Re-fetch the full context after creation.
	const ctx = await fetchOwnOrganizationContext(userId);
	if (!ctx) throw new Error('Organization was created but context could not be loaded.');
	return ctx;
}

// ── Join by code ──

export async function joinOrganizationByCode(
	userId: string,
	joinCode: string
): Promise<OrganizationContext> {
	const { error } = await getSupabaseClient().rpc('join_organization_by_code', {
		p_profile_id: userId,
		p_join_code: joinCode
	});
	if (error) throw error;

	const ctx = await fetchOwnOrganizationContext(userId);
	if (!ctx) throw new Error('Joined but context could not be loaded.');
	return ctx;
}

// ── Accept invitation ──

export async function acceptInvitation(
	userId: string,
	token: string
): Promise<OrganizationContext> {
	const { error } = await getSupabaseClient().rpc('accept_organization_invitation', {
		p_profile_id: userId,
		p_token: token
	});
	if (error) throw error;

	const ctx = await fetchOwnOrganizationContext(userId);
	if (!ctx) throw new Error('Invitation accepted but context could not be loaded.');
	return ctx;
}

// ── Invitations (admin) ──

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
		throw error;
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

export async function fetchPendingInvitations(
	organizationId: string
): Promise<OrganizationInvitation[]> {
	const { data, error } = await getSupabaseClient()
		.from('organization_invitations')
		.select('id, organization_id, email, phone, status, created_at')
		.eq('organization_id', organizationId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as OrganizationInvitation[];
}

// ── Join code (admin) ──

export async function regenerateJoinCode(organizationId: string): Promise<string> {
	const { data, error } = await getSupabaseClient().rpc('regenerate_organization_join_code', {
		p_organization_id: organizationId
	});
	if (error) throw error;
	return data as string;
}

// ── Member count ──

export async function fetchMemberCount(organizationId: string): Promise<number> {
	const { count, error } = await getSupabaseClient()
		.from('organization_memberships')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', organizationId);

	if (error) throw error;
	return count ?? 0;
}

export async function fetchOrganizationMembers(
	organizationId: string
): Promise<OrganizationMember[]> {
	const { data, error } = await getSupabaseClient().rpc('get_organization_members', {
		p_organization_id: organizationId
	});

	if (error) throw error;
	return (data ?? []) as OrganizationMember[];
}
