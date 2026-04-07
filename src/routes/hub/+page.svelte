<!--
  Hub page — the registry-driven coordinator.

  This page decides which plugin sections to render based on
  the plugin state map. It loads data once, then delegates
  rendering to each plugin's member section component.

  This mirrors CommunionLink's hub coordinator pattern:
  the page is a loop over active plugins, not a hardcoded list.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { getActivePluginsForMember } from '$lib/stores/pluginRegistry';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';

	onMount(() => {
		currentHub.load();
	});

	const activePlugins = $derived(getActivePluginsForMember(currentHub.plugins));
</script>

<main>
	<h1>Hub</h1>
	<p><a href="/">← Home</a></p>

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
