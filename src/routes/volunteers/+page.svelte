<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import ActivityDotGrid from '$lib/components/ui/ActivityDotGrid.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import FillPill from '$lib/components/volunteer/FillPill.svelte';
	import NewEventSheet from '$lib/components/volunteer/NewEventSheet.svelte';
	import {
		volunteerEvents,
		volunteerContacts,
		volunteerSeasonStats,
		getEventFilledSlots,
		getEventTotalSlots,
		getFillStatus
	} from '$lib/demo/volunteerFixtures';

	const upcoming = volunteerEvents.filter((e) => e.id !== 'vol-event-3');
	const completed = volunteerEvents.filter((e) => e.id === 'vol-event-3');
	const totalUpcomingSlots = upcoming.reduce((sum, event) => sum + getEventTotalSlots(event), 0);
	const filledUpcomingSlots = upcoming.reduce((sum, event) => sum + getEventFilledSlots(event), 0);
	const openSlots = totalUpcomingSlots - filledUpcomingSlots;
	const coveragePercent = totalUpcomingSlots ? Math.round((filledUpcomingSlots / totalUpcomingSlots) * 100) : 0;
	const nextEvent = upcoming[0] ?? null;
	const latestCompleted = completed[0] ?? null;
	const attentionEvent =
		[...upcoming].sort(
			(left, right) =>
				getEventTotalSlots(right) - getEventFilledSlots(right) - (getEventTotalSlots(left) - getEventFilledSlots(left))
		)[0] ?? null;
	const attentionGap = attentionEvent
		? getEventTotalSlots(attentionEvent) - getEventFilledSlots(attentionEvent)
		: 0;
	const heroTitle = attentionEvent
		? `${attentionEvent.title} still needs ${attentionGap} volunteer${attentionGap === 1 ? '' : 's'}`
		: 'Current volunteer events are fully covered';
	const heroSummary = attentionEvent
		? `${upcoming.length} upcoming events are active, and this is the clearest staffing gap to close next.`
		: `${upcoming.length} upcoming events are staffed across ${totalUpcomingSlots} scheduled positions.`;
	const seasonSummary = `${volunteerSeasonStats.totalHours} hours contributed by ${volunteerSeasonStats.totalVolunteers} volunteers with a ${(100 - volunteerSeasonStats.noShowRate * 100).toFixed(1)}% show rate.`;
	const nextPrioritySummary = attentionEvent
		? `${attentionEvent.date} · ${attentionEvent.timeRange}`
		: nextEvent
			? `${nextEvent.title} · ${nextEvent.date}`
			: 'No upcoming events scheduled.';
	const topContacts = [...volunteerContacts]
		.sort((left, right) => right.totalHours - left.totalHours)
		.slice(0, 5);
	const quickContacts = topContacts.slice(0, 3);

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function buildActivityCells(seedValues: number[], offset: number) {
		return Array.from({ length: 28 }, (_, index) => {
			const base = seedValues[index % seedValues.length] ?? 0;
			const bucket = clamp(Math.round(base / 25), 0, 4);
			const wave = index % 7 >= 3 ? 1 : 0;
			const pulse = (index + offset) % 6 === 0 ? 1 : 0;
			const dip = (index + offset) % 5 === 0 ? 1 : 0;
			return clamp(bucket + wave + pulse - dip, 0, 4);
		});
	}

	const staffingActivityValues = buildActivityCells(
		[
			coveragePercent,
			coveragePercent - attentionGap * 2,
			volunteerSeasonStats.eventsHeld * 8,
			(100 - volunteerSeasonStats.noShowRate * 100),
			topContacts[0]?.pastEventCount ? topContacts[0].pastEventCount * 10 : 0
		],
		volunteerSeasonStats.eventsHeld + attentionGap
	);
	const staffingActivityCaption =
		coveragePercent >= 70
			? 'Recent staffing remained fairly steady even with multiple events in motion.'
			: 'Recent staffing rhythm still needs another push before the busiest dates arrive.';
	const staffingActivityCaptionCompact =
		coveragePercent >= 70
			? 'Steady across the last few weeks.'
			: 'Needs another push before the busiest dates.';

	function getContactInitials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function getDateParts(date: string) {
		const [month, day] = date.split(' ');
		return {
			month: month.slice(0, 3).toUpperCase(),
			day: day.replace(',', '')
		};
	}
</script>

<svelte:head>
	<title>Volunteer Coordinator — Harbor Unit</title>
</svelte:head>

<!-- sticky top bar -->
<div class="sticky top-0 z-20 -mx-3 border-b border-border/60 bg-background/90 backdrop-blur-sm sm:-mx-4">
	<div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card text-[0.7rem] font-semibold text-foreground"
			>
				H
			</div>
			<div>
				<p class="text-sm font-semibold leading-tight text-foreground">Harbor Unit</p>
				<p class="text-[0.7rem] leading-tight text-muted-foreground">Coordinator</p>
			</div>
		</div>
		<NewEventSheet />
	</div>
</div>

<!-- page body -->
<div class="relative isolate page-stack py-5">
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_65%)]"></div>
	<section>
		<Card.Root size="sm" class="relative overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-muted/30 shadow-sm">
			<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
			<Card.Content class="relative space-y-4 px-4 py-5 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.92fr)] lg:items-start lg:gap-5 lg:space-y-0">
				<div class="space-y-3.5 lg:max-w-2xl">
					<div class="space-y-1.5">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Volunteer coordinator</p>
						<h1 class="text-[2.15rem] font-semibold tracking-tight text-foreground sm:text-[2.55rem] sm:leading-[0.98] lg:text-[2.8rem]">{heroTitle}</h1>
						<p class="max-w-2xl text-sm leading-6 text-muted-foreground">{heroSummary}</p>
					</div>

					<div class="rounded-[1.25rem] border border-border/70 bg-background/82 px-4 py-3 shadow-sm">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Why this matters</p>
						<p class="mt-2 text-sm font-medium text-foreground">{filledUpcomingSlots} of {totalUpcomingSlots} scheduled positions are filled.</p>
						<p class="mt-1 text-[0.84rem] leading-5 text-muted-foreground">{nextPrioritySummary}</p>
					</div>

				</div>

				<div class="space-y-3.5 border-t border-border/60 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
					<div class="grid grid-cols-2 gap-2.5">
						<div class="rounded-[1rem] border border-border/70 bg-background/82 px-3.5 py-3 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Coverage</p>
							<p class="mt-1 text-[2rem] font-semibold tracking-tight text-foreground">{coveragePercent}%</p>
							<p class="mt-1 text-[0.82rem] leading-5 text-muted-foreground">{filledUpcomingSlots}/{totalUpcomingSlots} positions filled.</p>
						</div>

						<div class="rounded-[1rem] border border-border/70 bg-background/82 px-3.5 py-3 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next up</p>
							<p class="mt-1 text-sm font-semibold text-foreground">{nextEvent?.title ?? 'No event scheduled'}</p>
							<p class="mt-1 text-[0.82rem] leading-5 text-muted-foreground">{nextEvent ? `${nextEvent.date} · ${nextEvent.timeRange}` : 'Nothing queued yet.'}</p>
						</div>

						<div class="rounded-[1rem] border border-border/70 bg-background/82 px-3.5 py-3 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Open gap</p>
							<p class="mt-1 text-[1.55rem] font-semibold tracking-tight text-foreground">{attentionGap}</p>
							<p class="mt-1 text-[0.82rem] leading-5 text-muted-foreground">{attentionEvent ? `${attentionEvent.title} still needs coverage.` : 'No staffing gap is active right now.'}</p>
						</div>

						<div class="rounded-[1rem] border border-border/70 bg-background/82 px-3.5 py-3 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Season snapshot</p>
							<p class="mt-1 text-[1.55rem] font-semibold tracking-tight text-foreground">{volunteerSeasonStats.eventsHeld}</p>
							<p class="mt-1 text-[0.82rem] leading-5 text-muted-foreground">{volunteerSeasonStats.totalHours} hours from {volunteerSeasonStats.totalVolunteers} volunteers.</p>
						</div>
					</div>

					<ActivityDotGrid title="Staffing activity" caption={staffingActivityCaptionCompact} values={staffingActivityValues} compact={true} />

					<div class="rounded-[1.1rem] border border-border/70 bg-background/82 px-3.5 py-3.5 shadow-sm">
						<div>
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">People to call</p>
							<p class="mt-1 text-sm text-muted-foreground">Trusted volunteers who usually close the next staffing gap fastest.</p>
						</div>
						<div class="mt-3 space-y-2.5">
							{#each quickContacts as contact (contact.id)}
								<div class="flex items-center gap-3 rounded-[1rem] bg-muted/12 px-3 py-2.5">
									<Avatar.Root class="size-10 border border-border/70 bg-background shadow-sm after:hidden">
										{#if contact.avatarUrl}
											<Avatar.Image src={contact.avatarUrl} alt={contact.name} />
										{:else}
											<Avatar.Fallback class="text-sm font-semibold text-foreground">
												{getContactInitials(contact.name)}
											</Avatar.Fallback>
										{/if}
									</Avatar.Root>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-foreground">{contact.name}</p>
										<p class="truncate text-xs text-muted-foreground">{contact.businessAffiliation ?? contact.email}</p>
									</div>
									<div class="text-right text-xs">
										<p class="font-semibold tabular-nums text-foreground">{contact.totalHours}h</p>
										<p class="text-muted-foreground">{contact.pastEventCount} events</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.88fr)_17rem]">
		<Card.Root size="sm" class="border-border/70 bg-card xl:col-span-2">
			<Card.Header class="gap-2 border-b border-border/70">
				<div class="flex items-end justify-between gap-3">
					<div>
						<Card.Title class="text-lg font-semibold tracking-tight">Current schedule</Card.Title>
						<Card.Description>{upcoming.length} upcoming events, ordered for quick staffing review.</Card.Description>
					</div>
					<p class="text-xs text-muted-foreground">{filledUpcomingSlots}/{totalUpcomingSlots} filled</p>
				</div>
			</Card.Header>
			<Card.Content class="px-0 py-0">
				<div class="divide-y divide-border/50">
					{#each upcoming as event (event.id)}
						{@const total = getEventTotalSlots(event)}
						{@const filled = getEventFilledSlots(event)}
						{@const status = getFillStatus(filled, total)}
						{@const fillPct = Math.round((filled / total) * 100)}
						{@const openCount = total - filled}
						<div class={`space-y-2.5 px-4 py-3.5 sm:px-5 ${attentionEvent?.id === event.id ? 'bg-primary/[0.035]' : ''}`}>
							<div class="flex items-start gap-3">
								<div class="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[1rem] border border-border/70 bg-muted/30 text-center">
									<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
									<p class="text-base font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
								</div>

								<div class="min-w-0 flex-1 space-y-1.5">
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-[0.98rem] font-semibold tracking-tight text-foreground">{event.title}</p>
										<FillPill {filled} needed={total} {status} />
									</div>
									<p class="text-sm text-muted-foreground">{event.location}</p>
									<p class="text-[0.76rem] text-muted-foreground">
										{event.timeRange} · {event.shifts.length} shift{event.shifts.length === 1 ? '' : 's'} · {openCount} open
									</p>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-xs text-muted-foreground">
											<span>{filled}/{total} filled</span>
											<span>{openCount} open</span>
										</div>
										<div class="h-2 overflow-hidden rounded-full bg-muted">
											<div
												class={`h-full rounded-full transition-all ${status === 'full' ? 'bg-muted-foreground' : status === 'need-more' ? 'bg-yellow-500/90' : 'bg-foreground/70'}`}
												style="width: {fillPct}%"
											></div>
										</div>
									</div>
									<div class="flex flex-wrap gap-2 pt-1">
										<Button href="/volunteers/{event.id}/checkin" size="sm" class="h-7 rounded-full px-3.5 text-[0.72rem]">Check-In</Button>
										<Button href="/signup/{event.id}" variant="outline" size="sm" class="h-7 rounded-full px-3.5 text-[0.72rem] text-muted-foreground">Public Signup</Button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Header class="gap-2 border-b border-border/70">
				<Card.Title class="text-lg font-semibold tracking-tight">Reliable volunteers</Card.Title>
				<Card.Description>Real people who repeatedly help the schedule land on time.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="space-y-2.5">
					{#each topContacts as contact (contact.id)}
						<div class="flex items-center gap-3">
							<Avatar.Root class="size-10 shrink-0 border border-border/70 bg-background shadow-sm after:hidden">
								{#if contact.avatarUrl}
									<Avatar.Image src={contact.avatarUrl} alt={contact.name} />
								{:else}
									<Avatar.Fallback class="text-xs font-semibold text-primary">
										{getContactInitials(contact.name)}
									</Avatar.Fallback>
								{/if}
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">{contact.name}</p>
								<p class="truncate text-xs text-muted-foreground">{contact.businessAffiliation ?? contact.email}</p>
							</div>
							<div class="text-right text-xs">
								<p class="font-semibold tabular-nums text-foreground">{contact.totalHours}h</p>
								<p class="text-muted-foreground">{contact.pastEventCount} events</p>
							</div>
						</div>
					{/each}
				</div>

				<div class="border-t border-border/60 pt-3">
					<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest completion</p>
					<p class="mt-2 text-sm font-medium text-foreground">{latestCompleted?.title ?? 'No completed event yet'}</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{latestCompleted ? `${latestCompleted.location} · ${volunteerSeasonStats.eventsHeld} events held this season` : `${volunteerSeasonStats.eventsHeld} events held this season`}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
