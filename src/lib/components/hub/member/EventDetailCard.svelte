<!--
  EventDetailCard — full detail view for a single hub event.

  Shows title, description, date/time, location, lifecycle state,
  RSVP buttons, attendance summary, and calendar export actions.
-->
<script lang="ts">
	import { CalendarPlus, Download, MapPin, Clock } from '@lucide/svelte';
	import EventAttendanceRosterPanel from '$lib/components/hub/admin/EventAttendanceRosterPanel.svelte';
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
	import { getEventReminderSummaryCopy } from '$lib/models/eventReminderModel';
	import {
		EVENT_RESPONSE_OPTIONS,
		formatEventAttendanceSummary,
		getEventResponseRosterSummaryCopy
	} from '$lib/models/eventResponseModel';
	import type { EventResponseStatus, EventRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatEventDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

	let { event } = $props<{ event: EventRow }>();

	const stateLabel = $derived(getEventStateLabel(event));
	const isCanceled = $derived(Boolean(event.canceled_at));
	const locationLabel = $derived(getEventLocationLabel(event.location));
	const attendance = $derived(currentHub.getEventAttendanceSummary(event.id));
	const ownResponse = $derived(currentHub.getOwnEventResponse(event.id));
	const isSavingResponse = $derived(currentHub.eventResponseTargetId === event.id);
	const isAdmin = $derived(currentOrganization.isAdmin);
	const organizationName = $derived(currentOrganization.organization?.name ?? undefined);
	const deliveryStatus = $derived(currentHub.getEventDeliveryStatus(event.id));
	const reminderSummary = $derived(currentHub.getEventReminderSummary(event.id));
	const responseRoster = $derived(currentHub.getEventResponseRoster(event.id));
	const isLoadingMemberRoster = $derived(
		currentOrganization.isAdmin &&
			currentOrganization.isLoadingMembers &&
			currentOrganization.members.length === 0
	);
	const manageHref = $derived(`/hub/manage/content#event-${event.id}`);
	const googleCalendarHref = $derived(buildGoogleCalendarHref(event, { organizationName }));
	const calendarDownloadHref = $derived(
		buildEventCalendarDataUrl(event, { organizationName })
	);
	const deliveryCopy = $derived.by(() => {
		if (!event.publish_at) {
			return 'This event is still a draft and is not scheduled for member visibility yet.';
		}

		return deliveryStatus?.copy ?? 'Delivery status is not available for this event.';
	});
	const reminderCopy = $derived.by(() =>
		reminderSummary ? getEventReminderSummaryCopy(reminderSummary) : 'No reminders planned.'
	);
	const reminderLabel = $derived.by(() => {
		if (!reminderSummary || reminderSummary.count === 0) {
			return 'None planned';
		}

		return reminderSummary.count === 1 ? '1 reminder planned' : `${reminderSummary.count} reminders planned`;
	});
	const responseRosterCopy = $derived.by(() => {
		if (isLoadingMemberRoster) {
			return 'Loading current member roster for admin follow-up...';
		}

		if (!responseRoster) {
			return 'Current member roster unavailable.';
		}

		return getEventResponseRosterSummaryCopy(responseRoster);
	});
	const lifecycleCopy = $derived.by(() => {
		if (event.member_signal_kind === 'canceled' && event.canceled_at) {
			return `Canceled ${formatShortDateTime(event.canceled_at)}. Keep this link if you need the original details or want to watch for a restore.`;
		}

		if (event.member_signal_kind === 'restored') {
			return 'This event is back on the schedule. Review the updated timing and reminders before you head out.';
		}

		return null;
	});
	const visibilityLabel = $derived(deliveryStatus?.label ?? 'Draft');
	const utilityButtonClass = 'h-7 rounded-full px-2.5 text-[0.82rem] font-medium text-muted-foreground hover:text-foreground';

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
			<Badge variant="outline" class="rounded-xl px-2.5 py-1 text-[0.88rem] uppercase tracking-[0.16em]">
				{stateLabel}
			</Badge>
		</div>

		<div class="space-y-1.5">
			<h1 class="text-xl font-semibold text-foreground">{event.title}</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				{event.description || 'No details have been shared yet.'}
			</p>
			{#if lifecycleCopy}
				<p class="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground">
					{lifecycleCopy}
				</p>
			{/if}
		</div>

		<div class="grid gap-2 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:gap-2">
			<div class="flex items-center gap-2 sm:inline-flex sm:rounded-full sm:border sm:border-border/70 sm:bg-background/70 sm:px-3 sm:py-1.5 sm:shadow-sm">
				<Clock class="size-4 shrink-0" />
				<span>{formatEventDateTime(event.starts_at)}</span>
			</div>
			{#if event.ends_at}
				<div class="flex items-center gap-2 sm:inline-flex sm:rounded-full sm:border sm:border-border/70 sm:bg-background/70 sm:px-3 sm:py-1.5 sm:shadow-sm">
					<Clock class="hidden size-4 shrink-0 opacity-0 sm:block" />
					<span>Ends {formatShortDateTime(event.ends_at)}</span>
				</div>
			{/if}
			{#if locationLabel}
				<div class="flex items-center gap-2 sm:inline-flex sm:rounded-full sm:border sm:border-border/70 sm:bg-background/70 sm:px-3 sm:py-1.5 sm:shadow-sm">
					<MapPin class="size-4 shrink-0" />
					<span>{locationLabel}</span>
				</div>
			{/if}
		</div>

		<div class="grid gap-3 border-t border-border/70 pt-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
			<div class="space-y-2.5">
				<h2 class="text-sm font-semibold text-foreground">Your response</h2>
				<div class="flex flex-wrap gap-1.5">
					{#each EVENT_RESPONSE_OPTIONS as option (option.value)}
						<Button
							type="button"
							size="sm"
							variant={ownResponse === option.value ? 'secondary' : 'outline'}
							class="rounded-xl px-3"
							aria-pressed={ownResponse === option.value}
							disabled={isSavingResponse || isCanceled}
							onclick={() => respondToEvent(option.value)}
						>
							{option.label}
						</Button>
					{/each}
				</div>
				{#if isCanceled}
					<p class="text-[0.82rem] text-muted-foreground">
						Responses are closed because this event was canceled.
					</p>
				{:else if isSavingResponse}
					<p class="text-[0.82rem] text-muted-foreground">Saving your response...</p>
				{:else if attendance.total > 0}
					<p class="text-[0.82rem] text-muted-foreground">{formatEventAttendanceSummary(attendance)}</p>
				{/if}
			</div>

			<div class="space-y-2 lg:justify-self-end">
				<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Calendar</p>
				<div class="flex flex-wrap gap-1.5 lg:justify-end">
					<Button href={googleCalendarHref} variant="ghost" size="xs" target="_blank" rel="noreferrer" class={utilityButtonClass}>
						<CalendarPlus class="size-4" />
						Google Calendar
					</Button>
					<Button href={calendarDownloadHref} variant="ghost" size="xs" download={buildEventCalendarFileName(event)} class={utilityButtonClass}>
						<Download class="size-4" />
						Download .ics
					</Button>
				</div>
			</div>
		</div>

		{#if isAdmin}
			<div class="space-y-2.5 border-t border-border/70 pt-3.5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="space-y-1">
						<h2 class="text-sm font-semibold text-foreground">Admin context</h2>
						<p class="text-[0.82rem] text-muted-foreground">Visibility: {visibilityLabel}.</p>
					</div>
					<Button href={manageHref} variant="ghost" size="xs" class={utilityButtonClass}>
						Open in manage
					</Button>
				</div>

				<div class="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
					<div class="space-y-1 rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2.5 shadow-sm">
						<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							RSVP follow-up
						</p>
						<p class="text-[0.82rem] text-muted-foreground">{responseRosterCopy}</p>
					</div>

					<div class="space-y-1 rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2.5 shadow-sm">
						<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Reminders
						</p>
						<p class="text-sm font-medium text-foreground">{reminderLabel}</p>
						<p class="text-[0.82rem] text-muted-foreground">{reminderCopy}</p>
					</div>
				</div>

				{#if isLoadingMemberRoster}
					<p class="text-[0.82rem] text-muted-foreground">Loading member roster for admin actions...</p>
				{:else}
					<EventAttendanceRosterPanel {event} />
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
