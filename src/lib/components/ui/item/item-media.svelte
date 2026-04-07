<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLAttributes<HTMLDivElement> & {
			children?: Snippet;
			variant?: 'default' | 'icon' | 'image' | 'avatar';
		}
	>;

	let { ref = $bindable(null), class: className, children, variant = 'default', ...restProps }: Props = $props();
</script>

<div
	bind:this={ref}
	data-slot="item-media"
	data-variant={variant}
	class={cn(
	'flex flex-none items-center justify-center',
		variant === 'icon' && 'size-9 rounded-md bg-muted text-muted-foreground',
		variant === 'image' && 'overflow-hidden rounded-md',
		variant === 'avatar' && 'overflow-hidden rounded-full',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
