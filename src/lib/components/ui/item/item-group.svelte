<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type WithElementRef } from '$lib/utils';
	import { getItemGroupClass } from './itemStyles';

	type Props = WithElementRef<
		HTMLAttributes<HTMLDivElement> & {
			children?: Snippet;
		}
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<div
	bind:this={ref}
	data-slot="item-group"
	class={getItemGroupClass(className)}
	{...restProps}
>
	{@render children?.()}
</div>
