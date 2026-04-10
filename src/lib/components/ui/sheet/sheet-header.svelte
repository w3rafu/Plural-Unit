<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		class?: string;
	} & Record<string, unknown>;

	let { children, class: className = '', ...restProps }: Props = $props();
</script>

<div data-slot="sheet-header" class={cn('flex flex-col gap-1.5 border-b border-border px-5 py-4', className)} {...restProps}>
	{@render children?.()}
</div>