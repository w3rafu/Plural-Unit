<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		value: string;
		disabled?: boolean;
		class?: string;
		ref?: HTMLButtonElement | null;
	} & Record<string, any>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	data-slot="radio-group-item"
	class={cn(
		"peer relative dark:bg-input/30 data-[state=checked]:border-primary data-[state=checked]:after:scale-100 data-[state=checked]:after:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-full border border-input bg-background shadow-xs outline-none transition-shadow focus-visible:ring-[3px] after:absolute after:inset-0 after:m-auto after:size-2 after:rounded-full after:scale-0 after:content-[''] disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</RadioGroupPrimitive.Item>
