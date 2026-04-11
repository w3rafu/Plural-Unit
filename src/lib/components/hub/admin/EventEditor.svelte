<!--
  EventEditor — admin form to create/delete events.

  Rendered by the hub manage page when the `events` plugin is active.
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

	let title = $state('');
	let description = $state('');
	let startsAt = $state('');
	let location = $state('');
	let feedback = $state('');
	const UNSAVED_CHANGES_KEY = 'hub-event-editor';
	const initialEventSnapshot = createDirtySnapshot({
		title: '',
		description: '',
		startsAt: '',
		location: ''
	});
	const currentEventSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			description: description.trim(),
			startsAt,
			location: location.trim()
		})
	);
	const isEventDirty = $derived(currentEventSnapshot !== initialEventSnapshot);

	$effect(() => {
		unsavedChanges.set(UNSAVED_CHANGES_KEY, 'event draft', isEventDirty);
	});

	onDestroy(() => {
		unsavedChanges.clear(UNSAVED_CHANGES_KEY);
	});

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

	function formatDateTime(value: string) {
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(value));
	}
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Events</Card.Title>
		<Card.Description>Publish the next gathering members need to plan around.</Card.Description>
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
						<Field.Description>Choose the local date and time members should see.</Field.Description>
						<Input id="event-starts-at" type="datetime-local" bind:value={startsAt} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-location">Location</Field.Label>
						<Field.Description>Optional place or room name.</Field.Description>
						<Input id="event-location" type="text" bind:value={location} />
					</Field.Content>
				</Field.Field>
			</Field.Group>
			<div class="flex justify-start">
				<Button type="submit">Create event</Button>
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
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Published events</h3>
				<p class="text-sm text-muted-foreground">
					{currentHub.events.length === 0
						? 'No events are live yet.'
						: `${currentHub.events.length} event${currentHub.events.length === 1 ? '' : 's'} currently published.`}
				</p>
			</div>

		{#if currentHub.events.length === 0}
			<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
				<Card.Content>
					<p class="text-sm text-muted-foreground">Publish your first event when you are ready.</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<Item.Group>
				{#each currentHub.events as event (event.id)}
					<Item.Root variant="muted" size="sm">
						<Item.Content>
							<Item.Title>{event.title}</Item.Title>
							<Item.Description>{event.description || 'More details will appear here soon.'}</Item.Description>
							<p class="text-sm text-muted-foreground">{formatDateTime(event.starts_at)}</p>
							{#if event.location}
								<p class="text-sm text-muted-foreground">{event.location}</p>
							{/if}
						</Item.Content>
						<Item.Actions>
							<Button variant="destructive" size="sm" onclick={() => remove(event.id)}>
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
