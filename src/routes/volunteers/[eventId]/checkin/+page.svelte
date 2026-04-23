<script lang="ts">
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { findVolunteerContactByName, getVolunteerEvent } from '$lib/demo/volunteerFixtures';

	const event = $derived(getVolunteerEvent(page.params.eventId ?? ''));

	// Mock signups: distribute contacts across shifts for demo purposes
	const mockSignups: Record<string, { name: string; affiliation?: string }[]> = {
		s1: [
			{ name: 'Megan Carter', affiliation: 'Cape Shore Bank' },
			{ name: 'Tyler Dawson', affiliation: 'Dawson Grounds Co.' },
			{ name: 'Lauren Mitchell', affiliation: 'Mitchell Family Law' },
			{ name: 'Brooke Simmons', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Connor Hayes', affiliation: 'West End Hardware' },
			{ name: 'Erin Wallace', affiliation: 'Northside Health Clinic' },
			{ name: 'Garrett Cole', affiliation: 'Cape Sound Collective' },
			{ name: 'Melissa Hart', affiliation: 'Hart Catering Co.' }
		],
		s2: [
			{ name: 'Tyler Dawson', affiliation: 'Dawson Grounds Co.' },
			{ name: 'Connor Hayes', affiliation: 'West End Hardware' },
			{ name: 'Garrett Cole', affiliation: 'Cape Sound Collective' },
			{ name: 'Brooke Simmons', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Megan Carter', affiliation: 'Cape Shore Bank' },
			{ name: 'Lauren Mitchell', affiliation: 'Mitchell Family Law' },
			{ name: 'Melissa Hart', affiliation: 'Hart Catering Co.' },
			{ name: 'Erin Wallace', affiliation: 'Northside Health Clinic' },
			{ name: 'Aiden Clarke', affiliation: 'Riverside Commons' },
			{ name: 'Sofia Reyes', affiliation: 'City Press' }
		],
		s3: [
			{ name: 'Connor Hayes', affiliation: 'West End Hardware' },
			{ name: 'Garrett Cole', affiliation: 'Cape Sound Collective' },
			{ name: 'Brooke Simmons', affiliation: 'Harbor Youth Sailing' }
		],
		s4: [
			{ name: 'Tyler Dawson', affiliation: 'Dawson Grounds Co.' },
			{ name: 'Megan Carter', affiliation: 'Cape Shore Bank' },
			{ name: 'Erin Wallace', affiliation: 'Northside Health Clinic' },
			{ name: 'Garrett Cole', affiliation: 'Cape Sound Collective' },
			{ name: 'Melissa Hart', affiliation: 'Hart Catering Co.' }
		],
		s5: [
			{ name: 'Connor Hayes', affiliation: 'West End Hardware' },
			{ name: 'Brooke Simmons', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Lauren Mitchell', affiliation: 'Mitchell Family Law' },
			{ name: 'Aiden Clarke', affiliation: 'Riverside Commons' }
		],
		s6: [
			{ name: 'Megan Carter', affiliation: 'Cape Shore Bank' },
			{ name: 'Tyler Dawson', affiliation: 'Dawson Grounds Co.' },
			{ name: 'Erin Wallace', affiliation: 'Northside Health Clinic' },
			{ name: 'Garrett Cole', affiliation: 'Cape Sound Collective' },
			{ name: 'Brooke Simmons', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Connor Hayes', affiliation: 'West End Hardware' },
			{ name: 'Lauren Mitchell', affiliation: 'Mitchell Family Law' },
			{ name: 'Melissa Hart', affiliation: 'Hart Catering Co.' },
			{ name: 'Sofia Reyes', affiliation: 'City Press' },
			{ name: 'Aiden Clarke', affiliation: 'Riverside Commons' },
			{ name: 'Marcus Webb', affiliation: 'Civic Design Studio' },
			{ name: 'Nadia Flores', affiliation: 'Riverview Dental' },
			{ name: 'Omar Hassan', affiliation: 'Community Health Alliance' },
			{ name: 'Yuki Tanaka', affiliation: 'Sterling & Co.' }
		],
		s7: [
			{ name: 'Megan Carter', affiliation: 'Cape Shore Bank' },
			{ name: 'Tyler Dawson', affiliation: 'Dawson Grounds Co.' },
			{ name: 'Lauren Mitchell', affiliation: 'Mitchell Family Law' },
			{ name: 'Garrett Cole', affiliation: 'Cape Sound Collective' }
		]
	};

	let selectedShiftId = $state<string | null>(null);
	let checkedIn = $state<Set<string>>(new Set());

	const activeShiftId = $derived(selectedShiftId ?? event?.shifts[0]?.id ?? null);
	const activeShift = $derived(event?.shifts.find((shift) => shift.id === activeShiftId) ?? null);
	const signups = $derived(activeShiftId ? (mockSignups[activeShiftId] ?? []) : []);
	const totalRegistered = $derived(event?.shifts.reduce((sum, shift) => sum + shift.filled, 0) ?? 0);
	const checkedCount = $derived(signups.filter((_, index) => checkedIn.has(`${activeShiftId}-${index}`)).length);
	const completionPercent = $derived(signups.length ? Math.round((checkedCount / signups.length) * 100) : 0);
	const remainingCheckIns = $derived(Math.max(signups.length - checkedCount, 0));
	const activeShiftWindow = $derived(activeShift ? `${activeShift.startTime} – ${activeShift.endTime}` : '');
	const activeShiftSummary = $derived.by(() => {
		if (!activeShift) {
			return 'Choose a shift to start day-of check-in.';
		}

		if (signups.length === 0) {
			return `No one is assigned to ${activeShift.title} yet.`;
		}

		return `${remainingCheckIns} of ${signups.length} people on ${activeShift.title} still need check-in.`;
	});
	const rosterStatusLabel = $derived(signups.length ? `${checkedCount} checked in · ${remainingCheckIns} pending` : 'No one is assigned yet.');
	const rosterPeople = $derived.by(() =>
		signups.map((person, index) => {
			const key = `${activeShiftId}-${index}`;
			const contact = findVolunteerContactByName(person.name);

			return {
				key,
				name: person.name,
				affiliation: person.affiliation,
				done: checkedIn.has(key),
				avatarUrl: contact?.avatarUrl ?? '',
				initials: initials(person.name),
				meta: contact
					? `${contact.pastEventCount} events · ${contact.totalHours} hours`
					: person.affiliation ?? 'Volunteer'
			};
		})
	);
	const pendingPeople = $derived(rosterPeople.filter((person) => !person.done));
	const arrivedPeople = $derived(rosterPeople.filter((person) => person.done));
	const quickRoster = $derived(pendingPeople.slice(0, 3));
	const shiftLead = $derived(quickRoster[0] ?? rosterPeople[0] ?? null);
	const arrivalHeadline = $derived.by(() => {
		if (!activeShift) {
			return 'Choose a shift to begin check-in.';
		}

		if (signups.length === 0) {
			return 'No one is assigned to this shift yet.';
		}

		if (remainingCheckIns === 0) {
			return 'Everyone assigned to this shift is already on site.';
		}

		if (checkedCount === 0) {
			return `${remainingCheckIns} volunteers are still expected for ${activeShift.title}.`;
		}

		return `${remainingCheckIns} volunteers are still on the way while ${checkedCount} are already checked in.`;
	});

	function toggle(key: string) {
		const next = new Set(checkedIn);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		checkedIn = next;
	}

	function initials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<svelte:head>
	<title>Check-In — {event?.title ?? 'Event'}</title>
</svelte:head>

<div class="sticky top-0 z-20 -mx-3 border-b border-border/60 bg-background/90 backdrop-blur-sm sm:-mx-4">
	<div class="flex items-center gap-3 px-4 py-2.5">
		<Button href="/volunteers" variant="ghost" size="sm" class="-ml-1 h-8 gap-1.5 px-2 text-xs">
			<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10 12L6 8l4-4" />
			</svg>
			Volunteers
		</Button>

		{#if event}
			<span class="text-muted-foreground">/</span>
			<p class="truncate text-sm font-medium text-foreground">{event.title}</p>
		{/if}
	</div>
</div>

<div class="relative isolate page-stack py-5">
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_65%)]"></div>
	{#if !event}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Event not found.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root size="sm" class="relative overflow-hidden border-border/70 bg-card shadow-sm">
			<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
			<Card.Content class="relative space-y-3.5 px-4 py-3.5 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1.18fr)_17rem] lg:items-start lg:gap-4.5 lg:space-y-0 lg:px-5">
				<div class="space-y-2.5">
					<div class="space-y-1.25">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Day-of check-in</p>
						<h1 class="max-w-3xl text-[1.8rem] font-semibold tracking-tight text-foreground sm:text-[1.95rem] sm:leading-[0.98]">{event.title}</h1>
						<p class="text-sm text-muted-foreground">{event.date} · {event.location}</p>
						<p class="max-w-2xl text-sm leading-5.5 text-muted-foreground">{activeShiftSummary}</p>
					</div>

					<div class="flex flex-wrap gap-2">
						<div class="rounded-full border border-border/70 bg-background px-3 py-1.25 text-[0.72rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{event.shifts.length} shifts</div>
						<div class="rounded-full border border-border/70 bg-background px-3 py-1.25 text-[0.72rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{totalRegistered} registered</div>
						<div class="rounded-full border border-border/70 bg-background px-3 py-1.25 text-[0.72rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{checkedCount} checked in</div>
					</div>
				</div>

				<div class="rounded-[1.1rem] bg-muted/20 px-3.5 py-3.5 dark:bg-background/56">
					<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Working now</p>
					<p class="mt-1.5 text-lg font-semibold tracking-tight text-foreground">{activeShift?.title ?? 'Choose a shift'}</p>
					<p class="mt-1 text-sm text-muted-foreground">{activeShift ? `${activeShiftWindow} · ${remainingCheckIns} pending` : 'Use the shift switcher below to begin check-in.'}</p>

					{#if shiftLead}
						<div class="mt-3 flex items-center gap-3 border-t border-border/60 pt-3">
							<div class="flex -space-x-2">
								{#each quickRoster as person (person.key)}
									<Avatar.Root class="size-8 border-2 border-background bg-muted/30 shadow-sm after:hidden">
										{#if person.avatarUrl}
											<Avatar.Image src={person.avatarUrl} alt={person.name} />
										{:else}
											<Avatar.Fallback class="text-[0.65rem] font-semibold text-foreground">{person.initials}</Avatar.Fallback>
										{/if}
									</Avatar.Root>
								{/each}
							</div>
							<div class="min-w-0">
								<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">First expected</p>
								<p class="truncate text-sm font-medium text-foreground">{shiftLead.name}</p>
							</div>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:items-start">
			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Header class="gap-2 border-b border-border/70">
					<Card.Title class="text-lg font-semibold tracking-tight">Check-in list</Card.Title>
					{#if activeShift}
						<Card.Description>{activeShift.title} · {activeShift.startTime}–{activeShift.endTime}</Card.Description>
					{/if}
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div class="flex flex-wrap gap-2">
							{#each event.shifts as shift (shift.id)}
								{@const isActive = activeShiftId === shift.id}
								{@const expected = mockSignups[shift.id]?.length ?? shift.filled}
								<button
									type="button"
									onclick={() => (selectedShiftId = shift.id)}
									class={`appearance-none flex items-center gap-2 rounded-xl border px-3 py-1.75 text-[0.74rem] font-medium transition-colors ${isActive ? 'border-primary bg-primary/8 text-foreground shadow-sm dark:border-white/10 dark:bg-black/76 dark:text-foreground' : 'border-border/70 bg-background text-muted-foreground hover:bg-muted/18 dark:border-white/10 dark:bg-black/58 dark:text-foreground/78 dark:hover:bg-black/70'}`}
								>
									<span>{shift.title}</span>
									<span class="text-[0.68rem] text-muted-foreground/80 dark:text-foreground/60">{expected} expected</span>
								</button>
							{/each}
						</div>

						<p class="text-[0.74rem] text-muted-foreground">{rosterStatusLabel}</p>
					</div>

					{#if activeShift}
						{#if signups.length === 0}
							<div class="rounded-2xl border border-dashed border-border/70 py-8 text-center">
								<p class="text-sm text-muted-foreground">No signups for this shift yet.</p>
							</div>
						{:else}
							<div class="space-y-4">
								<div class="space-y-3">
									<div class="flex items-center justify-between gap-3">
										<p class="text-sm font-semibold text-foreground">Pending arrival</p>
										<p class="text-xs text-muted-foreground">{pendingPeople.length} still to check in</p>
									</div>

									{#if pendingPeople.length > 0}
										<div class="overflow-hidden rounded-[1.35rem] border border-border/70 dark:border-white/10 dark:bg-black/82">
											<div class="divide-y divide-border/50">
												{#each pendingPeople as person (person.key)}
													<button
														type="button"
														onclick={() => toggle(person.key)}
														class="appearance-none flex w-full items-center gap-3 bg-background px-3.25 py-2.5 text-left transition-colors hover:bg-primary/5 dark:bg-black/72 dark:hover:bg-black/66"
													>
														<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/35 transition-all"></div>
														<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-primary/8 shadow-sm after:hidden">
															{#if person.avatarUrl}
																<Avatar.Image src={person.avatarUrl} alt={person.name} />
															{:else}
																<Avatar.Fallback class="text-xs font-semibold text-foreground">{person.initials}</Avatar.Fallback>
															{/if}
														</Avatar.Root>
														<div class="min-w-0 flex-1">
															<p class="text-sm font-semibold text-foreground">{person.name}</p>
															<p class="mt-0.5 text-[0.78rem] text-muted-foreground">{person.affiliation ?? person.meta}</p>
														</div>
														<div class="text-right">
															<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Expected</p>
															<p class="mt-1 text-[0.72rem] text-muted-foreground">{person.meta}</p>
														</div>
													</button>
												{/each}
											</div>
										</div>
									{:else}
										<div class="rounded-[1.25rem] border border-dashed border-border/70 bg-muted/14 px-4 py-5 text-center">
											<p class="text-sm font-medium text-foreground">Everyone assigned to this shift is already on site.</p>
											<p class="mt-1 text-sm text-muted-foreground">Leave the list open in case anyone needs to be unchecked and confirmed again.</p>
										</div>
									{/if}
								</div>

								{#if arrivedPeople.length > 0}
									<div class="space-y-3 border-t border-border/60 pt-4">
										<div class="flex items-center justify-between gap-3">
											<p class="text-sm font-semibold text-foreground">Already checked in</p>
											<p class="text-xs text-muted-foreground">{arrivedPeople.length} on site</p>
										</div>
										<div class="overflow-hidden rounded-[1.35rem] border border-border/70 bg-muted/16 dark:border-white/10 dark:bg-black/66">
											<div class="divide-y divide-border/50">
												{#each arrivedPeople as person (person.key)}
													<button
														type="button"
														onclick={() => toggle(person.key)}
														class="appearance-none flex w-full items-center gap-3 px-3.25 py-2.5 text-left transition-colors hover:bg-muted/20 dark:hover:bg-black/60"
													>
														<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-foreground/70 bg-foreground/70 transition-all">
															<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2.5">
																<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l3.5 3.5L13 5" />
															</svg>
														</div>
														<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-muted/24 shadow-sm after:hidden">
															{#if person.avatarUrl}
																<Avatar.Image src={person.avatarUrl} alt={person.name} />
															{:else}
																<Avatar.Fallback class="text-xs font-semibold text-foreground">{person.initials}</Avatar.Fallback>
															{/if}
														</Avatar.Root>
														<div class="min-w-0 flex-1">
															<p class="text-sm font-semibold text-muted-foreground line-through">{person.name}</p>
															<p class="mt-0.5 text-[0.78rem] text-muted-foreground">{person.affiliation ?? person.meta}</p>
														</div>
														<p class="shrink-0 text-[0.72rem] font-medium text-muted-foreground">Checked in</p>
													</button>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>

			<div class="space-y-3.5 xl:sticky xl:top-24">
				<Card.Root size="sm" class="border-border/70 bg-card">
					<Card.Content class="space-y-3.5 py-4">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live progress</p>
						{#if activeShift}
							<p class="text-base font-semibold tracking-tight text-foreground">{activeShift.title}</p>
							<p class="text-sm text-muted-foreground">{activeShift.startTime} – {activeShift.endTime}</p>
						{/if}
						<div class="flex items-end justify-between gap-3">
							<p class="text-3xl font-semibold tracking-tight text-foreground">{completionPercent}%</p>
							<p class="text-xs text-muted-foreground">{checkedCount}/{signups.length || 0} checked in</p>
						</div>
						<div class="h-2 overflow-hidden rounded-full bg-muted">
							<div class="h-full rounded-full bg-foreground/75 transition-all" style="width: {completionPercent}%"></div>
						</div>
						<div class="space-y-2.5 border-t border-border/60 pt-3">
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm text-muted-foreground">Still to check in</p>
								<p class="text-sm font-semibold text-foreground">{remainingCheckIns}</p>
							</div>
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm text-muted-foreground">Already on site</p>
								<p class="text-sm font-semibold text-foreground">{checkedCount}</p>
							</div>
						</div>
						<p class="text-sm leading-5 text-muted-foreground">Keep marking arrivals as they happen so follow-up stays visible for the team.</p>
						<Button href="/signup/{event.id}" size="sm" class="h-9 w-full justify-center px-3 text-xs shadow-sm">Open public signup</Button>
					</Card.Content>
				</Card.Root>

				{#if shiftLead}
					<Card.Root size="sm" class="border-border/70 bg-card">
						<Card.Content class="space-y-3.5 py-4">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Up next</p>
							<div class="flex items-center gap-3">
								<Avatar.Root class="size-12 shrink-0 border border-border/70 bg-muted/24 shadow-sm after:hidden">
									{#if shiftLead.avatarUrl}
										<Avatar.Image src={shiftLead.avatarUrl} alt={shiftLead.name} />
									{:else}
										<Avatar.Fallback class="text-sm font-semibold text-foreground">{shiftLead.initials}</Avatar.Fallback>
									{/if}
								</Avatar.Root>
								<div class="min-w-0">
									<p class="text-sm font-semibold text-foreground">{shiftLead.name}</p>
									<p class="text-sm text-muted-foreground">{shiftLead.affiliation ?? shiftLead.meta}</p>
								</div>
							</div>

							{#if quickRoster.length > 1}
								<div class="space-y-2 border-t border-border/60 pt-4">
									{#each quickRoster.slice(1) as person (person.key)}
										<div class="flex items-center gap-3">
											<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-muted/24 shadow-sm after:hidden">
												{#if person.avatarUrl}
													<Avatar.Image src={person.avatarUrl} alt={person.name} />
												{:else}
													<Avatar.Fallback class="text-xs font-semibold text-foreground">{person.initials}</Avatar.Fallback>
												{/if}
											</Avatar.Root>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm font-medium text-foreground">{person.name}</p>
												<p class="truncate text-xs text-muted-foreground">{person.affiliation ?? person.meta}</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</div>
		</div>
	{/if}
</div>
