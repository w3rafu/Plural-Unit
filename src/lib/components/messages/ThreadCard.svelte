<!--
  ThreadCard — single conversation row in the inbox list.
  Shows avatar/initials, participant name, message preview,
  timestamp, and optional unread badge.
-->
<script lang="ts">
	import type { MessageThread } from '$lib/models/messageModel';
	import { getParticipantInitials, getThreadPreview, getThreadLastMessageSentAt } from '$lib/models/messageModel';
	import { Badge } from '$lib/components/ui/badge';
	import { formatThreadTimestamp } from './messageUi';
	import { cn } from '$lib/utils';

	let {
		thread,
		isActive = false,
		onclick
	}: {
		thread: MessageThread;
		isActive?: boolean;
		onclick: () => void;
	} = $props();

	const initials = $derived(getParticipantInitials(thread.participant.name));
	const preview = $derived(getThreadPreview(thread));
	const timestamp = $derived(formatThreadTimestamp(getThreadLastMessageSentAt(thread)));
</script>

<button
	type="button"
	class={cn(
		'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
		isActive
			? 'bg-accent text-accent-foreground'
			: 'hover:bg-muted/60'
	)}
	{onclick}
>
	<!-- Avatar -->
	{#if thread.participant.avatar_url}
		<img
			src={thread.participant.avatar_url}
			alt={thread.participant.name}
			class="h-10 w-10 shrink-0 rounded-full object-cover"
		/>
	{:else}
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
			{initials}
		</div>
	{/if}

	<!-- Content -->
	<div class="min-w-0 flex-1">
		<div class="flex items-baseline justify-between gap-2">
			<span class="truncate text-sm font-medium">{thread.participant.name}</span>
			<span class="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
		</div>
		<p class="truncate text-xs text-muted-foreground">{preview}</p>
	</div>

	<!-- Unread badge -->
	{#if thread.unreadCount > 0}
		<Badge variant="default" class="shrink-0 tabular-nums">{thread.unreadCount}</Badge>
	{/if}
</button>
