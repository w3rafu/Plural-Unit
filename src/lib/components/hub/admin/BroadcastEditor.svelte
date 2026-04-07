<!--
  BroadcastEditor — admin form to create/delete broadcasts.

  Rendered by the hub manage page when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { Textarea } from '$lib/components/ui/textarea';
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

<Item.Root variant="outline">
	<Item.Content>
		<Item.Title>Broadcasts</Item.Title>
		<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
			<Field.Group>
				<Field.Field>
					<Field.Content>
						<Field.Label for="broadcast-title">Title</Field.Label>
						<Field.Description>Keep it short so the broadcast is easy to scan.</Field.Description>
						<Input id="broadcast-title" type="text" bind:value={title} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="broadcast-message">Message</Field.Label>
						<Textarea id="broadcast-message" bind:value={body} />
					</Field.Content>
				</Field.Field>
			</Field.Group>
			<Button type="submit">Send broadcast</Button>
		</form>

		{#if feedback}
			<p role="alert">{feedback}</p>
		{/if}

		{#if currentHub.broadcasts.length > 0}
			<Item.Group>
				{#each currentHub.broadcasts as broadcast (broadcast.id)}
					<Item.Root variant="muted" size="sm">
						<Item.Content>
							<Item.Title>{broadcast.title}</Item.Title>
							<Item.Description>Broadcast message</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Button variant="destructive" size="sm" onclick={() => remove(broadcast.id)}>Delete</Button>
						</Item.Actions>
					</Item.Root>
				{/each}
			</Item.Group>
		{/if}
	</Item.Content>
</Item.Root>
