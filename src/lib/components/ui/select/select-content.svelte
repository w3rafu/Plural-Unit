<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { getSelectContentClass } from './selectStyles';

	type Props = {
		children?: Snippet;
		class?: string;
		loop?: boolean;
		sideOffset?: number;
		align?: 'start' | 'center' | 'end';
		ref?: HTMLDivElement | null;
	} & Record<string, any>;

	let { children, class: className, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Portal>
	<SelectPrimitive.Content
		data-slot="select-content"
		class={getSelectContentClass(className)}
		{...restProps}
	>
		<SelectPrimitive.ScrollUpButton />
		<SelectPrimitive.Viewport class="p-1">
			{@render children?.()}
		</SelectPrimitive.Viewport>
		<SelectPrimitive.ScrollDownButton />
	</SelectPrimitive.Content>
</SelectPrimitive.Portal>
