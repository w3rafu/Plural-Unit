<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		checked?: boolean;
		disabled?: boolean;
		required?: boolean;
		readonly?: boolean;
		name?: string;
		value?: string;
		onCheckedChange?: (checked: boolean) => void;
		indeterminate?: boolean;
		class?: string;
		ref?: HTMLButtonElement | null;
	} & Record<string, any>;

	let {
		ref = $bindable(null),
		class: className,
		children,
		checked = $bindable(false),
		indeterminate = $bindable(false),
		...restProps
	}: Props = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	data-slot="checkbox"
	class={cn(
		'peer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 size-4 shrink-0 rounded-[4px] border border-input bg-background shadow-xs outline-none transition-shadow focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#if checked}
		<svg
			class="pointer-events-none size-3.5 shrink-0 text-current"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	{:else if indeterminate}
		<svg
			class="pointer-events-none size-3.5 shrink-0 text-current"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M5 12h14" />
		</svg>
	{/if}
</CheckboxPrimitive.Root>
