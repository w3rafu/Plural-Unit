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

<SelectPrimitive.ScrollUpButton
	data-slot="select-scroll-up-button"
	class={cn('flex cursor-default items-center justify-center py-1', className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.ScrollUpButton>
