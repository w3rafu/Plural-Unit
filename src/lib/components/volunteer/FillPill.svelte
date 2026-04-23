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
	<Badge variant="outline" class="rounded-full border-border/70 bg-transparent px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
		Full
	</Badge>
{:else if status === 'need-more'}
	<span class="inline-flex items-center rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-[0.7rem] font-medium text-foreground">
		Need {remaining} more
	</span>
{:else}
	<Badge variant="secondary" class="rounded-full bg-primary/8 px-2 py-0.5 text-[0.7rem] font-medium text-primary/90">
		{filled}/{needed} filled
	</Badge>
{/if}
