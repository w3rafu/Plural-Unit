<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { MessageEntry, MessageThread } from '$lib/models/messageModel';
	import { sortThreadsByRecent } from '$lib/models/messageModel';
	import MessageWorkspace from './MessageWorkspace.svelte';

	let { getInitialThreads }: { getInitialThreads: () => MessageThread[] } = $props();
	const seedThreads = () => getInitialThreads();
	const initialThreads = seedThreads();
	let demoThreads = $state<MessageThread[]>(initialThreads);
	let activeThreadId = $state(initialThreads[0]?.id ?? '');
	let demoObjectUrls = $state<string[]>([]);

	const activeThread = $derived(
		demoThreads.find((thread) => thread.id === activeThreadId) ?? null
	);

	onDestroy(() => {
		for (const objectUrl of demoObjectUrls) {
			URL.revokeObjectURL(objectUrl);
		}
	});

	function selectThread(threadId: string) {
		activeThreadId = threadId;
		const lastReadAt = new Date().toISOString();
		demoThreads = demoThreads.map((thread) =>
			thread.id === threadId ? { ...thread, unreadCount: 0, lastReadAt } : thread
		);
	}

	function appendMessage(nextMessage: MessageEntry) {
		demoThreads = sortThreadsByRecent(
			demoThreads.map((thread) =>
				thread.id === nextMessage.threadId
					? {
							...thread,
							messages: [...thread.messages, nextMessage],
							unreadCount: 0,
							lastReadAt: nextMessage.sentAt
						}
					: thread
			)
		);
		activeThreadId = nextMessage.threadId;
	}

	function sendMessage(body: string) {
		if (!activeThread) {
			return;
		}

		const sentAt = new Date().toISOString();
		appendMessage({
			id: `demo-message-${crypto.randomUUID()}`,
			threadId: activeThread.id,
			senderId: 'demo-owner',
			senderKind: 'owner',
			kind: 'text',
			body,
			imageUrl: '',
			sentAt
		});
	}

	function sendImage(file: File) {
		if (!activeThread) {
			return;
		}

		const imageUrl = URL.createObjectURL(file);
		demoObjectUrls = [...demoObjectUrls, imageUrl];
		const sentAt = new Date().toISOString();

		appendMessage({
			id: `demo-image-${crypto.randomUUID()}`,
			threadId: activeThread.id,
			senderId: 'demo-owner',
			senderKind: 'owner',
			kind: 'image',
			body: file.name,
			imageUrl,
			sentAt
		});
	}
</script>

<MessageWorkspace
	threads={demoThreads}
	{activeThreadId}
	{activeThread}
	onSelectThread={selectThread}
	onSendMessage={sendMessage}
	onSendImage={sendImage}
	onBack={() => (activeThreadId = '')}
/>