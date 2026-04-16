export type MessageParticipant = {
	id: string;
	profileId: string | null;
	name: string;
	avatar_url: string;
	subtitle: string;
	isFakeUser: boolean;
};

export type MessageEntry = {
	id: string;
	threadId: string;
	senderId: string;
	senderKind: 'owner' | 'contact';
	kind: 'text' | 'image';
	body: string;
	imageUrl: string;
	sentAt: string;
};

export type MessageThread = {
	id: string;
	participant: MessageParticipant;
	messages: MessageEntry[];
	unreadCount: number;
	lastReadAt: string | null;
	contactLastReadAt: string | null;
	hasMoreMessages: boolean;
};

export type MessageContactRow = {
	id: string;
	profile_id: string | null;
	name: string;
	avatar_url: string;
	subtitle: string;
	is_demo: boolean;
};

export type MessageThreadRow = {
	id: string;
	contact_id: string;
	last_read_at: string | null;
	created_at: string;
	updated_at: string;
	contact: MessageContactRow | MessageContactRow[] | null;
};

export type MessageRow = {
	id: string;
	thread_id: string;
	sender_kind: 'owner' | 'contact';
	message_kind: 'text' | 'image';
	body: string;
	image_url: string | null;
	sent_at: string;
	created_at: string;
};

export function normalizeMessageBody(body: string | null | undefined) {
	return (body ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeMessageImageUrl(imageUrl: string | null | undefined) {
	return (imageUrl ?? '').trim();
}

export function getParticipantInitials(name: string) {
	const initials = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('');

	return initials || '?';
}

export function getThreadLastMessage(thread: MessageThread) {
	return thread.messages.at(-1) ?? null;
}

export function getThreadLastMessageSentAt(thread: MessageThread) {
	return getThreadLastMessage(thread)?.sentAt ?? '';
}

export function getThreadPreview(thread: MessageThread) {
	const lastMessage = getThreadLastMessage(thread);
	if (!lastMessage) {
		return 'No messages yet.';
	}

	return lastMessage.kind === 'image' ? 'Photo' : lastMessage.body;
}

export function sortThreadsByRecent(threads: MessageThread[]) {
	return [...threads].sort((left, right) => {
		const leftTime = getThreadLastMessageSentAt(left);
		const rightTime = getThreadLastMessageSentAt(right);
		return rightTime.localeCompare(leftTime);
	});
}

export type MessageInboxSections = {
	visibleThreads: MessageThread[];
	unreadThreads: MessageThread[];
	recentThreads: MessageThread[];
	olderThreads: MessageThread[];
};

type InboxSectionOptions = {
	now?: number;
	recentWindowMs?: number;
};

const DEFAULT_RECENT_THREAD_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

export function isThreadRecent(
	thread: MessageThread,
	options: InboxSectionOptions = {}
) {
	const timestamp = getThreadLastMessageSentAt(thread);
	if (!timestamp) {
		return false;
	}

	const sentAt = new Date(timestamp).getTime();
	if (Number.isNaN(sentAt)) {
		return false;
	}

	const now = options.now ?? Date.now();
	const recentWindowMs = options.recentWindowMs ?? DEFAULT_RECENT_THREAD_WINDOW_MS;
	return now - sentAt < recentWindowMs;
}

export function filterThreadsByInboxQuery(threads: MessageThread[], query: string) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return threads;
	}

	return threads.filter((thread) => {
		const haystack = [
			thread.participant.name,
			thread.participant.subtitle,
			getThreadPreview(thread)
		]
			.join(' ')
			.toLowerCase();

		return haystack.includes(normalizedQuery);
	});
}

export function getInboxThreadSections(
	threads: MessageThread[],
	query = '',
	options: InboxSectionOptions = {}
): MessageInboxSections {
	const visibleThreads = filterThreadsByInboxQuery(threads, query);
	const unreadThreads = visibleThreads.filter((thread) => thread.unreadCount > 0);
	const recentThreads = visibleThreads.filter(
		(thread) => thread.unreadCount === 0 && isThreadRecent(thread, options)
	);
	const olderThreads = visibleThreads.filter(
		(thread) => thread.unreadCount === 0 && !isThreadRecent(thread, options)
	);

	return {
		visibleThreads,
		unreadThreads,
		recentThreads,
		olderThreads
	};
}

export const MESSAGE_PAGE_SIZE = 50;

export function mapMessageThreads(input: {
	ownerId: string;
	threads: MessageThreadRow[];
	messages: MessageRow[];
	contactLastReadAtMap?: Record<string, string | null>;
	pageSize?: number;
}): MessageThread[] {
	const messagesByThread = new Map<string, MessageEntry[]>();

	for (const row of input.messages) {
		const normalizedBody = normalizeMessageBody(row.body);
		const normalizedImageUrl = normalizeMessageImageUrl(row.image_url);
		const kind = row.message_kind === 'image' ? 'image' : 'text';
		const isValidText = kind === 'text' && normalizedBody;
		const isValidImage = kind === 'image' && normalizedImageUrl;
		if (!row.id || !row.thread_id || !row.sent_at || (!isValidText && !isValidImage)) {
			continue;
		}

		const list = messagesByThread.get(row.thread_id) ?? [];
		list.push({
			id: row.id,
			threadId: row.thread_id,
			senderId: row.sender_kind === 'owner' ? input.ownerId : `contact:${row.thread_id}`,
			senderKind: row.sender_kind,
			kind,
			body: normalizedBody,
			imageUrl: normalizedImageUrl,
			sentAt: row.sent_at
		});
		messagesByThread.set(row.thread_id, list);
	}

	const pageSize = input.pageSize ?? 0;

	return sortThreadsByRecent(
		input.threads
			.map((thread) => {
				const participant = resolveParticipant(thread.contact);
				if (!participant) {
					return null;
				}

				const allMessages = (messagesByThread.get(thread.id) ?? []).sort((left, right) =>
					left.sentAt.localeCompare(right.sentAt)
				);

				const threadMessages =
					pageSize > 0 && allMessages.length > pageSize
						? allMessages.slice(-pageSize)
						: allMessages;

				return {
					id: thread.id,
					participant,
					messages: threadMessages.map((message) =>
						message.senderKind === 'contact'
							? {
									...message,
									senderId: participant.id
								}
							: message
					),
					unreadCount: countUnreadMessages(threadMessages, thread.last_read_at),
					lastReadAt: thread.last_read_at,
					contactLastReadAt: input.contactLastReadAtMap?.[thread.id] ?? null,
					hasMoreMessages: pageSize > 0 && allMessages.length >= pageSize
				} satisfies MessageThread;
			})
			.filter((thread): thread is MessageThread => thread !== null)
	);
}

function resolveParticipant(contact: MessageThreadRow['contact']): MessageParticipant | null {
	const row = Array.isArray(contact) ? contact[0] : contact;
	if (!row?.id || !row.name) {
		return null;
	}

	return {
		id: row.id,
		profileId: row.profile_id ?? null,
		name: row.name,
		avatar_url: row.avatar_url ?? '',
		subtitle: row.subtitle ?? '',
		isFakeUser: Boolean(row.is_demo)
	};
}

function countUnreadMessages(messages: MessageEntry[], lastReadAt: string | null) {
	if (!lastReadAt) {
		return messages.filter((message) => message.senderKind === 'contact').length;
	}

	return messages.filter(
		(message) => message.senderKind === 'contact' && message.sentAt > lastReadAt
	).length;
}
