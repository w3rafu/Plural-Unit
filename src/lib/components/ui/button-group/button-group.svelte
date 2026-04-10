<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		orientation?: 'horizontal' | 'vertical';
		class?: string;
	} & Record<string, unknown>;

	let {
		children,
		orientation = 'horizontal',
		class: className = '',
		...rest
	}: Props = $props();

	const groupClass = $derived(
		cn(
			'inline-flex w-fit items-center',
			orientation === 'horizontal' &&
				'[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px',
			orientation === 'vertical' &&
				'flex-col [&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px',
			className
		)
	);
</script>

<div role="group" class={groupClass} {...rest}>
	{@render children?.()}
</div>