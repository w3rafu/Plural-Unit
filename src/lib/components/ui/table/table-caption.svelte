<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		class?: string;
		ref?: HTMLTableCaptionElement | null;
	} & Record<string, any>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<caption
	bind:this={ref}
	data-slot="table-caption"
	class={cn('text-muted-foreground mt-4 text-sm', className)}
	{...restProps}
>
	{@render children?.()}
</caption>
