<script lang="ts">
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import FillPill from '$lib/components/volunteer/FillPill.svelte';
	import {
		findVolunteerContactByName,
		getVolunteerEvent,
		getFillStatus,
		volunteerContacts
	} from '$lib/demo/volunteerFixtures';

	const event = $derived(getVolunteerEvent(page.params.eventId ?? ''));

	let selectedShiftId = $state<string | null>(null);
	let submitted = $state(false);

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let affiliation = $state('');

	function handleSubmit(e: { preventDefault: () => void }) {
		e.preventDefault();
		if (!name || !email || !selectedShiftId) return;
		submitted = true;
	}

	const selectedShift = $derived(
		event?.shifts.find((shift) => shift.id === selectedShiftId) ?? null
	);
	const selectedShiftOpenSlots = $derived(
		selectedShift ? Math.max(selectedShift.needed - selectedShift.filled, 0) : 0
	);
	const totalOpenSlots = $derived(
		event?.shifts.reduce((sum, shift) => sum + Math.max(shift.needed - shift.filled, 0), 0) ?? 0
	);
	const openShiftCount = $derived(
		event?.shifts.filter((shift) => getFillStatus(shift.filled, shift.needed) !== 'full').length ?? 0
	);
	const selectedShiftStatus = $derived(
		selectedShift ? getFillStatus(selectedShift.filled, selectedShift.needed) : null
	);
	const coordinator = $derived(
		findVolunteerContactByName('Megan Carter') ?? volunteerContacts[0] ?? null
	);
	const selectedShiftSummary = $derived.by(() => {
		if (!selectedShift) {
			return 'Choose any open shift to continue.';
		}

		if (selectedShiftOpenSlots === 0) {
			return 'This opening is almost fully covered.';
		}

		return `${selectedShiftOpenSlots} spot${selectedShiftOpenSlots === 1 ? '' : 's'} still open in this block.`;
	});
	const signupLeadCopyCompact = $derived.by(() => {
		if (!event) {
			return 'Pick an open shift and add your details.';
		}

		return `${openShiftCount} open shift${openShiftCount === 1 ? '' : 's'} still need coverage across ${totalOpenSlots} volunteer spot${totalOpenSlots === 1 ? '' : 's'}. Pick the window that fits.`;
	});
	const signupChips = $derived.by(() => [
		`${openShiftCount} open shift${openShiftCount === 1 ? '' : 's'}`,
		`${totalOpenSlots} spot${totalOpenSlots === 1 ? '' : 's'} still open`,
		'No account required'
	]);
	const confirmationChips = $derived.by(() => {
		const chips = [event?.date ?? '', selectedShift ? `${selectedShift.startTime} – ${selectedShift.endTime}` : '', event?.location ?? ''];
		return chips.filter(Boolean);
	});
	const confirmationNotes = $derived.by(() => {
		if (!event || !selectedShift) {
			return [
				{ title: 'Your shift is reserved', summary: 'Your volunteer window is saved and ready.' },
				{ title: 'Show up a few minutes early', summary: 'Arrive a little early so the coordinator can point you in.' },
				{ title: 'Need another hand?', summary: 'Reopen this event if you want to share the signup page with someone else.' }
			];
		}

		return [
			{
				title: 'Your shift is reserved',
				summary: `We saved ${selectedShift.title} for ${name}, and the team will expect you during that window.`
			},
			{
				title: 'Show up a few minutes early',
				summary: `Come to ${event.location} about 10 minutes before ${selectedShift.startTime} so the coordinator can point you in.`
			},
			{
				title: 'Need another hand?',
				summary: 'Reopen this event if you want to reserve another open role or share the signup page with someone else.'
			}
		];
	});
	const selectedShiftSummaryCompact = $derived.by(() => {
		if (!selectedShift) {
			return 'Choose any open shift to continue.';
		}

		if (selectedShiftOpenSlots === 0) {
			return 'Almost fully covered.';
		}

		return `${selectedShiftOpenSlots} spot${selectedShiftOpenSlots === 1 ? '' : 's'} still open.`;
	});
	const coordinatorSummaryCompact = 'Coordinating arrivals and any last-minute gaps.';

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
	class={`relative isolate mx-auto max-w-5xl px-4 py-8 sm:py-10 xl:max-w-6xl ${submitted ? 'lg:grid lg:min-h-[calc(100dvh-7.5rem)] lg:content-center' : ''}`}
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
			<Card.Content class="relative space-y-5 px-4 py-5 lg:grid lg:grid-cols-[minmax(0,1.04fr)_minmax(20rem,0.96fr)] lg:items-start lg:gap-5 lg:space-y-0 lg:px-6 lg:py-6">
				<div class="space-y-4">
					<div class="flex items-start gap-3.5">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div class="min-w-0">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Volunteer confirmed</p>
							<h1 class="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[1.95rem] lg:text-[2.25rem] lg:leading-[0.96]">
								You are all set for {selectedShift?.title ?? 'your shift'}
							</h1>
							<p class="mt-1.5 max-w-2xl text-[0.92rem] leading-6 text-muted-foreground lg:text-[0.96rem]">
								Confirmation is on its way to {email}. Bring yourself, arrive a few minutes early,
								and we will take care of the rest.
							</p>
							<div class="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
								{#each confirmationChips as chip (chip)}
									<Badge variant="muted" class="rounded-full px-2.5 py-1 text-[0.72rem] font-medium">
										{chip}
									</Badge>
								{/each}
							</div>
						</div>
					</div>

					{#if coordinator}
						<div class="rounded-[1.2rem] border border-border/70 bg-background/82 px-3.5 py-3.5 shadow-sm">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Need anything before you arrive?</p>
							<div class="mt-2.5 flex items-center gap-3">
								<Avatar.Root class="size-10 border border-border/70 bg-muted/30 shadow-sm after:hidden">
									<Avatar.Image src={coordinator.avatarUrl} alt={coordinator.name} />
								</Avatar.Root>
								<div class="min-w-0">
									<p class="text-sm font-semibold text-foreground">{coordinator.name}</p>
									<p class="text-[0.84rem] text-muted-foreground">Volunteer lead · {coordinator.businessAffiliation}</p>
								</div>
							</div>
							<p class="mt-2.5 text-[0.92rem] leading-6 text-muted-foreground">
								She will have the day-of team list and the check-in table ready when you arrive.
							</p>
						</div>
					{/if}

					<div class="grid gap-2.5 border-t border-border/60 pt-3.5 sm:grid-cols-3">
						{#each confirmationNotes as note, index (note.title)}
							<div class="rounded-2xl bg-muted/16 px-3 py-3">
								<div class="flex items-center gap-2">
									<span class={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : index === 1 ? 'bg-primary/70' : 'bg-primary/45'}`}></span>
									<p class="text-sm font-medium text-foreground">{note.title}</p>
								</div>
								<p class="mt-2 text-[0.9rem] leading-5 text-muted-foreground">{note.summary}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="space-y-3.5 rounded-[1.35rem] border border-border/70 bg-background/82 px-4 py-4 shadow-sm lg:px-5 lg:py-4.5">
					<div class="flex items-start gap-3.5 border-b border-border/60 pb-3.5">
						<div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/70 bg-muted/35 text-center">
							<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
							<p class="text-base font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
						</div>
						<div class="min-w-0">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Event recap</p>
							<h2 class="mt-1 text-[1.05rem] font-semibold tracking-tight text-foreground">{event.title}</h2>
							<p class="mt-1 text-sm leading-5 text-muted-foreground">{event.location}</p>
						</div>
					</div>

					<div class="space-y-2.5">
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Volunteer</span>
							<span class="text-right text-sm font-medium text-foreground">{name}</span>
						</div>
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shift</span>
							<span class="text-right text-sm font-medium text-foreground">{selectedShift?.title}</span>
						</div>
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Time</span>
							<span class="text-right text-sm font-medium text-foreground">{selectedShift?.startTime} – {selectedShift?.endTime}</span>
						</div>
						<div class="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Email</span>
							<span class="text-right text-sm font-medium text-foreground">{email}</span>
						</div>
						<div class="flex items-start justify-between gap-3">
							<span class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Affiliation</span>
							<span class="text-right text-sm font-medium text-foreground">{affiliation || 'Guest volunteer'}</span>
						</div>
					</div>

					<div class="flex flex-col gap-2 pt-1 sm:flex-row">
						<Button href={page.url.pathname} class="sm:flex-1 shadow-sm">Reserve another spot</Button>
						<Button href={page.url.pathname} variant="outline" class="sm:flex-1">View shifts again</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 lg:grid-cols-[minmax(17.5rem,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(18.5rem,0.68fr)_minmax(0,1.32fr)]">
			<Card.Root size="sm" class="relative hidden overflow-hidden border-border/70 bg-card shadow-sm lg:sticky lg:top-24 lg:block">
				<div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
				<div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
				<Card.Content class="relative space-y-3 px-4 py-4 lg:px-5 lg:py-4.25">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="flex items-start gap-4">
							<div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/70 bg-muted/30 text-center">
								<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
								<p class="text-[0.95rem] font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
							</div>

							<div class="space-y-1.5">
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Volunteer team</p>
								<h1 class="max-w-xl text-[1.45rem] font-semibold tracking-tight text-foreground sm:text-[1.8rem] lg:text-[2.05rem] lg:leading-[0.96]">{event.title}</h1>
								<p class="text-[0.92rem] leading-5 text-muted-foreground sm:text-sm">{event.location}</p>
								<p class="text-[0.92rem] leading-5 text-muted-foreground sm:text-sm">{event.date} · {event.timeRange}</p>
							</div>
						</div>
					</div>

					<p class="max-w-lg text-[0.9rem] leading-5.5 text-muted-foreground lg:text-[0.92rem]">{signupLeadCopyCompact}</p>

					<div class="flex flex-wrap gap-1.5 text-[0.8rem] text-muted-foreground sm:gap-2 sm:text-sm">
						{#each signupChips as chip, index (chip)}
							<Badge variant="muted" class={`rounded-full px-2.5 py-1 font-medium sm:px-3 sm:py-1.25 ${index === 2 ? 'hidden sm:inline-flex' : ''}`}>{chip}</Badge>
						{/each}
					</div>

					<div class="grid gap-2.5">
						<div class="rounded-[1.1rem] bg-muted/20 px-3 py-3 sm:rounded-[1.2rem] sm:px-3.5 sm:py-3.5">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current selection</p>
							{#if selectedShift}
								<div class="mt-2 flex flex-wrap items-center gap-2">
									<h2 class="text-[1.05rem] font-semibold tracking-tight text-foreground sm:text-[1.34rem]">{selectedShift.title}</h2>
									{#if selectedShiftStatus}
										<FillPill filled={selectedShift.filled} needed={selectedShift.needed} status={selectedShiftStatus} />
									{/if}
								</div>
								<p class="mt-1 text-[0.88rem] text-muted-foreground sm:text-sm">{selectedShift.startTime} – {selectedShift.endTime}</p>
								<p class="mt-1.5 text-[0.84rem] leading-5 text-muted-foreground sm:hidden">{selectedShiftSummaryCompact}</p>
								<p class="mt-2 hidden text-[0.9rem] leading-5 text-muted-foreground sm:block">{selectedShiftSummary}</p>
							{:else}
								<p class="mt-2 text-[0.88rem] text-muted-foreground sm:mt-2.5 sm:text-sm">Choose any open shift to continue.</p>
							{/if}
						</div>

						{#if coordinator}
							<div class="rounded-[1.1rem] border border-border/70 bg-background/82 px-3 py-3 shadow-sm sm:rounded-[1.2rem] sm:px-3.5 sm:py-3.25">
								<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">On-site coordinator</p>
								<div class="mt-2 flex items-center gap-2.5 sm:mt-2.5 sm:gap-3">
									<Avatar.Root class="size-9 border border-border/70 bg-muted/30 shadow-sm after:hidden sm:size-10">
										<Avatar.Image src={coordinator.avatarUrl} alt={coordinator.name} />
									</Avatar.Root>
									<div class="min-w-0">
										<p class="text-sm font-semibold text-foreground">{coordinator.name}</p>
										<p class="text-[0.8rem] text-muted-foreground sm:text-[0.84rem]">{coordinator.businessAffiliation}</p>
									</div>
								</div>
								<p class="mt-2 text-[0.84rem] leading-5 text-muted-foreground sm:hidden">{coordinatorSummaryCompact}</p>
								<p class="mt-2.5 hidden text-[0.9rem] leading-5 text-muted-foreground sm:block">She will be coordinating arrivals and filling any last-minute gaps at the event table.</p>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root size="sm" class="border-border/70 bg-card shadow-sm ring-1 ring-primary/10 lg:order-2">
				<Card.Header class="gap-2 border-b border-border/70">
					<div class="flex items-start gap-3 lg:hidden">
						<div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[0.9rem] border border-border/70 bg-muted/30 text-center">
							<p class="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
							<p class="text-[0.95rem] font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
						</div>
						<div class="min-w-0">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Volunteer team</p>
							<p class="truncate text-[0.98rem] font-semibold tracking-tight text-foreground">{event.title}</p>
							<p class="text-[0.82rem] leading-5 text-muted-foreground">{event.date} · {event.location}</p>
						</div>
					</div>
					<Card.Title class="text-lg font-semibold tracking-tight">Reserve a shift</Card.Title>
					<Card.Description>Pick an opening, add your contact details, and you are done.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3 py-4">
					<form onsubmit={handleSubmit} class="space-y-3">
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
										class={`appearance-none flex w-full items-start justify-between gap-3 rounded-[0.95rem] border px-3.25 py-2.5 text-left transition-all ${selectedShiftId === shift.id ? 'border-primary/25 bg-primary/8 shadow-sm dark:border-white/10 dark:bg-black/58 dark:text-foreground' : 'border-border/70 bg-background/80 dark:border-white/10 dark:bg-black/44 dark:text-foreground'} ${isFull ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/15 hover:bg-muted/20 dark:hover:bg-black/56'}`}
										onclick={() => !isFull && (selectedShiftId = shift.id)}
									>
										<div class="min-w-0 flex-1">
											<div class="flex flex-wrap items-center gap-2">
												<span class="text-[0.94rem] font-semibold tracking-tight text-foreground">{shift.title}</span>
												<FillPill filled={shift.filled} needed={shift.needed} {status} />
											</div>
											<p class="mt-1 text-[0.92rem] text-muted-foreground">{shift.startTime} – {shift.endTime}</p>
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

						<div class="space-y-2.5">
							<p class="text-sm font-medium text-foreground">Your details</p>

							<div class="grid gap-3 sm:grid-cols-2">
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

						<div class="space-y-2">
							{#if selectedShift}
								<p class="text-center text-xs text-muted-foreground">
									Selected: {selectedShift.title} · {selectedShift.startTime} – {selectedShift.endTime}
								</p>
							{/if}
							<Button type="submit" class="h-11 w-full shadow-sm" disabled={!name || !email || !selectedShiftId}>Reserve My Spot</Button>
							<p class="text-center text-xs text-muted-foreground">No account required. Confirmation goes to your email.</p>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
