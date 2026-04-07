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
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { getActivePluginsForMember } from '$lib/stores/pluginRegistry';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';

	onMount(() => {
		currentHub.load();
	});

	const activePlugins = $derived(getActivePluginsForMember(currentHub.plugins));
	const hubActions = $derived.by(() =>
		currentOrganization.isAdmin ? [{ id: 'hub-manage', label: 'Manage hub', href: '/hub/manage' }] : []
	);

	function goHome() {
		void goto('/');
	}
</script>

<PageHeader title="Hub" subtitle="Member modules" backLabel=" " onBack={goHome} actions={hubActions} />

<main class="flex flex-col gap-4">

	{#if currentHub.isLoading}
		<p>Loading hub...</p>
	{:else if activePlugins.length === 0}
		<p>The hub is getting ready. No sections are active yet.</p>
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
