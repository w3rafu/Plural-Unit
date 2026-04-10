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
	class={cn(
		"ring-foreground/8 bg-card/92 text-card-foreground group/card flex flex-col gap-5 overflow-hidden rounded-[1.55rem] py-5 text-sm ring-1 shadow-[0_16px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-[1.25rem] *:[img:last-child]:rounded-b-[1.25rem]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
