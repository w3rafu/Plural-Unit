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
</script>

{#if status === 'full'}
	<Badge variant="outline" class="rounded-full px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
		Full
	</Badge>
{:else if status === 'need-more'}
	<span class="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-foreground/80">
		Need {needed - filled} more
	</span>
{:else}
	<Badge variant="secondary" class="rounded-full px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
		{filled}/{needed} filled
	</Badge>
{/if}
