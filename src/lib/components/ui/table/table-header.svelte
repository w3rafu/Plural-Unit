<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLTableSectionElement> & {
			children?: Snippet;
			class?: string;
		}
	>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<thead
	bind:this={ref}
	data-slot="table-header"
	class={cn('[&_tr]:border-b', className)}
	{...restProps}
>
	{@render children?.()}
</thead>
