<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
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
	const featuredContact = topContacts[0] ?? null;
	const priorityNote = attentionEvent
		? `${featuredContact?.name ?? 'Your regular lead crew'} usually closes the final gap fastest, so this schedule should move straight into the active events below.`
		: 'Coverage is healthy right now, so the board can stay focused on the live schedule instead of more top-level summary cards.';

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
	<title>Volunteer Coordinator — Old Town Cape</title>
</svelte:head>

<!-- sticky top bar -->
<div class="sticky top-0 z-20 -mx-3 border-b border-border/60 bg-background/90 backdrop-blur-sm sm:-mx-4">
	<div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card text-[0.7rem] font-semibold text-foreground"
			>
				O
			</div>
			<div>
				<p class="text-sm font-semibold leading-tight text-foreground">Old Town Cape</p>
				<p class="text-[0.7rem] leading-tight text-muted-foreground">Coordinator</p>
			</div>
		</div>
		<NewEventSheet />
	</div>
</div>

<!-- page body -->
<div class="relative isolate page-stack py-4">
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_65%)]"></div>
	<section>
		<Card.Root size="sm" class="relative overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-muted/30 shadow-sm">
			<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
			<Card.Content class="relative space-y-3 px-4 py-3 sm:px-5 sm:py-3.5 lg:grid lg:grid-cols-[minmax(0,1.28fr)_16.5rem] lg:items-start lg:gap-3.5 lg:space-y-0">
				<div class="space-y-2.25 lg:max-w-2xl">
					<div class="space-y-1.25">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Volunteer coordinator</p>
						<h1 class="text-[1.95rem] font-semibold tracking-tight text-foreground sm:text-[2.3rem] sm:leading-[0.98] lg:text-[2.4rem]">{heroTitle}</h1>
						<p class="max-w-2xl text-sm leading-5.5 text-muted-foreground">{heroSummary}</p>
					</div>

					<div class="flex flex-wrap gap-1.75 text-[0.75rem] text-muted-foreground">
						<div class="rounded-full border border-border/70 bg-background/82 px-3 py-1.35 shadow-sm">
							{filledUpcomingSlots}/{totalUpcomingSlots} positions filled
						</div>
						<div class="rounded-full border border-border/70 bg-background/82 px-3 py-1.35 shadow-sm">
							{openSlots} open spot{openSlots === 1 ? '' : 's'}
						</div>
						<div class="rounded-full border border-border/70 bg-background/82 px-3 py-1.35 shadow-sm">
							{nextPrioritySummary}
						</div>
					</div>

					<div class="rounded-[1.05rem] border border-primary/12 bg-primary/4.5 px-3.25 py-2.5 shadow-sm">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary/80">Priority note</p>
						<p class="mt-1 text-[0.82rem] leading-5 text-foreground/90">{priorityNote}</p>
					</div>

					<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/60 pt-2.5 text-[0.78rem] text-muted-foreground">
						<p class="font-medium text-foreground">{nextEvent?.title ?? 'No event scheduled'} is next on deck</p>
						<p>{nextPrioritySummary}</p>
					</div>

				</div>

				<div class="space-y-2.25 border-t border-border/60 pt-3 lg:border-l lg:border-t-0 lg:pl-3.5 lg:pt-0">
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
						<div class="rounded-2xl border border-border/70 bg-background/82 px-3 py-2.5 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Coverage</p>
							<p class="mt-1 text-[1.85rem] font-semibold tracking-tight text-foreground">{coveragePercent}%</p>
							<p class="mt-1 text-[0.8rem] leading-5 text-muted-foreground">{filledUpcomingSlots}/{totalUpcomingSlots} positions filled.</p>
						</div>

						<div class="rounded-2xl border border-border/70 bg-background/82 px-3 py-2.5 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Season snapshot</p>
							<p class="mt-1 text-[1.45rem] font-semibold tracking-tight text-foreground">{volunteerSeasonStats.eventsHeld}</p>
							<p class="mt-1 text-[0.8rem] leading-5 text-muted-foreground">{volunteerSeasonStats.totalHours} hours from {volunteerSeasonStats.totalVolunteers} volunteers.</p>
						</div>
					</div>

					<div class="rounded-2xl border border-border/70 bg-background/82 px-3 py-2.5 shadow-sm">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Staffing rhythm</p>
						<p class="mt-1 text-sm font-medium text-foreground">{staffingActivityCaptionCompact}</p>
						<p class="mt-1 text-[0.76rem] leading-5 text-muted-foreground">{seasonSummary}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>

	<div class="grid gap-3.5 lg:grid-cols-[minmax(0,1.24fr)_minmax(0,0.76fr)] lg:items-start xl:grid-cols-[minmax(0,1.36fr)_minmax(0,0.8fr)_15.5rem]">
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
								<div class="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/70 bg-muted/30 text-center">
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
										<Button href="/volunteers/{event.id}/checkin" variant="outline" size="sm" class="h-7 rounded-full px-3.5 text-[0.72rem]">Check-In</Button>
										<Button href="/signup/{event.id}" size="sm" class="h-7 rounded-full px-3.5 text-[0.72rem] shadow-sm">Public Signup</Button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Header class="gap-1.5 border-b border-border/70 py-4">
				<Card.Title class="text-lg font-semibold tracking-tight">Reliable volunteers</Card.Title>
				<Card.Description>People who regularly close the last staffing gap.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2.75 py-3.5">
				{#if featuredContact}
					<div class="rounded-2xl border border-border/70 bg-background/82 px-3 py-3 shadow-sm">
						<div class="flex items-center gap-3">
							<Avatar.Root class="size-11 shrink-0 border border-border/70 bg-background shadow-sm after:hidden">
								{#if featuredContact.avatarUrl}
									<Avatar.Image src={featuredContact.avatarUrl} alt={featuredContact.name} />
								{:else}
									<Avatar.Fallback class="text-sm font-semibold text-foreground">{getContactInitials(featuredContact.name)}</Avatar.Fallback>
								{/if}
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Featured lead</p>
								<p class="truncate text-sm font-semibold text-foreground">{featuredContact.name}</p>
								<p class="truncate text-[0.76rem] text-muted-foreground">{featuredContact.businessAffiliation ?? featuredContact.email}</p>
							</div>
						</div>
						<div class="mt-2 flex items-center justify-between gap-3 text-[0.76rem] text-muted-foreground">
							<span>{featuredContact.totalHours} hours logged</span>
							<span>{featuredContact.pastEventCount} recent events</span>
						</div>
					</div>
				{/if}

				<div class="space-y-2">
					{#each topContacts.slice(featuredContact ? 1 : 0, 4) as contact (contact.id)}
						<div class="flex items-center gap-3">
							<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-background shadow-sm after:hidden">
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
								<p class="truncate text-[0.76rem] text-muted-foreground">{contact.businessAffiliation ?? contact.email}</p>
							</div>
							<div class="text-right text-[0.72rem]">
								<p class="font-semibold tabular-nums text-foreground">{contact.totalHours}h</p>
								<p class="text-muted-foreground">{contact.pastEventCount} events</p>
							</div>
						</div>
					{/each}
				</div>

				<p class="border-t border-border/60 pt-2.5 text-[0.76rem] leading-5 text-muted-foreground">
					{latestCompleted
						? `${latestCompleted.title} just wrapped, so the next staffing push can stay focused on ${attentionEvent?.title ?? nextEvent?.title ?? 'upcoming coverage'}.`
						: seasonSummary}
				</p>
			</Card.Content>
		</Card.Root>
	</div>
</div>
