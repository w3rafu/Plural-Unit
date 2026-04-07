<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		class?: string;
	} & Record<string, any>;

	let { children, class: className, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Viewport
	data-slot="select-viewport"
	class={cn('p-1', className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.Viewport>
