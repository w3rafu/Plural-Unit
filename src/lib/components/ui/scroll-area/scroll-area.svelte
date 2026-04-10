<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	let { ref = $bindable(null), class: className, children, ...restProps }: ScrollAreaPrimitive.RootProps = $props();
</script>

<ScrollAreaPrimitive.Root
	bind:ref
	data-slot="scroll-area"
	class={cn('relative overflow-hidden', className)}
	{...restProps}
>
	<ScrollAreaPrimitive.Viewport class="size-full rounded-[inherit]">
		{@render children?.()}
	</ScrollAreaPrimitive.Viewport>
	<ScrollAreaPrimitive.Scrollbar orientation="vertical" class="flex w-2.5 touch-none p-px transition-colors select-none">
		<ScrollAreaPrimitive.Thumb class="bg-border relative flex-1 rounded-full" />
	</ScrollAreaPrimitive.Scrollbar>
	<ScrollAreaPrimitive.Scrollbar orientation="horizontal" class="flex h-2.5 touch-none p-px transition-colors select-none">
		<ScrollAreaPrimitive.Thumb class="bg-border relative flex-1 rounded-full" />
	</ScrollAreaPrimitive.Scrollbar>
	<ScrollAreaPrimitive.Corner class="bg-transparent" />
</ScrollAreaPrimitive.Root>