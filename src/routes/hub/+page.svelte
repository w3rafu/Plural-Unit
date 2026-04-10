<!--
  Hub page — the registry-driven coordinator.

  This page decides which plugin sections to render based on
  the plugin state map. It loads data once, then delegates
  rendering to each plugin's member section component.

  This mirrors CommunionLink's hub coordinator pattern:
  the page is a loop over active plugins, not a hardcoded list.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import HubOverviewCard from '$lib/components/hub/member/HubOverviewCard.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { getActivePluginsForMember } from '$lib/stores/pluginRegistry';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';

	let loadedHubOrgId = $state('');

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId || loadedHubOrgId === organizationId) {
			return;
		}

		loadedHubOrgId = organizationId;
		void currentHub.load();
	});

	const activePlugins = $derived(getActivePluginsForMember(currentHub.plugins));

	function goHome() {
		void goto('/');
	}
</script>

<PageHeader title="Hub" subtitle="Member modules" backLabel=" " onBack={goHome} />

<main class="flex flex-col gap-4">
	<HubOverviewCard />

	{#if currentHub.isLoading}
		<Card.Root size="sm" class="border-border/70 bg-card/70">
			<Card.Content>
				<p class="text-sm text-muted-foreground">Loading the hub...</p>
			</Card.Content>
		</Card.Root>
	{:else if activePlugins.length === 0}
		<Card.Root class="border-dashed border-border/70 bg-muted/20">
			<Card.Header>
				<Card.Title class="text-lg font-semibold tracking-tight">The hub is ready for setup</Card.Title>
				<Card.Description>No sections are live yet.</Card.Description>
			</Card.Header>
			{#if currentOrganization.isAdmin}
				<Card.Content class="pt-0">
					<Button href="/hub/manage" variant="outline" size="sm">Open hub manage</Button>
				</Card.Content>
			{/if}
		</Card.Root>
	{:else}
		{#each activePlugins as plugin (plugin.key)}
			{#if plugin.key === 'broadcasts'}
				<BroadcastsSection />
			{:else if plugin.key === 'events'}
				<EventsSection />
			{/if}
		{/each}
	{/if}
</main>
