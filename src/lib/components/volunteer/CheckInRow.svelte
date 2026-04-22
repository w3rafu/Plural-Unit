<script lang="ts">
	let {
		name,
		shift,
		checked = $bindable(false)
	}: {
		name: string;
		shift: string;
		checked?: boolean;
	} = $props();
</script>

<div class="flex items-center gap-4 py-3">
	<button
		type="button"
		role="checkbox"
		aria-checked={checked}
		class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
		class:border-primary={checked}
		class:bg-primary={checked}
		class:text-primary-foreground={checked}
		class:border-border={!checked}
		onclick={() => (checked = !checked)}
	>
		{#if checked}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</button>
	<div class="min-w-0 flex-1">
		<p class="text-sm font-medium text-foreground" class:line-through={checked} class:text-muted-foreground={checked}>
			{name}
		</p>
		<p class="text-xs text-muted-foreground">{shift}</p>
	</div>
	{#if checked}
		<span class="text-xs font-medium text-green-600 dark:text-green-400">Checked in</span>
	{/if}
</div>
