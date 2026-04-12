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

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="space-y-1">
			<Card.Title class="text-lg font-semibold tracking-tight">Hub setup</Card.Title>
			<Card.Description>
				Manage what members can see in {currentOrganization.organization?.name ?? 'your organization'}.
			</Card.Description>
		</div>
	</Card.Header>

	<Card.Content class="metric-grid">
		<div class="metric-card">
			<div>
				<p class="metric-label">Available sections</p>
				<p class="metric-value">{adminPlugins.length}</p>
			</div>
			<p class="metric-copy">Broadcasts and events can be turned on independently.</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Live now</p>
				<p class="metric-value">{activePlugins.length}</p>
			</div>
			<p class="metric-copy">{sectionSummary}</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Published content</p>
				<p class="metric-value">{publishedCount}</p>
			</div>
			<p class="metric-copy">{contentSummary}</p>
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
