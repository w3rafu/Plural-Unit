<!--
  EventEditor — admin form to create/delete events.

  Rendered by the hub manage page when the `events` plugin is active.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { Textarea } from '$lib/components/ui/textarea';
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

<Item.Root variant="outline">
	<Item.Content>
		<Item.Title>Events</Item.Title>
		<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
			<Field.Group>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-title">Title</Field.Label>
						<Input id="event-title" type="text" bind:value={title} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-description">Description</Field.Label>
						<Field.Description>Optional details for people who open the event.</Field.Description>
						<Textarea id="event-description" bind:value={description} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-starts-at">Starts at</Field.Label>
						<Input id="event-starts-at" type="datetime-local" bind:value={startsAt} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-location">Location</Field.Label>
						<Input id="event-location" type="text" bind:value={location} />
					</Field.Content>
				</Field.Field>
			</Field.Group>
			<Button type="submit">Create event</Button>
		</form>

		{#if feedback}
			<p role="alert">{feedback}</p>
		{/if}

		{#if currentHub.events.length > 0}
			<Item.Group>
				{#each currentHub.events as event (event.id)}
					<Item.Root variant="muted" size="sm">
						<Item.Content>
							<Item.Title>{event.title}</Item.Title>
							<Item.Description>{new Date(event.starts_at).toLocaleString()}</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Button variant="destructive" size="sm" onclick={() => remove(event.id)}>Delete</Button>
						</Item.Actions>
					</Item.Root>
				{/each}
			</Item.Group>
		{/if}
	</Item.Content>
</Item.Root>
