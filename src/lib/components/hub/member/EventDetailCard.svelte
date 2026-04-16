<!--
  EventDetailCard — full detail view for a single hub event.

  Shows title, description, date/time, location, lifecycle state,
  RSVP buttons, attendance summary, and calendar export actions.
-->
<script lang="ts">
	import { CalendarPlus, Download, MapPin, Clock } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		buildEventCalendarDataUrl,
		buildEventCalendarFileName,
		buildGoogleCalendarHref,
		getEventLocationLabel
	} from '$lib/models/eventCalendarModel';
	import { getEventStateLabel } from '$lib/models/eventLifecycleModel';
	import {
		EVENT_RESPONSE_OPTIONS,
		formatEventAttendanceSummary
	} from '$lib/models/eventResponseModel';
	import type { EventResponseStatus, EventRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatEventDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

	let { event } = $props<{ event: EventRow }>();

	const stateLabel = $derived(getEventStateLabel(event));
	const locationLabel = $derived(getEventLocationLabel(event.location));
	const attendance = $derived(currentHub.getEventAttendanceSummary(event.id));
	const ownResponse = $derived(currentHub.getOwnEventResponse(event.id));
	const isSavingResponse = $derived(currentHub.eventResponseTargetId === event.id);
	const organizationName = $derived(currentOrganization.organization?.name ?? undefined);
	const googleCalendarHref = $derived(buildGoogleCalendarHref(event, { organizationName }));
	const calendarDownloadHref = $derived(
		buildEventCalendarDataUrl(event, { organizationName })
	);

	async function respondToEvent(response: EventResponseStatus) {
		try {
			await currentHub.setEventResponse(event.id, response);
		} catch (error) {
			toast({
				title: 'Could not save response',
				description:
					error instanceof Error ? error.message : 'The event response could not be updated.',
				variant: 'error'
			});
		}
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Content class="space-y-4">
		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="outline" class="rounded-xl px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
				{stateLabel}
			</Badge>
		</div>

		<div class="space-y-1.5">
			<h1 class="text-xl font-semibold text-foreground">{event.title}</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				{event.description || 'No details have been shared yet.'}
			</p>
		</div>

		<div class="space-y-1.5 text-sm text-muted-foreground">
			<div class="flex items-center gap-2">
				<Clock class="size-4 shrink-0" />
				<span>{formatEventDateTime(event.starts_at)}</span>
			</div>
			{#if event.ends_at}
				<div class="flex items-center gap-2 pl-6">
					<span>Ends {formatShortDateTime(event.ends_at)}</span>
				</div>
			{/if}
			{#if locationLabel}
				<div class="flex items-center gap-2">
					<MapPin class="size-4 shrink-0" />
					<span>{locationLabel}</span>
				</div>
			{/if}
		</div>

		<div class="space-y-3 border-t border-border/70 pt-4">
			<h2 class="text-sm font-semibold text-foreground">Your response</h2>
			<div class="flex flex-wrap gap-1.5">
				{#each EVENT_RESPONSE_OPTIONS as option (option.value)}
					<Button
						type="button"
						size="sm"
						variant={ownResponse === option.value ? 'secondary' : 'outline'}
						class="rounded-xl px-3"
						aria-pressed={ownResponse === option.value}
						disabled={isSavingResponse}
						onclick={() => respondToEvent(option.value)}
					>
						{option.label}
					</Button>
				{/each}
			</div>
			{#if isSavingResponse}
				<p class="text-xs text-muted-foreground">Saving your response...</p>
			{:else if attendance.total > 0}
				<p class="text-xs text-muted-foreground">{formatEventAttendanceSummary(attendance)}</p>
			{/if}
		</div>

		<div class="space-y-2 border-t border-border/70 pt-4">
			<h2 class="text-sm font-semibold text-foreground">Add to calendar</h2>
			<div class="flex flex-wrap gap-1.5">
				<Button href={googleCalendarHref} variant="outline" size="sm" target="_blank" rel="noreferrer">
					<CalendarPlus class="size-4" />
					Google Calendar
				</Button>
				<Button href={calendarDownloadHref} variant="ghost" size="sm" download={buildEventCalendarFileName(event)}>
					<Download class="size-4" />
					Download .ics
				</Button>
			</div>
		</div>
	</Card.Content>
</Card.Root>
