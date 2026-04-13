<!--
  EventsSection — member-facing event list.

  Rendered by the hub coordinator when the `events` plugin is active.
-->
<script lang="ts">
	import { CalendarPlus, Download } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		buildEventCalendarDataUrl,
		buildEventCalendarFileName,
		buildGoogleCalendarHref,
		getEventLocationLabel
	} from '$lib/models/eventCalendarModel';
	import { sortLiveEvents } from '$lib/models/eventLifecycleModel';
	import {
		EVENT_RESPONSE_OPTIONS,
		formatEventAttendanceSummary,
		formatEventResponseTotal
	} from '$lib/models/eventResponseModel';
	import type { EventResponseStatus, EventRow } from '$lib/repositories/hubRepository';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';
	import { formatEventDateTime, formatShortDateTime } from '$lib/utils/dateFormat';

	let {
		events = undefined as EventRow[] | undefined,
		sectionId = undefined as string | undefined,
		showResponses = undefined as boolean | undefined,
		organizationName = undefined as string | undefined
	} = $props();

	const items = $derived.by(() => (events ? sortLiveEvents(events) : currentHub.liveEvents));
	const resolvedShowResponses = $derived(showResponses ?? events === undefined);
	const resolvedOrganizationName = $derived(
		organizationName ?? currentOrganization.organization?.name ?? undefined
	);

	async function respondToEvent(eventId: string, response: EventResponseStatus) {
		try {
			await currentHub.setEventResponse(eventId, response);
		} catch (error) {
			toast({
				title: 'Could not save response',
				description:
					error instanceof Error ? error.message : 'The event response could not be updated.',
				variant: 'error'
			});
		}
	}

	function getRecentResponseCopy(eventId: string) {
		const summary = currentHub.getEventAttendanceSummary(eventId);
		if (summary.total === 0) {
			return 'Be the first to respond.';
		}

		const recentNames = summary.recentProfileIds
			.map((profileId) => currentOrganization.members.find((member) => member.profile_id === profileId)?.name?.trim())
			.filter((name): name is string => !!name);

		if (recentNames.length === 0) {
			return formatEventResponseTotal(summary.total);
		}

		if (recentNames.length === 1) {
			return `Recent response: ${recentNames[0]}.`;
		}

		if (recentNames.length === 2) {
			return `Recent responses: ${recentNames[0]} and ${recentNames[1]}.`;
		}

		if (summary.total > recentNames.length) {
			return `Recent responses: ${recentNames[0]}, ${recentNames[1]}, and ${summary.total - 2} others.`;
		}

		return `Recent responses: ${recentNames[0]}, ${recentNames[1]}, and ${recentNames[2]}.`;
	}
</script>

<section id={sectionId} aria-label="Events" class="space-y-3 scroll-mt-24">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.events.title}</h2>
			<p class="text-sm text-muted-foreground">{PLUGIN_REGISTRY.events.description}</p>
		</div>
		<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
			{items.length} upcoming
		</p>
	</div>

	{#if items.length === 0}
		<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
			<Card.Content class="py-1">
				<p class="text-sm text-muted-foreground">No upcoming events are live yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-3">
			{#each items as event (event.id)}
				{@const attendance = currentHub.getEventAttendanceSummary(event.id)}
				{@const ownResponse = currentHub.getOwnEventResponse(event.id)}
				{@const isSavingResponse = currentHub.eventResponseTargetId === event.id}
				{@const locationLabel = getEventLocationLabel(event.location)}
				{@const googleCalendarHref = buildGoogleCalendarHref(event, { organizationName: resolvedOrganizationName })}
				{@const calendarDownloadHref = buildEventCalendarDataUrl(event, { organizationName: resolvedOrganizationName })}
				<Card.Root size="sm" class="border-border/70 bg-card">
					<Card.Content class="space-y-2.5">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<Badge variant="outline" class="rounded-xl px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
								Upcoming event
							</Badge>
							<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
								{formatEventDateTime(event.starts_at)}
							</p>
						</div>
						<div class="space-y-1">
							<h3 class="text-base font-medium text-foreground">{event.title}</h3>
							<p class="text-sm leading-5 text-muted-foreground">
								{event.description || 'More details will appear here soon.'}
							</p>
						</div>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
							{#if locationLabel}
								<p>{locationLabel}</p>
							{/if}
							{#if event.ends_at}
								<p>Ends {formatShortDateTime(event.ends_at)}</p>
							{/if}
							{#if resolvedShowResponses && attendance.total > 0}
								<p>{formatEventAttendanceSummary(attendance)}</p>
							{/if}
						</div>

						<div class="space-y-2 border-t border-border/70 pt-2.5">
							{#if resolvedShowResponses}
								<div class="flex flex-wrap gap-1.5">
									{#each EVENT_RESPONSE_OPTIONS as option (option.value)}
										<Button
											type="button"
											size="xs"
											variant={ownResponse === option.value ? 'secondary' : 'outline'}
											class="rounded-xl px-2.5"
											aria-pressed={ownResponse === option.value}
											disabled={isSavingResponse}
											onclick={() => respondToEvent(event.id, option.value)}
										>
											{option.label}
										</Button>
									{/each}
								</div>
								<p class="text-xs text-muted-foreground">
									{isSavingResponse ? 'Saving your response...' : getRecentResponseCopy(event.id)}
								</p>
							{/if}
							<div class="flex flex-wrap gap-1.5">
								<Button href={googleCalendarHref} variant="outline" size="xs" target="_blank" rel="noreferrer">
									<CalendarPlus class="size-3.5" />
									Google Calendar
								</Button>
								<Button href={calendarDownloadHref} variant="ghost" size="xs" download={buildEventCalendarFileName(event)}>
									<Download class="size-3.5" />
									Download .ics
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</section>
