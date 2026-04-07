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

<SelectPrimitive.GroupHeading
	data-slot="select-group-heading"
	class={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.GroupHeading>
