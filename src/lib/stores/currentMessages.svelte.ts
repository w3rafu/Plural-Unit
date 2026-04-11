import type { MessageThread } from '$lib/models/messageModel';
import * as messageRepository from '$lib/repositories/messageRepository';

export type MessageRepository = {
	fetchOwnMessageThreads: typeof messageRepository.fetchOwnMessageThreads;
	ensureDemoMessageThread: typeof messageRepository.ensureDemoMessageThread;
	ensureMessageThreadForProfile: typeof messageRepository.ensureMessageThreadForProfile;
	resetDemoMessageThread: typeof messageRepository.resetDemoMessageThread;
	sendMessageToThread: typeof messageRepository.sendMessageToThread;
	uploadMessageImage: typeof messageRepository.uploadMessageImage;
	sendImageMessageToThread: typeof messageRepository.sendImageMessageToThread;
	markMessageThreadRead: typeof messageRepository.markMessageThreadRead;
};

const defaultMessageRepository: MessageRepository = {
	fetchOwnMessageThreads: messageRepository.fetchOwnMessageThreads,
	ensureDemoMessageThread: messageRepository.ensureDemoMessageThread,
	ensureMessageThreadForProfile: messageRepository.ensureMessageThreadForProfile,
	resetDemoMessageThread: messageRepository.resetDemoMessageThread,
	sendMessageToThread: messageRepository.sendMessageToThread,
	uploadMessageImage: messageRepository.uploadMessageImage,
	sendImageMessageToThread: messageRepository.sendImageMessageToThread,
	markMessageThreadRead: messageRepository.markMessageThreadRead
};

class CurrentMessages {
	private static readonly POLL_INTERVAL_MS = 15_000;

	isReady = $state(false);
	isLoading = $state(false);
	isSending = $state(false);
	isResetting = $state(false);
	error = $state('');
	lastSentAt = $state(0);
	recentIncomingThreadId = $state('');
	recentIncomingAt = $state(0);
	activeThreadId = $state('');
	threads = $state<MessageThread[]>([]);

	private ownerId = '';
	private refreshRequestId = 0;
	private pollTimer: ReturnType<typeof setInterval> | null = null;

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

		this.ownerId = ownerId;
		this.isReady = false;
		this.error = '';
		this.threads = [];
		this.activeThreadId = '';

		try {
			await this.refresh({ ensureDemoThread: true });
		} finally {
			this.isReady = true;
			this.startPolling();
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

		const thread = this.activeThread;
		if (thread && thread.unreadCount > 0) {
			try {
				await this.repository.markMessageThreadRead(threadId);
				await this.refresh();
			} catch {
				// Silently fail — unread badge will clear on next poll
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
			await this.repository.sendMessageToThread(this.activeThreadId, body);
			this.lastSentAt = Date.now();
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
			await this.refresh();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not send image.';
		} finally {
			this.isSending = false;
		}
	}

	reset() {
		this.stopPolling();
		this.ownerId = '';
		this.refreshRequestId = 0;
		this.isReady = false;
		this.isLoading = false;
		this.isSending = false;
		this.isResetting = false;
		this.error = '';
		this.lastSentAt = 0;
		this.recentIncomingThreadId = '';
		this.recentIncomingAt = 0;
		this.activeThreadId = '';
		this.threads = [];
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
