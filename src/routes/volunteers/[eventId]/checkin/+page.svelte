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
					</div>

					<div class="flex flex-wrap gap-2">
						<div class="rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-sm text-foreground dark:border-border/80 dark:bg-background/60">
							<span class="font-semibold">{event.shifts.length}</span>
							<span class="ml-1.5 text-muted-foreground">shifts</span>
						</div>
						<div class="rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-sm text-foreground dark:border-border/80 dark:bg-background/60">
							<span class="font-semibold">{totalRegistered}</span>
							<span class="ml-1.5 text-muted-foreground">registered</span>
						</div>
						<div class="rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-sm text-foreground dark:border-border/80 dark:bg-background/60">
							<span class="font-semibold">{checkedCount}</span>
							<span class="ml-1.5 text-muted-foreground">checked in</span>
						</div>
					</div>

					<div class="rounded-[1.3rem] border border-border/70 bg-background/82 px-3.5 py-3.5 shadow-sm dark:border-border/80 dark:bg-background/56 lg:max-w-xl">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active shift</p>
								<p class="mt-1.5 text-base font-semibold tracking-tight text-foreground">{activeShift?.title ?? 'Choose a shift'}</p>
								<p class="mt-1 text-sm text-muted-foreground">{signups.length} expected on this check-in list.</p>
							</div>
							<div class="rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-sm font-medium text-foreground dark:border-border/80 dark:bg-background/72">
								{remainingCheckIns} pending
							</div>
						</div>
						<p class="mt-2.5 text-sm text-muted-foreground">
							Mark arrivals as they happen so late follow-up stays obvious for the team.
						</p>
					</div>
				</div>

				<div class="rounded-[1.3rem] border border-border/70 bg-background/88 p-3.5 shadow-sm dark:border-border/80 dark:bg-background/56 lg:h-full">
					<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live progress</p>
					{#if activeShift}
						<p class="mt-1.5 text-base font-semibold tracking-tight text-foreground">{activeShift.title}</p>
						<p class="mt-1 text-sm text-muted-foreground">{activeShift.startTime} – {activeShift.endTime}</p>
					{/if}
					<div class="mt-3.5 flex items-end justify-between gap-3">
						<p class="text-3xl font-semibold tracking-tight text-foreground">{completionPercent}%</p>
						<p class="text-xs text-muted-foreground">{checkedCount}/{signups.length || 0} checked in</p>
					</div>
					<div class="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
						<div class="h-full rounded-full bg-foreground/75 transition-all" style="width: {completionPercent}%"></div>
					</div>
					<div class="mt-3.5 rounded-[1.05rem] border border-border/70 bg-muted/20 px-3 py-2.5 dark:border-border/80 dark:bg-background/68">
						<p class="text-sm font-medium text-foreground">{remainingCheckIns} still to check in</p>
						<p class="mt-1 text-xs text-muted-foreground">Keep the active shift moving before volunteers arrive in clusters.</p>
					</div>
					<Button href="/signup/{event.id}" variant="outline" size="sm" class="mt-3.5 h-8 w-full justify-center border-white/10 bg-black/28 px-3 text-xs text-foreground/88 hover:bg-black/40 hover:text-foreground dark:border-white/10 dark:bg-black/28 dark:text-foreground/88">Open public signup</Button>
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
					<button
						type="button"
						onclick={() => (selectedShiftId = shift.id)}
						class={`appearance-none flex items-center gap-1.5 rounded-full border px-2.75 py-1.25 text-[0.72rem] font-medium transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground shadow-sm dark:border-white/10 dark:bg-black/76 dark:text-foreground' : 'border-border bg-muted text-muted-foreground dark:border-white/10 dark:bg-black/58 dark:text-foreground/78 dark:hover:bg-black/70'}`}
					>
						{shift.title}
						<span
							class={`rounded-full px-1.5 py-0.5 text-[0.62rem] tabular-nums ${isActive ? 'bg-primary-foreground text-primary dark:bg-white/12 dark:text-foreground' : 'bg-muted-foreground text-background dark:bg-white/10 dark:text-foreground/78'}`}
						>
							{shift.filled}
						</span>
					</button>
				{/each}
					</div>

					<div class="flex items-center gap-2 text-[0.72rem] font-medium text-muted-foreground">
						<span class="rounded-full border border-border/70 bg-background px-2.5 py-1 dark:border-border/80 dark:bg-background/60">{completionPercent}% complete</span>
						<span>{remainingCheckIns} left</span>
					</div>
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
									class="appearance-none flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors"
									style:background={done
										? 'color-mix(in srgb, var(--card) 86%, black 14%)'
										: 'color-mix(in srgb, var(--card) 94%, var(--background) 6%)'}
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

									{#if done}
											<span class="shrink-0 rounded-full border border-border/70 bg-background/80 px-2 py-0.75 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:border-border/80 dark:bg-background/66">Checked in</span>
									{/if}
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
