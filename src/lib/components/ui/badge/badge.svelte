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
			variant === 'default' && 'border-transparent bg-primary text-primary-foreground',
			variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
			variant === 'outline' && 'border-border bg-background text-foreground',
			variant === 'destructive' && 'border-transparent bg-destructive text-white',
			className
		)
	);
</script>

<span class={badgeClass} {...restProps}>
	{@render children?.()}
</span>
