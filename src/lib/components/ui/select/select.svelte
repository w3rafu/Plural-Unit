<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { getSelectRootClass } from './selectStyles';

	let { children, class: className, value = $bindable(''), open = $bindable(false), ...restProps }: any = $props();
</script>

<div data-slot="select" class={getSelectRootClass(className)}>
	<SelectPrimitive.Root bind:value bind:open {...restProps}>
		{@render children?.()}
	</SelectPrimitive.Root>
</div>
