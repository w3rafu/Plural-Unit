<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type WithElementRef } from '$lib/utils';
	import { getItemTitleClass } from './itemStyles';

	type Props = WithElementRef<
		HTMLAttributes<HTMLHeadingElement> & {
			children?: Snippet;
		}
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<h3
	bind:this={ref}
	data-slot="item-title"
	class={getItemTitleClass(className)}
	{...restProps}
>
	{@render children?.()}
</h3>
