<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		value?: string;
		name?: string;
		disabled?: boolean;
		required?: boolean;
		orientation?: 'horizontal' | 'vertical';
		onValueChange?: (value: string) => void;
		class?: string;
		ref?: HTMLDivElement | null;
	} & Record<string, any>;

	let {
		ref = $bindable(null),
		class: className,
		children,
		value = $bindable(''),
		...restProps
	}: Props = $props();
</script>

<RadioGroupPrimitive.Root
	bind:ref
	bind:value
	data-slot="radio-group"
	class={cn('grid gap-2', className)}
	{...restProps}
>
	{@render children?.()}
</RadioGroupPrimitive.Root>
