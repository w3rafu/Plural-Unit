<!--
  Hub manage page — admin surface for plugin activation and content editing.

  The coordinator renders:
  1. Plugin activation toggles
  2. Editor cards for each active plugin
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import PluginActivationCard from '$lib/components/hub/admin/PluginActivationCard.svelte';
	import BroadcastEditor from '$lib/components/hub/admin/BroadcastEditor.svelte';
	import EventEditor from '$lib/components/hub/admin/EventEditor.svelte';

	onMount(() => {
		currentHub.load();
	});
</script>

<main>
	<h1>Manage Hub</h1>
	<p><a href="/">← Home</a></p>

	{#if !currentOrganization.isAdmin}
		<p>Only admins can manage the hub.</p>
	{:else if currentHub.isLoading}
		<p>Loading...</p>
	{:else}
		<PluginActivationCard />

		<hr />

		{#if currentHub.plugins.broadcasts}
			<BroadcastEditor />
		{/if}

		{#if currentHub.plugins.events}
			<EventEditor />
		{/if}
	{/if}
</main>
