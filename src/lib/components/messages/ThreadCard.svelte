<!--
  ThreadCard — single conversation row in the inbox list.
  Shows avatar/initials, participant name, message preview,
  timestamp, and optional unread badge.
-->
<script lang="ts">
	import type { MessageThread } from '$lib/models/messageModel';
	import {
		getParticipantInitials,
		getThreadPreview,
		getThreadLastMessageSentAt,
		isThreadArchived,
		isThreadMuted
	} from '$lib/models/messageModel';
	import * as Avatar from '$lib/components/ui/avatar';
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
	const archived = $derived(isThreadArchived(thread));
	const muted = $derived(isThreadMuted(thread));
</script>

<button
	type="button"
	class={cn(
		'group flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-[background-color,border-color,box-shadow]',
		isActive
			? 'border-border/70 bg-accent/45 text-accent-foreground shadow-sm dark:border-border/80 dark:bg-background/68'
			: archived
				? 'border-border/30 bg-background/80 text-muted-foreground hover:border-border/60 hover:bg-muted/25 dark:border-border/60 dark:bg-background/54 dark:hover:bg-background/66'
			: thread.unreadCount > 0
					? 'border-border/40 bg-muted/25 hover:border-border/70 hover:bg-muted/40 dark:border-border/60 dark:bg-background/58 dark:hover:bg-background/70'
				: 'hover:border-border/60 hover:bg-muted/40 dark:hover:bg-background/66'
	)}
	{onclick}
>
	<Avatar.Root
		class={cn(
			'size-10 border bg-muted/50 shadow-sm after:hidden',
			thread.unreadCount > 0 ? 'border-primary/25 bg-primary/5' : 'border-border/70'
		)}
	>
		{#if thread.participant.avatar_url}
			<Avatar.Image src={thread.participant.avatar_url} alt={thread.participant.name} />
		{:else}
			<Avatar.Fallback class="text-sm font-medium text-muted-foreground">{initials}</Avatar.Fallback>
		{/if}
	</Avatar.Root>

	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 space-y-0.5">
				<div class="flex items-center gap-2">
					<span class="truncate text-sm font-semibold text-foreground">{thread.participant.name}</span>
					{#if thread.unreadCount > 0}
						<span class="size-2 rounded-full bg-primary"></span>
					{/if}
				</div>

				<p class="truncate text-xs text-muted-foreground">
					{thread.participant.subtitle || (archived ? 'Archived conversation' : muted ? 'Muted conversation' : 'Direct conversation')}
				</p>
			</div>

			<span
				class={cn(
					'shrink-0 text-xs',
					thread.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
				)}
			>
				{timestamp}
			</span>
		</div>

		<p class={cn('mt-2 truncate text-sm', thread.unreadCount > 0 && !archived ? 'text-foreground' : 'text-muted-foreground')}>
			{preview}
		</p>

		<div class="mt-2 flex items-center justify-between gap-2">
			<span class="text-[11px] text-muted-foreground">
				{archived ? 'Archived' : muted ? 'Muted' : 'Direct conversation'}
			</span>
			{#if thread.unreadCount > 0}
				<Badge variant="default" class="shrink-0 rounded-full tabular-nums">
					{thread.unreadCount} new
				</Badge>
			{/if}
		</div>
	</div>
</button>
