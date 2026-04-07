<!--
  EventsSection — member-facing event list.

  Rendered by the hub coordinator when the `events` plugin is active.
-->
<script lang="ts">
	import { currentHub } from '$lib/stores/currentHub.svelte';
</script>

<section aria-label="Events">
	<h3>Events</h3>
	{#if currentHub.events.length === 0}
		<p>No upcoming events.</p>
	{:else}
		<ul>
			{#each currentHub.events as event (event.id)}
				<li>
					<strong>{event.title}</strong>
					<p>{event.description}</p>
					<p>{event.location}</p>
					<time datetime={event.starts_at}>
						{new Date(event.starts_at).toLocaleString()}
					</time>
				</li>
			{/each}
		</ul>
	{/if}
</section>
