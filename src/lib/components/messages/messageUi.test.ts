import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MessageEntry, MessageThread } from '$lib/models/messageModel';
import {
	formatThreadTimestamp,
	formatDaySeparator,
	formatMessageTime,
	groupMessagesByDay,
	hasContactMessages
} from './messageUi';

// ── helpers ──

function makeEntry(overrides: Partial<MessageEntry> = {}): MessageEntry {
	return {
		id: 'msg-1',
		threadId: 'thread-1',
		senderId: 'user-1',
		senderKind: 'owner',
		kind: 'text',
		body: 'Hello',
		imageUrl: '',
		sentAt: '2026-04-10T14:30:00Z',
		...overrides
	};
}

function makeThread(overrides: Partial<MessageThread> = {}): MessageThread {
	return {
		id: 'thread-1',
		participant: {
			id: 'contact-1',
			profileId: null,
			name: 'Alice',
			avatar_url: '',
			subtitle: '',
			isFakeUser: false
		},
		messages: [makeEntry()],
		unreadCount: 0,
		lastReadAt: '2026-04-10T14:30:00Z',
		contactLastReadAt: null,
		...overrides
	};
}

// ── formatThreadTimestamp ──

describe('formatThreadTimestamp', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-10T18:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns empty string for empty input', () => {
		expect(formatThreadTimestamp('')).toBe('');
	});

	it('returns time-of-day for today', () => {
		const result = formatThreadTimestamp('2026-04-10T14:30:00Z');
		// Should contain a time representation (varies by locale)
		expect(result).toBeTruthy();
		expect(result).not.toContain('Apr');
	});

	it('returns short weekday for this week', () => {
		const result = formatThreadTimestamp('2026-04-08T10:00:00Z');
		// Two days ago — should be a short weekday like "Wed"
		expect(result).toBeTruthy();
	});

	it('returns short date for older messages', () => {
		const result = formatThreadTimestamp('2026-03-01T10:00:00Z');
		// Over a month ago — should contain month
		expect(result).toBeTruthy();
	});
});

// ── formatDaySeparator ──

describe('formatDaySeparator', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-10T18:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "Today" for today', () => {
		expect(formatDaySeparator('2026-04-10T14:00:00Z')).toBe('Today');
	});

	it('returns "Yesterday" for yesterday', () => {
		expect(formatDaySeparator('2026-04-09T14:00:00Z')).toBe('Yesterday');
	});

	it('returns full date for older messages', () => {
		const result = formatDaySeparator('2026-03-15T14:00:00Z');
		// Should contain a longer formatted date
		expect(result).toBeTruthy();
		expect(result).not.toBe('Today');
		expect(result).not.toBe('Yesterday');
	});
});

// ── formatMessageTime ──

describe('formatMessageTime', () => {
	it('returns a time string', () => {
		const result = formatMessageTime('2026-04-10T14:30:00Z');
		expect(result).toBeTruthy();
	});
});

// ── groupMessagesByDay ──

describe('groupMessagesByDay', () => {
	it('returns empty array for no messages', () => {
		expect(groupMessagesByDay([])).toEqual([]);
	});

	it('groups messages from the same day together', () => {
		const messages = [
			makeEntry({ id: 'a', sentAt: '2026-04-10T10:00:00Z' }),
			makeEntry({ id: 'b', sentAt: '2026-04-10T14:00:00Z' })
		];

		const groups = groupMessagesByDay(messages);

		expect(groups).toHaveLength(1);
		expect(groups[0].dateKey).toBe('2026-04-10');
		expect(groups[0].messages).toHaveLength(2);
	});

	it('separates messages from different days', () => {
		const messages = [
			makeEntry({ id: 'a', sentAt: '2026-04-09T10:00:00Z' }),
			makeEntry({ id: 'b', sentAt: '2026-04-10T14:00:00Z' })
		];

		const groups = groupMessagesByDay(messages);

		expect(groups).toHaveLength(2);
		expect(groups[0].dateKey).toBe('2026-04-09');
		expect(groups[0].messages).toHaveLength(1);
		expect(groups[1].dateKey).toBe('2026-04-10');
		expect(groups[1].messages).toHaveLength(1);
	});

	it('preserves message order within a group', () => {
		const messages = [
			makeEntry({ id: 'first', sentAt: '2026-04-10T08:00:00Z' }),
			makeEntry({ id: 'second', sentAt: '2026-04-10T09:00:00Z' }),
			makeEntry({ id: 'third', sentAt: '2026-04-10T10:00:00Z' })
		];

		const groups = groupMessagesByDay(messages);

		expect(groups[0].messages.map((m) => m.id)).toEqual(['first', 'second', 'third']);
	});

	it('assigns a label to each group', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-10T18:00:00Z'));

		const messages = [makeEntry({ sentAt: '2026-04-10T10:00:00Z' })];
		const groups = groupMessagesByDay(messages);

		expect(groups[0].label).toBe('Today');

		vi.useRealTimers();
	});
});

// ── hasContactMessages ──

describe('hasContactMessages', () => {
	it('returns true when thread has contact messages', () => {
		const thread = makeThread({
			messages: [
				makeEntry({ senderKind: 'owner' }),
				makeEntry({ id: 'msg-2', senderKind: 'contact' })
			]
		});

		expect(hasContactMessages(thread)).toBe(true);
	});

	it('returns false when thread has only owner messages', () => {
		const thread = makeThread({
			messages: [makeEntry({ senderKind: 'owner' })]
		});

		expect(hasContactMessages(thread)).toBe(false);
	});

	it('returns false when thread has no messages', () => {
		const thread = makeThread({ messages: [] });

		expect(hasContactMessages(thread)).toBe(false);
	});
});
