<!--
  ThreadPane — full conversation view for the active thread.
  Shows day-grouped messages, message bubbles, and the composer.
-->
<script lang="ts">
	import type { MessageThread } from '$lib/models/messageModel';
	import { getParticipantInitials } from '$lib/models/messageModel';
	import { groupMessagesByDay, formatMessageTime } from './messageUi';
	import MessageComposer from './MessageComposer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		thread,
		isSending = false,
		onSendMessage,
		onSendImage,
		onBack
	}: {
		thread: MessageThread;
		isSending?: boolean;
		onSendMessage: (body: string) => void;
		onSendImage: (file: File) => void;
		onBack?: () => void;
	} = $props();

	const dayGroups = $derived(groupMessagesByDay(thread.messages));
	const initials = $derived(getParticipantInitials(thread.participant.name));

	let scrollContainer = $state<HTMLElement | null>(null);

	$effect(() => {
		// Scroll to bottom when messages change
		if (thread.messages.length && scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	});
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="flex items-center gap-3 border-b border-border/70 px-3 py-2">
		{#if onBack}
			<Button variant="ghost" size="icon" class="shrink-0 md:hidden" onclick={onBack} aria-label="Back to inbox">
				<ArrowLeft class="h-4 w-4" />
			</Button>
		{/if}

		{#if thread.participant.avatar_url}
			<img
				src={thread.participant.avatar_url}
				alt={thread.participant.name}
				class="h-8 w-8 shrink-0 rounded-full object-cover"
			/>
		{:else}
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
				{initials}
			</div>
		{/if}

		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{thread.participant.name}</p>
			{#if thread.participant.subtitle}
				<p class="truncate text-xs text-muted-foreground">{thread.participant.subtitle}</p>
			{/if}
		</div>
	</div>

	<!-- Message stream -->
	<div class="flex-1 overflow-y-auto px-3 py-2" bind:this={scrollContainer}>
		{#each dayGroups as group (group.dateKey)}
			<!-- Day separator -->
			<div class="my-3 flex items-center gap-3">
				<div class="h-px flex-1 bg-border/50"></div>
				<span class="text-xs text-muted-foreground">{group.label}</span>
				<div class="h-px flex-1 bg-border/50"></div>
			</div>

			{#each group.messages as message (message.id)}
				<div
					class={cn(
						'mb-2 flex',
						message.senderKind === 'owner' ? 'justify-end' : 'justify-start'
					)}
				>
					<div
						class={cn(
							'max-w-[75%] rounded-2xl px-3 py-2',
							message.senderKind === 'owner'
								? 'bg-primary text-primary-foreground'
								: 'bg-muted'
						)}
					>
						{#if message.kind === 'image' && message.imageUrl}
							<img
								src={message.imageUrl}
								alt="Shared image"
								class="max-h-60 rounded-lg object-contain"
								loading="lazy"
							/>
						{:else}
							<p class="text-sm whitespace-pre-wrap break-words">{message.body}</p>
						{/if}
						<p
							class={cn(
								'mt-0.5 text-right text-[0.65rem]',
								message.senderKind === 'owner'
									? 'text-primary-foreground/70'
									: 'text-muted-foreground'
							)}
						>
							{formatMessageTime(message.sentAt)}
						</p>
					</div>
				</div>
			{/each}
		{/each}

		{#if thread.messages.length === 0}
			<p class="py-8 text-center text-sm text-muted-foreground">
				Start the conversation by sending a message.
			</p>
		{/if}
	</div>

	<!-- Composer -->
	<MessageComposer {isSending} {onSendMessage} {onSendImage} />
</div>
