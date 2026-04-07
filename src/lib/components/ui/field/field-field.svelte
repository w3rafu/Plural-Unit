<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Orientation = 'vertical' | 'horizontal';

	type Props = WithElementRef<
		HTMLAttributes<HTMLDivElement> & {
			children?: Snippet;
			orientation?: Orientation;
		}
	>;

	let {
		ref = $bindable(null),
		class: className,
		children,
		orientation = 'vertical',
		...restProps
	}: Props = $props();
</script>

<div
	bind:this={ref}
	data-slot="field"
	data-orientation={orientation}
	class={cn(
		orientation === 'horizontal'
			? 'flex flex-row items-center gap-3'
			: 'flex flex-col gap-1.5',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
