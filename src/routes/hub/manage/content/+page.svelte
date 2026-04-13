<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BroadcastEditor from '$lib/components/hub/admin/BroadcastEditor.svelte';
	import EventEditor from '$lib/components/hub/admin/EventEditor.svelte';
	import ResourceEditor from '$lib/components/hub/admin/ResourceEditor.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
</script>

{#if !currentHub.plugins.broadcasts && !currentHub.plugins.events && !currentHub.plugins.resources}
	<Card.Root class="border-dashed border-border/70 bg-muted/20">
		<Card.Header>
			<Card.Title class="text-lg font-semibold tracking-tight">No live editors yet</Card.Title>
			<Card.Description>Turn on a section in the sections area to start publishing content.</Card.Description>
		</Card.Header>
	</Card.Root>
{:else}
	<div class="card-grid">
		{#if currentHub.plugins.broadcasts}
			<section id="manage-broadcasts" aria-label="Broadcast editor" class="scroll-mt-24">
				<BroadcastEditor />
			</section>
		{/if}

		{#if currentHub.plugins.events}
			<section id="manage-events" aria-label="Event editor" class="scroll-mt-24">
				<EventEditor />
			</section>
		{/if}

		{#if currentHub.plugins.resources}
			<section id="manage-resources" aria-label="Resource editor" class="scroll-mt-24">
				<ResourceEditor />
			</section>
		{/if}
	</div>
{/if}
