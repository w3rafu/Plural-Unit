import { describe, expect, it } from 'vitest';
import { buildHubNotifications } from '$lib/models/hubNotifications';
import {
	cloneUiPreviewThreads,
	getUiPreviewMember,
	uiPreviewAdminCount,
	uiPreviewFixtures,
	uiPreviewMemberCount,
	uiPreviewNotifications,
	uiPreviewUnreadMessageCount
} from './uiPreviewFixtures';

describe('uiPreviewFixtures', () => {
	it('keeps the preview dataset counts stable', () => {
		expect(uiPreviewFixtures.organizationName).toBe('Harbor Unit');
		expect(uiPreviewFixtures.currentUserProfileId).toBe('profile-ariana-lopez');
		expect(uiPreviewFixtures.members).toHaveLength(8);
		expect(uiPreviewFixtures.threads).toHaveLength(5);
		expect(uiPreviewFixtures.broadcasts).toHaveLength(3);
		expect(uiPreviewFixtures.events).toHaveLength(4);
		expect(uiPreviewAdminCount).toBe(2);
		expect(uiPreviewMemberCount).toBe(6);
		expect(uiPreviewUnreadMessageCount).toBe(3);
	});

	it('looks up members by profile id and returns null for unknown ids', () => {
		expect(getUiPreviewMember('profile-ariana-lopez')).toMatchObject({
			profile_id: 'profile-ariana-lopez',
			name: 'Ariana Lopez',
			role: 'admin'
		});
		expect(getUiPreviewMember('profile-lucia-costa')).toMatchObject({
			profile_id: 'profile-lucia-costa',
			joined_via: 'invitation'
		});
		expect(getUiPreviewMember('profile-missing')).toBeNull();
	});

	it('keeps the notification export aligned with the fixture hub feeds', () => {
		const expectedNotifications = buildHubNotifications({
			broadcasts: uiPreviewFixtures.broadcasts,
			events: uiPreviewFixtures.events
		});

		expect(uiPreviewNotifications).toHaveLength(7);
		expect(uiPreviewNotifications.map((item) => item.id)).toEqual(
			expectedNotifications.map((item) => item.id)
		);
	});

	it('returns thread clones that are safe to mutate in demo mode', () => {
		const clonedThreads = cloneUiPreviewThreads();
		const originalThread = uiPreviewFixtures.threads[0];
		const clonedThread = clonedThreads[0];

		expect(clonedThreads.map((thread) => thread.id)).toEqual(
			uiPreviewFixtures.threads.map((thread) => thread.id)
		);
		expect(clonedThread).not.toBe(originalThread);
		expect(clonedThread?.participant).not.toBe(originalThread?.participant);
		expect(clonedThread?.messages).not.toBe(originalThread?.messages);
		expect(clonedThread?.messages[0]).not.toBe(originalThread?.messages[0]);

		const originalMessageCount = originalThread?.messages.length ?? 0;
		if (!clonedThread || !originalThread) {
			throw new Error('Expected preview fixture threads to be available.');
		}

		clonedThread.unreadCount = 99;
		clonedThread.participant.name = 'Changed in clone';
		clonedThread.messages[0].body = 'Changed body in clone';
		clonedThread.messages.push({
			...clonedThread.messages[0],
			id: 'msg-cloned-extra',
			body: 'Extra cloned message',
			sentAt: '2026-04-12T10:00:00.000Z'
		});

		expect(originalThread.unreadCount).toBe(2);
		expect(originalThread.participant.name).toBe('Elena Rossi');
		expect(originalThread.messages[0]?.body).toBe(
			'I locked the community hall for Thursday night. Can you confirm the room setup plan?'
		);
		expect(originalThread.messages).toHaveLength(originalMessageCount);
	});
});