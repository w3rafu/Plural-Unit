<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLTableRowElement> & {
			children?: Snippet;
			class?: string;
		}
	>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn('hover:bg-muted/50 border-b transition-colors data-[state=selected]:bg-muted', className)}
	{...restProps}
>
	{@render children?.()}
</tr>
