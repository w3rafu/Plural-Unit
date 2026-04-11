<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	const MAX_VISIBLE_ACTIVITY_ITEMS = 5;
	const activityItems = $derived(currentHub.activityFeed.slice(0, MAX_VISIBLE_ACTIVITY_ITEMS));
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Recent activity</Card.Title>
		<Card.Description>
			The latest broadcasts and event updates from {currentOrganization.organization?.name ?? 'your organization'}.
		</Card.Description>
	</Card.Header>

	<Card.Content>
		{#if currentHub.isLoading && activityItems.length === 0}
			<div class="space-y-3">
				{#each Array.from({ length: 3 }) as _, index (`hub-activity-loading-${index}`)}
					<div class="animate-pulse rounded-xl border border-border/70 bg-muted/20 px-4 py-4">
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="h-4 w-28 rounded bg-muted"></div>
							<div class="h-5 w-18 rounded-full bg-muted"></div>
						</div>
						<div class="mb-2 h-4 w-3/5 rounded bg-muted"></div>
						<div class="mb-2 h-3 w-full rounded bg-muted/80"></div>
						<div class="h-3 w-1/2 rounded bg-muted/80"></div>
					</div>
				{/each}
			</div>
		{:else if activityItems.length === 0}
			<div class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
				<p class="font-medium text-foreground">No recent activity yet</p>
				<p class="mt-1 text-sm text-muted-foreground">
					When a broadcast goes live or an event is published, it will appear here first.
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each activityItems as item (item.id)}
					<div class="rounded-xl border border-border/70 bg-muted/15 px-4 py-4">
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-semibold text-foreground">{item.title}</p>
							<Badge variant={item.kind === 'broadcast' ? 'secondary' : 'outline'}>
								{item.label}
							</Badge>
						</div>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
						<p class="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
							{item.meta}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
