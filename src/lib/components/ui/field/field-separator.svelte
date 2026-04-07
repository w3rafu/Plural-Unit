<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<HTMLAttributes<HTMLHRElement>>;

	let { ref = $bindable(null), class: className, ...restProps }: Props = $props();
</script>

<hr
	bind:this={ref}
	data-slot="field-separator"
	class={cn('border-border my-2 w-full border-t', className)}
	{...restProps}
/>
