import rawFixtures from './ui-visual-fixtures.json';
import { getMemberPortraitAvatar } from './portraitAvatars';

import {
	buildEventResponseMap,
	getOwnEventResponseForProfile
} from '$lib/models/eventResponseModel';
import { buildHubNotifications } from '$lib/models/hubNotifications';
import type { MessageThread } from '$lib/models/messageModel';
import type { OrganizationMember } from '$lib/models/organizationModel';
import type {
	BroadcastRow,
	EventResponseRow,
	EventRow,
	EventResponseStatus
} from '$lib/repositories/hubRepository';

export type UiPreviewFixtures = {
	organizationName: string;
	organizationId: string;
	currentUserProfileId: string;
	members: OrganizationMember[];
	threads: MessageThread[];
	broadcasts: BroadcastRow[];
	events: EventRow[];
};

const previewMembers = rawFixtures.members.map((member) => ({
	...member,
	avatar_url: getMemberPortraitAvatar(member.profile_id, member.avatar_url)
}));

const previewThreads = rawFixtures.threads.map((thread) => ({
	...thread,
	participant: {
		...thread.participant,
		avatar_url: thread.participant.profileId
			? getMemberPortraitAvatar(thread.participant.profileId, thread.participant.avatar_url)
			: thread.participant.avatar_url
	}
}));

export const uiPreviewFixtures = {
	...rawFixtures,
	members: previewMembers,
	threads: previewThreads
} as UiPreviewFixtures;

export const uiPreviewEventResponses: EventResponseRow[] = [
	{
		id: 'response-event-1-ariana',
		event_id: 'event-1',
		organization_id: uiPreviewFixtures.organizationId,
		profile_id: uiPreviewFixtures.currentUserProfileId,
		response: 'going',
		created_at: '2026-04-11T18:00:00.000Z',
		updated_at: '2026-04-11T18:00:00.000Z'
	},
	{
		id: 'response-event-1-elena',
		event_id: 'event-1',
		organization_id: uiPreviewFixtures.organizationId,
		profile_id: 'profile-elena-rossi',
		response: 'going',
		created_at: '2026-04-11T18:10:00.000Z',
		updated_at: '2026-04-11T18:10:00.000Z'
	},
	{
		id: 'response-event-2-malik',
		event_id: 'event-2',
		organization_id: uiPreviewFixtures.organizationId,
		profile_id: 'profile-malik-johnson',
		response: 'going',
		created_at: '2026-04-13T13:15:00.000Z',
		updated_at: '2026-04-13T13:15:00.000Z'
	},
	{
		id: 'response-event-3-ariana',
		event_id: 'event-3',
		organization_id: uiPreviewFixtures.organizationId,
		profile_id: uiPreviewFixtures.currentUserProfileId,
		response: 'maybe',
		created_at: '2026-04-12T09:30:00.000Z',
		updated_at: '2026-04-12T09:30:00.000Z'
	},
	{
		id: 'response-event-3-lucia',
		event_id: 'event-3',
		organization_id: uiPreviewFixtures.organizationId,
		profile_id: 'profile-lucia-costa',
		response: 'going',
		created_at: '2026-04-12T10:00:00.000Z',
		updated_at: '2026-04-12T10:00:00.000Z'
	}
];

export const uiPreviewEventResponseMap = buildEventResponseMap(uiPreviewEventResponses);

export const uiPreviewOwnEventResponses = Object.fromEntries(
	uiPreviewFixtures.events.map((event) => [
		event.id,
		getOwnEventResponseForProfile(
			uiPreviewEventResponseMap[event.id] ?? [],
			uiPreviewFixtures.currentUserProfileId
		)
	])
) as Record<string, EventResponseStatus | null>;

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