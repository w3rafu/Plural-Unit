/**
 * Pure helpers for the organization access / invitation card.
 *
 * These functions contain no Svelte state — they accept data and return
 * formatted strings so they are easy to test in isolation.
 */

import type { OrganizationInvitation } from '$lib/models/organizationModel';

// ── Types ──

/** Discriminated union describing a pending invite action (resend or revoke). */
export type PendingInviteAction = {
	type: 'resend' | 'revoke';
	invitation: OrganizationInvitation;
} | null;

// ── Confirmation sheet text ──

/** Title for the invitation confirmation sheet. */
export function getInviteConfirmationTitle(action: PendingInviteAction): string {
	if (!action) return '';
	return action.type === 'resend' ? 'Resend invitation?' : 'Revoke invitation?';
}

/** Subtitle explaining the consequence of the pending invite action. */
export function getInviteConfirmationDescription(action: PendingInviteAction): string {
	if (!action) return '';

	const recipient = action.invitation.email ?? action.invitation.phone ?? 'this invite';

	return action.type === 'resend'
		? `A new invitation token and expiry window will be generated for ${recipient}.`
		: `${recipient} will no longer be able to use this pending invitation.`;
}

/** Bullet-point details shown inside the invite confirmation sheet. */
export function getInviteConfirmationDetails(action: PendingInviteAction): string[] {
	if (!action) return [];

	const invitation = action.invitation;
	const recipient = invitation.email ?? invitation.phone ?? 'Unknown recipient';
	const channel = invitation.email ? 'Email' : 'Phone';

	if (action.type === 'resend') {
		return [
			`Recipient: ${recipient}`,
			`Delivery channel: ${channel}`,
			'The original invite will be refreshed with a new token and a fresh expiry window.'
		];
	}

	return [
		`Recipient: ${recipient}`,
		`Delivery channel: ${channel}`,
		'This action keeps the record for admins, but the invite will no longer be active.'
	];
}

/** Primary button label for the invite confirmation sheet. */
export function getInviteConfirmationLabel(action: PendingInviteAction): string {
	if (!action) return 'Confirm';
	return action.type === 'resend' ? 'Resend invitation' : 'Revoke invitation';
}

/** Busy-state button label while the invite action is in progress. */
export function getInviteConfirmationBusyLabel(action: PendingInviteAction): string {
	if (!action) return 'Working...';
	return action.type === 'resend' ? 'Resending...' : 'Revoking...';
}

/** Button variant (destructive for revoke, default for resend). */
export function getInviteConfirmationVariant(action: PendingInviteAction): 'destructive' | 'default' {
	return action?.type === 'revoke' ? 'destructive' : 'default';
}
