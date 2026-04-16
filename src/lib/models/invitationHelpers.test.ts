import { describe, it, expect } from 'vitest';
import type { OrganizationInvitation } from '$lib/models/organizationModel';
import {
	getInviteConfirmationTitle,
	getInviteConfirmationDescription,
	getInviteConfirmationDetails,
	getInviteConfirmationLabel,
	getInviteConfirmationBusyLabel,
	getInviteConfirmationVariant
} from './invitationHelpers';

function makeInvitation(overrides: Partial<OrganizationInvitation> = {}): OrganizationInvitation {
	return {
		id: 'inv-1',
		organization_id: 'org-1',
		email: 'test@example.com',
		phone: null,
		status: 'pending',
		created_at: '2026-04-11T00:00:00Z',
		expires_at: '2026-04-25T00:00:00Z',
		...overrides
	};
}

describe('getInviteConfirmationTitle', () => {
	it('returns empty for null', () => {
		expect(getInviteConfirmationTitle(null)).toBe('');
	});

	it('returns resend title', () => {
		expect(
			getInviteConfirmationTitle({ type: 'resend', invitation: makeInvitation() })
		).toBe('Resend invitation?');
	});

	it('returns revoke title', () => {
		expect(
			getInviteConfirmationTitle({ type: 'revoke', invitation: makeInvitation() })
		).toBe('Revoke invitation?');
	});
});

describe('getInviteConfirmationDescription', () => {
	it('returns empty for null', () => {
		expect(getInviteConfirmationDescription(null)).toBe('');
	});

	it('uses email as recipient', () => {
		const desc = getInviteConfirmationDescription({
			type: 'resend',
			invitation: makeInvitation({ email: 'bob@test.com' })
		});
		expect(desc).toContain('bob@test.com');
	});

	it('uses phone as recipient when no email', () => {
		const desc = getInviteConfirmationDescription({
			type: 'revoke',
			invitation: makeInvitation({ email: null, phone: '+15551234' })
		});
		expect(desc).toContain('+15551234');
	});
});

describe('getInviteConfirmationDetails', () => {
	it('returns empty for null', () => {
		expect(getInviteConfirmationDetails(null)).toEqual([]);
	});

	it('includes recipient and channel for resend', () => {
		const details = getInviteConfirmationDetails({
			type: 'resend',
			invitation: makeInvitation({ email: 'a@b.com' })
		});
		expect(details.some((d) => d.includes('a@b.com'))).toBe(true);
		expect(details.some((d) => d.includes('Email'))).toBe(true);
		expect(details.some((d) => d.includes('fresh expiry window'))).toBe(true);
	});

	it('shows Phone channel when email is null', () => {
		const details = getInviteConfirmationDetails({
			type: 'revoke',
			invitation: makeInvitation({ email: null, phone: '+1555' })
		});
		expect(details.some((d) => d.includes('Phone'))).toBe(true);
	});
});

describe('getInviteConfirmationLabel / busyLabel / variant', () => {
	it('returns defaults for null', () => {
		expect(getInviteConfirmationLabel(null)).toBe('Confirm');
		expect(getInviteConfirmationBusyLabel(null)).toBe('Working...');
		expect(getInviteConfirmationVariant(null)).toBe('default');
	});

	it('returns destructive for revoke', () => {
		expect(
			getInviteConfirmationVariant({ type: 'revoke', invitation: makeInvitation() })
		).toBe('destructive');
	});

	it('returns default for resend', () => {
		expect(
			getInviteConfirmationVariant({ type: 'resend', invitation: makeInvitation() })
		).toBe('default');
	});
});
