<!--
  ThreadPane — full conversation view for the active thread.
  Shows day-grouped messages, message bubbles, and the composer.
-->
<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { MessageThread } from '$lib/models/messageModel';
	import {
		getParticipantInitials,
		getThreadLastMessageSentAt,
		isThreadArchived,
		isThreadMuted
	} from '$lib/models/messageModel';
	import * as Avatar from '$lib/components/ui/avatar';
	import { formatThreadTimestamp, groupMessagesByDay, formatMessageTime } from './messageUi';
	import MessageComposer from './MessageComposer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Archive, ArrowLeft, Bell, BellOff, RotateCcw, Trash2, Undo2 } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		thread,
		isSending = false,
		isResetting = false,
		isArchiving = false,
		isMuting = false,
		isLoadingOlderMessages = false,
		deletingMessageId = '',
		contactTyping = false,
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
		onLoadOlderMessages
	}: {
		thread: MessageThread;
		isSending?: boolean;
		isResetting?: boolean;
		isArchiving?: boolean;
		isMuting?: boolean;
		isLoadingOlderMessages?: boolean;
		deletingMessageId?: string;
		contactTyping?: boolean;
		onSendMessage: (body: string) => void;
		onSendImage: (file: File) => void;
		onArchiveThread?: () => void;
		onUnarchiveThread?: () => void;
		onMuteThread?: () => void;
		onUnmuteThread?: () => void;
		onDeleteMessage?: (messageId: string) => void;
		onTyping?: () => void;
		onBack?: () => void;
		onResetDemo?: () => void;
		onLoadOlderMessages?: () => void;
	} = $props();

	const dayGroups = $derived(groupMessagesByDay(thread.messages));
	const initials = $derived(getParticipantInitials(thread.participant.name));
	const archived = $derived(isThreadArchived(thread));
	const muted = $derived(isThreadMuted(thread));
	const lastUpdatedLabel = $derived(formatThreadTimestamp(getThreadLastMessageSentAt(thread)) || 'now');
	const headerMeta = $derived(`Updated ${lastUpdatedLabel}`);
	const isSparseThread = $derived(thread.messages.length <= 4);
	const statusBadges = $derived.by(() => {
		const badges: Array<{ label: string; variant: 'warning' | 'muted' }> = [];

		if (thread.unreadCount > 0) {
			badges.push({ label: `${thread.unreadCount} unread`, variant: 'warning' });
		}

		if (archived) {
			badges.push({ label: 'Archived', variant: 'muted' });
		}

		if (muted) {
			badges.push({ label: 'Muted', variant: 'muted' });
		}

		if (thread.participant.isFakeUser) {
			badges.push({ label: 'Demo thread', variant: 'muted' });
		}

		return badges;
	});

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
	<div class="border-b border-border/70 bg-muted/10 px-2 py-1.25 sm:px-3.5 sm:py-1.5">
		<div class="flex items-start gap-2 sm:gap-2.5">
			{#if onBack}
				<Button
					variant="ghost"
					size="icon-sm"
					class="mt-0.5 h-7 w-7 shrink-0 rounded-xl md:hidden"
					onclick={onBack}
					aria-label="Back to inbox"
				>
					<ArrowLeft class="h-4 w-4" />
				</Button>
			{/if}

			<Avatar.Root class="size-7 border border-primary/15 bg-background shadow-sm after:hidden sm:size-9">
				{#if thread.participant.avatar_url}
					<Avatar.Image src={thread.participant.avatar_url} alt={thread.participant.name} />
				{:else}
					<Avatar.Fallback class="text-sm font-medium text-muted-foreground">{initials}</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="min-w-0 flex-1">
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 space-y-0.5">
						<p class="truncate text-[0.82rem] font-semibold leading-5 text-foreground sm:text-[0.88rem] lg:text-[1.02rem]">
							{thread.participant.name}
						</p>
						<p class="truncate text-[0.84rem] text-muted-foreground sm:text-[0.88rem] lg:text-[0.8rem]">
							{thread.participant.subtitle || 'Direct conversation'}
							<span class="mx-1.5 text-muted-foreground/60">·</span>
							{headerMeta}
						</p>
					</div>

					<div class="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5">
						{#if muted ? onUnmuteThread : onMuteThread}
							<Button
								variant="outline"
								size="sm"
								disabled={isMuting}
								onclick={() => {
									if (muted) {
										onUnmuteThread?.();
									} else {
										onMuteThread?.();
									}
								}}
								aria-label={muted ? 'Unmute conversation' : 'Mute conversation'}
								class="h-6.5 w-6.5 rounded-xl px-0 sm:h-7 sm:w-auto sm:rounded-full sm:px-2"
							>
								{#if muted}
									<Bell class="h-3.5 w-3.5 sm:mr-1.5" />
									<span class="hidden sm:inline">{isMuting ? 'Unmuting...' : 'Unmute'}</span>
								{:else}
									<BellOff class="h-3.5 w-3.5 sm:mr-1.5" />
									<span class="hidden sm:inline">{isMuting ? 'Muting...' : 'Mute'}</span>
								{/if}
							</Button>
						{/if}

						{#if archived ? onUnarchiveThread : onArchiveThread}
							<Button
								variant="outline"
								size="sm"
								disabled={isArchiving}
								onclick={() => {
									if (archived) {
										onUnarchiveThread?.();
									} else {
										onArchiveThread?.();
									}
								}}
								aria-label={archived ? 'Restore conversation' : 'Archive conversation'}
								class="h-6.5 w-6.5 rounded-xl px-0 sm:h-7 sm:w-auto sm:rounded-full sm:px-2"
							>
								{#if archived}
									<Undo2 class="h-3.5 w-3.5 sm:mr-1.5" />
									<span class="hidden sm:inline">{isArchiving ? 'Restoring...' : 'Restore'}</span>
								{:else}
									<Archive class="h-3.5 w-3.5 sm:mr-1.5" />
									<span class="hidden sm:inline">{isArchiving ? 'Archiving...' : 'Archive'}</span>
								{/if}
							</Button>
						{/if}

						{#if thread.participant.isFakeUser && onResetDemo}
							<Button
								variant="outline"
								size="sm"
								disabled={isResetting}
								onclick={onResetDemo}
								aria-label="Reset demo conversation"
								class="h-6.5 w-6.5 rounded-xl px-0 sm:h-7 sm:w-auto sm:rounded-full sm:px-2"
							>
								<RotateCcw class="h-3.5 w-3.5 sm:mr-1.5" />
								<span class="hidden sm:inline">Reset</span>
							</Button>
						{/if}
					</div>
				</div>

				{#if statusBadges.length > 0}
					<div class="mt-0.75 flex flex-wrap gap-1">
							{#each statusBadges as badge (badge.label)}
								<Badge variant={badge.variant} class="rounded-full px-2 py-0.5 text-[0.82rem] font-medium sm:text-[0.84rem]">
									{badge.label}
								</Badge>
							{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if archived || muted}
		<div class="border-b border-border/70 bg-background px-3 py-2 sm:px-4">
			{#if archived}
				<p class="text-[0.82rem] text-muted-foreground">
					Archived conversations stay out of inbox triage until you restore them or send a new reply.
				</p>
			{/if}
			{#if muted}
				<p class={cn('text-[0.82rem] text-muted-foreground', archived ? 'mt-1' : '')}>
					Push notifications are muted for this conversation, but in-app unread state and replies still update.
				</p>
			{/if}
		</div>
	{/if}

	<div
		class="min-h-0 flex-1 overflow-y-auto bg-muted/10 px-2 py-1 sm:px-3 sm:py-1.5"
		{@attach keepScrolledToBottom(`${thread.id}:${thread.messages.length}`)}
		{@attach handleScrollTop}
	>
		{#if thread.messages.length === 0}
			<div class="flex min-h-full items-center justify-center px-4 py-10">
				<div class="rounded-3xl border border-dashed border-border/70 bg-background px-6 py-8 text-center shadow-sm">
					<p class="font-medium text-foreground">Start the conversation</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Send the first message to turn this thread into an active exchange.
					</p>
				</div>
			</div>
		{:else}
			<div class={cn('flex min-h-full flex-col', isSparseThread ? 'justify-start' : 'justify-end')}>
				{#if isLoadingOlderMessages}
					<div class="mb-2.5 flex justify-center">
						<span class="text-[0.82rem] text-muted-foreground animate-pulse">Loading older messages…</span>
					</div>
				{:else if thread.hasMoreMessages}
					<div class="mb-2.5 flex justify-center">
						<button
							type="button"
							class="text-[0.82rem] text-muted-foreground transition-colors hover:text-foreground"
							onclick={() => onLoadOlderMessages?.()}
						>
							Load older messages
						</button>
					</div>
				{/if}

				{#if isSparseThread}
					<div class="mb-2 rounded-[1.05rem] border border-border/70 bg-background/88 px-3 py-2.5 shadow-sm sm:px-3.5">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Conversation context</p>
							<p class="text-[0.88rem] text-muted-foreground">{thread.participant.subtitle || 'Direct conversation'} · {headerMeta}</p>
						</div>
						<p class="mt-1 text-[0.88rem] leading-5 text-muted-foreground">
							{thread.unreadCount > 0
								? `${thread.unreadCount} unread ${thread.unreadCount === 1 ? 'message still needs' : 'messages still need'} review before the thread is fully caught up.`
								: 'The thread is quiet right now, so the latest updates stay visible near the composer.'}
						</p>
					</div>
				{/if}

				{#each dayGroups as group (group.dateKey)}
					<div class="my-1.5 flex items-center gap-2 lg:my-2">
						<div class="h-px flex-1 bg-border/50"></div>
						<span class="rounded-full border border-border/70 bg-background px-2.5 py-0.85 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:px-2.75 sm:py-1 sm:text-[0.88rem]">
							{group.label}
						</span>
						<div class="h-px flex-1 bg-border/50"></div>
					</div>

					{#each group.messages as message (message.id)}
						<div
							class={cn(
								'mb-1.25 flex',
								message.senderKind === 'owner' ? 'justify-end' : 'justify-start'
							)}
						>
							<div class="max-w-[84%] sm:max-w-[80%] xl:max-w-[72%]">
								{#if message.senderKind === 'owner' && !message.isDeleted && onDeleteMessage}
									<div class="mb-1 flex justify-end">
										<Button
											type="button"
											variant="ghost"
											size="xs"
											class="h-auto px-2 py-1 text-[0.75rem] text-muted-foreground"
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
										'rounded-[1.2rem] border px-3 py-2.25 shadow-sm sm:rounded-[1.35rem] sm:px-3.5 sm:py-2.5',
										message.isDeleted
											? 'border-border/70 bg-muted/30 text-muted-foreground'
											: message.senderKind === 'owner'
												? 'border-primary/80 bg-primary text-primary-foreground'
												: 'border-border/70 bg-background text-foreground'
									)}
								>
									{#if message.isDeleted}
										<p class="text-[0.82rem] italic leading-6 whitespace-pre-wrap wrap-break-word lg:text-[0.88rem]">
											{message.body}
										</p>
									{:else if message.kind === 'image' && message.imageUrl}
										<div class="space-y-2">
											<img
												src={message.imageUrl}
												alt={message.body.trim() || 'Shared photo'}
												class="max-h-60 rounded-xl object-contain"
												loading="lazy"
											/>
											{#if message.body.trim()}
												<p class="text-[0.82rem] leading-6 whitespace-pre-wrap wrap-break-word lg:text-[0.88rem]">
													{message.body}
												</p>
											{/if}
										</div>
									{:else}
										<p class="text-[0.82rem] leading-6 whitespace-pre-wrap wrap-break-word lg:text-[0.88rem]">
											{message.body}
										</p>
									{/if}
									<p
										class={cn(
											'mt-1 text-right text-[0.86rem]',
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
							<p class="mb-2 text-right text-[0.75rem] text-muted-foreground">Seen</p>
						{/if}
					{/each}
				{/each}
			</div>
		{/if}
	</div>

	{#if contactTyping}
		<div class="px-2.5 py-0.75 sm:px-4">
			<p class="text-[0.82rem] text-muted-foreground animate-pulse">{thread.participant.name} is typing…</p>
		</div>
	{/if}

	<MessageComposer {isSending} {onSendMessage} {onSendImage} {onTyping} />
</div>
