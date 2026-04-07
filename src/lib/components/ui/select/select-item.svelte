<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { getSelectItemClass } from './selectStyles';

	type Props = {
		children?: Snippet;
		value: string;
		label?: string;
		disabled?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
	} & Record<string, any>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	data-slot="select-item"
	class={getSelectItemClass(className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.Item>
