import type { OrganizationInvitation, OrganizationMember } from '$lib/models/organizationModel';

export const ACCESS_REVIEW_RECENT_MEMBER_DAYS = 7;
export const ACCESS_REVIEW_STALE_INVITATION_DAYS = 7;
export const ACCESS_REVIEW_INVITATION_EXPIRY_DAYS = 14;
export const ACCESS_REVIEW_INVITATION_EXPIRING_SOON_DAYS = 3;

export type MemberReviewFilter = 'all' | 'admin' | 'member' | 'recent';
export type InvitationReviewFilter = 'all' | 'stale' | 'expired' | 'email' | 'phone';

type MemberReviewOptions = {
	query?: string;
	filter?: MemberReviewFilter;
	now?: number;
	recentDays?: number;
};

type InvitationReviewOptions = {
	query?: string;
	filter?: InvitationReviewFilter;
	now?: number;
	staleDays?: number;
};

function normalizeQuery(query: string) {
	return query.trim().toLowerCase();
}

function getTimestamp(value: string) {
	const timestamp = new Date(value).getTime();
	return Number.isNaN(timestamp) ? null : timestamp;
}

function includesQuery(values: Array<string | null | undefined>, query: string) {
	if (!query) {
		return true;
	}

	return values.some((value) => value?.toLowerCase().includes(query));
}

export function isRecentOrganizationMember(
	member: OrganizationMember,
	now = Date.now(),
	recentDays = ACCESS_REVIEW_RECENT_MEMBER_DAYS
) {
	const joinedAt = getTimestamp(member.joined_at);
	if (!joinedAt) {
		return false;
	}

	return now - joinedAt <= recentDays * 86_400_000;
}

export function countRecentOrganizationMembers(
	members: OrganizationMember[],
	now = Date.now(),
	recentDays = ACCESS_REVIEW_RECENT_MEMBER_DAYS
) {
	return members.filter((member) => isRecentOrganizationMember(member, now, recentDays)).length;
}

export function filterOrganizationMembers(
	members: OrganizationMember[],
	{ query = '', filter = 'all', now = Date.now(), recentDays = ACCESS_REVIEW_RECENT_MEMBER_DAYS }: MemberReviewOptions = {}
) {
	const normalizedQuery = normalizeQuery(query);

	return members.filter((member) => {
		const matchesFilter =
			filter === 'all'
				? true
				: filter === 'recent'
					? isRecentOrganizationMember(member, now, recentDays)
					: member.role === filter;

		if (!matchesFilter) {
			return false;
		}

		return includesQuery(
			[
				member.name,
				member.email,
				member.phone_number,
				member.role,
				member.joined_via,
				member.joined_via === 'invitation' ? 'invited' : '',
				member.joined_via === 'code' ? 'join code' : ''
			],
			normalizedQuery
		);
	});
}

function getMemberFilterLabel(filter: MemberReviewFilter) {
	switch (filter) {
		case 'admin':
			return 'admins';
		case 'member':
			return 'members';
		case 'recent':
			return 'recent joins';
		default:
			return 'members';
	}
}

export function buildOrganizationMembersSummary(input: {
	query: string;
	filter: MemberReviewFilter;
	visibleCount: number;
	totalCount: number;
}) {
	if (input.totalCount === 0) {
		return 'No members have joined this organization yet.';
	}

	const hasQuery = input.query.trim().length > 0;
	const hasFilter = input.filter !== 'all';

	if (!hasQuery && !hasFilter) {
		return `${input.totalCount} member${input.totalCount === 1 ? '' : 's'} currently have access.`;
	}

	const scopeLabel = getMemberFilterLabel(input.filter);
	return `Showing ${input.visibleCount} of ${input.totalCount} ${scopeLabel}${hasQuery ? ' for the current search' : ''}.`;
}

export function getOrganizationMembersEmptyState(query: string, filter: MemberReviewFilter) {
	if (query.trim()) {
		return {
			title: 'No matching members',
			description: 'Try a different name, contact detail, role, or join method.'
		};
	}

	if (filter === 'recent') {
		return {
			title: 'No recent joins',
			description: 'New members from the last week will be highlighted here.'
		};
	}

	return {
		title: `No ${getMemberFilterLabel(filter)} found`,
		description: 'The current filter does not match any organization members.'
	};
}

export function getInvitationRecipient(invitation: OrganizationInvitation) {
	return invitation.email ?? invitation.phone ?? 'Unknown';
}

export function getInvitationChannel(invitation: OrganizationInvitation) {
	return invitation.email ? 'email' : 'phone';
}

export function getOrganizationInvitationExpiresAt(
	invitation: OrganizationInvitation,
	expiryDays = ACCESS_REVIEW_INVITATION_EXPIRY_DAYS
) {
	if (invitation.expires_at) {
		return invitation.expires_at;
	}

	const createdAt = getTimestamp(invitation.created_at);
	if (!createdAt) {
		return null;
	}

	return new Date(createdAt + expiryDays * 86_400_000).toISOString();
}

export function isExpiredOrganizationInvitation(
	invitation: OrganizationInvitation,
	now = Date.now(),
	expiryDays = ACCESS_REVIEW_INVITATION_EXPIRY_DAYS
) {
	if (invitation.status === 'expired') {
		return true;
	}

	const expiresAt = getOrganizationInvitationExpiresAt(invitation, expiryDays);
	const expiresTimestamp = expiresAt ? getTimestamp(expiresAt) : null;
	if (!expiresTimestamp) {
		return false;
	}

	return expiresTimestamp <= now;
}

export function isExpiringSoonOrganizationInvitation(
	invitation: OrganizationInvitation,
	now = Date.now(),
	expiryDays = ACCESS_REVIEW_INVITATION_EXPIRY_DAYS,
	expiringSoonDays = ACCESS_REVIEW_INVITATION_EXPIRING_SOON_DAYS
) {
	if (isExpiredOrganizationInvitation(invitation, now, expiryDays)) {
		return false;
	}

	const expiresAt = getOrganizationInvitationExpiresAt(invitation, expiryDays);
	const expiresTimestamp = expiresAt ? getTimestamp(expiresAt) : null;
	if (!expiresTimestamp) {
		return false;
	}

	return expiresTimestamp - now <= expiringSoonDays * 86_400_000;
}

export function isStaleOrganizationInvitation(
	invitation: OrganizationInvitation,
	now = Date.now(),
	staleDays = ACCESS_REVIEW_STALE_INVITATION_DAYS
) {
	if (isExpiredOrganizationInvitation(invitation, now)) {
		return false;
	}

	const createdAt = getTimestamp(invitation.created_at);
	if (!createdAt) {
		return false;
	}

	return now - createdAt >= staleDays * 86_400_000;
}

export function countStaleOrganizationInvitations(
	invitations: OrganizationInvitation[],
	now = Date.now(),
	staleDays = ACCESS_REVIEW_STALE_INVITATION_DAYS
) {
	return invitations.filter((invitation) => isStaleOrganizationInvitation(invitation, now, staleDays)).length;
}

export function countExpiredOrganizationInvitations(
	invitations: OrganizationInvitation[],
	now = Date.now(),
	expiryDays = ACCESS_REVIEW_INVITATION_EXPIRY_DAYS
) {
	return invitations.filter((invitation) => isExpiredOrganizationInvitation(invitation, now, expiryDays)).length;
}

export function countExpiringSoonOrganizationInvitations(
	invitations: OrganizationInvitation[],
	now = Date.now(),
	expiryDays = ACCESS_REVIEW_INVITATION_EXPIRY_DAYS,
	expiringSoonDays = ACCESS_REVIEW_INVITATION_EXPIRING_SOON_DAYS
) {
	return invitations.filter((invitation) =>
		isExpiringSoonOrganizationInvitation(invitation, now, expiryDays, expiringSoonDays)
	).length;
}

export function filterPendingInvitations(
	invitations: OrganizationInvitation[],
	{ query = '', filter = 'all', now = Date.now(), staleDays = ACCESS_REVIEW_STALE_INVITATION_DAYS }: InvitationReviewOptions = {}
) {
	const normalizedQuery = normalizeQuery(query);

	return invitations.filter((invitation) => {
		const channel = getInvitationChannel(invitation);
		const matchesFilter =
			filter === 'all'
				? true
				: filter === 'stale'
					? isStaleOrganizationInvitation(invitation, now, staleDays)
					: filter === 'expired'
						? isExpiredOrganizationInvitation(invitation, now)
					: channel === filter;

		if (!matchesFilter) {
			return false;
		}

		return includesQuery(
			[
				getInvitationRecipient(invitation),
				channel,
				invitation.status,
				isExpiredOrganizationInvitation(invitation, now) ? 'expired' : 'active',
				isExpiringSoonOrganizationInvitation(invitation, now) ? 'expiring soon' : '',
				channel === 'email' ? 'invite by email' : 'invite by phone'
			],
			normalizedQuery
		);
	});
}

function getInvitationFilterLabel(filter: InvitationReviewFilter) {
	switch (filter) {
		case 'stale':
			return 'stale invites';
		case 'expired':
			return 'expired invites';
		case 'email':
			return 'email invites';
		case 'phone':
			return 'phone invites';
		default:
			return 'invites needing review';
	}
}

export function buildPendingInvitationsSummary(input: {
	query: string;
	filter: InvitationReviewFilter;
	visibleCount: number;
	totalCount: number;
}) {
	if (input.totalCount === 0) {
		return 'No invitation follow-up is waiting right now.';
	}

	const hasQuery = input.query.trim().length > 0;
	const hasFilter = input.filter !== 'all';

	if (!hasQuery && !hasFilter) {
		return `${input.totalCount} invite${input.totalCount === 1 ? '' : 's'} currently need review.`;
	}

	const scopeLabel = getInvitationFilterLabel(input.filter);
	return `Showing ${input.visibleCount} of ${input.totalCount} ${scopeLabel}${hasQuery ? ' for the current search' : ''}.`;
}

export function getPendingInvitationsEmptyState(query: string, filter: InvitationReviewFilter) {
	if (query.trim()) {
		return {
			title: 'No matching invitations',
			description: 'Try a different email, phone number, or delivery filter.'
		};
	}

	if (filter === 'stale') {
		return {
			title: 'No stale invitations',
			description: 'Invites older than a week will be highlighted here.'
		};
	}

	if (filter === 'expired') {
		return {
			title: 'No expired invitations',
			description: 'Expired invites that need a resend will appear here.'
		};
	}

	return {
		title: `No ${getInvitationFilterLabel(filter)} found`,
		description: 'The current filter does not match any invitations that need review.'
	};
}
