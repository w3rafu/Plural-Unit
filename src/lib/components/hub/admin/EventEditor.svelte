<!--
  EventEditor — admin form to create/delete events.

  Rendered by the hub manage page when the `events` plugin is active.
-->
<script lang="ts">
	import { currentHub } from '$lib/stores/currentHub.svelte';

	let title = $state('');
	let description = $state('');
	let startsAt = $state('');
	let location = $state('');
	let feedback = $state('');

	async function submit() {
		feedback = '';
		if (!title.trim()) { feedback = 'Enter a title.'; return; }
		if (!startsAt) { feedback = 'Pick a date/time.'; return; }
		try {
			await currentHub.addEvent({
				title: title.trim(),
				description: description.trim(),
				starts_at: new Date(startsAt).toISOString(),
				location: location.trim()
			});
			title = '';
			description = '';
			startsAt = '';
			location = '';
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to create event.';
		}
	}

	async function remove(id: string) {
		try {
			await currentHub.removeEvent(id);
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to delete.';
		}
	}
</script>

<section aria-label="Manage events">
	<h3>Events</h3>

	<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<label>Title <input type="text" bind:value={title} /></label>
		<label>Description <textarea bind:value={description}></textarea></label>
		<label>Starts at <input type="datetime-local" bind:value={startsAt} /></label>
		<label>Location <input type="text" bind:value={location} /></label>
		<button type="submit">Create event</button>
	</form>

	{#if feedback}
		<p role="alert">{feedback}</p>
	{/if}

	{#if currentHub.events.length > 0}
		<ul>
			{#each currentHub.events as event (event.id)}
				<li>
					{event.title} — {new Date(event.starts_at).toLocaleString()}
					<button onclick={() => remove(event.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
