<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type WithElementRef } from '$lib/utils';
	import { getItemDescriptionClass } from './itemStyles';

	type Props = WithElementRef<
		HTMLAttributes<HTMLParagraphElement> & {
			children?: Snippet;
		}
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<p
	bind:this={ref}
	data-slot="item-description"
	class={getItemDescriptionClass(className)}
	{...restProps}
>
	{@render children?.()}
</p>
