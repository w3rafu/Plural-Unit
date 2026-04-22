<script lang="ts">
	import {
		getFillStatus,
		getEventFilledSlots,
		getEventTotalSlots
	} from '$lib/demo/volunteerFixtures';
	import type { VolunteerEvent } from '$lib/demo/volunteerFixtures';
	import FillPill from './FillPill.svelte';
	import { Button } from '$lib/components/ui/button';

	let { event, signupHref }: { event: VolunteerEvent; signupHref: string } = $props();

	const total = $derived(getEventTotalSlots(event));
	const filled = $derived(getEventFilledSlots(event));
	const status = $derived(getFillStatus(filled, total));
	const fillPercent = $derived(Math.round((filled / total) * 100));

	function getDateParts(date: string) {
		const [month, day] = date.split(' ');
		return {
			month: month.slice(0, 3).toUpperCase(),
			day: day.replace(',', '')
		};
	}
</script>

<div class="grid grid-cols-[auto,minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[auto,minmax(0,1fr)_auto] sm:items-end">
	<div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/70 bg-muted/30 text-center">
		<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getDateParts(event.date).month}</p>
		<p class="text-base font-semibold tracking-tight text-foreground">{getDateParts(event.date).day}</p>
	</div>

	<div class="min-w-0 space-y-2">
		<div class="flex flex-wrap items-center gap-2">
			<p class="text-sm font-medium text-foreground">{event.title}</p>
			<FillPill {filled} needed={total} {status} />
		</div>
		<div class="flex flex-wrap gap-2 text-[0.72rem] font-medium text-muted-foreground">
			<span class="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">{event.timeRange}</span>
		</div>
		<p class="text-sm text-muted-foreground">{event.location}</p>
		<div class="min-w-0 flex-1 space-y-1.5">
			<div class="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					class={`h-full rounded-full ${status === 'full' ? 'bg-muted-foreground' : status === 'need-more' ? 'bg-yellow-500/90' : 'bg-foreground/70'}`}
					style="width: {fillPercent}%"
				></div>
			</div>
			<p class="text-xs text-muted-foreground">{filled}/{total} filled</p>
		</div>
	</div>
	<Button href={signupHref} variant="outline" size="sm" class="col-span-2 h-8 w-fit shrink-0 rounded-full px-3 text-xs sm:col-span-1 sm:self-center sm:justify-self-end">Sign up</Button>
</div>
