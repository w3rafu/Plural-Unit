<!--
  ThreadPane — full conversation view for the active thread.
  Shows day-grouped messages, message bubbles, and the composer.
-->
<script lang="ts">
	import type { MessageThread } from '$lib/models/messageModel';
	import { getParticipantInitials } from '$lib/models/messageModel';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { groupMessagesByDay, formatMessageTime } from './messageUi';
	import MessageComposer from './MessageComposer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, RotateCcw, Trash2 } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		thread,
		isSending = false,
		isResetting = false,
		isLoadingOlderMessages = false,
		deletingMessageId = '',
		contactTyping = false,
		onSendMessage,
		onSendImage,
		onDeleteMessage,
		onTyping,
		onBack,
		onResetDemo,
		onLoadOlderMessages
	}: {
		thread: MessageThread;
		isSending?: boolean;
		isResetting?: boolean;
		isLoadingOlderMessages?: boolean;
		deletingMessageId?: string;
		contactTyping?: boolean;
		onSendMessage: (body: string) => void;
		onSendImage: (file: File) => void;
		onDeleteMessage?: (messageId: string) => void;
		onTyping?: () => void;
		onBack?: () => void;
		onResetDemo?: () => void;
		onLoadOlderMessages?: () => void;
	} = $props();

	const dayGroups = $derived(groupMessagesByDay(thread.messages));
	const initials = $derived(getParticipantInitials(thread.participant.name));

	const lastSeenMessageId = $derived.by(() => {
		if (!thread.contactLastReadAt) return null;
		let lastId: string | null = null;
		for (const message of thread.messages) {
			if (message.senderKind === 'owner' && message.sentAt <= thread.contactLastReadAt) {
				lastId = message.id;
			}
		}
		return lastId;
	});

	function keepScrolledToBottom(_trigger: string) {
		return (node: HTMLElement) => {
			const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
			if (isNearBottom || node.scrollTop === 0) {
				node.scrollTop = node.scrollHeight;
			}
		};
	}

	function handleScrollTop(node: HTMLElement) {
		function onScroll() {
			if (node.scrollTop < 40 && thread.hasMoreMessages && !isLoadingOlderMessages && onLoadOlderMessages) {
				onLoadOlderMessages();
			}
		}
		node.addEventListener('scroll', onScroll, { passive: true });
		return {
			destroy() {
				node.removeEventListener('scroll', onScroll);
			}
		};
	}
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="border-b border-border/70 bg-muted/10 px-3 py-3 sm:px-4">
		<div class="flex items-start gap-3">
		{#if onBack}
			<Button variant="ghost" size="icon" class="shrink-0 md:hidden" onclick={onBack} aria-label="Back to inbox">
				<ArrowLeft class="h-4 w-4" />
			</Button>
		{/if}

		<Avatar.Root class="size-10 border border-border/70 bg-muted/50 shadow-sm after:hidden">
			{#if thread.participant.avatar_url}
				<Avatar.Image src={thread.participant.avatar_url} alt={thread.participant.name} />
			{:else}
				<Avatar.Fallback class="text-sm font-medium text-muted-foreground">{initials}</Avatar.Fallback>
			{/if}
		</Avatar.Root>

		<div class="min-w-0 flex-1 space-y-2">
			<div class="space-y-1">
				<p class="truncate text-sm font-semibold text-foreground">{thread.participant.name}</p>
				<p class="truncate text-xs text-muted-foreground">
					{thread.participant.subtitle || 'Direct conversation'}
				</p>
			</div>

			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary" class="rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
					{thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'}
				</Badge>

				{#if thread.unreadCount > 0}
					<Badge variant="default" class="rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
						{thread.unreadCount} unread
					</Badge>
				{/if}

				{#if thread.participant.isFakeUser}
					<Badge variant="outline" class="rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
						Demo conversation
					</Badge>
				{/if}
			</div>
		</div>

		{#if thread.participant.isFakeUser && onResetDemo}
			<Button
				variant="outline"
				size="sm"
				class="shrink-0"
				disabled={isResetting}
				onclick={onResetDemo}
				aria-label="Reset demo conversation"
			>
				<RotateCcw class="mr-1.5 h-3.5 w-3.5" />
				Reset
			</Button>
		{/if}
		</div>
	</div>

	<div
		class="min-h-0 flex-1 overflow-y-auto bg-muted/[0.12] px-3 py-3 sm:px-4"
		{@attach keepScrolledToBottom(`${thread.id}:${thread.messages.length}`)}
		{@attach handleScrollTop}
	>
		{#if isLoadingOlderMessages}
			<div class="mb-3 flex justify-center">
				<span class="text-xs text-muted-foreground animate-pulse">Loading older messages…</span>
			</div>
		{:else if thread.hasMoreMessages}
			<div class="mb-3 flex justify-center">
				<button
					type="button"
					class="text-xs text-muted-foreground hover:text-foreground transition-colors"
					onclick={() => onLoadOlderMessages?.()}
				>
					Load older messages
				</button>
			</div>
		{/if}
		{#each dayGroups as group (group.dateKey)}
			<div class="my-3 flex items-center gap-3">
				<div class="h-px flex-1 bg-border/50"></div>
				<span class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
					{group.label}
				</span>
				<div class="h-px flex-1 bg-border/50"></div>
			</div>

			{#each group.messages as message (message.id)}
				<div
					class={cn(
						'mb-2 flex',
						message.senderKind === 'owner' ? 'justify-end' : 'justify-start'
					)}
				>
					<div class="max-w-[82%]">
						{#if message.senderKind === 'owner' && !message.isDeleted && onDeleteMessage}
							<div class="mb-1 flex justify-end">
								<Button
									type="button"
									variant="ghost"
									size="xs"
									class="h-auto px-2 py-1 text-[0.65rem] text-muted-foreground"
									disabled={deletingMessageId === message.id}
									onclick={() => onDeleteMessage(message.id)}
								>
									<Trash2 class="mr-1 h-3.5 w-3.5" />
									{deletingMessageId === message.id ? 'Deleting...' : 'Delete'}
								</Button>
							</div>
						{/if}

						<div
							class={cn(
								'rounded-2xl border px-3 py-2.5 shadow-sm',
								message.isDeleted
									? 'border-border/70 bg-muted/30 text-muted-foreground'
									: message.senderKind === 'owner'
										? 'border-primary/80 bg-primary text-primary-foreground'
										: 'border-border/70 bg-background text-foreground'
							)}
						>
							{#if message.isDeleted}
								<p class="text-sm italic whitespace-pre-wrap wrap-break-word">{message.body}</p>
							{:else if message.kind === 'image' && message.imageUrl}
								<div class="space-y-2">
									<img
										src={message.imageUrl}
										alt={message.body.trim() || 'Shared photo'}
										class="max-h-60 rounded-xl object-contain"
										loading="lazy"
									/>
									{#if message.body.trim()}
										<p class="text-sm whitespace-pre-wrap wrap-break-word">{message.body}</p>
									{/if}
								</div>
							{:else}
								<p class="text-sm whitespace-pre-wrap wrap-break-word">{message.body}</p>
							{/if}
							<p
								class={cn(
									'mt-0.5 text-right text-[0.65rem]',
									message.isDeleted
										? 'text-muted-foreground'
										: message.senderKind === 'owner'
											? 'text-primary-foreground/70'
											: 'text-muted-foreground'
								)}
							>
								{formatMessageTime(message.sentAt)}
							</p>
						</div>
					</div>
				</div>
				{#if message.id === lastSeenMessageId}
					<p class="mb-2 text-right text-[0.65rem] text-muted-foreground">Seen</p>
				{/if}
			{/each}
		{/each}

		{#if thread.messages.length === 0}
			<div class="flex min-h-full items-center justify-center px-4 py-10">
				<div class="rounded-3xl border border-dashed border-border/70 bg-background px-6 py-8 text-center shadow-sm">
					<p class="font-medium text-foreground">Start the conversation</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Send the first message to turn this thread into an active exchange.
					</p>
				</div>
			</div>
		{/if}
	</div>

	{#if contactTyping}
		<div class="px-3 py-1 sm:px-4">
			<p class="text-xs text-muted-foreground animate-pulse">{thread.participant.name} is typing…</p>
		</div>
	{/if}

	<MessageComposer {isSending} {onSendMessage} {onSendImage} {onTyping} />
</div>
