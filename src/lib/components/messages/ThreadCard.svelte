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
	const metaLabel = $derived.by(() => {
		const parts = [] as string[];

		if (thread.unreadCount > 0) {
			parts.push(`${thread.unreadCount} unread`);
		}

		if (archived) {
			parts.push('Archived');
		} else if (muted) {
			parts.push('Muted');
		}

		return parts.join(' · ');
	});
</script>

<button
	type="button"
	class={cn(
		'group flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-[background-color,border-color,box-shadow]',
		isActive
			? 'border-border/70 bg-accent/35 text-accent-foreground shadow-sm dark:border-border/80 dark:bg-background/68'
			: archived
				? 'border-border/30 bg-background/78 text-muted-foreground hover:border-border/60 hover:bg-muted/20 dark:border-border/60 dark:bg-background/54 dark:hover:bg-background/66'
			: thread.unreadCount > 0
					? 'border-border/40 bg-muted/18 hover:border-border/70 hover:bg-muted/28 dark:border-border/60 dark:bg-background/58 dark:hover:bg-background/70'
				: 'hover:border-border/60 hover:bg-muted/28 dark:hover:bg-background/66'
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
					{thread.participant.subtitle || 'Direct conversation'}
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

		{#if metaLabel}
			<p class="mt-2 text-[11px] text-muted-foreground">{metaLabel}</p>
		{/if}
	</div>
</button>
