<script lang="ts">
	import { onDestroy } from 'svelte';
	import { MessageSquare } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import type { MessageEntry, MessageThread } from '$lib/models/messageModel';
	import { sortThreadsByRecent } from '$lib/models/messageModel';
	import InboxPane from './InboxPane.svelte';
	import ThreadPane from './ThreadPane.svelte';

	let { getInitialThreads }: { getInitialThreads: () => MessageThread[] } = $props();
	const seedThreads = () => getInitialThreads();
	let demoThreads = $state<MessageThread[]>(seedThreads());
	let activeThreadId = $state(seedThreads()[0]?.id ?? '');
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

<div class="hidden min-h-0 flex-1 md:grid md:grid-cols-[340px_1fr] md:gap-2">
	<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		<InboxPane threads={demoThreads} {activeThreadId} onSelectThread={selectThread} />
	</Card.Root>

	<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		{#if activeThread}
			<ThreadPane thread={activeThread} onSendMessage={sendMessage} onSendImage={sendImage} />
		{:else}
			<div class="flex h-full items-center justify-center bg-muted/12 p-6">
				<div class="max-w-sm rounded-3xl border border-dashed border-border/70 bg-background px-6 py-8 text-center shadow-sm">
					<div class="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
						<MessageSquare class="size-5 text-muted-foreground" />
					</div>
					<p class="mt-4 font-medium text-foreground">Select a conversation</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Choose a thread from the inbox to review history and send a reply.
					</p>
				</div>
			</div>
		{/if}
	</Card.Root>
</div>

<div class="min-h-0 flex-1 md:hidden">
	{#if activeThread}
		<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
			<ThreadPane thread={activeThread} onSendMessage={sendMessage} onSendImage={sendImage} onBack={() => (activeThreadId = '')} />
		</Card.Root>
	{:else}
		<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
			<InboxPane threads={demoThreads} {activeThreadId} onSelectThread={selectThread} />
		</Card.Root>
	{/if}
</div>