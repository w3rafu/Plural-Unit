<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { getAllPluginsForAdmin } from '$lib/stores/pluginRegistry';

	const adminPlugins = getAllPluginsForAdmin();

	const activePlugins = $derived(adminPlugins.filter((plugin) => currentHub.plugins[plugin.key]));
	const publishedCount = $derived(currentHub.broadcasts.length + currentHub.events.length);
	const sectionSummary = $derived.by(() => {
		if (activePlugins.length === 0) {
			return 'No hub sections are live yet.';
		}

		return `${activePlugins.length} section${activePlugins.length === 1 ? '' : 's'} currently visible to members.`;
	});

	const contentSummary = $derived.by(() => {
		if (publishedCount === 0) {
			return 'No broadcasts or events have been published yet.';
		}

		return `${publishedCount} published item${publishedCount === 1 ? '' : 's'} ready for members.`;
	});
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="space-y-1">
			<Card.Title class="text-lg font-semibold tracking-tight">Hub setup</Card.Title>
			<Card.Description>
				Manage what members can see in {currentOrganization.organization?.name ?? 'your organization'}.
			</Card.Description>
		</div>
	</Card.Header>

	<Card.Content class="grid gap-3 sm:grid-cols-3">
		<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
			<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Available sections
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">{adminPlugins.length}</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Broadcasts and events can be turned on independently.
			</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
			<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Live now
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">{activePlugins.length}</p>
			<p class="mt-1 text-sm text-muted-foreground">{sectionSummary}</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
			<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Published content
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">{publishedCount}</p>
			<p class="mt-1 text-sm text-muted-foreground">{contentSummary}</p>
		</div>
	</Card.Content>

	<Card.Footer class="border-t border-border/70 pt-4">
		<div class="flex flex-wrap gap-2">
			{#each adminPlugins as plugin (plugin.key)}
				<Badge variant={currentHub.plugins[plugin.key] ? 'secondary' : 'outline'}>
					{plugin.title}
				</Badge>
			{/each}
		</div>
	</Card.Footer>
</Card.Root>
