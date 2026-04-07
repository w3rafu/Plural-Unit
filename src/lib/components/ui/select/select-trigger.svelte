<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { getSelectTriggerClass } from './selectStyles';

	type Props = {
		children?: Snippet;
		class?: string;
		id?: string;
		ref?: HTMLButtonElement | null;
	} & Record<string, any>;

	let { ref = $bindable(null), children, class: className, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	class={getSelectTriggerClass(className)}
	{...restProps}
>
	<span class="truncate">
		{@render children?.()}
	</span>
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="size-4 shrink-0 opacity-50"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
</SelectPrimitive.Trigger>
