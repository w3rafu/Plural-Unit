<!--
  InboxPane — thread list with search and sectioned layout.
  Sections: Unread, Recent (7 days), Older.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { MessageThread, MessageInboxSections } from '$lib/models/messageModel';
	import { getInboxThreadSections, isThreadArchived } from '$lib/models/messageModel';
	import { Input } from '$lib/components/ui/input';
	import ThreadCard from './ThreadCard.svelte';
	import { Search, SquarePen } from '@lucide/svelte';

	let {
		threads,
		activeThreadId = '',
		onSelectThread,
		onCompose
	}: {
		threads: MessageThread[];
		activeThreadId?: string;
		onSelectThread: (threadId: string) => void;
		onCompose?: () => void;
	} = $props();

	let query = $state('');
	let showArchived = $state(false);

	const sections: MessageInboxSections = $derived(
		getInboxThreadSections(threads, query, { includeArchived: showArchived })
	);
	const archivedCount = $derived(threads.filter((thread) => isThreadArchived(thread)).length);
	const threadLabel = $derived(
		sections.visibleThreads.length === 1 ? '1 thread' : `${sections.visibleThreads.length} threads`
	);
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="border-b border-border/70 bg-muted/10 px-3 py-2 sm:px-3.5 sm:py-2.5">
		<div class="space-y-2.5">
			<div class="flex items-center gap-2">
				<label class="relative block flex-1">
				<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
						placeholder="Search conversations"
					class="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
					bind:value={query}
				/>
				</label>

				{#if onCompose}
					<Button type="button" variant="outline" size="icon-sm" class="h-9 w-9 shrink-0 rounded-xl" aria-label="New message" onclick={onCompose}>
						<SquarePen class="size-4" />
					</Button>
				{/if}
			</div>

			<div class="flex items-center justify-between gap-3 text-[0.82rem] text-muted-foreground">
				<p>
					{#if query.trim()}
						Showing {threadLabel.toLowerCase()} that match your search.
					{:else}
						{sections.unreadThreads.length > 0
							? `${sections.unreadThreads.length} need a reply right now.`
							: `${threadLabel} in this inbox.`}
					{/if}
				</p>

				{#if archivedCount > 0}
					<Button
						type="button"
						variant={showArchived ? 'secondary' : 'ghost'}
						size="xs"
						onclick={() => {
							showArchived = !showArchived;
						}}
					>
						{showArchived ? 'Hide archived' : 'Show archived'}
					</Button>
				{/if}
			</div>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 sm:px-2 sm:py-2">
		{#if sections.visibleThreads.length === 0}
			<div class="px-2 py-2">
				<div class="rounded-[1.25rem] border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
					<p class="font-medium text-foreground">
						{query
							? 'No conversations match your search.'
							: archivedCount > 0
								? 'All conversations are archived.'
								: 'No conversations yet.'}
					</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{query
							? 'Try a name, subtitle, or keyword from the latest message preview.'
							: archivedCount > 0
								? 'Use Show archived to restore a thread back into active triage.'
								: 'New direct conversations will appear here as soon as someone replies.'}
					</p>
					{#if !query && archivedCount > 0 && !showArchived}
						<Button
							type="button"
							variant="outline"
							size="xs"
							class="mt-4"
							onclick={() => {
								showArchived = true;
							}}
						>
							Show archived
						</Button>
					{/if}
				</div>
			</div>
		{:else}
			{#if sections.unreadThreads.length > 0}
				<div class="flex items-center justify-between px-2 pb-0.5 pt-1.5">
					<span class="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Need reply</span>
					<span class="text-[0.82rem] text-muted-foreground">{sections.unreadThreads.length}</span>
				</div>
				{#each sections.unreadThreads as thread (thread.id)}
					<ThreadCard
						{thread}
						isActive={thread.id === activeThreadId}
						onclick={() => onSelectThread(thread.id)}
					/>
				{/each}
			{/if}

			{#if sections.recentThreads.length > 0}
				<div class="flex items-center justify-between px-2 pb-0.5 pt-1.5">
					<span class="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recently active</span>
					<span class="text-[0.82rem] text-muted-foreground">Last 7 days</span>
				</div>
				{#each sections.recentThreads as thread (thread.id)}
					<ThreadCard
						{thread}
						isActive={thread.id === activeThreadId}
						onclick={() => onSelectThread(thread.id)}
					/>
				{/each}
			{/if}

			{#if sections.olderThreads.length > 0}
				<div class="flex items-center justify-between px-2 pb-0.5 pt-1.5">
					<span class="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quiet</span>
					<span class="text-[0.82rem] text-muted-foreground">Low activity</span>
				</div>
				{#each sections.olderThreads as thread (thread.id)}
					<ThreadCard
						{thread}
						isActive={thread.id === activeThreadId}
						onclick={() => onSelectThread(thread.id)}
					/>
				{/each}
			{/if}

			{#if sections.archivedThreads.length > 0}
				<div class="flex items-center justify-between px-2 pb-0.5 pt-1.5">
					<span class="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Archived</span>
					<span class="text-[0.82rem] text-muted-foreground">Out of triage</span>
				</div>
				{#each sections.archivedThreads as thread (thread.id)}
					<ThreadCard
						{thread}
						isActive={thread.id === activeThreadId}
						onclick={() => onSelectThread(thread.id)}
					/>
				{/each}
			{/if}
		{/if}
	</div>
</div>
