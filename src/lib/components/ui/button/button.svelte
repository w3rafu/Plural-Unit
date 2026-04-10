<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';

	export type ButtonProps = {
		children?: Snippet;
		href?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		target?: string;
		rel?: string;
	} & Record<string, unknown>;

	let {
		children,
		href = '',
		variant = 'default',
		size = 'default',
		class: className = '',
		type = 'button',
		disabled = false,
		onclick,
		target,
		rel,
		...rest
	}: ButtonProps = $props();

	const buttonClass = $derived(
		cn(
			'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
			variant === 'default' &&
				'bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(24,24,27,0.12)] hover:-translate-y-px hover:bg-primary/95',
			variant === 'destructive' &&
				'bg-destructive text-white shadow-[0_10px_22px_rgba(127,29,29,0.14)] hover:-translate-y-px hover:bg-destructive/92',
			variant === 'outline' &&
				'border border-input/90 bg-background/88 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:-translate-y-px hover:bg-accent/85 hover:text-accent-foreground',
			variant === 'secondary' &&
				'bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-secondary/88',
			variant === 'ghost' && 'hover:bg-accent/80 hover:text-accent-foreground',
			variant === 'link' && 'h-auto px-0 text-foreground underline-offset-4 hover:underline',
			size === 'default' && 'h-10 px-4 py-2',
			size === 'sm' && 'h-9 rounded-lg px-3',
			size === 'lg' && 'h-11 rounded-lg px-8',
			size === 'icon' && 'h-10 w-10 p-0',
			size === 'icon-sm' && 'h-9 w-9 p-0',
			className
		)
	);
</script>

{#if href}
	<a
		class={buttonClass}
		href={disabled ? undefined : href}
		aria-disabled={disabled ? 'true' : undefined}
		tabindex={disabled ? -1 : undefined}
		target={target || undefined}
		rel={rel || undefined}
		onclick={disabled ? undefined : onclick}
		{...rest}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		class={buttonClass}
		{type}
		disabled={disabled}
		onclick={onclick}
		{...rest}
	>
		{@render children?.()}
	</button>
{/if}
