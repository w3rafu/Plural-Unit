<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLLegendElement> & {
			children?: Snippet;
		}
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<legend
	bind:this={ref}
	data-slot="field-legend"
	class={cn('text-sm font-medium leading-none', className)}
	{...restProps}
>
	{@render children?.()}
</legend>
