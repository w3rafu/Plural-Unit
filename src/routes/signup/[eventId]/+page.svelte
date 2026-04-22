<script lang="ts">
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import FillPill from '$lib/components/volunteer/FillPill.svelte';
	import {
		getVolunteerEvent,
		getFillStatus
	} from '$lib/demo/volunteerFixtures';

	const event = $derived(getVolunteerEvent(page.params.eventId ?? ''));

	let selectedShiftId = $state<string | null>(null);
	let submitted = $state(false);

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let affiliation = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name || !email || !selectedShiftId) return;
		submitted = true;
	}

	const selectedShift = $derived(
		event?.shifts.find((s) => s.id === selectedShiftId) ?? null
	);
	const openShiftCount = $derived(
		event?.shifts.filter((shift) => getFillStatus(shift.filled, shift.needed) !== 'full').length ?? 0
	);

	function getDateParts(date: string) {
		const [month, day] = date.split(' ');
		return {
			month: month.slice(0, 3).toUpperCase(),
			day: day.replace(',', '')
		};
	}

	$effect(() => {
		if (!event || selectedShiftId) {
			return;
		}

		selectedShiftId =
			event.shifts.find((shift) => getFillStatus(shift.filled, shift.needed) !== 'full')?.id ?? null;
	});

	// Force light mode on the html element for this public page.
	$effect(() => {
		const html = document.documentElement;
		const wasDark = html.classList.contains('dark');
		html.classList.remove('dark');
		return () => {
			if (wasDark) html.classList.add('dark');
		};
	});
</script>

<svelte:head>
	<title>{event?.title ?? 'Volunteer Signup'}</title>
</svelte:head>

<!-- light mode is applied via $effect on document.documentElement -->
<div class="relative isolate mx-auto max-w-5xl px-4 py-10 sm:py-12 xl:max-w-6xl">
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_65%)]"></div>
	{#if !event}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Event not found.</p>
			</Card.Content>
		</Card.Root>
	{:else if submitted}
		<Card.Root size="sm" class="relative mx-auto max-w-2xl overflow-hidden border-border/70 bg-card shadow-sm lg:max-w-4xl">
			<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
			<Card.Content class="relative space-y-5 px-5 py-6 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-6 lg:space-y-0 lg:px-6 lg:py-6">
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div class="min-w-0">
							<h1 class="text-2xl font-semibold tracking-tight text-foreground">Spot reserved</h1>
							<p class="mt-1 text-sm text-muted-foreground">Confirmation sent to {email}.</p>
						</div>
				</div>
				</div>
				<div class="space-y-3 rounded-[1.3rem] border border-border/70 bg-muted/20 px-4 py-4 lg:min-h-full">
					<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
						<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Event</span>
						<span class="text-right text-sm font-medium text-foreground">{event.title}</span>
					</div>
					<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
						<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</span>
						<span class="text-right text-sm font-medium text-foreground">{event.date}</span>
					</div>
					<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
						<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shift</span>
						<span class="text-right text-sm font-medium text-foreground">{selectedShift?.title}</span>
					</div>
					<div class="flex items-start justify-between gap-3">
						<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Time</span>
						<span class="text-right text-sm font-medium text-foreground">{selectedShift?.startTime} – {selectedShift?.endTime}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-6">
			<Card.Root size="sm" class="relative overflow-hidden border-border/70 bg-card shadow-sm lg:sticky lg:top-24">
				<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
				<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
				<Card.Content class="relative space-y-4 px-4 py-5 sm:px-5 lg:space-y-5 lg:px-6 lg:py-6">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div class="flex items-start gap-4">
							<div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[1.1rem] border border-border/70 bg-muted/30 text-center">
								<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
								<p class="text-base font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
							</div>

							<div class="space-y-1.5">
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Volunteer signup</p>
								<h1 class="text-[2rem] font-semibold tracking-tight text-foreground lg:text-[2.55rem] lg:leading-[0.95]">{event.title}</h1>
								<p class="text-sm text-muted-foreground">{event.location}</p>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap gap-2 text-[0.72rem] font-medium text-muted-foreground lg:max-w-md">
						<span class="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">{openShiftCount} open shifts</span>
						<span class="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">48h reminder</span>
						<span class="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">{event.date}</span>
						<span class="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">{event.timeRange}</span>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Header class="gap-2 border-b border-border/70">
					<Card.Title class="text-lg font-semibold tracking-tight">Reserve a shift</Card.Title>
					<Card.Description>Pick a role and leave your details.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-5">
					<form onsubmit={handleSubmit} class="space-y-5">
						<div class="space-y-3">
							<div class="flex items-end justify-between gap-3">
								<p class="text-sm font-medium text-foreground">Choose a shift</p>
							</div>

							<div class="space-y-2">
								{#each event.shifts as shift (shift.id)}
									{@const status = getFillStatus(shift.filled, shift.needed)}
									{@const isFull = status === 'full'}
									<button
										type="button"
										disabled={isFull}
										class={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${selectedShiftId === shift.id ? 'border-primary bg-primary/5' : 'border-border/70'} ${isFull ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/30'}`}
										onclick={() => !isFull && (selectedShiftId = shift.id)}
									>
										<div class="min-w-0 flex-1">
											<div class="flex flex-wrap items-center gap-2">
												<span class="text-sm font-medium text-foreground">{shift.title}</span>
												<FillPill filled={shift.filled} needed={shift.needed} {status} />
											</div>
											<p class="mt-1 text-xs text-muted-foreground">{shift.startTime} – {shift.endTime}</p>
										</div>
										{#if selectedShiftId === shift.id}
											<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
												<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
													<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</div>
										{/if}
									</button>
								{/each}
							</div>
						</div>

						<div class="space-y-4">
							<p class="text-sm font-medium text-foreground">Your details</p>

							<div class="grid gap-4 sm:grid-cols-2">
								<div class="flex flex-col gap-1.5 sm:col-span-2">
									<Label for="signup-name">Full name <span class="text-destructive">*</span></Label>
									<Input id="signup-name" bind:value={name} placeholder="Your name" required />
								</div>

								<div class="flex flex-col gap-1.5 sm:col-span-2">
									<Label for="signup-email">Email <span class="text-destructive">*</span></Label>
									<Input id="signup-email" type="email" bind:value={email} placeholder="you@example.com" required />
								</div>

								<div class="flex flex-col gap-1.5">
									<Label for="signup-phone">Phone <span class="text-xs text-muted-foreground">optional</span></Label>
									<Input id="signup-phone" type="tel" bind:value={phone} placeholder="(555) 000-0000" />
								</div>

								<div class="flex flex-col gap-1.5">
									<Label for="signup-affiliation">Business affiliation <span class="text-xs text-muted-foreground">optional</span></Label>
									<Input id="signup-affiliation" bind:value={affiliation} placeholder="e.g. Acme Corp" />
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<Button type="submit" class="h-10 w-full" disabled={!name || !email || !selectedShiftId}>Reserve My Spot</Button>
							<p class="text-center text-xs text-muted-foreground">No account required.</p>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
