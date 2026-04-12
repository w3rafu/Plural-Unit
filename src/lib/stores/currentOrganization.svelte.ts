/**
 * currentOrganization — reactive store for the user's organization.
 *
 * Responsibilities:
 *  - Resolve current user's organization membership
 *  - Expose create, join, accept-invitation actions
 *  - Load admin-only invitations and member count
 *  - Expose join code regeneration
 *
 * The store listens to Supabase auth changes so it refreshes
 * when the user logs in/out.
 */

import type {
	OrganizationPayload,
	OrganizationMembership,
	OrganizationInvitation,
	OrganizationMember
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
	setOrganizationMemberRole,
	removeOrganizationMember
} from '$lib/repositories/organizationRepository';
import { subscribeToAuthStateChange, getAuthenticatedUser } from '$lib/repositories/profileRepository';

const REFRESH_TIMEOUT_MS = 8_000;

class CurrentOrganization {
	isLoading = $state(false);
	isMutating = $state(false);
	hasResolvedMembership = $state(false);
	organization = $state<OrganizationPayload | null>(null);
	membership = $state<OrganizationMembership | null>(null);
	invitations = $state<OrganizationInvitation[]>([]);
	members = $state<OrganizationMember[]>([]);
	memberCount = $state<number | null>(null);
	isLoadingMembers = $state(false);
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
			this.stopAuth = subscribeToAuthStateChange((_event, user) => {
				if (user) void this.refresh(user.id);
				else this.clear();
			});
			void this.init();
		}
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
		this.memberCount = null;
		this.isLoadingMembers = false;
		this.hasResolvedMembership = true;
	}

	/** Clear all state. Called on logout. */
	reset() {
		this.lastError = null;
		this.clear();
	}

	async refresh(userId?: string) {
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
					this.memberCount = null;
				}
				this.organization = ctx.organization;
				this.membership = ctx.membership;
			} else {
				this.organization = null;
				this.membership = null;
				this.invitations = [];
				this.members = [];
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
		if (!this.organization) return;
		this.invitations = await fetchPendingInvitations(this.organization.id);
	}

	async sendInvitation(contact: { email?: string; phone?: string }) {
		if (!this.organization) throw new Error('No organization.');
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
		this.isMutating = true;
		try {
			await revokeInvitation(invitationId);
			await this.loadInvitations();
		} finally {
			this.isMutating = false;
		}
	}

	async regenerateCode() {
		if (!this.organization) throw new Error('No organization.');
		this.isMutating = true;
		try {
			const newCode = await regenerateJoinCode(this.organization.id);
			this.organization = { ...this.organization, join_code: newCode };
		} finally {
			this.isMutating = false;
		}
	}

	async loadMemberCount() {
		if (!this.organization) return;
		this.memberCount = await fetchMemberCount(this.organization.id);
	}

	async loadMembers() {
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

	async updateMemberRole(profileId: string, role: 'admin' | 'member') {
		if (!this.organization) throw new Error('No organization.');
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
		if (!this.organization) throw new Error('No organization.');
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
