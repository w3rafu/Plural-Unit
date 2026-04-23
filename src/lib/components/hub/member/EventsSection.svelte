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
	import {
		EVENT_RESPONSE_OPTIONS,
		formatEventResponseTotal
	} from '$lib/models/eventResponseModel';
	import {
		getMemberEventTimingState,
		sortMemberVisibleEvents,
		type MemberCommitmentResponseLookup
	} from '$lib/models/memberCommitmentModel';
	import type { EventResponseStatus, EventRow } from '$lib/repositories/hubRepository';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { PLUGIN_REGISTRY } from '$lib/stores/pluginRegistry';
	import { formatEventDateTime, formatShortDate } from '$lib/utils/dateFormat';

	let {
		events = undefined as EventRow[] | undefined,
		sectionId = undefined as string | undefined,
		showResponses = undefined as boolean | undefined,
		organizationName = undefined as string | undefined,
		ownResponses = undefined as MemberCommitmentResponseLookup | undefined
	} = $props();

	const items = $derived.by(() => sortMemberVisibleEvents(events ?? currentHub.events));
	const resolvedShowResponses = $derived(showResponses ?? events === undefined);
	const resolvedOrganizationName = $derived(
		organizationName ?? currentOrganization.organization?.name ?? undefined
	);
	const resolvedOwnResponses = $derived.by(() => {
		if (ownResponses) {
			return ownResponses;
		}

		if (events !== undefined) {
			return {};
		}

		return Object.fromEntries(items.map((event) => [event.id, currentHub.getOwnEventResponse(event.id)]));
	});
	const upcomingItems = $derived(
		items.filter((event) => getMemberEventTimingState(event) !== 'recently_completed')
	);
	const schedulePreview = $derived.by(() => {
		const dayGroups = new Map<string, { event: EventRow; count: number }>();

		for (const event of upcomingItems) {
			const label = formatShortDate(event.starts_at);
			if (!label) {
				continue;
			}

			const existing = dayGroups.get(label);
			if (existing) {
				existing.count += 1;
				continue;
			}

			dayGroups.set(label, { event, count: 1 });
		}

		return Array.from(dayGroups.entries())
			.slice(0, 5)
			.map(([label, entry]) => {
				const dateParts = getDateParts(entry.event.starts_at);
				return {
					key: label,
					label,
					month: dateParts.month,
					day: dateParts.day,
					count: entry.count,
					isToday: getMemberEventTimingState(entry.event) === 'today',
					summary:
						entry.count === 1
							? `${entry.event.title} · ${getEventTimeLabel(entry.event.starts_at)}`
							: `${entry.event.title} + ${entry.count - 1} more`
				};
			});
	});

	function getStatusVariant(
		status: 'reply_needed' | 'going' | 'maybe' | 'cannot_attend' | 'attended' | 'absent'
	) {
		if (status === 'reply_needed' || status === 'absent') {
			return 'destructive';
		}

		return status === 'going' || status === 'attended' ? 'secondary' : 'outline';
	}

	function getResponseVariant(response: EventResponseStatus | null) {
		if (!response) {
			return 'outline';
		}

		return getStatusVariant(response);
	}

	function getSavedResponseLabel(response: EventResponseStatus | null) {
		return EVENT_RESPONSE_OPTIONS.find((option) => option.value === response)?.label ?? null;
	}

	function getTimingBadgeCopy(event: EventRow) {
		const timingState = getMemberEventTimingState(event);

		if (timingState === 'today') {
			return 'Today';
		}

		if (timingState === 'in_progress') {
			return 'In progress';
		}

		return 'Upcoming event';
	}

	function getDateParts(value: string) {
		const formatted = formatShortDate(value);
		const [month = '', dayToken = ''] = formatted.split(' ');

		return {
			month: month.slice(0, 3).toUpperCase(),
			day: dayToken.replace(',', '')
		};
	}

	function getEventTimeLabel(value: string) {
		const formatted = formatEventDateTime(value);
		const parts = formatted.split(', ');
		return parts[parts.length - 1] ?? formatted;
	}

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

	const utilityButtonClass = 'h-7 rounded-full px-2.5 text-[0.72rem] font-medium text-muted-foreground hover:text-foreground';
</script>

<section id={sectionId} aria-label="Events" class="space-y-3 scroll-mt-24">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{PLUGIN_REGISTRY.events.title}</h2>
			<p class="text-sm text-muted-foreground">{PLUGIN_REGISTRY.events.description}</p>
		</div>
		<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
			{upcomingItems.length} upcoming
		</p>
	</div>

	{#if items.length === 0}
		<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
			<Card.Content class="py-1">
				<p class="text-sm text-muted-foreground">No upcoming or recent events are live yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
			<div class="grid gap-3 xl:grid-cols-2">
				{#each upcomingItems as event (event.id)}
					{@const attendance = currentHub.getEventAttendanceSummary(event.id)}
					{@const ownResponse = resolvedOwnResponses[event.id] ?? null}
					{@const isSavingResponse = currentHub.eventResponseTargetId === event.id}
					{@const locationLabel = getEventLocationLabel(event.location)}
					{@const googleCalendarHref = buildGoogleCalendarHref(event, { organizationName: resolvedOrganizationName })}
					{@const calendarDownloadHref = buildEventCalendarDataUrl(event, { organizationName: resolvedOrganizationName })}
					{@const savedResponseLabel = getSavedResponseLabel(ownResponse)}
					{@const dateParts = getDateParts(event.starts_at)}
					<Card.Root size="sm" class="border-border/70 bg-card">
						<Card.Content class="space-y-3.5">
							<div class="grid gap-3 sm:grid-cols-[auto,minmax(0,1fr)] sm:items-start">
								<div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[1rem] border border-border/70 bg-background/80 text-center shadow-sm">
									<p class="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{dateParts.month}</p>
									<p class="text-base font-semibold tracking-tight text-foreground">{dateParts.day}</p>
								</div>

								<div class="min-w-0 space-y-2.5">
									<div class="flex flex-wrap items-start justify-between gap-2">
										<div class="min-w-0 space-y-1.5">
											<div class="flex flex-wrap items-center gap-1.5">
												<Badge variant="muted" class="rounded-xl px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
													{getTimingBadgeCopy(event)}
												</Badge>
												{#if savedResponseLabel}
													<Badge variant={getResponseVariant(ownResponse)}>{savedResponseLabel}</Badge>
												{/if}
											</div>
											<h3 class="text-base font-medium text-foreground">
												<a href="/hub/event/{event.id}" class="hover:underline">{event.title}</a>
											</h3>
										</div>
										<p class="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-right">
											{getEventTimeLabel(event.starts_at)}
										</p>
									</div>

									<p class="text-sm leading-5 text-muted-foreground">
										{event.description || 'More details will appear here soon.'}
									</p>

									<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
										<span>{formatEventDateTime(event.starts_at)}</span>
										{#if locationLabel}
											<span>{locationLabel}</span>
										{/if}
									</div>
								</div>
							</div>

							<div class="space-y-2.5 border-t border-border/70 pt-3">
								{#if resolvedShowResponses}
									<div class="flex flex-wrap gap-1.5">
										{#each EVENT_RESPONSE_OPTIONS as option (option.value)}
											<Button
												type="button"
												size="xs"
												variant={ownResponse === option.value ? 'secondary' : 'outline'}
												class="rounded-full px-3"
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
								{:else if attendance.total > 0}
									<p class="text-xs text-muted-foreground">{formatEventResponseTotal(attendance.total)} replied.</p>
								{/if}

								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="flex flex-wrap gap-1.5">
										<Button href={googleCalendarHref} variant="ghost" size="xs" target="_blank" rel="noreferrer" class={utilityButtonClass}>
											<CalendarPlus class="size-3.5" />
											Google Calendar
										</Button>
										<Button href={calendarDownloadHref} variant="ghost" size="xs" download={buildEventCalendarFileName(event)} class={utilityButtonClass}>
											<Download class="size-3.5" />
											Download .ics
										</Button>
									</div>
									<a href="/hub/event/{event.id}" class="text-xs font-medium text-foreground underline-offset-4 hover:underline">
										Details
									</a>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>

			{#if schedulePreview.length > 0}
				<Card.Root size="sm" class="hidden border-border/70 bg-card xl:sticky xl:top-24 xl:block">
					<Card.Content class="space-y-3.5">
						<div class="space-y-1">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Schedule</p>
							<p class="text-sm text-muted-foreground">
								{schedulePreview.length} active date{schedulePreview.length === 1 ? '' : 's'} coming up.
							</p>
						</div>

						<div class="space-y-2.5">
							{#each schedulePreview as day (day.key)}
								<div class="grid grid-cols-[auto,minmax(0,1fr)] gap-3 rounded-[1rem] border border-border/70 bg-background/75 px-3 py-2.5 shadow-sm">
									<div class="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[0.95rem] border border-border/70 bg-background text-center">
										<p class="text-[0.54rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{day.month}</p>
										<p class="text-sm font-semibold tracking-tight text-foreground">{day.day}</p>
									</div>

									<div class="min-w-0 space-y-1">
										<div class="flex items-center justify-between gap-2">
											<p class="truncate text-sm font-medium text-foreground">{day.label}</p>
											<Badge variant={day.isToday ? 'secondary' : 'muted'} class="px-2 py-0 text-[0.65rem]">
												{day.isToday ? 'Today' : day.count}
											</Badge>
										</div>
										<p class="text-xs text-muted-foreground">{day.summary}</p>
									</div>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{/if}
</section>
