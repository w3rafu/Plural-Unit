<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLFieldsetAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<
		HTMLFieldsetAttributes & {
			children?: Snippet;
			disabled?: boolean;
		}
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<fieldset
	bind:this={ref}
	data-slot="field-set"
	class={cn('flex flex-col gap-4 rounded-lg border border-border/60 p-4', className)}
	{...restProps}
>
	{@render children?.()}
</fieldset>
