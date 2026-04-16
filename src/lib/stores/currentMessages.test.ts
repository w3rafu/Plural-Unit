import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MessageThread } from '$lib/models/messageModel';

// ── Mock push notification service ──

const mockTriggerPushNotification = vi.fn();

vi.mock('$lib/services/pushNotification', () => ({
	triggerPushNotification: (...args: any[]) => mockTriggerPushNotification(...args)
}));

// ── Mock currentOrganization ──

vi.mock('$lib/stores/currentOrganization.svelte', () => ({
	currentOrganization: { organization: null as { id: string } | null }
}));

import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

// ── Mock realtime service ──

const mockSubscribeToMessages = vi.fn().mockReturnValue(() => {});
const mockSubscribeToThreadPresence = vi.fn().mockReturnValue(() => {});
const mockBroadcastTyping = vi.fn();
const mockClearTyping = vi.fn();
const mockUnsubscribeAll = vi.fn();

vi.mock('$lib/services/realtimeService', () => ({
	subscribeToMessages: (...args: any[]) => mockSubscribeToMessages(...args),
	subscribeToThreadPresence: (...args: any[]) => mockSubscribeToThreadPresence(...args),
	broadcastTyping: (...args: any[]) => mockBroadcastTyping(...args),
	clearTyping: (...args: any[]) => mockClearTyping(...args),
	unsubscribeAll: (...args: any[]) => mockUnsubscribeAll(...args)
}));

// ── Mock message repository ──

const mockFetchOwnMessageThreads = vi.fn();
const mockEnsureDemoMessageThread = vi.fn();
const mockEnsureMessageThreadForProfile = vi.fn();
const mockResetDemoMessageThread = vi.fn();
const mockSendMessageToThread = vi.fn();
const mockUploadMessageImage = vi.fn();
const mockSendImageMessageToThread = vi.fn();
const mockMarkMessageThreadRead = vi.fn();
const mockFetchOlderMessages = vi.fn();

const mockRepository = {
	fetchOwnMessageThreads: mockFetchOwnMessageThreads,
	ensureDemoMessageThread: mockEnsureDemoMessageThread,
	ensureMessageThreadForProfile: mockEnsureMessageThreadForProfile,
	resetDemoMessageThread: mockResetDemoMessageThread,
	sendMessageToThread: mockSendMessageToThread,
	uploadMessageImage: mockUploadMessageImage,
	sendImageMessageToThread: mockSendImageMessageToThread,
	markMessageThreadRead: mockMarkMessageThreadRead,
	fetchOlderMessages: mockFetchOlderMessages
};

import { createCurrentMessagesStore } from './currentMessages.svelte';

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
		messages: [
			{
				id: 'msg-1',
				threadId: 'thread-1',
				senderId: 'user-1',
				senderKind: 'owner',
				kind: 'text',
				body: 'Hello',
				imageUrl: '',
				sentAt: '2026-04-10T12:00:00Z'
			}
		],
		unreadCount: 0,
		lastReadAt: '2026-04-10T12:00:00Z',
		contactLastReadAt: null,
		hasMoreMessages: false,
		...overrides
	};
}

let store: ReturnType<typeof createCurrentMessagesStore>;

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers();
	store = createCurrentMessagesStore(mockRepository);
	currentOrganization.organization = { id: 'org-1' } as any;
});

afterEach(() => {
	store.reset();
	vi.useRealTimers();
});

// ── loadForUser ──

describe('loadForUser', () => {
	it('fetches threads and sets isReady', async () => {
		const threads = [makeThread()];
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce(threads);

		await store.loadForUser('user-1');

		expect(mockEnsureDemoMessageThread).toHaveBeenCalled();
		expect(mockFetchOwnMessageThreads).toHaveBeenCalledWith('user-1');
		expect(store.isReady).toBe(true);
		expect(store.threads).toEqual(threads);
		expect(store.isLoading).toBe(false);
	});

	it('sets isReady even when fetch fails', async () => {
		mockEnsureDemoMessageThread.mockRejectedValueOnce(new Error('network'));

		await store.loadForUser('user-1');

		expect(store.isReady).toBe(true);
		expect(store.error).toBe('network');
	});

	it('skips when ownerId is empty', async () => {
		await store.loadForUser('');

		expect(mockFetchOwnMessageThreads).not.toHaveBeenCalled();
		expect(store.isReady).toBe(false);
	});
});

// ── refresh ──

describe('refresh', () => {
	it('refreshes thread list', async () => {
		const threads = [makeThread()];
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([]);

		await store.loadForUser('user-1');

		mockFetchOwnMessageThreads.mockResolvedValueOnce(threads);
		await store.refresh();

		expect(store.threads).toEqual(threads);
	});

	it('captures error on failure', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([]);

		await store.loadForUser('user-1');

		mockFetchOwnMessageThreads.mockRejectedValueOnce(new Error('refresh error'));
		await store.refresh();

		expect(store.error).toBe('refresh error');
	});

	it('skips when no ownerId', async () => {
		await store.refresh();
		expect(mockFetchOwnMessageThreads).not.toHaveBeenCalled();
	});
});

// ── selectThread ──

describe('selectThread', () => {
	it('sets activeThreadId', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.loadForUser('user-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]); // refresh after mark read
		await store.selectThread('thread-1');

		expect(store.activeThreadId).toBe('thread-1');
	});

	it('marks thread as read when it has unread messages', async () => {
		const unreadThread = makeThread({ unreadCount: 3 });
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([unreadThread]);
		mockMarkMessageThreadRead.mockResolvedValueOnce(undefined);
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread({ unreadCount: 0 })]);

		await store.loadForUser('user-1');
		await store.selectThread('thread-1');

		expect(mockMarkMessageThreadRead).toHaveBeenCalledWith('thread-1');
	});
});

// ── startThreadForProfile ──

describe('startThreadForProfile', () => {
	it('reuses existing thread for profile', async () => {
		const thread = makeThread({ participant: { id: 'c1', profileId: 'profile-1', name: 'Bob', avatar_url: '', subtitle: '', isFakeUser: false } });
		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		mockMarkMessageThreadRead.mockResolvedValueOnce(undefined);
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.loadForUser('user-1');
		const id = await store.startThreadForProfile('profile-1');

		expect(id).toBe('thread-1');
		expect(mockEnsureMessageThreadForProfile).not.toHaveBeenCalled();
	});

	it('creates new thread when none exists for profile', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);
		mockEnsureMessageThreadForProfile.mockResolvedValueOnce('thread-2');
		// refresh after creating thread
		const newThread = makeThread({ id: 'thread-2', participant: { id: 'c2', profileId: 'profile-2', name: 'Carol', avatar_url: '', subtitle: '', isFakeUser: false } });
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread(), newThread]);
		mockMarkMessageThreadRead.mockResolvedValueOnce(undefined);
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread(), newThread]);

		await store.loadForUser('user-1');
		const id = await store.startThreadForProfile('profile-2');

		expect(mockEnsureMessageThreadForProfile).toHaveBeenCalledWith('profile-2');
		expect(id).toBe('thread-2');
	});
});

// ── sendMessage ──

describe('sendMessage', () => {
	it('sends message and refreshes', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockSendMessageToThread.mockResolvedValueOnce('msg-2');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.sendMessage('Hi');

		expect(mockSendMessageToThread).toHaveBeenCalledWith('thread-1', 'Hi');
		expect(store.isSending).toBe(false);
		expect(store.lastSentAt).toBeGreaterThan(0);
	});

	it('skips when no active thread', async () => {
		await store.sendMessage('test');
		expect(mockSendMessageToThread).not.toHaveBeenCalled();
	});

	it('captures error on failure', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockSendMessageToThread.mockRejectedValueOnce(new Error('send fail'));
		await store.sendMessage('Hi');

		expect(store.error).toBe('send fail');
		expect(store.isSending).toBe(false);
	});
});

// ── sendImage ──

describe('sendImage', () => {
	it('uploads image and sends image message', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockUploadMessageImage.mockResolvedValueOnce('https://example.com/img.jpg');
		mockSendImageMessageToThread.mockResolvedValueOnce('msg-3');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		const file = new File(['data'], 'photo.png', { type: 'image/png' });
		await store.sendImage(file);

		expect(mockUploadMessageImage).toHaveBeenCalledWith('user-1', 'thread-1', file);
		expect(mockSendImageMessageToThread).toHaveBeenCalledWith('thread-1', 'https://example.com/img.jpg');
		expect(store.isSending).toBe(false);
	});

	it('skips when no active thread', async () => {
		await store.sendImage(new File([], 'x.png'));
		expect(mockUploadMessageImage).not.toHaveBeenCalled();
	});
});

// ── Push notification triggers ──

describe('push notification triggers', () => {
	it('fires push after sendMessage when participant has a profileId', async () => {
		const thread = makeThread({
			participant: {
				id: 'contact-1',
				profileId: 'profile-2',
				name: 'Bob',
				avatar_url: '',
				subtitle: '',
				isFakeUser: false
			}
		});
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockSendMessageToThread.mockResolvedValueOnce('msg-2');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.sendMessage('Hey!');

		expect(mockTriggerPushNotification).toHaveBeenCalledWith({
			kind: 'message',
			organization_id: 'org-1',
			source_id: 'thread-1',
			title: 'New message',
			body: 'Hey!',
			url: '/messages?thread=thread-1',
			target_profile_id: 'profile-2'
		});
	});

	it('fires push after sendImage', async () => {
		const thread = makeThread({
			participant: {
				id: 'contact-1',
				profileId: 'profile-2',
				name: 'Bob',
				avatar_url: '',
				subtitle: '',
				isFakeUser: false
			}
		});
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockUploadMessageImage.mockResolvedValueOnce('https://example.com/img.jpg');
		mockSendImageMessageToThread.mockResolvedValueOnce('msg-3');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.sendImage(new File(['data'], 'photo.png', { type: 'image/png' }));

		expect(mockTriggerPushNotification).toHaveBeenCalledWith(
			expect.objectContaining({ kind: 'message', body: 'Sent an image' })
		);
	});

	it('skips push for fake users', async () => {
		const thread = makeThread({
			participant: {
				id: 'contact-1',
				profileId: 'profile-2',
				name: 'Demo Bot',
				avatar_url: '',
				subtitle: '',
				isFakeUser: true
			}
		});
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockSendMessageToThread.mockResolvedValueOnce('msg-2');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.sendMessage('Hello');

		expect(mockTriggerPushNotification).not.toHaveBeenCalled();
	});

	it('skips push when participant has no profileId', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockSendMessageToThread.mockResolvedValueOnce('msg-2');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.sendMessage('Hello');

		expect(mockTriggerPushNotification).not.toHaveBeenCalled();
	});

	it('skips push when no organization is loaded', async () => {
		currentOrganization.organization = null as any;

		const thread = makeThread({
			participant: {
				id: 'contact-1',
				profileId: 'profile-2',
				name: 'Bob',
				avatar_url: '',
				subtitle: '',
				isFakeUser: false
			}
		});
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockSendMessageToThread.mockResolvedValueOnce('msg-2');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.sendMessage('Hello');

		expect(mockTriggerPushNotification).not.toHaveBeenCalled();
	});
});

// ── loadOlderMessages ──

describe('loadOlderMessages', () => {
	it('prepends older messages to the active thread', async () => {
		const thread = makeThread({ hasMoreMessages: true });
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		mockFetchOlderMessages.mockResolvedValueOnce([
			{
				id: 'msg-0',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'Older message',
				image_url: null,
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			}
		]);

		await store.loadOlderMessages();

		expect(mockFetchOlderMessages).toHaveBeenCalledWith('thread-1', '2026-04-10T12:00:00Z');
		expect(store.activeThread?.messages).toHaveLength(2);
		expect(store.activeThread?.messages[0].body).toBe('Older message');
		expect(store.activeThread?.hasMoreMessages).toBe(false);
	});

	it('skips when thread has no more messages', async () => {
		const thread = makeThread({ hasMoreMessages: false });
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		await store.loadOlderMessages();

		expect(mockFetchOlderMessages).not.toHaveBeenCalled();
	});

	it('skips when no active thread', async () => {
		await store.loadOlderMessages();
		expect(mockFetchOlderMessages).not.toHaveBeenCalled();
	});
});

// ── resetDemoThread ──

describe('resetDemoThread', () => {
	it('resets demo thread and refreshes', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.loadForUser('user-1');

		mockResetDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.resetDemoThread();

		expect(mockResetDemoMessageThread).toHaveBeenCalled();
		expect(store.isResetting).toBe(false);
	});

	it('captures error on failure', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]);

		await store.loadForUser('user-1');

		mockResetDemoMessageThread.mockRejectedValueOnce(new Error('reset fail'));

		await store.resetDemoThread();

		expect(store.error).toBe('reset fail');
		expect(store.isResetting).toBe(false);
	});
});

// ── Derived state ──

describe('derived state', () => {
	it('totalUnreadCount sums across threads', async () => {
		const threads = [
			makeThread({ id: 'a', unreadCount: 2 }),
			makeThread({ id: 'b', unreadCount: 3 })
		];
		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce(threads);

		await store.loadForUser('user-1');

		expect(store.totalUnreadCount).toBe(5);
	});

	it('activeThread returns the selected thread', async () => {
		const thread = makeThread();
		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		expect(store.activeThread?.id).toBe('thread-1');
	});

	it('activeThread returns null when not selected', () => {
		expect(store.activeThread).toBeNull();
	});

	it('getThreadForProfile returns matching thread', async () => {
		const thread = makeThread({ participant: { id: 'c1', profileId: 'profile-1', name: 'Alice', avatar_url: '', subtitle: '', isFakeUser: false } });
		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.loadForUser('user-1');

		expect(store.getThreadForProfile('profile-1')?.id).toBe('thread-1');
		expect(store.getThreadForProfile('other')).toBeNull();
	});
});

// ── reset ──

describe('reset', () => {
	it('clears all state', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread({ unreadCount: 5 })]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-1';

		store.reset();

		expect(store.isReady).toBe(false);
		expect(store.isLoading).toBe(false);
		expect(store.threads).toEqual([]);
		expect(store.activeThreadId).toBe('');
		expect(store.error).toBe('');
		expect(store.totalUnreadCount).toBe(0);
	});
});

// ── Realtime + polling fallback ──

describe('realtime and polling', () => {
	it('subscribes to realtime after load', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValue([makeThread()]);

		await store.loadForUser('user-1');

		expect(mockSubscribeToMessages).toHaveBeenCalledTimes(1);
		expect(mockSubscribeToMessages).toHaveBeenCalledWith('user-1', expect.any(Function));
	});

	it('falls back to polling when realtime subscription throws', async () => {
		mockSubscribeToMessages.mockImplementationOnce(() => {
			throw new Error('Realtime unavailable');
		});
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValue([makeThread()]);

		await store.loadForUser('user-1');

		vi.advanceTimersByTime(15_000);

		// Initial load + 1 polling tick
		expect(mockFetchOwnMessageThreads).toHaveBeenCalledTimes(2);
	});

	it('stops polling on reset', async () => {
		mockSubscribeToMessages.mockImplementationOnce(() => {
			throw new Error('Realtime unavailable');
		});
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValue([makeThread()]);

		await store.loadForUser('user-1');
		store.reset();

		vi.advanceTimersByTime(30_000);

		// Only the initial load call
		expect(mockFetchOwnMessageThreads).toHaveBeenCalledTimes(1);
	});

	it('unsubscribes on reset', async () => {
		const mockUnsub = vi.fn();
		mockSubscribeToMessages.mockReturnValueOnce(mockUnsub);
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValue([makeThread()]);

		await store.loadForUser('user-1');
		store.reset();

		expect(mockUnsub).toHaveBeenCalled();
		expect(mockUnsubscribeAll).toHaveBeenCalled();
	});
});

// ── selectThread edge cases ──

describe('selectThread edge cases', () => {
	it('does not call markMessageThreadRead when unreadCount is 0', async () => {
		mockEnsureDemoMessageThread.mockResolvedValueOnce('thread-1');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread({ unreadCount: 0 })]);

		await store.loadForUser('user-1');
		await store.selectThread('thread-1');

		expect(mockMarkMessageThreadRead).not.toHaveBeenCalled();
	});
});

// ── openConversationForProfile ──

describe('openConversationForProfile', () => {
	it('loads messages and opens thread for profile', async () => {
		const thread = makeThread({
			id: 'thread-2',
			participant: { id: 'c2', profileId: 'profile-2', name: 'Eve', avatar_url: '', subtitle: '', isFakeUser: false }
		});

		mockEnsureDemoMessageThread.mockResolvedValue('demo');
		mockFetchOwnMessageThreads.mockResolvedValue([thread]);
		mockMarkMessageThreadRead.mockResolvedValue(undefined);

		const threadId = await store.openConversationForProfile('profile-2', 'user-1');

		expect(threadId).toBe('thread-2');
		expect(store.isReady).toBe(true);
		expect(store.activeThreadId).toBe('thread-2');
	});

	it('creates new thread when profile has no existing thread', async () => {
		mockEnsureDemoMessageThread.mockResolvedValue('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread()]); // load
		mockEnsureMessageThreadForProfile.mockResolvedValueOnce('thread-new');
		const newThread = makeThread({
			id: 'thread-new',
			participant: { id: 'c3', profileId: 'profile-3', name: 'Frank', avatar_url: '', subtitle: '', isFakeUser: false }
		});
		mockFetchOwnMessageThreads.mockResolvedValueOnce([makeThread(), newThread]); // refresh after create
		mockMarkMessageThreadRead.mockResolvedValue(undefined);
		mockFetchOwnMessageThreads.mockResolvedValue([makeThread(), newThread]); // refresh after select

		const threadId = await store.openConversationForProfile('profile-3', 'user-1');

		expect(mockEnsureMessageThreadForProfile).toHaveBeenCalledWith('profile-3');
		expect(threadId).toBe('thread-new');
	});

	it('throws when no ownerId provided and store has none', async () => {
		await expect(store.openConversationForProfile('profile-1')).rejects.toThrow(
			'No user context'
		);
	});

	it('skips loadForUser when already ready', async () => {
		const thread = makeThread({
			participant: { id: 'c1', profileId: 'profile-1', name: 'Alice', avatar_url: '', subtitle: '', isFakeUser: false }
		});
		mockEnsureDemoMessageThread.mockResolvedValue('demo');
		mockFetchOwnMessageThreads.mockResolvedValue([thread]);
		mockMarkMessageThreadRead.mockResolvedValue(undefined);

		await store.loadForUser('user-1');

		const callsBefore = mockEnsureDemoMessageThread.mock.calls.length;
		await store.openConversationForProfile('profile-1', 'user-1');

		// Should not re-call ensureDemoMessageThread (loadForUser skipped)
		expect(mockEnsureDemoMessageThread).toHaveBeenCalledTimes(callsBefore);
	});
});

// ── trackIncomingReplies ──

describe('incoming reply tracking', () => {
	it('tracks incoming reply on non-active thread', async () => {
		const threadA = makeThread({ id: 'thread-a', unreadCount: 0 });
		const threadB = makeThread({ id: 'thread-b', unreadCount: 0 });

		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([threadA, threadB]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-a';

		// Simulate incoming message on thread-b
		const updatedB = makeThread({ id: 'thread-b', unreadCount: 1 });
		mockFetchOwnMessageThreads.mockResolvedValueOnce([threadA, updatedB]);

		await store.refresh();

		expect(store.recentIncomingThreadId).toBe('thread-b');
		expect(store.recentIncomingAt).toBeGreaterThan(0);
	});

	it('does not track incoming reply on active thread', async () => {
		const thread = makeThread({ id: 'thread-a', unreadCount: 0 });

		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.loadForUser('user-1');
		store.activeThreadId = 'thread-a';

		const updated = makeThread({ id: 'thread-a', unreadCount: 1 });
		mockFetchOwnMessageThreads.mockResolvedValueOnce([updated]);

		await store.refresh();

		expect(store.recentIncomingThreadId).toBe('');
	});

	it('does not track when unread count does not increase', async () => {
		const thread = makeThread({ id: 'thread-b', unreadCount: 2 });

		mockEnsureDemoMessageThread.mockResolvedValueOnce('demo');
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);

		await store.loadForUser('user-1');

		// Same unread count
		mockFetchOwnMessageThreads.mockResolvedValueOnce([thread]);
		await store.refresh();

		expect(store.recentIncomingThreadId).toBe('');
	});
});
