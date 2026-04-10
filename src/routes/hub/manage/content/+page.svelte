<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BroadcastEditor from '$lib/components/hub/admin/BroadcastEditor.svelte';
	import EventEditor from '$lib/components/hub/admin/EventEditor.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
</script>

{#if !currentHub.plugins.broadcasts && !currentHub.plugins.events}
	<Card.Root class="border-dashed border-border/70 bg-muted/20">
		<Card.Header>
			<Card.Title class="text-lg font-semibold tracking-tight">No live editors yet</Card.Title>
			<Card.Description>Turn on a section in the sections area to start publishing content.</Card.Description>
		</Card.Header>
	</Card.Root>
{:else}
	<div class="space-y-4">
		{#if currentHub.plugins.broadcasts}
			<BroadcastEditor />
		{/if}

		{#if currentHub.plugins.events}
			<EventEditor />
		{/if}
	</div>
{/if}
