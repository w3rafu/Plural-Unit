<script lang="ts">
	import { MessageSquare } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import type { MessageThread } from '$lib/models/messageModel';
	import InboxPane from './InboxPane.svelte';
	import ThreadPane from './ThreadPane.svelte';

	let {
		threads,
		activeThreadId = '',
		activeThread,
		isSending = false,
		isResetting = false,
		isArchiving = false,
		isMuting = false,
		isLoadingOlderMessages = false,
		deletingMessageId = '',
		contactTyping = false,
		onSelectThread,
		onSendMessage,
		onSendImage,
		onArchiveThread,
		onUnarchiveThread,
		onMuteThread,
		onUnmuteThread,
		onDeleteMessage,
		onTyping,
		onBack,
		onResetDemo,
		onLoadOlderMessages,
		onCompose
	}: {
		threads: MessageThread[];
		activeThreadId?: string;
		activeThread: MessageThread | null;
		isSending?: boolean;
		isResetting?: boolean;
		isArchiving?: boolean;
		isMuting?: boolean;
		isLoadingOlderMessages?: boolean;
		deletingMessageId?: string;
		contactTyping?: boolean;
		onSelectThread: (threadId: string) => void;
		onSendMessage: (body: string) => void;
		onSendImage: (file: File) => void;
		onArchiveThread?: () => void;
		onUnarchiveThread?: () => void;
		onMuteThread?: () => void;
		onUnmuteThread?: () => void;
		onDeleteMessage?: (messageId: string) => void;
		onTyping?: () => void;
		onBack: () => void;
		onResetDemo?: () => void;
		onLoadOlderMessages?: () => void;
		onCompose?: () => void;
	} = $props();

	const showThread = $derived(!!activeThread);
</script>

<div class="hidden min-h-0 flex-1 md:grid md:grid-cols-[340px_1fr] md:gap-2">
	<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		<InboxPane {threads} {activeThreadId} {onSelectThread} {onCompose} />
	</Card.Root>

	<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		{#if activeThread}
			<ThreadPane
				thread={activeThread}
				{isSending}
				{isResetting}
				{isArchiving}
				{isMuting}
				{isLoadingOlderMessages}
				{deletingMessageId}
				{contactTyping}
				{onSendMessage}
				{onSendImage}
				{onArchiveThread}
				{onUnarchiveThread}
				{onMuteThread}
				{onUnmuteThread}
				{onDeleteMessage}
				{onTyping}
				{onResetDemo}
				{onLoadOlderMessages}
			/>
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
	{#if showThread && activeThread}
		<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
			<ThreadPane
				thread={activeThread}
				{isSending}
				{isResetting}
				{isArchiving}
				{isMuting}
				{isLoadingOlderMessages}
				{deletingMessageId}
				{contactTyping}
				{onSendMessage}
				{onSendImage}
				{onArchiveThread}
				{onUnarchiveThread}
				{onMuteThread}
				{onUnmuteThread}
				{onDeleteMessage}
				{onTyping}
				{onBack}
				{onResetDemo}
				{onLoadOlderMessages}
			/>
		</Card.Root>
	{:else}
		<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
			<InboxPane {threads} {activeThreadId} {onSelectThread} {onCompose} />
		</Card.Root>
	{/if}
</div>