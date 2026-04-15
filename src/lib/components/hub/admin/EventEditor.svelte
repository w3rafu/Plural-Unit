<!--
  EventEditor — admin form to create, edit, and manage event lifecycle.

  Rendered by the hub manage page when the `events` plugin is active.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { syncUnsavedChanges } from '$lib/actions/unsavedChanges';
	import ExecutionDiagnosticsPanel from '$lib/components/hub/admin/ExecutionDiagnosticsPanel.svelte';
	import EventAttendanceRosterPanel from '$lib/components/hub/admin/EventAttendanceRosterPanel.svelte';
	import WorkflowSummaryPanel from '$lib/components/hub/admin/WorkflowSummaryPanel.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import {
		buildHubExecutionFollowUpTriageKey,
		buildHubExecutionQueueItemTriageKey
	} from '$lib/models/hubExecutionQueue';
	import type { HubExecutionDiagnosticEntry } from '$lib/models/hubExecutionDiagnostics';
	import {
		getEventLocationLabel,
		normalizeEventLocation
	} from '$lib/models/eventCalendarModel';
	import {
		EVENT_REMINDER_OPTIONS,
		formatEventReminderOffset,
		getEventReminderSummaryCopy,
		normalizeEventReminderOffsets
	} from '$lib/models/eventReminderModel';
	import {
		getEventAttendanceRosterSummaryCopy,
		isEventAttendanceWindowOpen
		} from '$lib/models/eventAttendanceModel';
	import {
		getEventStateLabel,
		parseEventDateTimeLocalValue,
		toEventDateTimeLocalValue
	} from '$lib/models/eventLifecycleModel';
	import {
		formatEventAttendanceSummary,
		formatEventResponseTotal,
		getEventResponseLabel,
		getEventResponseRosterSummaryCopy
	} from '$lib/models/eventResponseModel';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import type { EventRow } from '$lib/repositories/hubRepository';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { formatEventDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

	let editingId = $state<string | null>(null);
	let title = $state('');
	let description = $state('');
	let startsAt = $state('');
	let endsAt = $state('');
	let publishAt = $state('');
	let selectedReminderOffsets = $state<number[]>([]);
	let location = $state('');
	let feedback = $state('');
	let openingConversationForProfileId = $state('');
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
			reminderOffsets: editingEvent ? currentHub.getEventReminderOffsets(editingEvent.id).join('|') : '',
			location: getEventLocationLabel(editingEvent?.location)
		})
	);
	const normalizedSelectedReminderOffsets = $derived(
		normalizeEventReminderOffsets(selectedReminderOffsets)
	);
	const currentEventSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			description: description.trim(),
			startsAt,
			endsAt,
			publishAt,
			reminderOffsets: normalizedSelectedReminderOffsets.join('|'),
			location: normalizeEventLocation(location)
		})
	);
	const isEditing = $derived(!!editingEvent);
	const liveEvents = $derived(currentHub.liveEvents);
	const scheduledEvents = $derived(currentHub.scheduledEvents);
	const inactiveEvents = $derived(currentHub.inactiveEvents);
	const selectedReminderPlanCopy = $derived.by(() =>
		normalizedSelectedReminderOffsets.length === 0
			? 'No reminders will be queued for this event.'
			: `Selected: ${normalizedSelectedReminderOffsets.map((offset) => formatEventReminderOffset(offset)).join(' · ')}.`
	);
	const isEventDirty = $derived(currentEventSnapshot !== initialEventSnapshot);
	const isEventMutating = $derived(currentHub.eventTargetId !== '');
	const eventMutationStatus = $derived.by(() => {
		if (!isEventMutating) {
			return '';
		}

		if (currentHub.eventTargetId === 'draft') {
			return isEditing ? 'Saving event changes...' : 'Saving event...';
		}

		if (editingId && currentHub.eventTargetId === editingId) {
			return 'Saving changes to this event...';
		}

		return 'Updating event list...';
	});

	function resetForm() {
		editingId = null;
		title = '';
		description = '';
		startsAt = '';
		endsAt = '';
		publishAt = '';
		selectedReminderOffsets = [];
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
		selectedReminderOffsets = currentHub.getEventReminderOffsets(event.id);
		location = getEventLocationLabel(event.location);
		feedback = '';
	}

	function toggleReminderOffset(offsetMinutes: number) {
		selectedReminderOffsets = normalizeEventReminderOffsets(
			selectedReminderOffsets.includes(offsetMinutes)
				? selectedReminderOffsets.filter((value) => value !== offsetMinutes)
				: [...selectedReminderOffsets, offsetMinutes]
		);
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

	function getEventItemClass(eventId: string) {
		return page.url.hash === `#event-${eventId}`
			? 'border-primary/35 bg-primary/5 ring-2 ring-primary/20'
			: '';
	}

	function getAttendanceCopy(event: EventRow) {
		if (isEventAttendanceWindowOpen(event)) {
			const attendanceRoster = currentHub.getEventAttendanceRoster(event.id);
			if (attendanceRoster) {
				return getEventAttendanceRosterSummaryCopy(attendanceRoster);
			}
		}

		const attendance = currentHub.getEventAttendanceSummary(event.id);
		return attendance.total === 0
			? 'No responses yet.'
			: `${formatEventAttendanceSummary(attendance)} · ${formatEventResponseTotal(attendance.total)}`;
	}

	function getEngagementSignal(eventId: string) {
		return currentHub.getEventEngagementSignal(eventId);
	}

	function getResponseRoster(eventId: string) {
		return currentHub.getEventResponseRoster(eventId);
	}

	function getDeliveryStatus(eventId: string) {
		return currentHub.getEventDeliveryStatus(eventId);
	}

	function getEngagementClass(eventId: string) {
		return getEngagementSignal(eventId)?.needsAttention
			? 'text-xs text-foreground'
			: 'text-xs text-muted-foreground';
	}

	function getDeliveryClass(eventId: string) {
		return getDeliveryStatus(eventId)?.needsAttention
			? 'text-xs text-foreground'
			: 'text-xs text-muted-foreground';
	}

	function getDeliveryCopy(eventId: string) {
		const deliveryStatus = getDeliveryStatus(eventId);
		if (!deliveryStatus) {
			return null;
		}

		return deliveryStatus.state === 'scheduled'
			? 'Delivery scheduled.'
			: deliveryStatus.copy;
	}

	function getExecutionWorkflowSummaryEntries(entries: HubExecutionDiagnosticEntry[]) {
		return entries.flatMap((entry) => {
			const summary = currentHub.getWorkflowSummary(buildHubExecutionQueueItemTriageKey(entry.id));
			if (!summary) {
				return [];
			}

			return [
				{
					id: entry.id,
					label: entry.label,
					summary,
					contextCopy: entry.detailCopy
				}
			];
		});
	}

	function getEventWorkflowSummaryEntries(
		eventId: string,
		executionDiagnostics: HubExecutionDiagnosticEntry[]
	) {
		const executionEntries = getExecutionWorkflowSummaryEntries(executionDiagnostics);
		const followUpEntries = currentHub
			.getHubEventFollowUpSignals({ includeTriaged: true })
			.filter((signal) => signal.eventId === eventId)
			.flatMap((signal) => {
				const summary = currentHub.getWorkflowSummary(buildHubExecutionFollowUpTriageKey(signal));
				if (!summary) {
					return [];
				}

				return [
					{
						id: `${signal.eventId}:${signal.kind}`,
						label: signal.statusLabel,
						summary,
						contextCopy: signal.copy
					}
				];
			});

		return [...executionEntries, ...followUpEntries];
	}

	async function messageProfile(profileId: string) {
		openingConversationForProfileId = profileId;

		try {
			await currentMessages.openConversationForProfile(profileId, currentUser.details.id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description:
					error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		} finally {
			openingConversationForProfileId = '';
		}
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
				await currentHub.updateEvent(editingId, payload, normalizedSelectedReminderOffsets);
			} else {
				await currentHub.addEvent(
					payload,
					normalizedSelectedReminderOffsets.length > 0 ? normalizedSelectedReminderOffsets : undefined
				);
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

	<Card.Content class="space-y-6" aria-busy={isEventMutating}>
		<form
			class="space-y-5"
			use:syncUnsavedChanges={{
				key: UNSAVED_CHANGES_KEY,
				label: isEditing ? 'event edits' : 'event draft',
				isDirty: isEventDirty
			}}
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<Field.Set disabled={isEventMutating}>
				<Field.Group class="gap-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="event-title">Title</Field.Label>
							<Input id="event-title" type="text" bind:value={title} disabled={isEventMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="event-description">Description</Field.Label>
							<Field.Description>Optional details for people who open the event.</Field.Description>
							<Textarea id="event-description" bind:value={description} disabled={isEventMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="event-starts-at">Starts at</Field.Label>
							<Field.Description>Choose the local date and time members should see.</Field.Description>
							<Input id="event-starts-at" type="datetime-local" bind:value={startsAt} disabled={isEventMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="event-ends-at">Ends at</Field.Label>
							<Field.Description>
								Optional. Add an end time so calendar exports land with a real duration.
							</Field.Description>
							<Input id="event-ends-at" type="datetime-local" bind:value={endsAt} disabled={isEventMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="event-publish-at">Visible at</Field.Label>
							<Field.Description>
								Optional. Delay member visibility until this date and time.
							</Field.Description>
							<Input id="event-publish-at" type="datetime-local" bind:value={publishAt} disabled={isEventMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label>Reminder plan</Field.Label>
							<Field.Description>
								Optional. Queue simple in-app reminder windows before the event starts.
							</Field.Description>
							<div class="grid gap-2 sm:grid-cols-3">
								{#each EVENT_REMINDER_OPTIONS as option (option.value)}
									<label
										class={`flex items-start gap-3 rounded-xl border px-3 py-3 shadow-sm transition-colors ${normalizedSelectedReminderOffsets.includes(option.value) ? 'border-primary/35 bg-primary/5' : 'border-border/70 bg-background'} ${isEventMutating ? 'cursor-not-allowed opacity-70' : ''}`}
									>
										<Checkbox
											id={`event-reminder-${option.value}`}
											checked={normalizedSelectedReminderOffsets.includes(option.value)}
											disabled={isEventMutating}
											onCheckedChange={() => toggleReminderOffset(option.value)}
										/>
										<div class="space-y-1">
											<p class="text-sm font-medium text-foreground">{option.label}</p>
											<p class="text-xs text-muted-foreground">{option.description}</p>
										</div>
									</label>
								{/each}
							</div>
							<p class="text-xs text-muted-foreground">{selectedReminderPlanCopy}</p>
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="event-location">Location</Field.Label>
							<Field.Description>Optional room, address, or short call-in detail.</Field.Description>
							<Input id="event-location" type="text" bind:value={location} disabled={isEventMutating} />
						</Field.Content>
					</Field.Field>
				</Field.Group>
			</Field.Set>
			<div class="flex flex-wrap justify-start gap-2">
				<Button type="submit" disabled={isEventMutating}>
					{isEditing ? 'Save changes' : 'Create event'}
				</Button>
				{#if isEditing}
					<Button type="button" variant="ghost" onclick={resetForm} disabled={isEventMutating}>
						Cancel
					</Button>
				{/if}
			</div>
		</form>

		{#if isEventMutating}
			<p
				role="status"
				aria-live="polite"
				class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
			>
				{eventMutationStatus}
			</p>
		{/if}

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
			<Item.Group aria-busy={isEventMutating}>
				{#each liveEvents as event (event.id)}
					<div id={`event-${event.id}`} class="scroll-mt-28">
						<Item.Root variant="muted" size="sm" class={getEventItemClass(event.id)}>
						<Item.Content>
							{@const locationLabel = getEventLocationLabel(event.location)}
							{@const engagementSignal = getEngagementSignal(event.id)}
							{@const deliveryCopy = getDeliveryCopy(event.id)}
							{@const executionDiagnostics = currentHub.getEventExecutionDiagnostics(event.id)}
							{@const workflowSummaryEntries = getEventWorkflowSummaryEntries(event.id, executionDiagnostics)}
							{@const reminderSummary = currentHub.getEventReminderSummary(event.id)}
							{@const responseRoster = getResponseRoster(event.id)}
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
							<p class="text-xs text-muted-foreground">{getAttendanceCopy(event)}</p>
							{#if deliveryCopy}
								<p class={getDeliveryClass(event.id)}>{deliveryCopy}</p>
							{/if}
							<ExecutionDiagnosticsPanel entries={executionDiagnostics} />
							<WorkflowSummaryPanel entries={workflowSummaryEntries} />
							{#if reminderSummary && reminderSummary.count > 0}
								<p class="text-xs text-muted-foreground">{getEventReminderSummaryCopy(reminderSummary)}</p>
							{/if}
							{#if engagementSignal}
								<p class={getEngagementClass(event.id)}>{engagementSignal.copy}</p>
							{/if}
							{#if currentOrganization.isLoadingMembers && currentOrganization.members.length === 0}
								<p class="text-xs text-muted-foreground">Loading member roster for follow-up...</p>
							{:else if responseRoster && responseRoster.totalMembers > 0}
								<div class="mt-1 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm">
									<div class="space-y-1">
										<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
											Response roster
										</p>
										<p class="text-xs text-muted-foreground">
											{getEventResponseRosterSummaryCopy(responseRoster)}
										</p>
									</div>

									<div class="space-y-2">
										<p class="text-xs font-medium text-foreground">Needs follow-up</p>
										{#if responseRoster.nonResponders.length === 0}
											<p class="text-xs text-muted-foreground">Everyone on the current roster has replied.</p>
										{:else}
											<div class="space-y-2">
												{#each responseRoster.nonResponders.slice(0, 3) as entry (entry.member.profile_id)}
													<div class="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
														<div class="min-w-0 space-y-0.5">
															<p class="truncate text-sm font-medium text-foreground">
																{entry.member.name || 'Unnamed member'}
															</p>
															<p class="text-xs text-muted-foreground">
																{entry.isCurrentUser ? 'You have not replied yet.' : 'No RSVP yet.'}
															</p>
														</div>
														{#if !entry.isCurrentUser}
															<Button
																type="button"
																variant="outline"
																size="xs"
																disabled={openingConversationForProfileId === entry.member.profile_id}
																onclick={() => messageProfile(entry.member.profile_id)}
															>
																{openingConversationForProfileId === entry.member.profile_id ? 'Opening...' : 'Message'}
															</Button>
														{/if}
													</div>
												{/each}
											</div>
											{#if responseRoster.nonResponders.length > 3}
												<p class="text-xs text-muted-foreground">
													+{responseRoster.nonResponders.length - 3} more member{responseRoster.nonResponders.length - 3 === 1 ? '' : 's'} still have not replied.
												</p>
											{/if}
										{/if}
									</div>

									{#if responseRoster.responders.length > 0}
										<div class="space-y-2">
											<p class="text-xs font-medium text-foreground">Recent replies</p>
											<div class="space-y-2">
												{#each responseRoster.responders.slice(0, 3) as entry (entry.member.profile_id)}
													<div class="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
														<div class="min-w-0 space-y-0.5">
															<div class="flex flex-wrap items-center gap-2">
																<p class="truncate text-sm font-medium text-foreground">
																	{entry.member.name || 'Unnamed member'}
																</p>
																<Badge variant={entry.response === 'going' ? 'secondary' : 'outline'}>
																	{entry.response ? getEventResponseLabel(entry.response) : 'Responded'}
																</Badge>
															</div>
															<p class="text-xs text-muted-foreground">
																{entry.updatedAt ? `Replied ${formatShortDateTime(entry.updatedAt)}.` : 'Response saved.'}
															</p>
														</div>
														{#if !entry.isCurrentUser}
															<Button
																type="button"
																variant="ghost"
																size="xs"
																disabled={openingConversationForProfileId === entry.member.profile_id}
																onclick={() => messageProfile(entry.member.profile_id)}
															>
																{openingConversationForProfileId === entry.member.profile_id ? 'Opening...' : 'Message'}
															</Button>
														{/if}
													</div>
												{/each}
											</div>
											{#if responseRoster.responders.length > 3}
												<p class="text-xs text-muted-foreground">
													+{responseRoster.responders.length - 3} more member{responseRoster.responders.length - 3 === 1 ? '' : 's'} already replied.
												</p>
											{/if}
										</div>
									{/if}

									{#if responseRoster.externalResponseCount > 0}
										<p class="text-xs text-muted-foreground">
											{responseRoster.externalResponseCount} saved response{responseRoster.externalResponseCount === 1 ? '' : 's'} came from people no longer on the current roster.
										</p>
									{/if}
								</div>
							{/if}
							<EventAttendanceRosterPanel {event} />
						</Item.Content>
						<Item.Actions>
							<Button variant="ghost" size="sm" onclick={() => startEditing(event)} disabled={isEventMutating}>
								Edit
							</Button>
							<Button variant="ghost" size="sm" onclick={() => cancelLifecycle(event.id)} disabled={isEventMutating}>
								{currentHub.eventTargetId === event.id ? 'Canceling...' : 'Cancel'}
							</Button>
							<Button variant="ghost" size="sm" onclick={() => archive(event.id)} disabled={isEventMutating}>
								{currentHub.eventTargetId === event.id ? 'Archiving...' : 'Archive'}
							</Button>
							<Button variant="destructive" size="sm" onclick={() => remove(event.id)} disabled={isEventMutating}>
								{currentHub.eventTargetId === event.id ? 'Deleting...' : 'Delete'}
							</Button>
						</Item.Actions>
						</Item.Root>
					</div>
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
				<Item.Group aria-busy={isEventMutating}>
					{#each scheduledEvents as event (event.id)}
						<div id={`event-${event.id}`} class="scroll-mt-28">
							<Item.Root variant="muted" size="sm" class={getEventItemClass(event.id)}>
							<Item.Content>
								{@const locationLabel = getEventLocationLabel(event.location)}
								{@const engagementSignal = getEngagementSignal(event.id)}
								{@const deliveryCopy = getDeliveryCopy(event.id)}
								{@const executionDiagnostics = currentHub.getEventExecutionDiagnostics(event.id)}
								{@const workflowSummaryEntries = getEventWorkflowSummaryEntries(event.id, executionDiagnostics)}
								{@const reminderSummary = currentHub.getEventReminderSummary(event.id)}
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
								{#if deliveryCopy}
									<p class={getDeliveryClass(event.id)}>{deliveryCopy}</p>
								{/if}
								<ExecutionDiagnosticsPanel entries={executionDiagnostics} />
								<WorkflowSummaryPanel entries={workflowSummaryEntries} />
								{#if reminderSummary && reminderSummary.count > 0}
									<p class="text-xs text-muted-foreground">{getEventReminderSummaryCopy(reminderSummary)}</p>
								{/if}
								{#if engagementSignal}
									<p class={getEngagementClass(event.id)}>{engagementSignal.copy}</p>
								{/if}
								<EventAttendanceRosterPanel {event} />
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(event)} disabled={isEventMutating}>
									Edit
								</Button>
								<Button variant="ghost" size="sm" onclick={() => publishNow(event)} disabled={isEventMutating}>
									{currentHub.eventTargetId === event.id ? 'Publishing...' : 'Publish now'}
								</Button>
								<Button variant="ghost" size="sm" onclick={() => cancelLifecycle(event.id)} disabled={isEventMutating}>
									{currentHub.eventTargetId === event.id ? 'Canceling...' : 'Cancel'}
								</Button>
								<Button variant="ghost" size="sm" onclick={() => archive(event.id)} disabled={isEventMutating}>
									{currentHub.eventTargetId === event.id ? 'Archiving...' : 'Archive'}
								</Button>
								<Button variant="destructive" size="sm" onclick={() => remove(event.id)} disabled={isEventMutating}>
									{currentHub.eventTargetId === event.id ? 'Deleting...' : 'Delete'}
								</Button>
							</Item.Actions>
							</Item.Root>
						</div>
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
				<Item.Group aria-busy={isEventMutating}>
					{#each inactiveEvents as event (event.id)}
						<div id={`event-${event.id}`} class="scroll-mt-28">
							<Item.Root variant="muted" size="sm" class={getEventItemClass(event.id)}>
							<Item.Content>
								{@const locationLabel = getEventLocationLabel(event.location)}
								{@const engagementSignal = getEngagementSignal(event.id)}
								{@const deliveryCopy = getDeliveryCopy(event.id)}
								{@const executionDiagnostics = currentHub.getEventExecutionDiagnostics(event.id)}
								{@const workflowSummaryEntries = getEventWorkflowSummaryEntries(event.id, executionDiagnostics)}
								{@const reminderSummary = currentHub.getEventReminderSummary(event.id)}
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
								<p class="text-xs text-muted-foreground">{getAttendanceCopy(event)}</p>
								{#if deliveryCopy}
									<p class={getDeliveryClass(event.id)}>{deliveryCopy}</p>
								{/if}
								<ExecutionDiagnosticsPanel entries={executionDiagnostics} />
								<WorkflowSummaryPanel entries={workflowSummaryEntries} />
								{#if reminderSummary && reminderSummary.count > 0}
									<p class="text-xs text-muted-foreground">{getEventReminderSummaryCopy(reminderSummary)}</p>
								{/if}
								{#if engagementSignal}
									<p class={getEngagementClass(event.id)}>{engagementSignal.copy}</p>
								{/if}
								<EventAttendanceRosterPanel {event} />
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(event)} disabled={isEventMutating}>
									Edit
								</Button>
								{#if event.archived_at || event.canceled_at}
									<Button variant="ghost" size="sm" onclick={() => restore(event.id)} disabled={isEventMutating}>
										{currentHub.eventTargetId === event.id ? 'Restoring...' : 'Restore'}
									</Button>
								{/if}
								<Button variant="destructive" size="sm" onclick={() => remove(event.id)} disabled={isEventMutating}>
									{currentHub.eventTargetId === event.id ? 'Deleting...' : 'Delete'}
								</Button>
							</Item.Actions>
							</Item.Root>
						</div>
					{/each}
				</Item.Group>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
