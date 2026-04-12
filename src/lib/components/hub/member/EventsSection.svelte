<!--
  EventsSection — member-facing event list.

  Rendered by the hub coordinator when the `events` plugin is active.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { EventRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';
	import { formatEventDateTime } from '$lib/utils/dateFormat';

	let { events = undefined as EventRow[] | undefined } = $props();

	const items = $derived(events ?? currentHub.events);
</script>

<section aria-label="Events" class="space-y-3">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.events.title}</h2>
			<p class="text-sm text-muted-foreground">{PLUGIN_REGISTRY.events.description}</p>
		</div>
		<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
			{items.length} upcoming
		</p>
	</div>

	{#if items.length === 0}
		<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
			<Card.Content class="py-1">
				<p class="text-sm text-muted-foreground">No upcoming events are live yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-3">
			{#each items as event (event.id)}
				<Card.Root size="sm" class="border-border/70 bg-card">
					<Card.Content class="space-y-3">
						<div class="space-y-1">
							<h3 class="text-base font-medium text-foreground">{event.title}</h3>
							<p class="text-sm leading-6 text-muted-foreground">
								{event.description || 'More details will appear here soon.'}
							</p>
						</div>
						<div class="space-y-1 text-sm text-muted-foreground">
							<p>{formatEventDateTime(event.starts_at)}</p>
							{#if event.location}
								<p>{event.location}</p>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</section>
