<!--
  BroadcastEditor — admin form to create/delete broadcasts.

  Rendered by the hub manage page when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import { currentHub } from '$lib/stores/currentHub.svelte';

	let title = $state('');
	let body = $state('');
	let feedback = $state('');

	async function submit() {
		feedback = '';
		if (!title.trim()) { feedback = 'Enter a title.'; return; }
		if (!body.trim()) { feedback = 'Enter a message.'; return; }
		try {
			await currentHub.addBroadcast(title.trim(), body.trim());
			title = '';
			body = '';
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to create broadcast.';
		}
	}

	async function remove(id: string) {
		try {
			await currentHub.removeBroadcast(id);
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to delete.';
		}
	}
</script>

<section aria-label="Manage broadcasts">
	<h3>Broadcasts</h3>

	<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<label>Title <input type="text" bind:value={title} /></label>
		<label>Message <textarea bind:value={body}></textarea></label>
		<button type="submit">Send broadcast</button>
	</form>

	{#if feedback}
		<p role="alert">{feedback}</p>
	{/if}

	{#if currentHub.broadcasts.length > 0}
		<ul>
			{#each currentHub.broadcasts as broadcast (broadcast.id)}
				<li>
					{broadcast.title}
					<button onclick={() => remove(broadcast.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
