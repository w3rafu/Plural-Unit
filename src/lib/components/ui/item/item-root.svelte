<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type WithElementRef } from '$lib/utils';
	import { getItemRootClass, type ItemSize, type ItemVariant } from './itemStyles';

	type Props = WithElementRef<
		HTMLAttributes<HTMLElement> & {
			children?: Snippet;
			variant?: ItemVariant;
			size?: ItemSize;
			child?: Snippet<[{
				props: Record<string, unknown>;
			}]>;
		}
	>;

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		variant = 'default',
		size = 'default',
		...restProps
	}: Props = $props();

	const rootClass = $derived(
		getItemRootClass({
			variant,
			size,
			className
		})
	);

	const rootProps = $derived({
		...restProps,
		class: rootClass
	});
</script>

{#if child}
	{@render child({ props: rootProps })}
{:else}
	<div bind:this={ref} data-slot="item" {...rootProps}>
		{@render children?.()}
	</div>
{/if}
