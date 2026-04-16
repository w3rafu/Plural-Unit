import type { MessageThread, MessageEntry } from '$lib/models/messageModel';
import { MESSAGE_PAGE_SIZE, normalizeMessageBody, normalizeMessageImageUrl } from '$lib/models/messageModel';
import * as messageRepository from '$lib/repositories/messageRepository';
import {
	subscribeToMessages,
	subscribeToThreadPresence,
	broadcastTyping,
	clearTyping,
	unsubscribeAll
} from '$lib/services/realtimeService';
import { triggerPushNotification } from '$lib/services/pushNotification';
import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
import { buildSmokeMessages } from '$lib/demo/smokeFixtures';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';

export type MessageRepository = {
	fetchOwnMessageThreads: typeof messageRepository.fetchOwnMessageThreads;
	ensureDemoMessageThread: typeof messageRepository.ensureDemoMessageThread;
	ensureMessageThreadForProfile: typeof messageRepository.ensureMessageThreadForProfile;
	resetDemoMessageThread: typeof messageRepository.resetDemoMessageThread;
	sendMessageToThread: typeof messageRepository.sendMessageToThread;
	uploadMessageImage: typeof messageRepository.uploadMessageImage;
	sendImageMessageToThread: typeof messageRepository.sendImageMessageToThread;
	markMessageThreadRead: typeof messageRepository.markMessageThreadRead;
	fetchOlderMessages: typeof messageRepository.fetchOlderMessages;
};

const defaultMessageRepository: MessageRepository = {
	fetchOwnMessageThreads: messageRepository.fetchOwnMessageThreads,
	ensureDemoMessageThread: messageRepository.ensureDemoMessageThread,
	ensureMessageThreadForProfile: messageRepository.ensureMessageThreadForProfile,
	resetDemoMessageThread: messageRepository.resetDemoMessageThread,
	sendMessageToThread: messageRepository.sendMessageToThread,
	uploadMessageImage: messageRepository.uploadMessageImage,
	sendImageMessageToThread: messageRepository.sendImageMessageToThread,
	markMessageThreadRead: messageRepository.markMessageThreadRead,
	fetchOlderMessages: messageRepository.fetchOlderMessages
};

class CurrentMessages {
	private static readonly POLL_INTERVAL_MS = 15_000;
	private static readonly REALTIME_REFRESH_DEBOUNCE_MS = 300;

	isReady = $state(false);
	isLoading = $state(false);
	isLoadingOlderMessages = $state(false);
	isSending = $state(false);
	isResetting = $state(false);
	error = $state('');
	lastSentAt = $state(0);
	recentIncomingThreadId = $state('');
	recentIncomingAt = $state(0);
	activeThreadId = $state('');
	threads = $state<MessageThread[]>([]);
	contactTyping = $state(false);

	private ownerId = '';
	private refreshRequestId = 0;
	private pollTimer: ReturnType<typeof setInterval> | null = null;
	private unsubscribeMessages: (() => void) | null = null;
	private unsubscribePresence: (() => void) | null = null;
	private realtimeRefreshTimer: ReturnType<typeof setTimeout> | null = null;
	private useRealtimeFallback = false;

	constructor(private readonly repository: MessageRepository = defaultMessageRepository) {}

	get sortedThreads() {
		return this.threads;
	}

	get activeThread() {
		return this.threads.find((thread) => thread.id === this.activeThreadId) ?? null;
	}

	getThreadForProfile(profileId: string) {
		return this.threads.find((thread) => thread.participant.profileId === profileId) ?? null;
	}

	getThreadIdForProfile(profileId: string) {
		return this.getThreadForProfile(profileId)?.id ?? null;
	}

	get totalUnreadCount() {
		return this.threads.reduce((total, thread) => total + thread.unreadCount, 0);
	}

	async loadForUser(ownerId: string) {
		if (!ownerId) return;

		if (isSmokeModeEnabled()) {
			this.ownerId = ownerId;
			this.isReady = true;
			this.isLoading = false;
			this.error = '';
			this.threads = buildSmokeMessages();
			this.activeThreadId = this.threads[0]?.id ?? '';
			return;
		}

		this.ownerId = ownerId;
		this.isReady = false;
		this.error = '';
		this.threads = [];
		this.activeThreadId = '';

		try {
			await this.refresh({ ensureDemoThread: true });
		} finally {
			this.isReady = true;
			this.startRealtimeOrPolling();
		}
	}

	async refresh(options?: { ensureDemoThread?: boolean }) {
		if (!this.ownerId) return;

		const requestId = ++this.refreshRequestId;
		this.isLoading = true;
		this.error = '';

		try {
			if (options?.ensureDemoThread) {
				await this.repository.ensureDemoMessageThread();
			}

			const previousThreads = this.threads;
			const nextThreads = await this.repository.fetchOwnMessageThreads(this.ownerId);

			if (requestId !== this.refreshRequestId) return;

			this.trackIncomingReplies(previousThreads, nextThreads);
			this.threads = nextThreads;
		} catch (err) {
			if (requestId !== this.refreshRequestId) return;
			this.error = err instanceof Error ? err.message : 'Could not load messages.';
		} finally {
			if (requestId === this.refreshRequestId) {
				this.isLoading = false;
			}
		}
	}

	async selectThread(threadId: string) {
		this.activeThreadId = threadId;
		this.contactTyping = false;
		this.subscribeToActiveThreadPresence();

		const thread = this.activeThread;
		if (thread && thread.unreadCount > 0) {
			try {
				await this.repository.markMessageThreadRead(threadId);
				await this.refresh();
			} catch {
				// Silently fail — unread badge will clear on next refresh
			}
		}
	}

	async startThreadForProfile(profileId: string) {
		const existingThreadId = this.getThreadIdForProfile(profileId);
		if (existingThreadId) {
			await this.selectThread(existingThreadId);
			return existingThreadId;
		}

		const threadId = await this.repository.ensureMessageThreadForProfile(profileId);
		await this.refresh();
		await this.selectThread(threadId);
		return threadId;
	}

	async openConversationForProfile(profileId: string, ownerId = this.ownerId) {
		if (!ownerId) {
			throw new Error('No user context for opening a conversation.');
		}

		if (!this.isReady) {
			await this.loadForUser(ownerId);
		}

		return this.startThreadForProfile(profileId);
	}

	async resetDemoThread() {
		this.isResetting = true;
		this.error = '';

		try {
			await this.repository.resetDemoMessageThread();
			await this.refresh();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not reset demo thread.';
		} finally {
			this.isResetting = false;
		}
	}

	async sendMessage(body: string) {
		if (!this.activeThreadId) return;

		this.isSending = true;
		this.error = '';

		try {
			this.notifyStoppedTyping();
			await this.repository.sendMessageToThread(this.activeThreadId, body);
			this.lastSentAt = Date.now();
			this.firePushForActiveThread(body);
			await this.refresh();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not send message.';
		} finally {
			this.isSending = false;
		}
	}

	async sendImage(file: File) {
		if (!this.activeThreadId || !this.ownerId) return;

		this.isSending = true;
		this.error = '';

		try {
			const imageUrl = await this.repository.uploadMessageImage(
				this.ownerId,
				this.activeThreadId,
				file
			);
			await this.repository.sendImageMessageToThread(this.activeThreadId, imageUrl);
			this.lastSentAt = Date.now();
			this.firePushForActiveThread('Sent an image');
			await this.refresh();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not send image.';
		} finally {
			this.isSending = false;
		}
	}

	async loadOlderMessages() {
		const thread = this.activeThread;
		if (!thread || !thread.hasMoreMessages || this.isLoadingOlderMessages) return;

		const oldestMessage = thread.messages[0];
		if (!oldestMessage) return;

		this.isLoadingOlderMessages = true;

		try {
			const olderRows = await this.repository.fetchOlderMessages(
				thread.id,
				oldestMessage.sentAt
			);

			const olderEntries: MessageEntry[] = olderRows
				.map((row) => {
					const body = normalizeMessageBody(row.body);
					const imageUrl = normalizeMessageImageUrl(row.image_url);
					const kind = row.message_kind === 'image' ? 'image' as const : 'text' as const;
					const isValid = kind === 'text' ? Boolean(body) : Boolean(imageUrl);
					if (!isValid) return null;

					return {
						id: row.id,
						threadId: row.thread_id,
						senderId:
							row.sender_kind === 'owner'
								? this.ownerId
								: thread.participant.id,
						senderKind: row.sender_kind,
						kind,
						body,
						imageUrl: imageUrl,
						sentAt: row.sent_at
					} satisfies MessageEntry;
				})
				.filter((entry): entry is MessageEntry => entry !== null)
				.sort((a, b) => a.sentAt.localeCompare(b.sentAt));

			const hasMore = olderRows.length >= MESSAGE_PAGE_SIZE;

			this.threads = this.threads.map((t) =>
				t.id === thread.id
					? { ...t, messages: [...olderEntries, ...t.messages], hasMoreMessages: hasMore }
					: t
			);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not load older messages.';
		} finally {
			this.isLoadingOlderMessages = false;
		}
	}

	reset() {
		this.teardownChannels();
		this.stopPolling();
		this.ownerId = '';
		this.refreshRequestId = 0;
		this.isReady = false;
		this.isLoading = false;
		this.isLoadingOlderMessages = false;
		this.isSending = false;
		this.isResetting = false;
		this.error = '';
		this.lastSentAt = 0;
		this.recentIncomingThreadId = '';
		this.recentIncomingAt = 0;
		this.activeThreadId = '';
		this.threads = [];
		this.contactTyping = false;
		this.useRealtimeFallback = false;
	}

	private firePushForActiveThread(body: string) {
		const thread = this.activeThread;
		if (!thread || thread.participant.isFakeUser || !thread.participant.profileId) return;

		const orgId = currentOrganization.organization?.id;
		if (!orgId) return;

		void triggerPushNotification({
			kind: 'message',
			organization_id: orgId,
			source_id: thread.id,
			title: 'New message',
			body: body.slice(0, 200),
			url: `/messages?thread=${thread.id}`,
			target_profile_id: thread.participant.profileId
		});
	}

	/**
	 * Notify the store that the user is actively composing a message.
	 * Called by the composer on each keystroke.
	 */
	notifyTyping() {
		if (!this.activeThreadId || isSmokeModeEnabled()) return;
		broadcastTyping(this.activeThreadId);
	}

	/**
	 * Explicitly clear typing indicator (e.g. after send).
	 */
	notifyStoppedTyping() {
		if (!this.activeThreadId || isSmokeModeEnabled()) return;
		clearTyping(this.activeThreadId);
	}

	private startRealtimeOrPolling() {
		if (isSmokeModeEnabled()) return;

		try {
			this.unsubscribeMessages = subscribeToMessages(this.ownerId, () => {
				this.debouncedRealtimeRefresh();
			});
		} catch {
			// Realtime unavailable — fall back to polling
			this.useRealtimeFallback = true;
		}

		if (this.useRealtimeFallback) {
			this.startPolling();
		}
	}

	private debouncedRealtimeRefresh() {
		if (this.realtimeRefreshTimer) clearTimeout(this.realtimeRefreshTimer);
		this.realtimeRefreshTimer = setTimeout(() => {
			this.realtimeRefreshTimer = null;
			void this.refresh();
		}, CurrentMessages.REALTIME_REFRESH_DEBOUNCE_MS);
	}

	private subscribeToActiveThreadPresence() {
		if (this.unsubscribePresence) {
			this.unsubscribePresence();
			this.unsubscribePresence = null;
		}

		if (!this.activeThreadId || !this.ownerId || isSmokeModeEnabled()) return;

		try {
			this.unsubscribePresence = subscribeToThreadPresence(
				this.activeThreadId,
				this.ownerId,
				{
					onTypingChange: (typing) => {
						this.contactTyping = typing;
					}
				}
			);
		} catch {
			// Presence unavailable — typing indicators won't show
		}
	}

	private teardownChannels() {
		if (this.realtimeRefreshTimer) {
			clearTimeout(this.realtimeRefreshTimer);
			this.realtimeRefreshTimer = null;
		}

		if (this.unsubscribePresence) {
			this.unsubscribePresence();
			this.unsubscribePresence = null;
		}

		if (this.unsubscribeMessages) {
			this.unsubscribeMessages();
			this.unsubscribeMessages = null;
		}

		unsubscribeAll();
	}

	private startPolling() {
		this.stopPolling();
		this.pollTimer = setInterval(() => {
			void this.refresh();
		}, CurrentMessages.POLL_INTERVAL_MS);
	}

	private stopPolling() {
		if (this.pollTimer !== null) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
	}

	private trackIncomingReplies(previousThreads: MessageThread[], nextThreads: MessageThread[]) {
		for (const next of nextThreads) {
			if (next.id === this.activeThreadId) continue;

			const previous = previousThreads.find((thread) => thread.id === next.id);
			if (!previous) continue;

			if (next.unreadCount > previous.unreadCount) {
				this.recentIncomingThreadId = next.id;
				this.recentIncomingAt = Date.now();
			}
		}
	}
}

function createCurrentMessagesStore(repository?: MessageRepository) {
	return new CurrentMessages(repository);
}

export const currentMessages = createCurrentMessagesStore();
export { createCurrentMessagesStore, CurrentMessages };
