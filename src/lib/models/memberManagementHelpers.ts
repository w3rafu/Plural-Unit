/**
 * Pure helpers for the organization members card.
 *
 * These functions contain no Svelte state — they accept data as arguments
 * and return formatted strings, so they are easy to test in isolation.
 */

import type { OrganizationMember } from '$lib/models/organizationModel';
import { computeAvatarInitials } from '$lib/components/profile/avatarUploadModel';
import { formatShortDate } from '$lib/utils/dateFormat';

// ── Types ──

/** Discriminated union describing a pending member action (role change or removal). */
export type PendingMemberAction =
	| {
			type: 'role';
			member: OrganizationMember;
			nextRole: OrganizationMember['role'];
	  }
	| {
			type: 'remove';
			member: OrganizationMember;
	  }
	| null;

// ── Formatters ──

/** Human-readable label for how a member joined (created, invited, code). */
export function formatJoinedVia(member: OrganizationMember): string {
	switch (member.joined_via) {
		case 'created':
			return 'Created organization';
		case 'invitation':
			return 'Invited';
		case 'code':
			return 'Joined by code';
		default:
			return member.joined_via;
	}
}

/** Format a membership date as a short locale string, or em-dash if invalid. */
export function formatJoinedAt(value: string): string {
	return formatShortDate(value) || '—';
}

/** Return the member's best available contact, or a fallback label. */
export function formatContact(member: OrganizationMember): string {
	return member.email || member.phone_number || 'No contact added';
}

/** Derive 1–2 character initials for a member's avatar. */
export function getMemberInitials(member: OrganizationMember): string {
	return computeAvatarInitials(member.name, member.email, member.phone_number, 'Member');
}

// ── Guard helpers ──

/** True when this member is the sole admin in the organization. */
export function isLastAdmin(member: OrganizationMember, adminCount: number): boolean {
	return member.role === 'admin' && adminCount === 1;
}

/** True when a role draft would leave the organization with zero admins. */
export function wouldDemoteLastAdmin(
	member: OrganizationMember,
	draftRole: OrganizationMember['role'],
	adminCount: number
): boolean {
	return member.role === 'admin' && draftRole === 'member' && adminCount === 1;
}

// ── Confirmation sheet text ──

export function getConfirmationTitle(action: PendingMemberAction): string {
	if (!action) return '';

	if (action.type === 'role') {
		return action.nextRole === 'admin' ? 'Promote to admin?' : 'Change member role?';
	}

	return 'Remove member?';
}

export function getConfirmationDescription(action: PendingMemberAction): string {
	if (!action) return '';

	const memberName = action.member.name || 'This member';

	if (action.type === 'role') {
		return action.nextRole === 'admin'
			? `${memberName} will gain access to organization admin tools.`
			: `${memberName} will stay in the organization, but admin tools will be removed.`;
	}

	return `${memberName} will lose access to this organization and its hub content.`;
}

export function getConfirmationDetails(
	action: PendingMemberAction,
	currentUserId: string,
	organizationName: string
): string[] {
	if (!action) return [];

	const memberName = action.member.name || 'This member';

	if (action.type === 'role') {
		const details = [
			`Current role: ${action.member.role}`,
			`New role: ${action.nextRole}`
		];

		if (action.nextRole === 'member' && action.member.profile_id === currentUserId) {
			details.push('This will remove your own admin access after the change is applied.');
		}

		if (action.nextRole === 'admin') {
			details.push(`${memberName} will be able to manage join codes, invitations, and members.`);
		}

		return details;
	}

	const details = [
		`Organization: ${organizationName}`,
		'This action removes membership immediately.'
	];

	if (action.member.profile_id === currentUserId) {
		details.push('You are removing your own membership from this organization.');
	}

	return details;
}

export function getConfirmationLabel(action: PendingMemberAction): string {
	if (!action) return 'Confirm';
	return action.type === 'role'
		? action.nextRole === 'admin'
			? 'Promote to admin'
			: 'Save role change'
		: 'Remove member';
}

export function getConfirmationBusyLabel(action: PendingMemberAction): string {
	if (!action) return 'Working...';
	return action.type === 'role' ? 'Saving...' : 'Removing...';
}

export function getConfirmationVariant(action: PendingMemberAction): 'destructive' | 'default' {
	return action?.type === 'remove' ? 'destructive' : 'default';
}
