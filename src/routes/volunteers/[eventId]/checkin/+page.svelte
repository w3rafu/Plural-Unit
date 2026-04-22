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
			{ name: 'Dana Whitfield' },
			{ name: 'Carlos Fuentes' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'James Osei' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' }
		],
		s2: [
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Carlos Fuentes' },
			{ name: 'James Osei' },
			{ name: 'Dana Whitfield' },
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'Aiden Clarke' },
			{ name: 'Sofia Reyes', affiliation: 'City Press' }
		],
		s3: [
			{ name: 'Carlos Fuentes' },
			{ name: 'James Osei' },
			{ name: 'Dana Whitfield' }
		],
		s4: [
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'James Osei' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' }
		],
		s5: [
			{ name: 'Carlos Fuentes' },
			{ name: 'Dana Whitfield' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Aiden Clarke' }
		],
		s6: [
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Ruth Kim', affiliation: 'Northside Health Clinic' },
			{ name: 'James Osei' },
			{ name: 'Dana Whitfield' },
			{ name: 'Carlos Fuentes' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'Linda Marchetti', affiliation: 'Marchetti Catering' },
			{ name: 'Sofia Reyes', affiliation: 'City Press' },
			{ name: 'Aiden Clarke' },
			{ name: 'Marcus Webb' },
			{ name: 'Nadia Flores', affiliation: 'Riverview Dental' },
			{ name: 'Omar Hassan' },
			{ name: 'Yuki Tanaka', affiliation: 'Sterling & Co.' }
		],
		s7: [
			{ name: 'Marguerite Okafor', affiliation: 'Harbor Community Bank' },
			{ name: 'Tom Bellacino', affiliation: 'Bellacino & Sons Landscaping' },
			{ name: 'Priya Nambiar', affiliation: 'Nambiar Law Partners' },
			{ name: 'James Osei' }
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
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_65%)]"></div>
	{#if !event}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Event not found.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root size="sm" class="relative overflow-hidden border-border/70 bg-card shadow-sm">
			<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
			<Card.Content class="relative space-y-4 px-4 py-5 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6 lg:space-y-0">
				<div class="space-y-4">
					<div class="space-y-1.5">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Day-of check-in</p>
						<h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">{event.title}</h1>
						<p class="text-sm text-muted-foreground">{event.date} · {event.location}</p>
					</div>

					<div class="flex flex-wrap gap-2.5">
						<div class="rounded-full border border-border/70 bg-background/85 px-3.5 py-2 text-sm text-foreground">
							<span class="font-semibold">{event.shifts.length}</span>
							<span class="ml-1.5 text-muted-foreground">shifts</span>
						</div>
						<div class="rounded-full border border-border/70 bg-background/85 px-3.5 py-2 text-sm text-foreground">
							<span class="font-semibold">{totalRegistered}</span>
							<span class="ml-1.5 text-muted-foreground">registered</span>
						</div>
						<div class="rounded-full border border-border/70 bg-background/85 px-3.5 py-2 text-sm text-foreground">
							<span class="font-semibold">{checkedCount}</span>
							<span class="ml-1.5 text-muted-foreground">checked in</span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-3 rounded-[1.2rem] border border-border/70 bg-background/85 p-3 shadow-sm lg:h-full lg:flex-col lg:items-start lg:justify-between lg:p-4">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-2">
						<svg viewBox="0 0 100 100" class="h-full w-full" aria-hidden="true">
							<rect x="5" y="5" width="28" height="28" rx="3" fill="currentColor" class="text-foreground/80" />
							<rect x="10" y="10" width="18" height="18" rx="1.5" fill="currentColor" class="text-background" />
							<rect x="14" y="14" width="10" height="10" rx="1" fill="currentColor" class="text-foreground/80" />
							<rect x="67" y="5" width="28" height="28" rx="3" fill="currentColor" class="text-foreground/80" />
							<rect x="72" y="10" width="18" height="18" rx="1.5" fill="currentColor" class="text-background" />
							<rect x="76" y="14" width="10" height="10" rx="1" fill="currentColor" class="text-foreground/80" />
							<rect x="5" y="67" width="28" height="28" rx="3" fill="currentColor" class="text-foreground/80" />
							<rect x="10" y="72" width="18" height="18" rx="1.5" fill="currentColor" class="text-background" />
							<rect x="14" y="76" width="10" height="10" rx="1" fill="currentColor" class="text-foreground/80" />
							<rect x="40" y="5" width="7" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="50" y="5" width="5" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="58" y="5" width="7" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="5" y="40" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="5" y="48" width="5" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="5" y="58" width="7" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="40" y="40" width="20" height="20" rx="2" fill="currentColor" class="text-foreground/20" />
							<rect x="44" y="44" width="12" height="12" rx="1.5" fill="currentColor" class="text-foreground/50" />
							<rect x="48" y="48" width="4" height="4" rx="0.5" fill="currentColor" class="text-foreground/80" />
							<rect x="62" y="40" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="72" y="40" width="5" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="80" y="40" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="62" y="48" width="5" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="72" y="50" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="40" y="62" width="5" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="48" y="65" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="57" y="62" width="5" height="10" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="65" y="67" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="75" y="62" width="5" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="83" y="65" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="75" y="72" width="15" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="40" y="72" width="7" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="50" y="75" width="5" height="7" rx="1" fill="currentColor" class="text-foreground/70" />
							<rect x="58" y="72" width="5" height="5" rx="1" fill="currentColor" class="text-foreground/70" />
						</svg>
					</div>
					<div class="min-w-0 flex-1 space-y-0.5">
						<p class="text-sm font-medium text-foreground">Public signup</p>
						<p class="text-xs text-muted-foreground">Open the live form.</p>
					</div>
					<Button href="/signup/{event.id}" variant="outline" size="sm" class="h-8 shrink-0 px-3 text-xs text-muted-foreground lg:w-full lg:justify-center">Open</Button>
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
			<Card.Content class="space-y-5">
				<div class="flex flex-wrap gap-2">
				{#each event.shifts as shift (shift.id)}
					{@const isActive = activeShiftId === shift.id}
					<button
						type="button"
						onclick={() => (selectedShiftId = shift.id)}
						class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
						class:border-primary={isActive}
						class:bg-primary={isActive}
						class:text-primary-foreground={isActive}
						class:border-border={!isActive}
						class:bg-muted={!isActive}
						class:text-muted-foreground={!isActive}
					>
						{shift.title}
						<span
							class="rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums"
							class:bg-primary-foreground={isActive}
							class:text-primary={isActive}
							class:bg-muted-foreground={!isActive}
							class:text-background={!isActive}
						>
							{shift.filled}
						</span>
					</button>
				{/each}
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between text-xs text-muted-foreground">
						<span>{completionPercent}% complete</span>
						<span>{signups.length - checkedCount} left</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-foreground/70 transition-all"
							style="width: {completionPercent}%"
						></div>
					</div>
				</div>

				{#if activeShift}
					{#if signups.length === 0}
						<div class="rounded-2xl border border-dashed border-border/70 py-8 text-center">
							<p class="text-sm text-muted-foreground">No signups for this shift yet.</p>
						</div>
					{:else}
						<div class="overflow-hidden rounded-[1.35rem] border border-border/70">
							<div class="divide-y divide-border/50">
							{#each signups as person, i (i)}
								{@const key = `${activeShiftId}-${i}`}
								{@const done = checkedIn.has(key)}
								<button
									type="button"
									onclick={() => toggle(key)}
									class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
								>
									<div
										class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${done ? 'border-foreground/70 bg-foreground/70' : 'border-border'}`}
									>
										{#if done}
											<svg
												class="h-4 w-4 text-white"
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
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
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
									</div>

									{#if done}
										<span class="shrink-0 text-xs text-muted-foreground">Checked in</span>
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
