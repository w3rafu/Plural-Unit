// @ts-nocheck — Supabase mock chain returns are loosely typed by design.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase client ──

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn(() => ({ data: [], error: null }));
const mockEq = vi.fn((): any => ({ maybeSingle: mockMaybeSingle, select: mockSelect, eq: mockEq, order: mockOrder }));
const mockSelect = vi.fn((): any => ({
	single: mockSingle,
	maybeSingle: mockMaybeSingle,
	eq: mockEq,
	order: mockOrder
}));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockHead = vi.fn(() => ({ eq: mockHeadEq }));
const mockHeadEq = vi.fn();
const mockSelectCount = vi.fn((_star: string, _opts: any) => ({ head: true, eq: mockHeadEq }));
const mockRpc = vi.fn();

const mockFrom = vi.fn((): any => ({
	select: (...args: any[]) => {
		if (args.length === 2 && args[1]?.head) {
			return { eq: mockHeadEq };
		}
		return mockSelect(...args);
	},
	insert: mockInsert,
	eq: mockEq
}));

const mockClient = {
	from: mockFrom,
	rpc: mockRpc
};

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: () => mockClient
}));

import {
	fetchOwnOrganizationContext,
	createOrganization,
	joinOrganizationByCode,
	acceptInvitation,
	createInvitation,
	fetchPendingInvitations,
	resendInvitation,
	revokeInvitation,
	regenerateJoinCode,
	fetchMemberCount,
	fetchOrganizationMembers,
	fetchPendingDeletionRequests,
	resolveDeletionRequest,
	setOrganizationMemberRole,
	removeOrganizationMember
} from './organizationRepository';

beforeEach(() => {
	vi.clearAllMocks();
});

// ── Context lookup ──

describe('fetchOwnOrganizationContext', () => {
	it('returns context when a membership exists', async () => {
		mockMaybeSingle.mockResolvedValueOnce({
			data: {
				organization_id: 'org-1',
				role: 'admin',
				joined_via: 'created',
				organizations: { id: 'org-1', name: 'Acme', join_code: 'ABC123', created_at: '2026-01-01' }
			},
			error: null
		});

		const ctx = await fetchOwnOrganizationContext('user-1');

		expect(mockFrom).toHaveBeenCalledWith('organization_memberships');
		expect(ctx).not.toBeNull();
		expect(ctx!.organization.name).toBe('Acme');
		expect(ctx!.membership.role).toBe('admin');
	});

	it('returns null when no membership exists', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

		const ctx = await fetchOwnOrganizationContext('user-1');
		expect(ctx).toBeNull();
	});

	it('throws on error', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'load fail' } });

		await expect(fetchOwnOrganizationContext('user-1')).rejects.toThrow('load fail');
	});
});

// ── Create ──

describe('createOrganization', () => {
	it('calls the create_organization RPC and re-fetches context', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'org-new', error: null });
		// The re-fetch after create
		mockMaybeSingle.mockResolvedValueOnce({
			data: {
				organization_id: 'org-new',
				role: 'admin',
				joined_via: 'created',
				organizations: { id: 'org-new', name: 'New Org', join_code: 'XYZ', created_at: '2026-01-01' }
			},
			error: null
		});

		const ctx = await createOrganization('user-1', 'New Org');

		expect(mockRpc).toHaveBeenCalledWith('create_organization', {
			p_name: 'New Org',
			p_creator_id: 'user-1'
		});
		expect(ctx.organization.name).toBe('New Org');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'create fail' } });

		await expect(createOrganization('user-1', 'Fail')).rejects.toThrow('create fail');
	});
});

// ── Join by code ──

describe('joinOrganizationByCode', () => {
	it('calls the join RPC and re-fetches context', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });
		mockMaybeSingle.mockResolvedValueOnce({
			data: {
				organization_id: 'org-1',
				role: 'member',
				joined_via: 'code',
				organizations: { id: 'org-1', name: 'Acme', join_code: 'ABC', created_at: '2026-01-01' }
			},
			error: null
		});

		const ctx = await joinOrganizationByCode('user-1', 'ABC');

		expect(mockRpc).toHaveBeenCalledWith('join_organization_by_code', {
			p_profile_id: 'user-1',
			p_join_code: 'ABC'
		});
		expect(ctx.membership.joined_via).toBe('code');
	});

	it('throws on invalid code', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'Invalid join code.' } });

		await expect(joinOrganizationByCode('user-1', 'BAD')).rejects.toThrow('Invalid join code.');
	});
});

// ── Accept invitation ──

describe('acceptInvitation', () => {
	it('calls the accept RPC and re-fetches context', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });
		mockMaybeSingle.mockResolvedValueOnce({
			data: {
				organization_id: 'org-1',
				role: 'member',
				joined_via: 'invitation',
				organizations: { id: 'org-1', name: 'Acme', join_code: 'ABC', created_at: '2026-01-01' }
			},
			error: null
		});

		const ctx = await acceptInvitation('user-1', 'token-123');

		expect(mockRpc).toHaveBeenCalledWith('accept_organization_invitation', {
			p_profile_id: 'user-1',
			p_token: 'token-123'
		});
		expect(ctx.membership.joined_via).toBe('invitation');
	});
});

// ── Invitations ──

describe('createInvitation', () => {
	it('inserts an email invitation', async () => {
		const inv = { id: 'inv-1', organization_id: 'org-1', email: 'test@example.com', phone: null, status: 'pending', created_at: '2026-01-01', expires_at: '2026-01-15' };
		mockSingle.mockResolvedValueOnce({ data: inv, error: null });

		const result = await createInvitation('org-1', { email: 'test@example.com' });

		expect(mockFrom).toHaveBeenCalledWith('organization_invitations');
		expect(result).toEqual(inv);
	});

	it('inserts a phone invitation', async () => {
		const inv = { id: 'inv-2', organization_id: 'org-1', email: null, phone: '+15551234567', status: 'pending', created_at: '2026-01-01', expires_at: '2026-01-15' };
		mockSingle.mockResolvedValueOnce({ data: inv, error: null });

		const result = await createInvitation('org-1', { phone: '+15551234567' });
		expect(result.phone).toBe('+15551234567');
	});

	it('throws when both email and phone provided', async () => {
		await expect(
			createInvitation('org-1', { email: 'a@b.com', phone: '+1555' })
		).rejects.toThrow('Provide exactly one');
	});

	it('throws when neither email nor phone provided', async () => {
		await expect(createInvitation('org-1', {})).rejects.toThrow('Provide exactly one');
	});

	it('throws user-friendly message on duplicate', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate key' } });

		await expect(
			createInvitation('org-1', { email: 'dup@test.com' })
		).rejects.toThrow('already pending');
	});
});

describe('fetchPendingInvitations', () => {
	it('returns active and expired invitations that still need review', async () => {
		mockOrder.mockResolvedValueOnce({
			data: [
				{ id: 'inv-1', status: 'pending', expires_at: '2026-01-15' },
				{ id: 'inv-2', status: 'expired', expires_at: '2026-01-10' },
				{ id: 'inv-3', status: 'revoked', expires_at: '2026-01-12' }
			],
			error: null
		});

		const result = await fetchPendingInvitations('org-1');

		expect(mockFrom).toHaveBeenCalledWith('organization_invitations');
		expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-1');
		expect(mockEq).not.toHaveBeenCalledWith('status', 'pending');
		expect(result).toEqual([
			{ id: 'inv-1', status: 'pending', expires_at: '2026-01-15' },
			{ id: 'inv-2', status: 'expired', expires_at: '2026-01-10' }
		]);
	});

	it('throws on error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'load fail' } });

		await expect(fetchPendingInvitations('org-1')).rejects.toThrow('load fail');
	});
});

describe('resendInvitation', () => {
	it('calls the resend RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await resendInvitation('inv-1');

		expect(mockRpc).toHaveBeenCalledWith('resend_organization_invitation', { p_invitation_id: 'inv-1' });
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'resend fail' } });

		await expect(resendInvitation('inv-1')).rejects.toThrow('resend fail');
	});
});

describe('revokeInvitation', () => {
	it('calls the revoke RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await revokeInvitation('inv-1');

		expect(mockRpc).toHaveBeenCalledWith('revoke_organization_invitation', { p_invitation_id: 'inv-1' });
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'revoke fail' } });

		await expect(revokeInvitation('inv-1')).rejects.toThrow('revoke fail');
	});
});

// ── Join code ──

describe('regenerateJoinCode', () => {
	it('calls the regenerate RPC and returns the new code', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'NEWCODE', error: null });

		const code = await regenerateJoinCode('org-1');

		expect(mockRpc).toHaveBeenCalledWith('regenerate_organization_join_code', { p_organization_id: 'org-1' });
		expect(code).toBe('NEWCODE');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'regen fail' } });

		await expect(regenerateJoinCode('org-1')).rejects.toThrow('regen fail');
	});
});

// ── Members ──

describe('fetchMemberCount', () => {
	it('returns exact count', async () => {
		mockHeadEq.mockResolvedValueOnce({ count: 5, error: null });

		const count = await fetchMemberCount('org-1');

		expect(count).toBe(5);
	});

	it('returns 0 when count is null', async () => {
		mockHeadEq.mockResolvedValueOnce({ count: null, error: null });

		const count = await fetchMemberCount('org-1');
		expect(count).toBe(0);
	});

	it('throws on error', async () => {
		mockHeadEq.mockResolvedValueOnce({ count: null, error: { message: 'count fail' } });

		await expect(fetchMemberCount('org-1')).rejects.toThrow('count fail');
	});
});

describe('fetchOrganizationMembers', () => {
	it('calls the get_organization_members RPC', async () => {
		const members = [{ profile_id: 'u1', name: 'Alice', bio: 'Ops lead', role: 'admin' }];
		mockRpc.mockResolvedValueOnce({ data: members, error: null });

		const result = await fetchOrganizationMembers('org-1');

		expect(mockRpc).toHaveBeenCalledWith('get_organization_members', { p_organization_id: 'org-1' });
		expect(result).toEqual(members);
	});

	it('throws on error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'members fail' } });

		await expect(fetchOrganizationMembers('org-1')).rejects.toThrow('members fail');
	});
});

describe('fetchPendingDeletionRequests', () => {
	it('calls the pending deletion requests RPC', async () => {
		const requests = [
			{ profile_id: 'u1', name: 'Alice', deletion_requested_at: '2026-04-16T10:00:00.000Z' }
		];
		mockRpc.mockResolvedValueOnce({ data: requests, error: null });

		const result = await fetchPendingDeletionRequests('org-1');

		expect(mockRpc).toHaveBeenCalledWith('get_pending_account_deletion_requests', {
			p_organization_id: 'org-1'
		});
		expect(result).toEqual(requests);
	});

	it('throws on error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'deletion fail' } });

		await expect(fetchPendingDeletionRequests('org-1')).rejects.toThrow('deletion fail');
	});
});

describe('resolveDeletionRequest', () => {
	it('calls the resolve deletion request RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: '2026-04-16T12:00:00.000Z', error: null });

		const reviewedAt = await resolveDeletionRequest('org-1', 'u1');

		expect(mockRpc).toHaveBeenCalledWith('resolve_account_deletion_request', {
			p_organization_id: 'org-1',
			p_profile_id: 'u1'
		});
		expect(reviewedAt).toBe('2026-04-16T12:00:00.000Z');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'resolve fail' } });

		await expect(resolveDeletionRequest('org-1', 'u1')).rejects.toThrow('resolve fail');
	});
});

describe('setOrganizationMemberRole', () => {
	it('calls the set_organization_member_role RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await setOrganizationMemberRole('org-1', 'u1', 'admin');

		expect(mockRpc).toHaveBeenCalledWith('set_organization_member_role', {
			p_organization_id: 'org-1',
			p_profile_id: 'u1',
			p_role: 'admin'
		});
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'role fail' } });

		await expect(setOrganizationMemberRole('org-1', 'u1', 'admin')).rejects.toThrow('role fail');
	});
});

describe('removeOrganizationMember', () => {
	it('calls the remove_organization_member RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await removeOrganizationMember('org-1', 'u1');

		expect(mockRpc).toHaveBeenCalledWith('remove_organization_member', {
			p_organization_id: 'org-1',
			p_profile_id: 'u1'
		});
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'remove fail' } });

		await expect(removeOrganizationMember('org-1', 'u1')).rejects.toThrow('remove fail');
	});
});
