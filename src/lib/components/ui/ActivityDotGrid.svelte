<script lang="ts">
	let {
		title,
		caption,
		values,
		columns = 7,
		footer = 'Past 4 weeks',
		compact = false
	}: {
		title: string;
		caption: string;
		values: number[];
		columns?: number;
		footer?: string;
		compact?: boolean;
	} = $props();

	function getTone(value: number) {
		if (value >= 4) {
			return 'bg-emerald-600';
		}

		if (value === 3) {
			return 'bg-emerald-500';
		}

		if (value === 2) {
			return 'bg-emerald-300';
		}

		if (value === 1) {
			return 'bg-emerald-200';
		}

		return 'border border-emerald-100 bg-emerald-50';
	}
</script>

<div class={`rounded-[1.2rem] border border-border/70 bg-background/88 shadow-sm ${compact ? 'p-3' : 'p-3.5'}`}>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
			<p class={`mt-1 text-muted-foreground ${compact ? 'text-[0.84rem] leading-5' : 'text-sm leading-5'}`}>{caption}</p>
		</div>
		<p class="shrink-0 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
			{footer}
		</p>
	</div>

	<div class={`grid gap-1.5 ${compact ? 'mt-2.5' : 'mt-3'}`} style={`grid-template-columns: repeat(${columns}, minmax(0, 1fr));`}>
		{#each values as value, index (index)}
			<span class={`${compact ? 'h-3 rounded-[0.28rem]' : 'h-3.5 rounded-[0.32rem]'} ${getTone(value)}`}></span>
		{/each}
	</div>

	<div class={`flex items-center justify-between text-[0.68rem] text-muted-foreground ${compact ? 'mt-2.5' : 'mt-3'}`}>
		<span>Lower</span>
		<span>Higher activity</span>
	</div>
</div>