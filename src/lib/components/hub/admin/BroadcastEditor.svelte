<!--
  BroadcastEditor — admin form to create/delete broadcasts.

  Rendered by the hub manage page when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { formatShortDate } from '$lib/utils/dateFormat';

	let title = $state('');
	let body = $state('');
	let feedback = $state('');
	const UNSAVED_CHANGES_KEY = 'hub-broadcast-editor';
	const initialBroadcastSnapshot = createDirtySnapshot({ title: '', body: '' });
	const currentBroadcastSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			body: body.trim()
		})
	);
	const isBroadcastDirty = $derived(currentBroadcastSnapshot !== initialBroadcastSnapshot);

	$effect(() => {
		unsavedChanges.set(UNSAVED_CHANGES_KEY, 'broadcast draft', isBroadcastDirty);
	});

	onDestroy(() => {
		unsavedChanges.clear(UNSAVED_CHANGES_KEY);
	});

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

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Broadcasts</Card.Title>
		<Card.Description>Write a short update that all members can scan quickly.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		<form
			class="space-y-5"
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<Field.Group class="gap-4">
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
			<div class="flex justify-start">
				<Button type="submit">Send broadcast</Button>
			</div>
		</form>

		{#if feedback}
			<p
				role="alert"
				class="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
			>
				{feedback}
			</p>
		{/if}

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Published broadcasts</h3>
				<p class="text-sm text-muted-foreground">
					{currentHub.broadcasts.length === 0
						? 'No broadcasts are live yet.'
						: `${currentHub.broadcasts.length} broadcast${currentHub.broadcasts.length === 1 ? '' : 's'} currently live.`}
				</p>
			</div>

		{#if currentHub.broadcasts.length === 0}
			<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
				<Card.Content>
					<p class="text-sm text-muted-foreground">Publish your first broadcast when you are ready.</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<Item.Group>
				{#each currentHub.broadcasts as broadcast (broadcast.id)}
					<Item.Root variant="muted" size="sm">
						<Item.Content>
							<Item.Title>{broadcast.title}</Item.Title>
							<Item.Description>{broadcast.body}</Item.Description>
							<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
								{formatShortDate(broadcast.created_at)}
							</p>
						</Item.Content>
						<Item.Actions>
							<Button variant="destructive" size="sm" onclick={() => remove(broadcast.id)}>
								Delete
							</Button>
						</Item.Actions>
					</Item.Root>
				{/each}
			</Item.Group>
		{/if}
		</div>
	</Card.Content>
</Card.Root>
