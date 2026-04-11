import { describe, it, expect } from 'vitest';
import {
	normalizeMessageBody,
	normalizeMessageImageUrl,
	getParticipantInitials,
	getThreadLastMessage,
	getThreadLastMessageSentAt,
	getThreadPreview,
	sortThreadsByRecent,
	isThreadRecent,
	filterThreadsByInboxQuery,
	getInboxThreadSections,
	mapMessageThreads,
	type MessageThread,
	type MessageEntry,
	type MessageThreadRow,
	type MessageRow
} from './messageModel';

// ── Factories ──

function makeParticipant(overrides = {}) {
	return {
		id: 'contact-1',
		profileId: null,
		name: 'Alice',
		avatar_url: '',
		subtitle: 'Member',
		isFakeUser: false,
		...overrides
	};
}

function makeMessage(overrides: Partial<MessageEntry> = {}): MessageEntry {
	return {
		id: 'msg-1',
		threadId: 'thread-1',
		senderId: 'owner-1',
		senderKind: 'owner',
		kind: 'text',
		body: 'Hello',
		imageUrl: '',
		sentAt: '2026-04-10T12:00:00Z',
		...overrides
	};
}

function makeThread(overrides: Partial<MessageThread> = {}): MessageThread {
	return {
		id: 'thread-1',
		participant: makeParticipant(),
		messages: [makeMessage()],
		unreadCount: 0,
		lastReadAt: '2026-04-10T12:00:00Z',
		...overrides
	};
}

// ── normalizeMessageBody ──

describe('normalizeMessageBody', () => {
	it('trims and collapses whitespace', () => {
		expect(normalizeMessageBody('  hello   world  ')).toBe('hello world');
	});

	it('handles null and undefined', () => {
		expect(normalizeMessageBody(null)).toBe('');
		expect(normalizeMessageBody(undefined)).toBe('');
	});
});

// ── normalizeMessageImageUrl ──

describe('normalizeMessageImageUrl', () => {
	it('trims whitespace', () => {
		expect(normalizeMessageImageUrl('  https://example.com/img.jpg  ')).toBe('https://example.com/img.jpg');
	});

	it('handles null and undefined', () => {
		expect(normalizeMessageImageUrl(null)).toBe('');
		expect(normalizeMessageImageUrl(undefined)).toBe('');
	});
});

// ── getParticipantInitials ──

describe('getParticipantInitials', () => {
	it('returns first two initials', () => {
		expect(getParticipantInitials('Alice Smith')).toBe('AS');
	});

	it('returns single initial for single name', () => {
		expect(getParticipantInitials('Alice')).toBe('A');
	});

	it('returns ? for empty string', () => {
		expect(getParticipantInitials('')).toBe('?');
		expect(getParticipantInitials('   ')).toBe('?');
	});

	it('caps at two initials', () => {
		expect(getParticipantInitials('Alice B Carter')).toBe('AB');
	});
});

// ── getThreadLastMessage ──

describe('getThreadLastMessage', () => {
	it('returns the last message', () => {
		const msg = makeMessage({ id: 'last' });
		const thread = makeThread({ messages: [makeMessage({ id: 'first' }), msg] });
		expect(getThreadLastMessage(thread)?.id).toBe('last');
	});

	it('returns null for empty thread', () => {
		expect(getThreadLastMessage(makeThread({ messages: [] }))).toBeNull();
	});
});

// ── getThreadLastMessageSentAt ──

describe('getThreadLastMessageSentAt', () => {
	it('returns sentAt of last message', () => {
		const thread = makeThread({ messages: [makeMessage({ sentAt: '2026-04-10T15:00:00Z' })] });
		expect(getThreadLastMessageSentAt(thread)).toBe('2026-04-10T15:00:00Z');
	});

	it('returns empty string for empty thread', () => {
		expect(getThreadLastMessageSentAt(makeThread({ messages: [] }))).toBe('');
	});
});

// ── getThreadPreview ──

describe('getThreadPreview', () => {
	it('returns body for text messages', () => {
		expect(getThreadPreview(makeThread())).toBe('Hello');
	});

	it('returns Photo for image messages', () => {
		const thread = makeThread({ messages: [makeMessage({ kind: 'image', body: '' })] });
		expect(getThreadPreview(thread)).toBe('Photo');
	});

	it('returns placeholder for empty thread', () => {
		expect(getThreadPreview(makeThread({ messages: [] }))).toBe('No messages yet.');
	});
});

// ── sortThreadsByRecent ──

describe('sortThreadsByRecent', () => {
	it('sorts by most recent last message first', () => {
		const older = makeThread({
			id: 'old',
			messages: [makeMessage({ sentAt: '2026-04-09T12:00:00Z' })]
		});
		const newer = makeThread({
			id: 'new',
			messages: [makeMessage({ sentAt: '2026-04-10T12:00:00Z' })]
		});
		const sorted = sortThreadsByRecent([older, newer]);
		expect(sorted.map((t) => t.id)).toEqual(['new', 'old']);
	});

	it('does not mutate the original array', () => {
		const threads = [makeThread()];
		const sorted = sortThreadsByRecent(threads);
		expect(sorted).not.toBe(threads);
	});
});

// ── isThreadRecent ──

describe('isThreadRecent', () => {
	it('returns true for thread within the window', () => {
		const now = new Date('2026-04-10T12:00:00Z').getTime();
		const thread = makeThread({ messages: [makeMessage({ sentAt: '2026-04-09T12:00:00Z' })] });
		expect(isThreadRecent(thread, { now })).toBe(true);
	});

	it('returns false for thread outside the window', () => {
		const now = new Date('2026-04-20T12:00:00Z').getTime();
		const thread = makeThread({ messages: [makeMessage({ sentAt: '2026-04-01T12:00:00Z' })] });
		expect(isThreadRecent(thread, { now })).toBe(false);
	});

	it('returns false for empty thread', () => {
		expect(isThreadRecent(makeThread({ messages: [] }))).toBe(false);
	});
});

// ── filterThreadsByInboxQuery ──

describe('filterThreadsByInboxQuery', () => {
	it('returns all threads for empty query', () => {
		const threads = [makeThread()];
		expect(filterThreadsByInboxQuery(threads, '')).toEqual(threads);
	});

	it('filters by participant name', () => {
		const alice = makeThread({ id: 'a', participant: makeParticipant({ name: 'Alice' }) });
		const bob = makeThread({ id: 'b', participant: makeParticipant({ name: 'Bob' }) });
		expect(filterThreadsByInboxQuery([alice, bob], 'alice').map((t) => t.id)).toEqual(['a']);
	});

	it('filters by message body', () => {
		const thread = makeThread({ messages: [makeMessage({ body: 'unique keyword' })] });
		expect(filterThreadsByInboxQuery([thread], 'keyword')).toHaveLength(1);
		expect(filterThreadsByInboxQuery([thread], 'missing')).toHaveLength(0);
	});

	it('is case-insensitive', () => {
		const thread = makeThread({ participant: makeParticipant({ name: 'Alice' }) });
		expect(filterThreadsByInboxQuery([thread], 'ALICE')).toHaveLength(1);
	});
});

// ── getInboxThreadSections ──

describe('getInboxThreadSections', () => {
	const now = new Date('2026-04-10T12:00:00Z').getTime();

	it('separates unread, recent, and older threads', () => {
		const unread = makeThread({
			id: 'unread',
			unreadCount: 2,
			messages: [makeMessage({ sentAt: '2026-04-09T12:00:00Z' })]
		});
		const recent = makeThread({
			id: 'recent',
			unreadCount: 0,
			messages: [makeMessage({ sentAt: '2026-04-09T12:00:00Z' })]
		});
		const older = makeThread({
			id: 'older',
			unreadCount: 0,
			messages: [makeMessage({ sentAt: '2026-03-01T12:00:00Z' })]
		});
		const sections = getInboxThreadSections([unread, recent, older], '', { now });
		expect(sections.unreadThreads.map((t) => t.id)).toEqual(['unread']);
		expect(sections.recentThreads.map((t) => t.id)).toEqual(['recent']);
		expect(sections.olderThreads.map((t) => t.id)).toEqual(['older']);
	});

	it('applies query filter', () => {
		const alice = makeThread({ id: 'a', participant: makeParticipant({ name: 'Alice' }) });
		const bob = makeThread({ id: 'b', participant: makeParticipant({ name: 'Bob' }) });
		const sections = getInboxThreadSections([alice, bob], 'bob', { now });
		expect(sections.visibleThreads).toHaveLength(1);
	});
});

// ── mapMessageThreads ──

describe('mapMessageThreads', () => {
	it('maps thread and message rows into domain objects', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: {
					id: 'contact-1',
					profile_id: null,
					name: 'Demo Contact',
					avatar_url: '',
					subtitle: 'Test',
					is_demo: true
				}
			}
		];
		const messages: MessageRow[] = [
			{
				id: 'msg-1',
				thread_id: 'thread-1',
				sender_kind: 'owner',
				message_kind: 'text',
				body: 'Hello',
				image_url: null,
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			},
			{
				id: 'msg-2',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'Hi there',
				image_url: null,
				sent_at: '2026-04-10T12:00:00Z',
				created_at: '2026-04-10T12:00:00Z'
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages });
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('thread-1');
		expect(result[0].participant.name).toBe('Demo Contact');
		expect(result[0].participant.isFakeUser).toBe(true);
		expect(result[0].messages).toHaveLength(2);
		expect(result[0].messages[0].senderKind).toBe('owner');
		expect(result[0].messages[0].senderId).toBe('user-1');
		expect(result[0].messages[1].senderKind).toBe('contact');
		expect(result[0].messages[1].senderId).toBe('contact-1');
	});

	it('counts unread messages since last_read_at', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: '2026-04-10T11:30:00Z',
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: {
					id: 'contact-1',
					profile_id: null,
					name: 'Alice',
					avatar_url: '',
					subtitle: '',
					is_demo: false
				}
			}
		];
		const messages: MessageRow[] = [
			{
				id: 'msg-1',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'Before read',
				image_url: null,
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			},
			{
				id: 'msg-2',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'After read',
				image_url: null,
				sent_at: '2026-04-10T12:00:00Z',
				created_at: '2026-04-10T12:00:00Z'
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages });
		expect(result[0].unreadCount).toBe(1);
	});

	it('counts all contact messages as unread when last_read_at is null', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: { id: 'contact-1', profile_id: null, name: 'Alice', avatar_url: '', subtitle: '', is_demo: false }
			}
		];
		const messages: MessageRow[] = [
			{
				id: 'msg-1',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'One',
				image_url: null,
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			},
			{
				id: 'msg-2',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'Two',
				image_url: null,
				sent_at: '2026-04-10T12:00:00Z',
				created_at: '2026-04-10T12:00:00Z'
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages });
		expect(result[0].unreadCount).toBe(2);
	});

	it('skips threads with null contact', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: null
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages: [] });
		expect(result).toHaveLength(0);
	});

	it('handles image messages', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: { id: 'contact-1', profile_id: null, name: 'Alice', avatar_url: '', subtitle: '', is_demo: false }
			}
		];
		const messages: MessageRow[] = [
			{
				id: 'msg-1',
				thread_id: 'thread-1',
				sender_kind: 'owner',
				message_kind: 'image',
				body: '',
				image_url: 'https://example.com/img.jpg',
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages });
		expect(result[0].messages[0].kind).toBe('image');
		expect(result[0].messages[0].imageUrl).toBe('https://example.com/img.jpg');
	});

	it('skips invalid messages (empty body for text kind)', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: { id: 'contact-1', profile_id: null, name: 'Alice', avatar_url: '', subtitle: '', is_demo: false }
			}
		];
		const messages: MessageRow[] = [
			{
				id: 'msg-1',
				thread_id: 'thread-1',
				sender_kind: 'owner',
				message_kind: 'text',
				body: '',
				image_url: null,
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages });
		expect(result[0].messages).toHaveLength(0);
	});

	it('resolves contact from array form', () => {
		const threads: MessageThreadRow[] = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: [{ id: 'contact-1', profile_id: 'profile-1', name: 'Alice', avatar_url: '', subtitle: '', is_demo: false }]
			}
		];

		const result = mapMessageThreads({ ownerId: 'user-1', threads, messages: [] });
		expect(result[0].participant.name).toBe('Alice');
		expect(result[0].participant.profileId).toBe('profile-1');
	});
});
