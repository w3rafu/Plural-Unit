<!--
  BroadcastsSection — member-facing broadcast list.

  Rendered by the hub coordinator when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { getBroadcastStateLabel, sortActiveBroadcasts } from '$lib/models/broadcastLifecycleModel';
	import type { BroadcastRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';
	import { formatShortDate, formatShortDateTime } from '$lib/utils/dateFormat';

	let {
		broadcasts = undefined as BroadcastRow[] | undefined,
		sectionId = undefined as string | undefined
	} = $props();

	const items = $derived(sortActiveBroadcasts(broadcasts ?? currentHub.activeBroadcasts));

	function getMetaCopy(broadcast: BroadcastRow) {
		if (broadcast.expires_at) {
			return `Expires ${formatShortDateTime(broadcast.expires_at)}`;
		}

		return broadcast.publish_at
			? `Published ${formatShortDateTime(broadcast.publish_at)}`
			: `Created ${formatShortDate(broadcast.created_at)}`;
	}
</script>

<section id={sectionId} aria-label="Broadcasts" class="space-y-2 scroll-mt-24">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.broadcasts.title}</h2>
			<p class="text-[0.82rem] text-muted-foreground">{PLUGIN_REGISTRY.broadcasts.description}</p>
		</div>
		<p class="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
			{items.length} live
		</p>
	</div>

	{#if items.length === 0}
		<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
			<Card.Content class="py-1">
				<p class="text-sm text-muted-foreground">No broadcasts are live yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class={`space-y-2.5 ${items.length === 1 ? 'max-w-4xl' : ''}`}>
			{#each items as broadcast (broadcast.id)}
				{@const acknowledged = currentHub.hasAcknowledged(broadcast.id)}
				{@const ackCount = currentHub.getAcknowledgmentCount(broadcast.id)}
				{@const ackBusy = currentHub.broadcastAcknowledgmentTargetId === broadcast.id}
				{@const detailHref = `/hub/broadcast/${broadcast.id}`}
				<Card.Root size="sm" class="border-border/70 bg-card">
					<Card.Content class={`space-y-2 ${items.length === 1 ? 'sm:grid sm:grid-cols-[minmax(0,1fr)_8.75rem] sm:items-start sm:gap-2.5 sm:space-y-0' : ''}`}>
						<div class="space-y-2">
							<div class="flex items-center justify-between gap-3">
							<div class="flex flex-wrap gap-2">
									<Badge variant="muted" class="rounded-full px-2.5 py-1 text-[0.78rem] uppercase tracking-[0.16em]">
									Broadcast
								</Badge>
								{#if broadcast.is_pinned || broadcast.expires_at}
										<Badge variant="muted" class="rounded-full px-2.5 py-1 text-[0.78rem] uppercase tracking-[0.16em]">
										{getBroadcastStateLabel(broadcast)}
									</Badge>
								{/if}
							</div>
									<time class="text-[0.76rem] uppercase tracking-[0.12em] text-muted-foreground" datetime={broadcast.publish_at ?? broadcast.created_at}>
								{broadcast.publish_at ? formatShortDateTime(broadcast.publish_at) : formatShortDate(broadcast.created_at)}
							</time>
						</div>
								<div class="space-y-0.5">
									<h3 class="text-[0.82rem] font-medium text-foreground">
								<a href={detailHref} class="hover:underline">{broadcast.title}</a>
									</h3>
										<p class="text-[0.82rem] leading-5.25 text-muted-foreground">{broadcast.body}</p>
										<p class="text-[0.78rem] uppercase tracking-[0.12em] text-muted-foreground">{getMetaCopy(broadcast)}</p>
								</div>
						</div>
							<div class={`flex items-center justify-between gap-3 border-t border-border/70 pt-2 ${items.length === 1 ? 'sm:min-h-full sm:flex-col sm:items-stretch sm:justify-between sm:border-l sm:border-t-0 sm:pl-2.5 sm:pt-0' : ''}`}>
								<div class="space-y-1">
										<p class="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Acknowledgment</p>
									<p class="text-sm text-muted-foreground">
										{ackCount} {ackCount === 1 ? 'person has' : 'people have'} responded
									</p>
								</div>
							<Button
								variant={acknowledged ? 'secondary' : 'outline'}
								size="sm"
										class={`h-7 text-[0.78rem] ${items.length === 1 ? 'sm:w-full sm:justify-center' : ''}`}
								disabled={ackBusy}
								onclick={() => {
									if (acknowledged) {
										currentHub.unacknowledgeBroadcast(broadcast.id);
									} else {
										currentHub.acknowledgeBroadcast(broadcast.id);
									}
								}}
							>
								{acknowledged ? 'Acknowledged ✓' : 'Acknowledge'}
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</section>
