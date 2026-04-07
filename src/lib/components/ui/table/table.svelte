<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLTableAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLTableAttributes & {
			children?: Snippet;
			class?: string;
		}
	>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<div data-slot="table-container" class="relative w-full overflow-auto">
	<table
		bind:this={ref}
		data-slot="table"
		class={cn('w-full caption-bottom text-sm', className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
