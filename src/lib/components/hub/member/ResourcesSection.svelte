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
	const leadResource = $derived(items[0] ?? null);
	const secondaryResources = $derived(items.slice(1));

	function handleResourceOpen(resourceId: string) {
		void currentHub.recordResourceOpen(resourceId);
	}

	function getResourceCoverClass(resourceType: ResourceRow['resource_type']) {
		switch (resourceType) {
			case 'document':
				return 'from-indigo-100 via-sky-50 to-background dark:from-indigo-950/60 dark:via-sky-950/30 dark:to-card';
			case 'form':
				return 'from-sky-100 via-cyan-50 to-background dark:from-sky-950/60 dark:via-cyan-950/30 dark:to-card';
			default:
				return 'from-teal-100 via-cyan-50 to-background dark:from-teal-950/60 dark:via-cyan-950/30 dark:to-card';
		}
	}

	function getResourceUsageLabel(resource: ResourceRow) {
		const openCount = resource.open_count ?? 0;

		if (openCount <= 0) {
			return 'Fresh link';
		}

		return openCount === 1 ? '1 open' : `${openCount} opens`;
	}
</script>

<section id={sectionId} aria-label="Resources" class="space-y-3.5 scroll-mt-24">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.resources.title}</h2>
			<p class="text-sm text-muted-foreground">{PLUGIN_REGISTRY.resources.description}</p>
		</div>
		<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
		<div class={secondaryResources.length > 0
			? 'grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]'
			: 'space-y-3'}>
			{#if leadResource}
				<Card.Root class="overflow-hidden border-border/70 bg-card">
					<div class={`relative overflow-hidden border-b border-border/60 bg-linear-to-br px-4 py-4 sm:px-5 ${getResourceCoverClass(leadResource.resource_type)}`}>
						<div class="absolute -right-10 top-0 h-28 w-28 rounded-full bg-background/70 blur-3xl dark:bg-white/10"></div>
						<div class="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl"></div>
						<div class="relative space-y-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<Badge variant="outline" class="rounded-xl border-background/70 bg-background/80 px-2.5 py-1 text-[0.88rem] uppercase tracking-[0.16em] text-foreground shadow-sm">
									Featured {getResourceTypeLabel(leadResource.resource_type)}
								</Badge>
								<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
									{getResourceUsageLabel(leadResource)}
								</p>
							</div>

							<div class="max-w-xl space-y-1.5">
								<p class="text-[0.82rem] uppercase tracking-[0.14em] text-muted-foreground">
									{getResourceDestinationLabel(leadResource.href)}
								</p>
								<h3 class="text-xl font-semibold tracking-tight text-foreground sm:text-[1.45rem]">
									{leadResource.title}
								</h3>
								<p class="text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
									{leadResource.description || 'Open this saved resource when you need it.'}
								</p>
							</div>
						</div>
					</div>

					<Card.Content class="flex flex-wrap items-center justify-between gap-3 py-4">
						<div class="flex flex-wrap items-center gap-2 text-[0.82rem] uppercase tracking-[0.12em] text-muted-foreground">
							<span class="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
								Quick access
							</span>
							<span class="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
								Shared with members
							</span>
						</div>

						<Button
							href={leadResource.href}
							variant="default"
							size="sm"
							target="_blank"
							rel="noreferrer"
							onclick={() => handleResourceOpen(leadResource.id)}
							class="shadow-sm"
						>
							{getResourceActionLabel(leadResource.resource_type)}
							<ExternalLink class="size-4" />
						</Button>
					</Card.Content>
				</Card.Root>
			{/if}

			{#if secondaryResources.length > 0}
				<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
					{#each secondaryResources as resource (resource.id)}
						<Card.Root size="sm" class="border-border/70 bg-card">
							<Card.Content class="flex h-full flex-col gap-3">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<Badge variant="outline" class="rounded-xl px-2.5 py-1 text-[0.88rem] uppercase tracking-[0.16em]">
										{getResourceTypeLabel(resource.resource_type)}
									</Badge>
									<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										{getResourceUsageLabel(resource)}
									</p>
								</div>

								<div class="space-y-1.5">
									<p class="text-[0.82rem] uppercase tracking-[0.12em] text-muted-foreground">
										{getResourceDestinationLabel(resource.href)}
									</p>
									<h3 class="text-sm font-medium leading-5 text-foreground">{resource.title}</h3>
									<p class="line-clamp-3 text-sm leading-5 text-muted-foreground">
										{resource.description || 'Open this saved resource when you need it.'}
									</p>
								</div>

								<div class="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3">
									<p class="text-[0.82rem] text-muted-foreground">Open in a new tab</p>
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
		</div>
	{/if}
</section>
