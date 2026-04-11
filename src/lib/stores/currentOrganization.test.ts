import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock organization repository ──

const mockFetchOwnOrganizationContext = vi.fn();
const mockCreateOrganization = vi.fn();
const mockJoinOrganizationByCode = vi.fn();
const mockAcceptInvitation = vi.fn();
const mockCreateInvitation = vi.fn();
const mockFetchPendingInvitations = vi.fn();
const mockResendInvitation = vi.fn();
const mockRevokeInvitation = vi.fn();
const mockRegenerateJoinCode = vi.fn();
const mockFetchMemberCount = vi.fn();
const mockFetchOrganizationMembers = vi.fn();
const mockSetOrganizationMemberRole = vi.fn();
const mockRemoveOrganizationMember = vi.fn();

vi.mock('$lib/repositories/organizationRepository', () => ({
	fetchOwnOrganizationContext: (...args: any[]) => mockFetchOwnOrganizationContext(...args),
	createOrganization: (...args: any[]) => mockCreateOrganization(...args),
	joinOrganizationByCode: (...args: any[]) => mockJoinOrganizationByCode(...args),
	acceptInvitation: (...args: any[]) => mockAcceptInvitation(...args),
	createInvitation: (...args: any[]) => mockCreateInvitation(...args),
	fetchPendingInvitations: (...args: any[]) => mockFetchPendingInvitations(...args),
	resendInvitation: (...args: any[]) => mockResendInvitation(...args),
	revokeInvitation: (...args: any[]) => mockRevokeInvitation(...args),
	regenerateJoinCode: (...args: any[]) => mockRegenerateJoinCode(...args),
	fetchMemberCount: (...args: any[]) => mockFetchMemberCount(...args),
	fetchOrganizationMembers: (...args: any[]) => mockFetchOrganizationMembers(...args),
	setOrganizationMemberRole: (...args: any[]) => mockSetOrganizationMemberRole(...args),
	removeOrganizationMember: (...args: any[]) => mockRemoveOrganizationMember(...args)
}));

// Mock profileRepository auth helpers used by currentOrganization
const mockGetAuthenticatedUser = vi.fn().mockResolvedValue(null);
vi.mock('$lib/repositories/profileRepository', () => ({
	subscribeToAuthStateChange: () => () => {},
	getAuthenticatedUser: (...args: any[]) => mockGetAuthenticatedUser(...args)
}));

import { currentOrganization } from './currentOrganization.svelte';

const ORG_CTX = {
	organization: { id: 'org-1', name: 'Acme', join_code: 'ABC123', created_at: '2026-01-01' },
	membership: { organization_id: 'org-1', profile_id: 'u1', role: 'admin' as const, joined_via: 'created' as const }
};

beforeEach(() => {
	vi.clearAllMocks();
	currentOrganization.reset();
});

describe('currentOrganization.refresh', () => {
	it('loads organization context for a given user', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);

		await currentOrganization.refresh('u1');

		expect(currentOrganization.organization?.name).toBe('Acme');
		expect(currentOrganization.membership?.role).toBe('admin');
		expect(currentOrganization.isMember).toBe(true);
		expect(currentOrganization.isAdmin).toBe(true);
		expect(currentOrganization.isLoading).toBe(false);
		expect(currentOrganization.hasResolvedMembership).toBe(true);
	});

	it('clears state when no context is returned', async () => {
		// First load with data
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		// Then refresh returns null
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(null);
		await currentOrganization.refresh('u1');

		expect(currentOrganization.organization).toBeNull();
		expect(currentOrganization.isMember).toBe(false);
	});

	it('clears when no userId and no auth', async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce(null);

		await currentOrganization.refresh();

		expect(currentOrganization.organization).toBeNull();
	});

	it('captures error and re-throws on failure', async () => {
		mockFetchOwnOrganizationContext.mockRejectedValueOnce(new Error('timeout'));

		await expect(currentOrganization.refresh('u1')).rejects.toThrow('timeout');
		expect(currentOrganization.lastError?.message).toBe('timeout');
		expect(currentOrganization.isLoading).toBe(false);
	});
});

describe('currentOrganization.create', () => {
	it('creates an org and sets context', async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({ id: 'u1' });
		mockCreateOrganization.mockResolvedValueOnce(ORG_CTX);

		await currentOrganization.create('Acme');

		expect(mockCreateOrganization).toHaveBeenCalledWith('u1', 'Acme');
		expect(currentOrganization.organization?.name).toBe('Acme');
		expect(currentOrganization.isMutating).toBe(false);
	});

	it('throws when not logged in', async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce(null);

		await expect(currentOrganization.create('X')).rejects.toThrow('Not logged in');
	});
});

describe('currentOrganization.joinByCode', () => {
	it('joins an org by code and sets context', async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({ id: 'u1' });
		const ctx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member', joined_via: 'code' } };
		mockJoinOrganizationByCode.mockResolvedValueOnce(ctx);

		await currentOrganization.joinByCode('ABC123');

		expect(mockJoinOrganizationByCode).toHaveBeenCalledWith('u1', 'ABC123');
		expect(currentOrganization.isMember).toBe(true);
	});
});

describe('currentOrganization.acceptInvite', () => {
	it('accepts an invitation and sets context', async () => {
		mockGetAuthenticatedUser.mockResolvedValueOnce({ id: 'u1' });
		mockAcceptInvitation.mockResolvedValueOnce(ORG_CTX);

		await currentOrganization.acceptInvite('token-abc');

		expect(mockAcceptInvitation).toHaveBeenCalledWith('u1', 'token-abc');
		expect(currentOrganization.organization?.id).toBe('org-1');
	});
});

describe('currentOrganization.sendInvitation', () => {
	it('creates an invitation and reloads the list', async () => {
		// Set up org context
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockCreateInvitation.mockResolvedValueOnce({});
		mockFetchPendingInvitations.mockResolvedValueOnce([{ id: 'inv-1', status: 'pending' }]);

		await currentOrganization.sendInvitation({ email: 'test@example.com' });

		expect(mockCreateInvitation).toHaveBeenCalledWith('org-1', { email: 'test@example.com' });
		expect(currentOrganization.invitations).toHaveLength(1);
	});
});

describe('currentOrganization.resendPendingInvitation', () => {
	it('resends and reloads invitations', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockResendInvitation.mockResolvedValueOnce(undefined);
		mockFetchPendingInvitations.mockResolvedValueOnce([]);

		await currentOrganization.resendPendingInvitation('inv-1');

		expect(mockResendInvitation).toHaveBeenCalledWith('inv-1');
	});
});

describe('currentOrganization.revokePendingInvitation', () => {
	it('revokes and reloads invitations', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockRevokeInvitation.mockResolvedValueOnce(undefined);
		mockFetchPendingInvitations.mockResolvedValueOnce([]);

		await currentOrganization.revokePendingInvitation('inv-1');

		expect(mockRevokeInvitation).toHaveBeenCalledWith('inv-1');
	});
});

describe('currentOrganization.regenerateCode', () => {
	it('regenerates the join code and updates org state', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockRegenerateJoinCode.mockResolvedValueOnce('NEWCODE');

		await currentOrganization.regenerateCode();

		expect(currentOrganization.organization?.join_code).toBe('NEWCODE');
	});
});

describe('currentOrganization.loadMembers', () => {
	it('fetches members when admin', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		const members = [{ profile_id: 'u1', name: 'Alice', role: 'admin' }];
		mockFetchOrganizationMembers.mockResolvedValueOnce(members);

		await currentOrganization.loadMembers();

		expect(currentOrganization.members).toEqual(members);
	});

	it('clears members when not admin', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await currentOrganization.loadMembers();

		expect(currentOrganization.members).toEqual([]);
		expect(mockFetchOrganizationMembers).not.toHaveBeenCalled();
	});
});

describe('currentOrganization.updateMemberRole', () => {
	it('updates role and refreshes', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockSetOrganizationMemberRole.mockResolvedValueOnce(undefined);
		mockGetAuthenticatedUser.mockResolvedValueOnce({ id: 'u1' });
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		mockFetchOrganizationMembers.mockResolvedValueOnce([]);

		await currentOrganization.updateMemberRole('u2', 'admin');

		expect(mockSetOrganizationMemberRole).toHaveBeenCalledWith('org-1', 'u2', 'admin');
	});
});

describe('currentOrganization.removeMember', () => {
	it('removes member, refreshes, and updates count', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockRemoveOrganizationMember.mockResolvedValueOnce(undefined);
		mockGetAuthenticatedUser.mockResolvedValueOnce({ id: 'u1' });
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		mockFetchOrganizationMembers.mockResolvedValueOnce([]);
		mockFetchMemberCount.mockResolvedValueOnce(1);

		await currentOrganization.removeMember('u2');

		expect(mockRemoveOrganizationMember).toHaveBeenCalledWith('org-1', 'u2');
		expect(currentOrganization.memberCount).toBe(1);
	});
});

describe('currentOrganization.reset', () => {
	it('clears all state', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		currentOrganization.reset();

		expect(currentOrganization.organization).toBeNull();
		expect(currentOrganization.membership).toBeNull();
		expect(currentOrganization.invitations).toEqual([]);
		expect(currentOrganization.members).toEqual([]);
		expect(currentOrganization.memberCount).toBeNull();
		expect(currentOrganization.lastError).toBeNull();
	});
});
