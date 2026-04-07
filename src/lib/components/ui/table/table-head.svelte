<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLTableCellElement> & {
			children?: Snippet;
			class?: string;
		}
	>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn('text-foreground h-11 px-3 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
	{...restProps}
>
	{@render children?.()}
</th>
