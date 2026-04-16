import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: vi.fn()
}));

import {
	subscribeToMessages,
	subscribeToThreadPresence,
	broadcastTyping,
	clearTyping,
	unsubscribeAll
} from './realtimeService';
import { getSupabaseClient } from '$lib/supabaseClient';

function makeMockChannel() {
	const channel: Record<string, any> = {
		on: vi.fn().mockReturnThis(),
		subscribe: vi.fn().mockReturnThis(),
		track: vi.fn(),
		presenceState: vi.fn().mockReturnValue({})
	};
	return channel;
}

function makeMockClient(channel: Record<string, any>) {
	return {
		channel: vi.fn().mockReturnValue(channel),
		removeChannel: vi.fn()
	};
}

// Helper to set up client and ensure unsubscribeAll works cleanly
function setupMockClient() {
	const mockChannel = makeMockChannel();
	const mockClient = makeMockClient(mockChannel);
	vi.mocked(getSupabaseClient).mockReturnValue(mockClient as any);
	return { mockChannel, mockClient };
}

describe('subscribeToMessages', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		// Set up a mock client so unsubscribeAll doesn't throw
		const { mockClient } = setupMockClient();
		unsubscribeAll();
		vi.resetAllMocks();
	});

	it('subscribes to postgres_changes on the messages table', () => {
		const { mockChannel, mockClient } = setupMockClient();

		const onEvent = vi.fn();
		subscribeToMessages('user-1', onEvent);

		expect(mockClient.channel).toHaveBeenCalledWith('messages:user-1');
		expect(mockChannel.on).toHaveBeenCalledWith(
			'postgres_changes',
			expect.objectContaining({ event: 'INSERT', table: 'messages' }),
			expect.any(Function)
		);
		expect(mockChannel.subscribe).toHaveBeenCalled();
	});

	it('returns a cleanup function that removes the channel', () => {
		const { mockChannel, mockClient } = setupMockClient();

		const cleanup = subscribeToMessages('user-1', vi.fn());
		cleanup();

		expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);
	});

	it('invokes onEvent with threadId from INSERT payload', () => {
		const { mockChannel } = setupMockClient();

		const onEvent = vi.fn();
		subscribeToMessages('user-1', onEvent);

		// Extract the callback passed to .on()
		const onCallback = mockChannel.on.mock.calls[0][2];
		onCallback({ new: { thread_id: 'thread-abc' } });

		expect(onEvent).toHaveBeenCalledWith({ type: 'INSERT', threadId: 'thread-abc' });
	});

	it('does not invoke onEvent when thread_id is missing', () => {
		const { mockChannel } = setupMockClient();

		const onEvent = vi.fn();
		subscribeToMessages('user-1', onEvent);

		const onCallback = mockChannel.on.mock.calls[0][2];
		onCallback({ new: {} });

		expect(onEvent).not.toHaveBeenCalled();
	});
});

describe('subscribeToThreadPresence', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		setupMockClient();
		unsubscribeAll();
		vi.resetAllMocks();
	});

	it('subscribes to presence on a thread channel', () => {
		const { mockChannel, mockClient } = setupMockClient();

		const callbacks = { onTypingChange: vi.fn() };
		subscribeToThreadPresence('thread-1', 'user-1', callbacks);

		expect(mockClient.channel).toHaveBeenCalledWith('thread:thread-1', expect.any(Object));
		expect(mockChannel.on).toHaveBeenCalledWith(
			'presence',
			{ event: 'sync' },
			expect.any(Function)
		);
		expect(mockChannel.subscribe).toHaveBeenCalled();
	});

	it('returns a cleanup function', () => {
		const { mockChannel, mockClient } = setupMockClient();

		const cleanup = subscribeToThreadPresence('thread-1', 'user-1', {
			onTypingChange: vi.fn()
		});
		cleanup();

		expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);
	});

	it('reports remote typing via presence sync', () => {
		const { mockChannel } = setupMockClient();

		const onTypingChange = vi.fn();
		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange });

		// Simulate presence sync with a remote user typing
		mockChannel.presenceState.mockReturnValue({
			'user-1': [{ typing: false }],
			'user-2': [{ typing: true }]
		});

		const syncCallback = mockChannel.on.mock.calls[0][2];
		syncCallback();

		expect(onTypingChange).toHaveBeenCalledWith(true);
	});

	it('reports no remote typing when only self is present', () => {
		const { mockChannel } = setupMockClient();

		const onTypingChange = vi.fn();
		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange });

		mockChannel.presenceState.mockReturnValue({
			'user-1': [{ typing: true }]
		});

		const syncCallback = mockChannel.on.mock.calls[0][2];
		syncCallback();

		expect(onTypingChange).toHaveBeenCalledWith(false);
	});
});

describe('broadcastTyping', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.resetAllMocks();
		setupMockClient();
		unsubscribeAll();
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('tracks typing true on the thread channel', () => {
		const { mockChannel } = setupMockClient();

		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange: vi.fn() });
		broadcastTyping('thread-1');

		expect(mockChannel.track).toHaveBeenCalledWith({ typing: true });
	});

	it('auto-clears typing after debounce timeout', () => {
		const { mockChannel } = setupMockClient();

		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange: vi.fn() });
		broadcastTyping('thread-1');

		vi.advanceTimersByTime(2000);
		expect(mockChannel.track).toHaveBeenCalledWith({ typing: false });
	});

	it('is a no-op if no presence channel exists for threadId', () => {
		setupMockClient();
		broadcastTyping('nonexistent');
		// Should not throw
	});
});

describe('clearTyping', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.resetAllMocks();
		setupMockClient();
		unsubscribeAll();
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('tracks typing false on the thread channel', () => {
		const { mockChannel } = setupMockClient();

		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange: vi.fn() });
		clearTyping('thread-1');

		expect(mockChannel.track).toHaveBeenCalledWith({ typing: false });
	});

	it('cancels any pending typing debounce timer', () => {
		const { mockChannel } = setupMockClient();

		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange: vi.fn() });
		broadcastTyping('thread-1');
		clearTyping('thread-1');

		// After clear, advancing timers should not re-track
		mockChannel.track.mockClear();
		vi.advanceTimersByTime(2000);
		expect(mockChannel.track).not.toHaveBeenCalledWith({ typing: false });
	});
});

describe('unsubscribeAll', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('removes message channel', () => {
		const { mockChannel, mockClient } = setupMockClient();

		subscribeToMessages('user-1', vi.fn());
		unsubscribeAll();

		expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);
	});

	it('removes presence channels', () => {
		const { mockClient } = setupMockClient();

		subscribeToThreadPresence('thread-1', 'user-1', { onTypingChange: vi.fn() });
		unsubscribeAll();

		expect(mockClient.removeChannel).toHaveBeenCalled();
	});
});
