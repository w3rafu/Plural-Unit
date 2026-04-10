<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { getActivePluginsForMember } from '$lib/stores/pluginRegistry';

	const activePlugins = $derived(getActivePluginsForMember(currentHub.plugins));
	const nextEvent = $derived(currentHub.events[0] ?? null);
	const latestBroadcast = $derived(currentHub.broadcasts[0] ?? null);

	function formatEventDate(value: string) {
		const date = new Date(value);
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(date);
	}
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Hub overview</Card.Title>
				<Card.Description>
					{currentOrganization.organization?.name ?? 'Your organization'} has
					{` ${activePlugins.length} `}
					active {activePlugins.length === 1 ? 'section' : 'sections'}.
				</Card.Description>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each activePlugins as plugin (plugin.key)}
					<Badge variant="outline">{plugin.title}</Badge>
				{/each}
			</div>
		</div>
	</Card.Header>

	<Card.Content class="grid gap-3 sm:grid-cols-3">
		<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
			<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Upcoming
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{nextEvent ? nextEvent.title : 'No event scheduled yet'}
			</p>
			{#if nextEvent}
				<p class="mt-1 text-sm text-muted-foreground">{formatEventDate(nextEvent.starts_at)}</p>
			{/if}
		</div>

		<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
			<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Latest broadcast
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{latestBroadcast ? latestBroadcast.title : 'No broadcast posted yet'}
			</p>
			{#if latestBroadcast}
				<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{latestBroadcast.body}</p>
			{/if}
		</div>

		<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
			<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Ready now
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{activePlugins.length === 0 ? 'No sections live yet' : `${activePlugins.length} live`}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{activePlugins.length === 0
					? 'Turn on sections in hub manage to start publishing content.'
					: 'Members can open the active hub sections below.'}
			</p>
		</div>
	</Card.Content>
</Card.Root>
