<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils';
	import SheetPortal from './sheet-portal.svelte';
	import SheetOverlay from './sheet-overlay.svelte';

	type Side = 'top' | 'right' | 'bottom' | 'left';

	let {
		ref = $bindable(null),
		class: className,
		children,
		portalProps,
		side = 'right' as Side,
		...restProps
	}: DialogPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: Side;
	} = $props();

	const sideClass = $derived(
		side === 'right'
			? 'inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=open]:animate-in data-[state=closed]:animate-out'
			: side === 'left'
				? 'inset-y-0 left-0 h-full w-full max-w-md border-r data-[state=open]:animate-in data-[state=closed]:animate-out'
				: side === 'top'
					? 'inset-x-0 top-0 border-b data-[state=open]:animate-in data-[state=closed]:animate-out'
					: 'inset-x-0 bottom-0 border-t data-[state=open]:animate-in data-[state=closed]:animate-out'
	);
</script>

<SheetPortal {...portalProps}>
	<SheetOverlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		class={cn(
			'bg-background fixed z-50 flex flex-col gap-4 border-border p-0 shadow-2xl outline-none',
			sideClass,
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</DialogPrimitive.Content>
</SheetPortal>