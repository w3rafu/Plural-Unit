<!--
  BroadcastsSection — member-facing broadcast list.

  Rendered by the hub coordinator when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';

	function formatDate(value: string) {
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}
</script>

<section aria-label="Broadcasts" class="space-y-3">
	<div class="space-y-1">
		<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.broadcasts.title}</h2>
		<p class="text-sm text-muted-foreground">{PLUGIN_REGISTRY.broadcasts.description}</p>
	</div>

	{#if currentHub.broadcasts.length === 0}
		<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
			<Card.Content class="py-1">
				<p class="text-sm text-muted-foreground">No broadcasts are live yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-3">
			{#each currentHub.broadcasts as broadcast (broadcast.id)}
				<Card.Root size="sm" class="border-border/70 bg-card/80">
					<Card.Content class="space-y-3">
						<div class="space-y-1">
							<h3 class="text-base font-medium text-foreground">{broadcast.title}</h3>
							<p class="text-sm leading-6 text-muted-foreground">{broadcast.body}</p>
						</div>
						<time class="text-xs uppercase tracking-[0.12em] text-muted-foreground" datetime={broadcast.created_at}>
							{formatDate(broadcast.created_at)}
						</time>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</section>
