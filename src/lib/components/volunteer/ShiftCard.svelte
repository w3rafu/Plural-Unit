<script lang="ts">
	import { getFillStatus } from '$lib/demo/volunteerFixtures';
	import type { VolunteerShift } from '$lib/demo/volunteerFixtures';
	import FillPill from './FillPill.svelte';

	let { shift }: { shift: VolunteerShift } = $props();

	const status = $derived(getFillStatus(shift.filled, shift.needed));
	const fillPercent = $derived(Math.round((shift.filled / shift.needed) * 100));
</script>

<div class="flex items-start justify-between gap-3 py-3">
	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center gap-2">
			<p class="text-sm font-medium text-foreground">{shift.title}</p>
			<FillPill filled={shift.filled} needed={shift.needed} {status} />
		</div>
		<p class="mt-0.5 text-[0.82rem] text-muted-foreground">{shift.startTime} – {shift.endTime}</p>
		<div class="mt-2 flex items-center gap-2">
			<div class="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full transition-all"
					class:bg-muted-foreground={status === 'full'}
					class:bg-yellow-500={status === 'need-more'}
					class:bg-green-500={status === 'open'}
					style="width: {fillPercent}%"
				></div>
			</div>
			<span class="text-[0.82rem] text-muted-foreground">{shift.filled}/{shift.needed}</span>
		</div>
	</div>
</div>
