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
	deletedAt?: string | null;
	isDeleted?: boolean;
};

export type MessageThread = {
	id: string;
	participant: MessageParticipant;
	messages: MessageEntry[];
	unreadCount: number;
	lastReadAt: string | null;
	contactLastReadAt: string | null;
	archivedAt?: string | null;
	mutedAt?: string | null;
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
	archived_at?: string | null;
	muted_at?: string | null;
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
	deleted_at?: string | null;
};

export const DELETED_MESSAGE_PLACEHOLDER = 'This message was deleted.';

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

export function isThreadArchived(thread: Pick<MessageThread, 'archivedAt'>) {
	return Boolean(thread.archivedAt);
}

export function isThreadMuted(thread: Pick<MessageThread, 'mutedAt'>) {
	return Boolean(thread.mutedAt);
}

function getThreadSortTimestamp(thread: MessageThread) {
	const lastMessageSentAt = getThreadLastMessageSentAt(thread);
	const archivedAt = thread.archivedAt ?? '';
	return archivedAt > lastMessageSentAt ? archivedAt : lastMessageSentAt;
}

export function getThreadPreview(thread: MessageThread) {
	const lastMessage = getThreadLastMessage(thread);
	if (!lastMessage) {
		return 'No messages yet.';
	}

	if (lastMessage.isDeleted) {
		return DELETED_MESSAGE_PLACEHOLDER;
	}

	return lastMessage.kind === 'image' ? 'Photo' : lastMessage.body;
}

export function markMessageEntryDeleted(
	message: MessageEntry,
	deletedAt = message.deletedAt ?? new Date().toISOString()
): MessageEntry {
	return {
		...message,
		body: DELETED_MESSAGE_PLACEHOLDER,
		imageUrl: '',
		deletedAt,
		isDeleted: true
	};
}

export function mapMessageRowToEntry(input: {
	row: MessageRow;
	ownerId: string;
	contactSenderId: string;
}): MessageEntry | null {
	const { row } = input;
	const normalizedBody = normalizeMessageBody(row.body);
	const normalizedImageUrl = normalizeMessageImageUrl(row.image_url);
	const kind = row.message_kind === 'image' ? 'image' : 'text';
	const isDeleted = Boolean(row.deleted_at);
	const isValidText = kind === 'text' && normalizedBody;
	const isValidImage = kind === 'image' && normalizedImageUrl;
	if (!row.id || !row.thread_id || !row.sent_at || (!isDeleted && !isValidText && !isValidImage)) {
		return null;
	}

	const entry = {
		id: row.id,
		threadId: row.thread_id,
		senderId: row.sender_kind === 'owner' ? input.ownerId : input.contactSenderId,
		senderKind: row.sender_kind,
		kind,
		body: normalizedBody,
		imageUrl: normalizedImageUrl,
		sentAt: row.sent_at,
		deletedAt: row.deleted_at ?? null,
		isDeleted
	} satisfies MessageEntry;

	return isDeleted ? markMessageEntryDeleted(entry, row.deleted_at ?? row.sent_at) : entry;
}

export function sortThreadsByRecent(threads: MessageThread[]) {
	return [...threads].sort((left, right) => {
		const leftTime = getThreadSortTimestamp(left);
		const rightTime = getThreadSortTimestamp(right);
		return rightTime.localeCompare(leftTime);
	});
}

export type MessageInboxSections = {
	visibleThreads: MessageThread[];
	unreadThreads: MessageThread[];
	recentThreads: MessageThread[];
	olderThreads: MessageThread[];
	archivedThreads: MessageThread[];
};

type InboxSectionOptions = {
	now?: number;
	recentWindowMs?: number;
	includeArchived?: boolean;
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

		if (haystack.includes(normalizedQuery)) {
			return true;
		}

		return thread.messages.some(
			(message) => message.body.toLowerCase().includes(normalizedQuery)
		);
	});
}

export function getInboxThreadSections(
	threads: MessageThread[],
	query = '',
	options: InboxSectionOptions = {}
): MessageInboxSections {
	const matchingThreads = filterThreadsByInboxQuery(threads, query);
	const includeArchived = options.includeArchived ?? query.trim().length > 0;
	const activeThreads = matchingThreads.filter((thread) => !isThreadArchived(thread));
	const archivedThreads = includeArchived
		? matchingThreads.filter((thread) => isThreadArchived(thread))
		: [];
	const unreadThreads = activeThreads.filter((thread) => thread.unreadCount > 0);
	const recentThreads = activeThreads.filter(
		(thread) => thread.unreadCount === 0 && isThreadRecent(thread, options)
	);
	const olderThreads = activeThreads.filter(
		(thread) => thread.unreadCount === 0 && !isThreadRecent(thread, options)
	);
	const visibleThreads = includeArchived ? [...activeThreads, ...archivedThreads] : activeThreads;

	return {
		visibleThreads,
		unreadThreads,
		recentThreads,
		olderThreads,
		archivedThreads
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
		const entry = mapMessageRowToEntry({
			row,
			ownerId: input.ownerId,
			contactSenderId: `contact:${row.thread_id}`
		});
		if (!entry) {
			continue;
		}

		const list = messagesByThread.get(row.thread_id) ?? [];
		list.push(entry);
		messagesByThread.set(row.thread_id, list);
	}

	const pageSize = input.pageSize ?? 0;
	const mappedThreads = input.threads.flatMap((thread): MessageThread[] => {
		const participant = resolveParticipant(thread.contact);
		if (!participant) {
			return [];
		}

		const allMessages = (messagesByThread.get(thread.id) ?? []).sort((left, right) =>
			left.sentAt.localeCompare(right.sentAt)
		);

		const threadMessages =
			pageSize > 0 && allMessages.length > pageSize
				? allMessages.slice(-pageSize)
				: allMessages;

		return [
			{
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
				archivedAt: thread.archived_at ?? null,
				mutedAt: thread.muted_at ?? null,
				hasMoreMessages: pageSize > 0 && allMessages.length >= pageSize
			} satisfies MessageThread
		];
	});

	return sortThreadsByRecent(mappedThreads);
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
