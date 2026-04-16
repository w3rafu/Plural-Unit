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
const mockFetchPendingDeletionRequests = vi.fn();
const mockResolveDeletionRequest = vi.fn();
const mockSetOrganizationMemberRole = vi.fn();
const mockRemoveOrganizationMember = vi.fn();
const mockUpdateOrganizationName = vi.fn();

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
	fetchPendingDeletionRequests: (...args: any[]) => mockFetchPendingDeletionRequests(...args),
	resolveDeletionRequest: (...args: any[]) => mockResolveDeletionRequest(...args),
	setOrganizationMemberRole: (...args: any[]) => mockSetOrganizationMemberRole(...args),
	removeOrganizationMember: (...args: any[]) => mockRemoveOrganizationMember(...args),
	updateOrganizationName: (...args: any[]) => mockUpdateOrganizationName(...args)
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

	it('blocks invitation sending for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await expect(currentOrganization.sendInvitation({ email: 'test@example.com' })).rejects.toThrow(
			'Organization admin access required.'
		);
		expect(mockCreateInvitation).not.toHaveBeenCalled();
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

	it('blocks join code regeneration for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await expect(currentOrganization.regenerateCode()).rejects.toThrow('Organization admin access required.');
		expect(mockRegenerateJoinCode).not.toHaveBeenCalled();
	});
});

describe('currentOrganization.loadInvitations', () => {
	it('clears invitations and skips loading for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');
		currentOrganization.invitations = [{ id: 'inv-1' } as any];

		await currentOrganization.loadInvitations();

		expect(currentOrganization.invitations).toEqual([]);
		expect(mockFetchPendingInvitations).not.toHaveBeenCalled();
	});

	it('clears stale invitations when admin access is lost on refresh', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');
		currentOrganization.invitations = [{ id: 'inv-1' } as any];

		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		expect(currentOrganization.invitations).toEqual([]);
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

	it('fetches members for regular members on the directory contract', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		const members = [{ profile_id: 'u2', name: 'Bea', role: 'member' }];
		mockFetchOrganizationMembers.mockResolvedValueOnce(members);

		await currentOrganization.loadMembers();

		expect(currentOrganization.members).toEqual(members);
		expect(mockFetchOrganizationMembers).toHaveBeenCalledWith('org-1');
	});
});

describe('currentOrganization.loadPendingDeletionRequests', () => {
	it('fetches pending deletion requests when admin', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		const requests = [
			{ profile_id: 'u2', name: 'Bea', deletion_requested_at: '2026-04-16T10:00:00.000Z' }
		];
		mockFetchPendingDeletionRequests.mockResolvedValueOnce(requests);

		await currentOrganization.loadPendingDeletionRequests();

		expect(currentOrganization.deletionRequests).toEqual(requests);
		expect(mockFetchPendingDeletionRequests).toHaveBeenCalledWith('org-1');
	});

	it('clears pending deletion requests for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');
		currentOrganization.deletionRequests = [{ profile_id: 'u2' } as any];

		await currentOrganization.loadPendingDeletionRequests();

		expect(currentOrganization.deletionRequests).toEqual([]);
		expect(mockFetchPendingDeletionRequests).not.toHaveBeenCalled();
	});
});

describe('currentOrganization.resolvePendingDeletionRequest', () => {
	it('resolves the request and reloads the queue', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockResolveDeletionRequest.mockResolvedValueOnce('2026-04-16T12:00:00.000Z');
		mockFetchPendingDeletionRequests.mockResolvedValueOnce([]);

		await currentOrganization.resolvePendingDeletionRequest('u2');

		expect(mockResolveDeletionRequest).toHaveBeenCalledWith('org-1', 'u2');
		expect(currentOrganization.deletionRequests).toEqual([]);
	});

	it('blocks resolving requests for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await expect(currentOrganization.resolvePendingDeletionRequest('u2')).rejects.toThrow(
			'Organization admin access required.'
		);
		expect(mockResolveDeletionRequest).not.toHaveBeenCalled();
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

	it('blocks role updates for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await expect(currentOrganization.updateMemberRole('u2', 'admin')).rejects.toThrow(
			'Organization admin access required.'
		);
		expect(mockSetOrganizationMemberRole).not.toHaveBeenCalled();
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

	it('blocks member removal for non-admin members', async () => {
		const memberCtx = { ...ORG_CTX, membership: { ...ORG_CTX.membership, role: 'member' as const } };
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await expect(currentOrganization.removeMember('u2')).rejects.toThrow(
			'Organization admin access required.'
		);
		expect(mockRemoveOrganizationMember).not.toHaveBeenCalled();
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
		expect(currentOrganization.deletionRequests).toEqual([]);
		expect(currentOrganization.memberCount).toBeNull();
		expect(currentOrganization.lastError).toBeNull();
	});
});

describe('currentOrganization.updateName', () => {
	it('calls repository and optimistically updates org name', async () => {
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(ORG_CTX);
		await currentOrganization.refresh('u1');

		mockUpdateOrganizationName.mockResolvedValueOnce(undefined);
		await currentOrganization.updateName('New Name');

		expect(mockUpdateOrganizationName).toHaveBeenCalledWith('org-1', 'New Name');
		expect(currentOrganization.organization?.name).toBe('New Name');
		expect(currentOrganization.isMutating).toBe(false);
	});

	it('throws for non-admin members', async () => {
		const memberCtx = {
			...ORG_CTX,
			membership: { ...ORG_CTX.membership, role: 'member' as const }
		};
		mockFetchOwnOrganizationContext.mockResolvedValueOnce(memberCtx);
		await currentOrganization.refresh('u1');

		await expect(currentOrganization.updateName('Nope')).rejects.toThrow(
			'Organization admin access required.'
		);
		expect(mockUpdateOrganizationName).not.toHaveBeenCalled();
	});

	it('throws when no organization is loaded', async () => {
		await expect(currentOrganization.updateName('Nope')).rejects.toThrow(
			'Organization admin access required.'
		);
	});
});
