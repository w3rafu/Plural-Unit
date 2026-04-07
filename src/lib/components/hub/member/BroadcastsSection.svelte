<!--
  BroadcastsSection — member-facing broadcast list.

  Rendered by the hub coordinator when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import { currentHub } from '$lib/stores/currentHub.svelte';
</script>

<section aria-label="Broadcasts">
	<h3>Broadcasts</h3>
	{#if currentHub.broadcasts.length === 0}
		<p>No broadcasts yet.</p>
	{:else}
		<ul>
			{#each currentHub.broadcasts as broadcast (broadcast.id)}
				<li>
					<strong>{broadcast.title}</strong>
					<p>{broadcast.body}</p>
					<time datetime={broadcast.created_at}>
						{new Date(broadcast.created_at).toLocaleDateString()}
					</time>
				</li>
			{/each}
		</ul>
	{/if}
</section>
