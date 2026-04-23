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
	<Badge variant="muted" class="rounded-full px-2 py-0.5 text-[0.68rem] font-medium tracking-[0.01em]">
		Full
	</Badge>
{:else if status === 'need-more'}
	<Badge variant="warning" class="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.01em]">
		Need {remaining} more
	</Badge>
{:else}
	<Badge variant="success" class="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.01em]">
		{filled}/{needed} filled
	</Badge>
{/if}
