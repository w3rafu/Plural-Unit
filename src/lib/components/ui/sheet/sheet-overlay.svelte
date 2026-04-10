<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	let { ref = $bindable(null), class: className, ...restProps }: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="sheet-overlay"
	class={cn('fixed inset-0 z-50 bg-zinc-950/55 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out', className)}
	{...restProps}
/>