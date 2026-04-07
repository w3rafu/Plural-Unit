<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLDivElement> & {
			children?: Snippet;
		}
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<div
	bind:this={ref}
	data-slot="item-actions"
	class={cn('flex flex-none items-center gap-2', className)}
	{...restProps}
>
	{@render children?.()}
</div>
