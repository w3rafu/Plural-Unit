<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';
	import {
		volunteerEvents,
		getEventFilledSlots,
		getEventTotalSlots
	} from '$lib/demo/volunteerFixtures';
	import EventCard from '$lib/components/volunteer/EventCard.svelte';

	let { sectionId }: { sectionId?: string } = $props();

	const definition = PLUGIN_REGISTRY.volunteers;
	const upcomingEvents = $derived(
		volunteerEvents.filter((e) => e.id !== 'vol-event-3')
	);
	const totalSlots = $derived(
		upcomingEvents.reduce((sum, e) => sum + getEventTotalSlots(e), 0)
	);
	const filledSlots = $derived(
		upcomingEvents.reduce((sum, e) => sum + getEventFilledSlots(e), 0)
	);
	const openSlots = $derived(totalSlots - filledSlots);
</script>

<div id={sectionId} class="flex flex-col gap-3">
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<h2 class="text-lg font-semibold tracking-tight">{definition.title}</h2>
			<p class="text-sm text-muted-foreground">
				{openSlots > 0
					? `${openSlots} spot${openSlots === 1 ? '' : 's'} still need coverage.`
					: 'Upcoming volunteer events are fully covered.'}
			</p>
		</div>
	</div>

	<Card.Root size="sm" class="overflow-hidden border-border/70 bg-card">
		<Card.Content class="divide-y divide-border/50 px-4 py-0">
			{#if upcomingEvents.length === 0}
				<div class="py-6 text-center">
					<p class="text-sm text-muted-foreground">No upcoming volunteer events.</p>
				</div>
			{:else}
				{#each upcomingEvents as event (event.id)}
					<EventCard {event} signupHref="/signup/{event.id}" />
				{/each}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
