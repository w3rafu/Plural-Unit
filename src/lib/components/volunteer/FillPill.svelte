<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { FillStatus } from '$lib/demo/volunteerFixtures';

	let {
		filled,
		needed,
		status
	}: {
		filled: number;
		needed: number;
		status: FillStatus;
	} = $props();

	const remaining = $derived(Math.max(needed - filled, 0));
</script>

{#if status === 'full'}
	<Badge variant="outline" class="rounded-full border-border/80 bg-background/85 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-sm">
		Full
	</Badge>
{:else if status === 'need-more'}
	<span class="inline-flex items-center gap-1.5 rounded-full border border-chart-4/35 bg-chart-4/16 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-foreground shadow-sm">
		<span class="size-1.5 rounded-full bg-chart-4"></span>
		Need {remaining} more
	</span>
{:else}
	<Badge variant="secondary" class="rounded-full border-primary/15 bg-primary/8 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary/90 shadow-sm">
		{filled}/{needed} filled
	</Badge>
{/if}
