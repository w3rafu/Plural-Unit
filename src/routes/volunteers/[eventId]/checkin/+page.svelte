<script lang="ts">
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { getVolunteerEvent } from '$lib/demo/volunteerFixtures';

	const event = $derived(getVolunteerEvent(page.params.eventId ?? ''));

	// Mock signups: distribute contacts across shifts for demo purposes
	const mockSignups: Record<string, { name: string; affiliation?: string }[]> = {
		s1: [
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Dana Whitfield', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Carlos Fuentes', affiliation: 'West End Hardware' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'James Osei', affiliation: 'South Harbor Music Collective' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' }
		],
		s2: [
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Carlos Fuentes', affiliation: 'West End Hardware' },
			{ name: 'James Osei', affiliation: 'South Harbor Music Collective' },
			{ name: 'Dana Whitfield', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'Aiden Clarke', affiliation: 'Riverside Commons' },
			{ name: 'Sofia Reyes', affiliation: 'City Press' }
		],
		s3: [
			{ name: 'Carlos Fuentes', affiliation: 'West End Hardware' },
			{ name: 'James Osei', affiliation: 'South Harbor Music Collective' },
			{ name: 'Dana Whitfield', affiliation: 'Harbor Youth Sailing' }
		],
		s4: [
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'James Osei', affiliation: 'South Harbor Music Collective' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' }
		],
		s5: [
			{ name: 'Carlos Fuentes', affiliation: 'West End Hardware' },
			{ name: 'Dana Whitfield', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Aiden Clarke', affiliation: 'Riverside Commons' }
		],
		s6: [
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'James Osei', affiliation: 'South Harbor Music Collective' },
			{ name: 'Dana Whitfield', affiliation: 'Harbor Youth Sailing' },
			{ name: 'Carlos Fuentes', affiliation: 'West End Hardware' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' },
			{ name: 'Sofia Reyes', affiliation: 'City Press' },
			{ name: 'Aiden Clarke', affiliation: 'Riverside Commons' },
			{ name: 'Marcus Webb', affiliation: 'Civic Design Studio' },
			{ name: 'Nadia Flores', affiliation: 'Riverview Dental' },
			{ name: 'Omar Hassan', affiliation: 'Community Health Alliance' },
			{ name: 'Yuki Tanaka', affiliation: 'Sterling & Co.' }
		],
		s7: [
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'James Osei', affiliation: 'South Harbor Music Collective' }
		]
	};

	let selectedShiftId = $state<string | null>(null);
	let checkedIn = $state<Set<string>>(new Set());

	const activeShiftId = $derived(selectedShiftId ?? event?.shifts[0]?.id ?? null);
	const activeShift = $derived(event?.shifts.find((s) => s.id === activeShiftId) ?? null);
	const signups = $derived(activeShiftId ? (mockSignups[activeShiftId] ?? []) : []);
	const totalRegistered = $derived(event?.shifts.reduce((sum, shift) => sum + shift.filled, 0) ?? 0);

	const checkedCount = $derived(
		signups.filter((_, i) => checkedIn.has(`${activeShiftId}-${i}`)).length
	);
	const completionPercent = $derived(
		signups.length ? Math.round((checkedCount / signups.length) * 100) : 0
	);
	const remainingCheckIns = $derived(Math.max(signups.length - checkedCount, 0));
	const activeShiftWindow = $derived(
		activeShift ? `${activeShift.startTime} – ${activeShift.endTime}` : ''
	);
	const activeShiftSummary = $derived.by(() => {
		if (!activeShift) {
			return 'Choose a shift to start day-of check-in.';
		}

		if (signups.length === 0) {
			return `No one is assigned to ${activeShift.title} yet.`;
		}

		return `${remainingCheckIns} of ${signups.length} people on ${activeShift.title} still need check-in.`;
	});
	const rosterStatusLabel = $derived(
		signups.length ? `${checkedCount} checked in · ${remainingCheckIns} pending` : 'No one is assigned yet.'
	);

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
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<svelte:head>
	<title>Check-In — {event?.title ?? 'Event'}</title>
</svelte:head>

<!-- sticky top bar -->
<div
	class="sticky top-0 z-20 -mx-3 border-b border-border/60 bg-background/90 backdrop-blur-sm sm:-mx-4"
>
	<div class="flex items-center gap-3 px-4 py-2.5">
		<Button href="/volunteers" variant="ghost" size="sm" class="-ml-1 h-8 gap-1.5 px-2 text-xs">
			<svg
				class="h-4 w-4"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
			>
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
			<Card.Content class="relative space-y-3.5 px-4 py-5 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-5 lg:space-y-0">
				<div class="space-y-3.5">
					<div class="space-y-1.5">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Day-of check-in</p>
						<h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">{event.title}</h1>
						<p class="text-sm text-muted-foreground">{event.date} · {event.location}</p>
						<p class="max-w-2xl text-sm leading-6 text-muted-foreground">{activeShiftSummary}</p>
					</div>

					<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
						<span>{event.shifts.length} shifts</span>
						<span>{totalRegistered} registered</span>
						<span>{checkedCount} checked in</span>
					</div>

					<div class="hidden rounded-[1.2rem] bg-muted/20 px-4 py-3.5 dark:bg-background/56 lg:block lg:max-w-xl">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Working now</p>
						<p class="mt-1.5 text-base font-semibold tracking-tight text-foreground">{activeShift?.title ?? 'Choose a shift'}</p>
						<p class="mt-1 text-sm text-muted-foreground">
							{activeShift ? `${activeShiftWindow} · ${remainingCheckIns} pending` : 'Use the shift switcher below to begin check-in.'}
						</p>
					</div>
				</div>

				<div class="rounded-[1.3rem] border border-border/70 bg-background/88 p-3 sm:p-3.5 shadow-sm dark:border-border/80 dark:bg-background/56 lg:h-full">
					<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live progress</p>
					{#if activeShift}
						<p class="mt-1.5 text-base font-semibold tracking-tight text-foreground">{activeShift.title}</p>
						<p class="mt-1 text-sm text-muted-foreground">{activeShift.startTime} – {activeShift.endTime} · {remainingCheckIns} pending</p>
					{/if}
					<div class="mt-4 flex items-end justify-between gap-3">
						<p class="text-3xl font-semibold tracking-tight text-foreground">{completionPercent}%</p>
						<p class="text-xs text-muted-foreground">{checkedCount}/{signups.length || 0} checked in</p>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">{rosterStatusLabel}</p>
					<div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
						<div class="h-full rounded-full bg-foreground/75 transition-all" style="width: {completionPercent}%"></div>
					</div>
					<p class="mt-2.5 text-sm text-muted-foreground">Keep marking arrivals as they happen so late follow-up stays visible for the team.</p>
					<Button href="/signup/{event.id}" variant="outline" size="sm" class="mt-3.5 h-8 w-full justify-center px-3 text-xs">Open public signup</Button>
				</div>
			</Card.Content>
		</Card.Root>

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
						class={`appearance-none flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.74rem] font-medium transition-colors ${isActive ? 'border-primary bg-primary/8 text-foreground shadow-sm dark:border-white/10 dark:bg-black/76 dark:text-foreground' : 'border-border/70 bg-background text-muted-foreground hover:bg-muted/18 dark:border-white/10 dark:bg-black/58 dark:text-foreground/78 dark:hover:bg-black/70'}`}
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
						<div class="overflow-hidden rounded-[1.35rem] border border-border/70 dark:border-white/10 dark:bg-black/82">
							<div class="divide-y divide-border/50">
							{#each signups as person, i (i)}
								{@const key = `${activeShiftId}-${i}`}
								{@const done = checkedIn.has(key)}
								<button
									type="button"
									onclick={() => toggle(key)}
									class={`appearance-none flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${done ? 'bg-muted/20 dark:bg-black/58' : 'bg-background hover:bg-muted/18 dark:bg-black/72 dark:hover:bg-black/66'}`}
								>
									<div
										class={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${done ? 'border-foreground/70 bg-foreground/70' : 'border-border'}`}
									>
										{#if done}
											<svg
												class="h-3.5 w-3.5 text-white"
												fill="none"
												viewBox="0 0 16 16"
												stroke="currentColor"
												stroke-width="2.5"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M3 8l3.5 3.5L13 5"
												/>
											</svg>
										{/if}
									</div>

									<div
										class="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.68rem] font-bold text-primary"
									>
										{initials(person.name)}
									</div>

									<div class="min-w-0 flex-1">
										<p
											class="text-sm font-medium transition-colors"
											class:text-muted-foreground={done}
											class:line-through={done}
											class:text-foreground={!done}
										>
											{person.name}
										</p>
										{#if person.affiliation}
											<p class="mt-0.5 text-[0.72rem] text-muted-foreground">{person.affiliation}</p>
										{/if}
									</div>

									<span class={`shrink-0 text-[0.68rem] font-medium ${done ? 'text-muted-foreground' : 'text-foreground/80'}`}>
										{done ? 'Checked in' : 'Pending'}
									</span>
								</button>
							{/each}
							</div>
						</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
