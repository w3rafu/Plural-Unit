<!--
  InboxPane — thread list with search and sectioned layout.
  Sections: Unread, Recent (7 days), Older.
-->
<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { MessageThread, MessageInboxSections } from '$lib/models/messageModel';
	import { getInboxThreadSections } from '$lib/models/messageModel';
	import { Input } from '$lib/components/ui/input';
	import ThreadCard from './ThreadCard.svelte';
	import { Search } from '@lucide/svelte';

	let {
		threads,
		activeThreadId = '',
		onSelectThread
	}: {
		threads: MessageThread[];
		activeThreadId?: string;
		onSelectThread: (threadId: string) => void;
	} = $props();

	let query = $state('');

	const sections: MessageInboxSections = $derived(getInboxThreadSections(threads, query));
	const threadLabel = $derived(
		sections.visibleThreads.length === 1 ? '1 thread' : `${sections.visibleThreads.length} threads`
	);
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="border-b border-border/70 bg-muted/10 px-3 pb-3 pt-3">
		<div class="space-y-3">
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-1">
					<p class="text-sm font-semibold text-foreground">Inbox</p>
					<p class="text-xs text-muted-foreground">
						{#if query.trim()}
							Showing {threadLabel.toLowerCase()} that match your search.
						{:else}
							Unread, recent, and older conversations grouped for faster triage.
						{/if}
					</p>
				</div>

				<Badge variant="secondary" class="rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
					{threadLabel}
				</Badge>
			</div>

			<div class="grid grid-cols-3 gap-2">
				<div class="rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Unread
					</p>
					<p class="mt-1 text-lg font-semibold tracking-tight text-foreground">
						{sections.unreadThreads.length}
					</p>
				</div>

				<div class="rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Recent
					</p>
					<p class="mt-1 text-lg font-semibold tracking-tight text-foreground">
						{sections.recentThreads.length}
					</p>
				</div>

				<div class="rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Older
					</p>
					<p class="mt-1 text-lg font-semibold tracking-tight text-foreground">
						{sections.olderThreads.length}
					</p>
				</div>
			</div>

			<label class="relative block">
				<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search by name, role, or message"
					class="h-10 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
					bind:value={query}
				/>
			</label>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
		{#if sections.visibleThreads.length === 0}
			<div class="px-2 py-2">
				<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
					<p class="font-medium text-foreground">
						{query ? 'No conversations match your search.' : 'No conversations yet.'}
					</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{query
							? 'Try a name, subtitle, or keyword from the latest message preview.'
							: 'New direct conversations will appear here as soon as someone replies.'}
					</p>
				</div>
			</div>
		{:else}
			{#if sections.unreadThreads.length > 0}
				<div class="flex items-center justify-between px-2 pb-1 pt-2">
					<span class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Unread</span>
					<span class="text-[11px] text-muted-foreground">{sections.unreadThreads.length}</span>
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
				<div class="flex items-center justify-between px-2 pb-1 pt-2">
					<span class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent</span>
					<span class="text-[11px] text-muted-foreground">Last 7 days</span>
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
				<div class="flex items-center justify-between px-2 pb-1 pt-2">
					<span class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Older</span>
					<span class="text-[11px] text-muted-foreground">Archive-ready</span>
				</div>
				{#each sections.olderThreads as thread (thread.id)}
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
