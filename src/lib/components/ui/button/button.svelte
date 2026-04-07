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
			'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
			variant === 'default' &&
				'bg-stone-900 text-stone-50 shadow hover:bg-stone-800',
			variant === 'destructive' &&
				'bg-red-600 text-stone-50 shadow-sm hover:bg-red-700',
			variant === 'outline' &&
				'border border-stone-300 bg-transparent shadow-sm hover:bg-stone-100 hover:text-stone-900',
			variant === 'secondary' &&
				'bg-stone-100 text-stone-900 shadow-sm hover:bg-stone-200',
			variant === 'ghost' && 'hover:bg-stone-100 hover:text-stone-900',
			variant === 'link' && 'h-auto px-0 text-stone-900 underline-offset-4 hover:underline',
			size === 'default' && 'h-10 px-4 py-2',
			size === 'sm' && 'h-9 rounded-md px-3',
			size === 'lg' && 'h-11 rounded-md px-8',
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
