<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { getSelectRootClass } from './selectStyles';

	// bits-ui Select.Root uses a union type (single | multiple) that cannot be
	// narrowed in a wrapper component, so we keep the rest-props untyped.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let { children, class: className, value = $bindable(''), open = $bindable(false), ...restProps }: any = $props();
</script>

<div data-slot="select" class={getSelectRootClass(className)}>
	<SelectPrimitive.Root bind:value bind:open {...restProps}>
		{@render children?.()}
	</SelectPrimitive.Root>
</div>
