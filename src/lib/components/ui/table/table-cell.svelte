<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLTableCellElement> & {
			children?: Snippet;
			class?: string;
			colspan?: number;
			rowspan?: number;
		}
	>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn('p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
	{...restProps}
>
	{@render children?.()}
</td>
