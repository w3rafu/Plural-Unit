<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		class?: string;
	} & Record<string, unknown>;

	let { children, class: className = '', ...restProps }: Props = $props();
</script>

<div data-slot="sheet-footer" class={cn('flex items-center justify-end gap-3 border-t border-border px-5 py-4', className)} {...restProps}>
	{@render children?.()}
</div>