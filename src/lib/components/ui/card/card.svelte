<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	class={cn("bg-card text-card-foreground relative flex flex-col gap-5 overflow-hidden rounded-4xl border border-border py-5 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.06)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80 dark:border-white/8 dark:before:bg-white/6 dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.24)] has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3.5 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl group/card", className)}
	{...restProps}
>
	{@render children?.()}
</div>
