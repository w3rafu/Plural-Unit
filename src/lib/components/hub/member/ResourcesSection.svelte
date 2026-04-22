<!--
  ResourcesSection — member-facing resources list.

  Rendered by the hub coordinator when the `resources` plugin is active.
-->
<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		getResourceActionLabel,
		getResourceDestinationLabel,
		getResourceTypeLabel,
		sortLiveResourceRows
	} from '$lib/models/resourcesModel';
	import type { ResourceRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';

	let {
		resources = undefined as ResourceRow[] | undefined,
		sectionId = undefined as string | undefined
	} = $props();

	const items = $derived(sortLiveResourceRows(resources ?? currentHub.orderedResources));

	function handleResourceOpen(resourceId: string) {
		void currentHub.recordResourceOpen(resourceId);
	}
</script>

<section id={sectionId} aria-label="Resources" class="space-y-3 scroll-mt-24">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.resources.title}</h2>
			<p class="text-sm text-muted-foreground">{PLUGIN_REGISTRY.resources.description}</p>
		</div>
		<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
			{items.length} saved
		</p>
	</div>

	{#if items.length === 0}
		<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
			<Card.Content class="py-1">
				<p class="text-sm text-muted-foreground">No resources are live yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-3">
			{#each items as resource (resource.id)}
				<Card.Root size="sm" class="border-border/70 bg-card">
					<Card.Content class="space-y-2.5">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<Badge variant="outline" class="rounded-xl px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
								{getResourceTypeLabel(resource.resource_type)}
							</Badge>
							<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
								{getResourceDestinationLabel(resource.href)}
							</p>
						</div>

						<div class="space-y-1">
							<h3 class="text-base font-medium text-foreground">{resource.title}</h3>
							<p class="text-sm leading-5 text-muted-foreground">
								{resource.description || 'Open this saved resource when you need it.'}
							</p>
						</div>

						<div class="flex justify-start border-t border-border/70 pt-2.5">
							<Button
								href={resource.href}
								variant="outline"
								size="sm"
								target="_blank"
								rel="noreferrer"
								onclick={() => handleResourceOpen(resource.id)}
							>
								{getResourceActionLabel(resource.resource_type)}
								<ExternalLink class="size-4" />
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</section>
