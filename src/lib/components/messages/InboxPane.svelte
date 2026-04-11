<!--
  InboxPane — thread list with search and sectioned layout.
  Sections: Unread, Recent (7 days), Older.
-->
<script lang="ts">
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
</script>

<div class="flex h-full flex-col">
	<!-- Search -->
	<div class="relative px-3 pb-2 pt-1">
		<Search class="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			type="search"
			placeholder="Search conversations..."
			class="pl-9"
			bind:value={query}
		/>
	</div>

	<!-- Thread list -->
	<div class="flex-1 overflow-y-auto px-1">
		{#if sections.visibleThreads.length === 0}
			<p class="px-3 py-6 text-center text-sm text-muted-foreground">
				{query ? 'No conversations match your search.' : 'No conversations yet.'}
			</p>
		{:else}
			{#if sections.unreadThreads.length > 0}
				<div class="px-2 pb-1 pt-2">
					<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unread</span>
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
				<div class="px-2 pb-1 pt-2">
					<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent</span>
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
				<div class="px-2 pb-1 pt-2">
					<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Older</span>
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
