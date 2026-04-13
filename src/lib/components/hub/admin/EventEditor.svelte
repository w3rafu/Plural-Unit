<!--
  EventEditor — admin form to create, edit, and manage event lifecycle.

  Rendered by the hub manage page when the `events` plugin is active.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import {
		getEventLocationLabel,
		normalizeEventLocation
	} from '$lib/models/eventCalendarModel';
	import {
		getEventStateLabel,
		parseEventDateTimeLocalValue,
		toEventDateTimeLocalValue
	} from '$lib/models/eventLifecycleModel';
	import {
		formatEventAttendanceSummary,
		formatEventResponseTotal
	} from '$lib/models/eventResponseModel';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import type { EventRow } from '$lib/repositories/hubRepository';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { formatEventDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

	let editingId = $state<string | null>(null);
	let title = $state('');
	let description = $state('');
	let startsAt = $state('');
	let endsAt = $state('');
	let publishAt = $state('');
	let location = $state('');
	let feedback = $state('');
	const UNSAVED_CHANGES_KEY = 'hub-event-editor';
	const editingEvent = $derived(
		editingId ? currentHub.events.find((event) => event.id === editingId) ?? null : null
	);
	const initialEventSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: editingEvent?.title.trim() ?? '',
			description: editingEvent?.description.trim() ?? '',
			startsAt: toEventDateTimeLocalValue(editingEvent?.starts_at ?? null),
			endsAt: toEventDateTimeLocalValue(editingEvent?.ends_at ?? null),
			publishAt: toEventDateTimeLocalValue(editingEvent?.publish_at ?? null),
			location: getEventLocationLabel(editingEvent?.location)
		})
	);
	const currentEventSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			description: description.trim(),
			startsAt,
			endsAt,
			publishAt,
			location: normalizeEventLocation(location)
		})
	);
	const isEditing = $derived(!!editingEvent);
	const liveEvents = $derived(currentHub.liveEvents);
	const scheduledEvents = $derived(currentHub.scheduledEvents);
	const inactiveEvents = $derived(currentHub.inactiveEvents);
	const isEventDirty = $derived(currentEventSnapshot !== initialEventSnapshot);

	$effect(() => {
		unsavedChanges.set(UNSAVED_CHANGES_KEY, isEditing ? 'event edits' : 'event draft', isEventDirty);
	});

	onDestroy(() => {
		unsavedChanges.clear(UNSAVED_CHANGES_KEY);
	});

	function resetForm() {
		editingId = null;
		title = '';
		description = '';
		startsAt = '';
		endsAt = '';
		publishAt = '';
		location = '';
		feedback = '';
	}

	function startEditing(event: EventRow) {
		editingId = event.id;
		title = event.title;
		description = event.description;
		startsAt = toEventDateTimeLocalValue(event.starts_at);
		endsAt = toEventDateTimeLocalValue(event.ends_at);
		publishAt = toEventDateTimeLocalValue(event.publish_at);
		location = getEventLocationLabel(event.location);
		feedback = '';
	}

	function getScheduleCopy(event: EventRow) {
		const parts = [`Starts ${formatEventDateTime(event.starts_at)}`];

		if (event.ends_at) {
			parts.push(`Ends ${formatShortDateTime(event.ends_at)}`);
		}

		if (event.publish_at) {
			parts.push(`${getEventStateLabel(event) === 'Scheduled' ? 'Visible' : 'Published'} ${formatShortDateTime(event.publish_at)}`);
		}

		return parts.join(' · ');
	}

	function getHistoryCopy(event: EventRow) {
		if (event.archived_at) {
			return `Archived ${formatShortDateTime(event.archived_at)}.`;
		}

		if (event.canceled_at) {
			return `Canceled ${formatShortDateTime(event.canceled_at)}.`;
		}

		return 'Moved to history after the start time passed.';
	}

	function getAttendanceCopy(eventId: string) {
		const attendance = currentHub.getEventAttendanceSummary(eventId);
		return attendance.total === 0
			? 'No responses yet.'
			: `${formatEventAttendanceSummary(attendance)} · ${formatEventResponseTotal(attendance.total)}`;
	}

	function getEngagementSignal(eventId: string) {
		return currentHub.getEventEngagementSignal(eventId);
	}

	function getEngagementClass(eventId: string) {
		return getEngagementSignal(eventId)?.needsAttention
			? 'text-xs text-foreground'
			: 'text-xs text-muted-foreground';
	}

	async function submit() {
		feedback = '';

		if (!title.trim()) {
			feedback = 'Enter a title.';
			return;
		}

		if (!startsAt) {
			feedback = 'Pick a date/time.';
			return;
		}

		try {
			const parsedStartsAt = parseEventDateTimeLocalValue(startsAt, 'Pick a valid event date and time.');
			if (!parsedStartsAt) {
				feedback = 'Pick a date/time.';
				return;
			}

			const parsedEndsAt = parseEventDateTimeLocalValue(
				endsAt,
				'Pick a valid event end date and time.'
			);

			if (parsedEndsAt && new Date(parsedEndsAt).getTime() <= new Date(parsedStartsAt).getTime()) {
				feedback = 'End time must be after the event starts.';
				return;
			}

			const parsedPublishAt = parseEventDateTimeLocalValue(
				publishAt,
				'Pick a valid visibility date and time.'
			);

			if (parsedPublishAt && new Date(parsedPublishAt).getTime() > new Date(parsedStartsAt).getTime()) {
				feedback = 'Visibility time must be before the event starts.';
				return;
			}

			const payload = {
				title: title.trim(),
				description: description.trim(),
				starts_at: parsedStartsAt,
				ends_at: parsedEndsAt,
				publish_at: parsedPublishAt,
				location: normalizeEventLocation(location)
			};

			if (editingId) {
				await currentHub.updateEvent(editingId, payload);
			} else {
				await currentHub.addEvent(payload);
			}

			resetForm();
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to save the event.';
		}
	}

	async function publishNow(event: EventRow) {
		try {
			await currentHub.updateEvent(event.id, {
				title: event.title,
				description: event.description,
				starts_at: event.starts_at,
				ends_at: event.ends_at,
				location: getEventLocationLabel(event.location),
				publish_at: null
			});

			if (editingId === event.id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to publish the event.';
		}
	}

	async function cancelLifecycle(id: string) {
		try {
			await currentHub.cancelEvent(id);
			if (editingId === id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to cancel the event.';
		}
	}

	async function archive(id: string) {
		try {
			await currentHub.archiveEvent(id);
			if (editingId === id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to archive the event.';
		}
	}

	async function restore(id: string) {
		try {
			await currentHub.restoreEvent(id);
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to restore the event.';
		}
	}

	async function remove(id: string) {
		try {
			await currentHub.removeEvent(id);
			if (editingId === id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to delete.';
		}
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Events</Card.Title>
		<Card.Description>Manage live, scheduled, and historical event visibility from one place.</Card.Description>
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
						<Field.Label for="event-ends-at">Ends at</Field.Label>
						<Field.Description>
							Optional. Add an end time so calendar exports land with a real duration.
						</Field.Description>
						<Input id="event-ends-at" type="datetime-local" bind:value={endsAt} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-publish-at">Visible at</Field.Label>
						<Field.Description>
							Optional. Delay member visibility until this date and time.
						</Field.Description>
						<Input id="event-publish-at" type="datetime-local" bind:value={publishAt} />
					</Field.Content>
				</Field.Field>
				<Field.Field>
					<Field.Content>
						<Field.Label for="event-location">Location</Field.Label>
						<Field.Description>Optional room, address, or short call-in detail.</Field.Description>
						<Input id="event-location" type="text" bind:value={location} />
					</Field.Content>
				</Field.Field>
			</Field.Group>
			<div class="flex flex-wrap justify-start gap-2">
				<Button type="submit" disabled={currentHub.eventTargetId !== ''}>
					{isEditing ? 'Save changes' : 'Create event'}
				</Button>
				{#if isEditing}
					<Button type="button" variant="ghost" onclick={resetForm} disabled={currentHub.eventTargetId !== ''}>
						Cancel
					</Button>
				{/if}
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
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Live events</h3>
				<p class="text-sm text-muted-foreground">
					{liveEvents.length === 0
						? 'No events are live yet.'
						: `${liveEvents.length} event${liveEvents.length === 1 ? '' : 's'} currently visible to members.`}
				</p>
			</div>

		{#if liveEvents.length === 0}
			<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
				<Card.Content>
					<p class="text-sm text-muted-foreground">Publish your first event when you are ready.</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<Item.Group>
				{#each liveEvents as event (event.id)}
					<Item.Root variant="muted" size="sm">
						<Item.Content>
							{@const locationLabel = getEventLocationLabel(event.location)}
							{@const engagementSignal = getEngagementSignal(event.id)}
							<div class="flex flex-wrap items-center gap-2">
								<Item.Title>{event.title}</Item.Title>
								<Badge variant="secondary">{getEventStateLabel(event)}</Badge>
							</div>
							<Item.Description>{event.description || 'More details will appear here soon.'}</Item.Description>
							<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
								<p>{getScheduleCopy(event)}</p>
								{#if locationLabel}
									<p>{locationLabel}</p>
								{/if}
							</div>
							<p class="text-xs text-muted-foreground">{getAttendanceCopy(event.id)}</p>
							{#if engagementSignal}
								<p class={getEngagementClass(event.id)}>{engagementSignal.copy}</p>
							{/if}
						</Item.Content>
						<Item.Actions>
							<Button variant="ghost" size="sm" onclick={() => startEditing(event)} disabled={currentHub.eventTargetId === event.id}>
								Edit
							</Button>
							<Button variant="ghost" size="sm" onclick={() => cancelLifecycle(event.id)} disabled={currentHub.eventTargetId === event.id}>
								Cancel
							</Button>
							<Button variant="ghost" size="sm" onclick={() => archive(event.id)} disabled={currentHub.eventTargetId === event.id}>
								Archive
							</Button>
							<Button variant="destructive" size="sm" onclick={() => remove(event.id)} disabled={currentHub.eventTargetId === event.id}>
								Delete
							</Button>
						</Item.Actions>
					</Item.Root>
				{/each}
			</Item.Group>
		{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Scheduled visibility</h3>
				<p class="text-sm text-muted-foreground">
					{scheduledEvents.length === 0
						? 'Events scheduled for later visibility will collect here.'
						: `${scheduledEvents.length} event${scheduledEvents.length === 1 ? '' : 's'} waiting to go live.`}
				</p>
			</div>

			{#if scheduledEvents.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">Nothing is queued for later visibility right now.</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group>
					{#each scheduledEvents as event (event.id)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								{@const locationLabel = getEventLocationLabel(event.location)}
								{@const engagementSignal = getEngagementSignal(event.id)}
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{event.title}</Item.Title>
									<Badge variant="outline">{getEventStateLabel(event)}</Badge>
								</div>
								<Item.Description>{event.description || 'More details will appear here soon.'}</Item.Description>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<p>{getScheduleCopy(event)}</p>
									{#if locationLabel}
										<p>{locationLabel}</p>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">
									{event.publish_at ? `Visible ${formatShortDateTime(event.publish_at)}` : 'Waiting to go live.'}
								</p>
								{#if engagementSignal}
									<p class={getEngagementClass(event.id)}>{engagementSignal.copy}</p>
								{/if}
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(event)} disabled={currentHub.eventTargetId === event.id}>
									Edit
								</Button>
								<Button variant="ghost" size="sm" onclick={() => publishNow(event)} disabled={currentHub.eventTargetId === event.id}>
									Publish now
								</Button>
								<Button variant="ghost" size="sm" onclick={() => cancelLifecycle(event.id)} disabled={currentHub.eventTargetId === event.id}>
									Cancel
								</Button>
								<Button variant="ghost" size="sm" onclick={() => archive(event.id)} disabled={currentHub.eventTargetId === event.id}>
									Archive
								</Button>
								<Button variant="destructive" size="sm" onclick={() => remove(event.id)} disabled={currentHub.eventTargetId === event.id}>
									Delete
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Event history</h3>
				<p class="text-sm text-muted-foreground">
					{inactiveEvents.length === 0
						? 'Past, canceled, or archived events will collect here.'
						: `${inactiveEvents.length} event${inactiveEvents.length === 1 ? '' : 's'} in history.`}
				</p>
			</div>

			{#if inactiveEvents.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">Nothing has moved into history yet.</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group>
					{#each inactiveEvents as event (event.id)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								{@const locationLabel = getEventLocationLabel(event.location)}
								{@const engagementSignal = getEngagementSignal(event.id)}
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{event.title}</Item.Title>
									<Badge variant="outline">{getEventStateLabel(event)}</Badge>
								</div>
								<Item.Description>{event.description || 'More details will appear here soon.'}</Item.Description>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<p>{getScheduleCopy(event)}</p>
									{#if locationLabel}
										<p>{locationLabel}</p>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">{getHistoryCopy(event)}</p>
								<p class="text-xs text-muted-foreground">{getAttendanceCopy(event.id)}</p>
								{#if engagementSignal}
									<p class={getEngagementClass(event.id)}>{engagementSignal.copy}</p>
								{/if}
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(event)} disabled={currentHub.eventTargetId === event.id}>
									Edit
								</Button>
								{#if event.archived_at || event.canceled_at}
									<Button variant="ghost" size="sm" onclick={() => restore(event.id)} disabled={currentHub.eventTargetId === event.id}>
										Restore
									</Button>
								{/if}
								<Button variant="destructive" size="sm" onclick={() => remove(event.id)} disabled={currentHub.eventTargetId === event.id}>
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
