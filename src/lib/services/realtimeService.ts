/**
 * realtimeService — thin wrapper around Supabase Realtime channels for
 * message-level live updates and per-thread typing presence.
 *
 * Provides:
 *  - subscribeToMessages(userId, onEvent) — listens for INSERT on messages
 *  - subscribeToThreadPresence(threadId, userId, callbacks) — typing presence per thread
 *  - unsubscribeAll() — tears down every active channel
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type MessageRealtimeEvent = {
	type: 'INSERT';
	threadId: string;
};

export type PresenceCallbacks = {
	onTypingChange: (typing: boolean) => void;
};

const TYPING_DEBOUNCE_MS = 2_000;

let messageChannel: RealtimeChannel | null = null;
let presenceChannels = new Map<string, RealtimeChannel>();
let typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Subscribe to new messages for the given user's threads.
 * Calls `onEvent` on each INSERT so the store can refresh.
 * Returns a cleanup function.
 */
export function subscribeToMessages(
	userId: string,
	onEvent: (event: MessageRealtimeEvent) => void
): () => void {
	unsubscribeMessages();

	const supabase = getSupabaseClient();

	messageChannel = supabase
		.channel(`messages:${userId}`)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'messages'
			},
			(payload) => {
				const threadId = (payload.new as Record<string, unknown>)?.thread_id as string;
				if (threadId) {
					onEvent({ type: 'INSERT', threadId });
				}
			}
		)
		.subscribe();

	return () => unsubscribeMessages();
}

/**
 * Subscribe to typing presence on a specific thread channel.
 * The remote user's typing state changes are reported via `callbacks.onTypingChange`.
 */
export function subscribeToThreadPresence(
	threadId: string,
	userId: string,
	callbacks: PresenceCallbacks
): () => void {
	unsubscribeThreadPresence(threadId);

	const supabase = getSupabaseClient();
	const channel = supabase.channel(`thread:${threadId}`, {
		config: { presence: { key: userId } }
	});

	channel
		.on('presence', { event: 'sync' }, () => {
			const state = channel.presenceState();
			let remoteTyping = false;

			for (const key of Object.keys(state)) {
				if (key === userId) continue;
				const entries = state[key] as Array<{ typing?: boolean }>;
				if (entries?.some((e) => e.typing)) {
					remoteTyping = true;
					break;
				}
			}

			callbacks.onTypingChange(remoteTyping);
		})
		.subscribe();

	presenceChannels.set(threadId, channel);

	return () => unsubscribeThreadPresence(threadId);
}

/**
 * Broadcast that the current user is typing on the given thread.
 * Automatically clears after TYPING_DEBOUNCE_MS of inactivity.
 */
export function broadcastTyping(threadId: string): void {
	const channel = presenceChannels.get(threadId);
	if (!channel) return;

	channel.track({ typing: true });

	const existing = typingTimers.get(threadId);
	if (existing) clearTimeout(existing);

	typingTimers.set(
		threadId,
		setTimeout(() => {
			channel.track({ typing: false });
			typingTimers.delete(threadId);
		}, TYPING_DEBOUNCE_MS)
	);
}

/**
 * Explicitly clear typing state (e.g. after sending a message).
 */
export function clearTyping(threadId: string): void {
	const channel = presenceChannels.get(threadId);
	if (!channel) return;

	const timer = typingTimers.get(threadId);
	if (timer) {
		clearTimeout(timer);
		typingTimers.delete(threadId);
	}

	channel.track({ typing: false });
}

function unsubscribeMessages(): void {
	if (messageChannel) {
		const supabase = getSupabaseClient();
		supabase.removeChannel(messageChannel);
		messageChannel = null;
	}
}

function unsubscribeThreadPresence(threadId: string): void {
	const channel = presenceChannels.get(threadId);
	if (channel) {
		const supabase = getSupabaseClient();
		supabase.removeChannel(channel);
		presenceChannels.delete(threadId);
	}

	const timer = typingTimers.get(threadId);
	if (timer) {
		clearTimeout(timer);
		typingTimers.delete(threadId);
	}
}

/**
 * Tear down all Realtime channels and timers.
 */
export function unsubscribeAll(): void {
	unsubscribeMessages();

	for (const threadId of presenceChannels.keys()) {
		unsubscribeThreadPresence(threadId);
	}

	presenceChannels.clear();
	typingTimers.clear();
}
