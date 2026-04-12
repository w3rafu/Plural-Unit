import rawFixtures from './ui-visual-fixtures.json';

import { buildHubNotifications } from '$lib/models/hubNotifications';
import type { MessageThread } from '$lib/models/messageModel';
import type { OrganizationMember } from '$lib/models/organizationModel';
import type { BroadcastRow, EventRow } from '$lib/repositories/hubRepository';

export type UiPreviewFixtures = {
	organizationName: string;
	organizationId: string;
	currentUserProfileId: string;
	members: OrganizationMember[];
	threads: MessageThread[];
	broadcasts: BroadcastRow[];
	events: EventRow[];
};

export const uiPreviewFixtures = rawFixtures as UiPreviewFixtures;

export function cloneUiPreviewThreads() {
	return uiPreviewFixtures.threads.map((thread) => ({
		...thread,
		participant: { ...thread.participant },
		messages: thread.messages.map((message) => ({ ...message }))
	}));
}

export function getUiPreviewMember(memberId: string) {
	return uiPreviewFixtures.members.find((member) => member.profile_id === memberId) ?? null;
}

export const uiPreviewAdminCount = uiPreviewFixtures.members.filter(
	(member) => member.role === 'admin'
).length;

export const uiPreviewMemberCount = uiPreviewFixtures.members.filter(
	(member) => member.role === 'member'
).length;

export const uiPreviewUnreadMessageCount = uiPreviewFixtures.threads.reduce(
	(total, thread) => total + thread.unreadCount,
	0
);

export const uiPreviewNotifications = buildHubNotifications({
	broadcasts: uiPreviewFixtures.broadcasts,
	events: uiPreviewFixtures.events
});