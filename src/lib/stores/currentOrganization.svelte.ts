/**
 * currentOrganization — reactive store for the user's organization.
 *
 * Responsibilities:
 *  - Resolve current user's organization membership
 *  - Expose create, join, accept-invitation actions
 *  - Load admin-only invitations and member count
 *  - Load the member roster used by member-facing directory surfaces
 *  - Expose join code regeneration
 *
 * The store listens to Supabase auth changes so it refreshes
 * when the user logs in/out.
 */

import type {
	OrganizationPayload,
	OrganizationMembership,
	OrganizationInvitation,
	OrganizationMember,
	OrganizationDeletionRequest
} from '$lib/models/organizationModel';
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
	removeOrganizationMember,
	updateOrganizationName
} from '$lib/repositories/organizationRepository';
import { subscribeToAuthStateChange, getAuthenticatedUser } from '$lib/repositories/profileRepository';
import {
	buildSmokeDeletionRequests,
	buildSmokeInvitations,
	buildSmokeMembers,
	buildSmokeMembership,
	buildSmokeOrganization
} from '$lib/demo/smokeFixtures';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';

const REFRESH_TIMEOUT_MS = 8_000;

function buildSmokeJoinCode() {
	return `SMOKE${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

class CurrentOrganization {
	isLoading = $state(false);
	isMutating = $state(false);
	hasResolvedMembership = $state(false);
	organization = $state<OrganizationPayload | null>(null);
	membership = $state<OrganizationMembership | null>(null);
	invitations = $state<OrganizationInvitation[]>([]);
	members = $state<OrganizationMember[]>([]);
	deletionRequests = $state<OrganizationDeletionRequest[]>([]);
	memberCount = $state<number | null>(null);
	isLoadingMembers = $state(false);
	isLoadingDeletionRequests = $state(false);
	lastError = $state<Error | null>(null);

	clearError() {
		this.lastError = null;
	}

	private captureError(error: unknown) {
		this.lastError = error instanceof Error ? error : new Error(String(error));
	}

	private stopAuth: (() => void) | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			if (isSmokeModeEnabled()) {
				this.applySmokeState();
				return;
			}

			this.stopAuth = subscribeToAuthStateChange((_event, user) => {
				if (user) void this.refresh(user.id);
				else this.clear();
			});
			void this.init();
		}
	}

	private applySmokeState() {
		this.lastError = null;
		this.isLoading = false;
		this.isMutating = false;
		this.hasResolvedMembership = true;
		this.organization = buildSmokeOrganization();
		this.membership = buildSmokeMembership();
		this.invitations = buildSmokeInvitations();
		this.members = buildSmokeMembers();
		this.deletionRequests = buildSmokeDeletionRequests();
		this.memberCount = this.members.length;
		this.isLoadingMembers = false;
		this.isLoadingDeletionRequests = false;
	}

	get isMember() {
		return this.organization !== null && this.membership !== null;
	}

	get isAdmin() {
		return this.membership?.role === 'admin';
	}

	private async init() {
		const user = await getAuthenticatedUser();
		if (user) await this.refresh(user.id);
		else this.hasResolvedMembership = true;
	}

	private clear() {
		this.organization = null;
		this.membership = null;
		this.invitations = [];
		this.members = [];
		this.deletionRequests = [];
		this.memberCount = null;
		this.isLoadingMembers = false;
		this.isLoadingDeletionRequests = false;
		this.hasResolvedMembership = true;
	}

	/** Clear all state. Called on logout. */
	reset() {
		this.lastError = null;
		this.clear();
	}

	async refresh(userId?: string) {
		if (isSmokeModeEnabled()) {
			this.applySmokeState();
			return;
		}

		const uid = userId ?? (await getAuthenticatedUser())?.id;
		if (!uid) { this.clear(); return; }

		this.lastError = null;
		this.isLoading = true;
		try {
			const previousOrganizationId = this.organization?.id ?? '';
			const ctx = await withTimeout(
				fetchOwnOrganizationContext(uid),
				REFRESH_TIMEOUT_MS,
				'Organization lookup timed out.'
			);
			if (ctx) {
				if (previousOrganizationId !== ctx.organization.id) {
					this.invitations = [];
					this.members = [];
					this.deletionRequests = [];
					this.memberCount = null;
				}
				this.organization = ctx.organization;
				this.membership = ctx.membership;
				if (ctx.membership.role !== 'admin') {
					this.invitations = [];
					this.deletionRequests = [];
				}
			} else {
				this.organization = null;
				this.membership = null;
				this.invitations = [];
				this.members = [];
				this.deletionRequests = [];
				this.memberCount = null;
			}
		} catch (error) {
			this.captureError(error);
			throw error;
		} finally {
			this.isLoading = false;
			this.hasResolvedMembership = true;
		}
	}

	async create(name: string) {
		const user = await getAuthenticatedUser();
		if (!user) throw new Error('Not logged in.');
		this.isMutating = true;
		try {
			const ctx = await createOrganization(user.id, name);
			this.organization = ctx.organization;
			this.membership = ctx.membership;
		} finally {
			this.isMutating = false;
		}
	}

	async joinByCode(code: string) {
		const user = await getAuthenticatedUser();
		if (!user) throw new Error('Not logged in.');
		this.isMutating = true;
		try {
			const ctx = await joinOrganizationByCode(user.id, code);
			this.organization = ctx.organization;
			this.membership = ctx.membership;
		} finally {
			this.isMutating = false;
		}
	}

	async acceptInvite(token: string) {
		const user = await getAuthenticatedUser();
		if (!user) throw new Error('Not logged in.');
		this.isMutating = true;
		try {
			const ctx = await acceptInvitation(user.id, token);
			this.organization = ctx.organization;
			this.membership = ctx.membership;
		} finally {
			this.isMutating = false;
		}
	}

	async loadInvitations() {
		if (isSmokeModeEnabled()) {
			if (!this.organization || !this.isAdmin) {
				this.invitations = [];
			}
			return;
		}

		if (!this.organization || !this.isAdmin) {
			this.invitations = [];
			return;
		}
		this.invitations = await fetchPendingInvitations(this.organization.id);
	}

	async sendInvitation(contact: { email?: string; phone?: string }) {
		if (!this.organization || !this.isAdmin) throw new Error('Organization admin access required.');
		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				this.invitations = [
					{
						id: `smoke-invite-${Date.now().toString(36)}`,
						organization_id: this.organization.id,
						email: contact.email?.trim() || null,
						phone: contact.phone?.trim() || null,
						status: 'pending',
						created_at: new Date().toISOString(),
						expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString()
					},
					...this.invitations
				];
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			await createInvitation(this.organization.id, contact);
			await this.loadInvitations();
		} finally {
			this.isMutating = false;
		}
	}

	async resendPendingInvitation(invitationId: string) {
		if (!this.organization || !this.isAdmin) throw new Error('No organization.');
		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				const refreshedAt = new Date().toISOString();
				this.invitations = this.invitations.map((invitation) =>
					invitation.id === invitationId
						? {
							...invitation,
							status: 'pending',
							created_at: refreshedAt,
							expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString()
						}
						: invitation
				);
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			await resendInvitation(invitationId);
			await this.loadInvitations();
		} finally {
			this.isMutating = false;
		}
	}

	async revokePendingInvitation(invitationId: string) {
		if (!this.organization || !this.isAdmin) throw new Error('No organization.');
		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				this.invitations = this.invitations.filter((invitation) => invitation.id !== invitationId);
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			await revokeInvitation(invitationId);
			await this.loadInvitations();
		} finally {
			this.isMutating = false;
		}
	}

	async regenerateCode() {
		if (!this.organization || !this.isAdmin) throw new Error('Organization admin access required.');
		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				this.organization = {
					...this.organization,
					join_code: buildSmokeJoinCode()
				};
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			const newCode = await regenerateJoinCode(this.organization.id);
			this.organization = { ...this.organization, join_code: newCode };
		} finally {
			this.isMutating = false;
		}
	}

	async loadMemberCount() {
		if (isSmokeModeEnabled()) {
			this.memberCount = this.members.length;
			return;
		}

		if (!this.organization) return;
		this.memberCount = await fetchMemberCount(this.organization.id);
	}

	async loadMembers() {
		if (isSmokeModeEnabled()) {
			if (this.members.length === 0) {
				this.members = buildSmokeMembers();
			}
			this.memberCount = this.members.length;
			this.isLoadingMembers = false;
			return;
		}

		// The directory is member-visible, so any signed-in organization member can load the roster.
		if (!this.organization) {
			this.members = [];
			return;
		}

		this.isLoadingMembers = true;
		try {
			this.members = await fetchOrganizationMembers(this.organization.id);
		} finally {
			this.isLoadingMembers = false;
		}
	}

	async loadPendingDeletionRequests() {
		if (isSmokeModeEnabled()) {
			if (!this.organization || !this.isAdmin) {
				this.deletionRequests = [];
			}
			this.isLoadingDeletionRequests = false;
			return;
		}

		if (!this.organization || !this.isAdmin) {
			this.deletionRequests = [];
			return;
		}

		this.isLoadingDeletionRequests = true;
		try {
			this.deletionRequests = await fetchPendingDeletionRequests(this.organization.id);
		} finally {
			this.isLoadingDeletionRequests = false;
		}
	}

	async resolvePendingDeletionRequest(profileId: string) {
		if (!this.organization || !this.isAdmin) {
			throw new Error('Organization admin access required.');
		}

		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				this.deletionRequests = this.deletionRequests.filter(
					(request) => request.profile_id !== profileId
				);
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			await resolveDeletionRequest(this.organization.id, profileId);
			await this.loadPendingDeletionRequests();
		} finally {
			this.isMutating = false;
		}
	}

	async updateMemberRole(profileId: string, role: 'admin' | 'member') {
		if (!this.organization || !this.isAdmin) throw new Error('Organization admin access required.');
		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				this.members = this.members.map((member) =>
					member.profile_id === profileId ? { ...member, role } : member
				);

				if (this.membership?.profile_id === profileId) {
					this.membership = { ...this.membership, role };
				}
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			await setOrganizationMemberRole(this.organization.id, profileId, role);
			await this.refresh();
			if (this.organization) {
				await this.loadMembers();
			}
		} finally {
			this.isMutating = false;
		}
	}

	async removeMember(profileId: string) {
		if (!this.organization || !this.isAdmin) throw new Error('Organization admin access required.');
		if (isSmokeModeEnabled()) {
			this.isMutating = true;
			try {
				this.members = this.members.filter((member) => member.profile_id !== profileId);
				this.deletionRequests = this.deletionRequests.filter(
					(request) => request.profile_id !== profileId
				);
				this.memberCount = this.members.length;
			} finally {
				this.isMutating = false;
			}
			return;
		}

		this.isMutating = true;
		try {
			await removeOrganizationMember(this.organization.id, profileId);
			await this.refresh();
			if (this.organization) {
				await this.loadMembers();
			}
			await this.loadMemberCount();
		} finally {
			this.isMutating = false;
		}
	}

	async updateName(name: string) {
		if (!this.organization || !this.isAdmin) throw new Error('Organization admin access required.');
		this.isMutating = true;
		try {
			await updateOrganizationName(this.organization.id, name);
			this.organization = { ...this.organization, name };
		} finally {
			this.isMutating = false;
		}
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(message)), ms);
		promise.then(
			(v) => { clearTimeout(timer); resolve(v); },
			(e) => { clearTimeout(timer); reject(e); }
		);
	});
}

export const currentOrganization = new CurrentOrganization();
