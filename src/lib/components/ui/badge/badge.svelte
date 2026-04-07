<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Variant = 'default' | 'secondary' | 'outline' | 'destructive';

	type Props = {
		children?: Snippet;
		variant?: Variant;
		class?: string;
	} & Record<string, any>;

	let { children, variant = 'default', class: className, ...restProps }: Props = $props();

	const badgeClass = $derived(
		cn(
			'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
			variant === 'default' && 'border-transparent bg-stone-900 text-stone-50',
			variant === 'secondary' && 'border-transparent bg-stone-100 text-stone-900',
			variant === 'outline' && 'text-foreground',
			variant === 'destructive' && 'border-transparent bg-red-600 text-stone-50',
			className
		)
	);
</script>

<span class={badgeClass} {...restProps}>
	{@render children?.()}
</span>
