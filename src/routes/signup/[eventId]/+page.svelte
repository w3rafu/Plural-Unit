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
	const selectedShiftOpenSlots = $derived(
		selectedShift ? Math.max(selectedShift.needed - selectedShift.filled, 0) : 0
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
</script>

<svelte:head>
	<title>{event?.title ?? 'Volunteer Signup'}</title>
</svelte:head>

<div
	class={`relative isolate mx-auto max-w-5xl px-4 py-10 sm:py-12 xl:max-w-6xl ${submitted ? 'lg:grid lg:min-h-[calc(100dvh-7.5rem)] lg:content-center' : ''}`}
>
	<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_65%)]"></div>
	{#if !event}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Event not found.</p>
			</Card.Content>
		</Card.Root>
	{:else if submitted}
		<Card.Root
			size="sm"
			class="relative mx-auto max-w-2xl overflow-hidden border-border/70 bg-card shadow-sm lg:max-w-5xl"
		>
			<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
			<Card.Content class="relative space-y-6 px-5 py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] lg:items-start lg:gap-6 lg:space-y-0 lg:px-7 lg:py-7">
				<div class="space-y-5">
					<div class="flex items-start gap-4">
						<div class="flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.2rem] border border-primary/15 bg-primary/10 text-primary shadow-sm">
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div class="min-w-0">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Volunteer confirmed</p>
							<h1 class="text-[2rem] font-semibold tracking-tight text-foreground lg:text-[2.45rem] lg:leading-[0.96]">
								You are all set for {selectedShift?.title ?? 'your shift'}
							</h1>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[0.96rem]">
								Confirmation is on its way to {email}. Bring yourself, arrive a few minutes early,
								and we will take care of the rest.
							</p>
							<p class="mt-3 text-sm text-muted-foreground">{event.date} · {selectedShift?.startTime} – {selectedShift?.endTime} · {event.location}</p>
						</div>
					</div>

					<div class="space-y-3 border-t border-border/60 pt-4">
						<div class="flex items-start gap-3">
							<span class="mt-2 h-2 w-2 rounded-full bg-primary"></span>
							<div>
								<p class="text-sm font-medium text-foreground">Your shift is reserved</p>
								<p class="text-sm leading-5 text-muted-foreground">We saved {selectedShift?.title} for {name}, and the team will expect you during that window.</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<span class="mt-2 h-2 w-2 rounded-full bg-primary/70"></span>
							<div>
								<p class="text-sm font-medium text-foreground">Show up a few minutes early</p>
								<p class="text-sm leading-5 text-muted-foreground">Come to {event.location} about 10 minutes before {selectedShift?.startTime} so the coordinator can point you in.</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<span class="mt-2 h-2 w-2 rounded-full bg-primary/45"></span>
							<div>
								<p class="text-sm font-medium text-foreground">Need another hand?</p>
								<p class="text-sm leading-5 text-muted-foreground">Reopen this event if you want to reserve another open role or share the signup page with someone else.</p>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-4 rounded-[1.45rem] border border-border/70 bg-background/82 px-4 py-4 shadow-sm lg:min-h-full lg:px-5 lg:py-5">
					<div class="flex items-start gap-4 border-b border-border/60 pb-4">
						<div class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[1.1rem] border border-border/70 bg-muted/35 text-center">
							<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
							<p class="text-lg font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
						</div>
						<div class="min-w-0">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Event recap</p>
							<h2 class="mt-1 text-lg font-semibold tracking-tight text-foreground">{event.title}</h2>
							<p class="mt-1 text-sm leading-5 text-muted-foreground">{event.location}</p>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Volunteer</span>
							<span class="text-right text-sm font-medium text-foreground">{name}</span>
						</div>
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shift</span>
							<span class="text-right text-sm font-medium text-foreground">{selectedShift?.title}</span>
						</div>
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Time</span>
							<span class="text-right text-sm font-medium text-foreground">{selectedShift?.startTime} – {selectedShift?.endTime}</span>
						</div>
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Email</span>
							<span class="text-right text-sm font-medium text-foreground">{email}</span>
						</div>
						<div class="flex items-start justify-between gap-3">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Affiliation</span>
							<span class="text-right text-sm font-medium text-foreground">{affiliation || 'Guest volunteer'}</span>
						</div>
					</div>

					<div class="flex flex-col gap-2 pt-1 sm:flex-row">
						<Button href={page.url.pathname} variant="outline" class="sm:flex-1">Reserve another spot</Button>
						<Button href={page.url.pathname} class="sm:flex-1">View shifts again</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-6">
			<Card.Root size="sm" class="relative overflow-hidden border-border/70 bg-card shadow-sm lg:sticky lg:top-24">
				<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
				<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
				<Card.Content class="relative space-y-5 px-4 py-5 sm:px-5 lg:space-y-5 lg:px-6 lg:py-6">
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
								<p class="text-sm text-muted-foreground">{event.date} · {event.timeRange}</p>
							</div>
						</div>
					</div>

					<p class="text-sm text-muted-foreground">{openShiftCount} open shift{openShiftCount === 1 ? '' : 's'} remain. No account is required, and confirmation goes to your email.</p>

					<div class="rounded-[1.45rem] border border-border/70 bg-background/82 px-4 py-4 shadow-sm">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current selection</p>
						{#if selectedShift}
							<p class="mt-2 text-base font-semibold tracking-tight text-foreground">{selectedShift.title}</p>
							<p class="mt-1 text-sm text-muted-foreground">{selectedShift.startTime} – {selectedShift.endTime} · {selectedShiftOpenSlots} spot{selectedShiftOpenSlots === 1 ? '' : 's'} left</p>
							<p class="mt-3 text-sm text-muted-foreground">
								Pick a role, add your contact details, and you are done.
							</p>
						{:else}
							<p class="mt-3 text-sm text-muted-foreground">Choose any open shift to continue.</p>
						{/if}
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
										class={`appearance-none flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all ${selectedShiftId === shift.id ? 'border-primary/25 bg-primary/8 shadow-sm dark:border-white/10 dark:bg-black/58 dark:text-foreground' : 'border-border/70 bg-background/80 dark:border-white/10 dark:bg-black/44 dark:text-foreground'} ${isFull ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/15 hover:bg-muted/20 dark:hover:bg-black/56'}`}
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
							{#if selectedShift}
								<p class="text-center text-xs text-muted-foreground">
									Selected: {selectedShift.title} · {selectedShift.startTime} – {selectedShift.endTime}
								</p>
							{/if}
							<Button type="submit" class="h-10 w-full" disabled={!name || !email || !selectedShiftId}>Reserve My Spot</Button>
							<p class="text-center text-xs text-muted-foreground">No account required. Confirmation goes to your email.</p>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
