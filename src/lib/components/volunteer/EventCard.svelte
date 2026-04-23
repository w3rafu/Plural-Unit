<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import {
		getFillStatus,
		getEventFilledSlots,
		getEventTotalSlots
	} from '$lib/demo/volunteerFixtures';
	import type { VolunteerContact, VolunteerEvent } from '$lib/demo/volunteerFixtures';
	import FillPill from './FillPill.svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		event,
		signupHref,
		leadContact = null,
		participantContacts = []
	}: {
		event: VolunteerEvent;
		signupHref: string;
		leadContact?: VolunteerContact | null;
		participantContacts?: VolunteerContact[];
	} = $props();

	const total = $derived(getEventTotalSlots(event));
	const filled = $derived(getEventFilledSlots(event));
	const status = $derived(getFillStatus(filled, total));
	const fillPercent = $derived(Math.round((filled / total) * 100));
	const openSpots = $derived(Math.max(total - filled, 0));
	const visibleParticipants = $derived(participantContacts.slice(0, 3));

	function getDateParts(date: string) {
		const [month, day] = date.split(' ');
		return {
			month: month.slice(0, 3).toUpperCase(),
			day: day.replace(',', '')
		};
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card shadow-sm">
	<Card.Content class="space-y-3.5 p-3.5">
		<div class="grid grid-cols-[auto,minmax(0,1fr)] gap-3">
			<div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/70 bg-background/85 text-center shadow-sm">
				<p class="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{getDateParts(event.date).month}</p>
				<p class="text-base font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
			</div>

			<div class="min-w-0 space-y-2">
				<div class="flex flex-wrap items-start justify-between gap-2">
					<div class="min-w-0">
						<p class="text-[0.98rem] font-semibold tracking-tight text-foreground">{event.title}</p>
						<p class="mt-0.5 text-[0.8rem] text-muted-foreground">{event.date} · {event.timeRange}</p>
					</div>
					<FillPill {filled} needed={total} {status} />
				</div>

				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-muted-foreground">
					<span>{event.location}</span>
					<span>{filled}/{total} filled</span>
					{#if openSpots > 0}
						<span>{openSpots} open</span>
					{:else}
						<span>Fully staffed</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="space-y-1.5">
			<div class="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					class={`h-full rounded-full ${status === 'full' ? 'bg-muted-foreground' : status === 'need-more' ? 'bg-chart-4/90' : 'bg-primary/75'}`}
					style="width: {fillPercent}%"
				></div>
			</div>
			<p class="text-[0.76rem] text-muted-foreground">
				{openSpots > 0
					? `${openSpots} volunteer spot${openSpots === 1 ? '' : 's'} still need coverage.`
					: 'This event is fully covered.'}
			</p>
		</div>

		{#if leadContact}
			<div class="flex items-center justify-between gap-3 rounded-2xl bg-muted/18 px-3 py-2">
				<div class="flex min-w-0 items-center gap-3">
					<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-background shadow-sm after:hidden">
						{#if leadContact.avatarUrl}
							<Avatar.Image src={leadContact.avatarUrl} alt={leadContact.name} />
						{:else}
							<Avatar.Fallback class="text-[0.72rem] font-semibold text-foreground">
								{getInitials(leadContact.name)}
							</Avatar.Fallback>
						{/if}
					</Avatar.Root>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-foreground">{leadContact.name}</p>
						<p class="truncate text-[0.74rem] text-muted-foreground">
							Lead volunteer{leadContact.businessAffiliation ? ` · ${leadContact.businessAffiliation}` : ''}
						</p>
					</div>
				</div>

				{#if visibleParticipants.length > 0}
					<div class="flex items-center gap-2">
						<div class="flex -space-x-2">
							{#each visibleParticipants as participant (participant.id)}
								<Avatar.Root class="size-7 border-2 border-card bg-background shadow-sm after:hidden">
									{#if participant.avatarUrl}
										<Avatar.Image src={participant.avatarUrl} alt={participant.name} />
									{:else}
										<Avatar.Fallback class="text-[0.65rem] font-semibold text-foreground">
											{getInitials(participant.name)}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>
							{/each}
						</div>
						<p class="text-[0.7rem] text-muted-foreground">{visibleParticipants.length} returning</p>
					</div>
				{/if}
			</div>
		{/if}

		<div class="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
			<p class="text-[0.76rem] text-muted-foreground">Board is open now.</p>
			<Button href={signupHref} variant="default" size="sm" class="h-8 rounded-full px-4 text-[0.72rem] shadow-sm">Join shift</Button>
		</div>
	</Card.Content>
</Card.Root>
