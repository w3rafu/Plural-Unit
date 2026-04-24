<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { HubExecutionDiagnosticEntry } from '$lib/models/hubExecutionDiagnostics';

	type Props = {
		entries: HubExecutionDiagnosticEntry[];
		title?: string;
	};

	let { entries, title = 'Execution context' }: Props = $props();
</script>

{#if entries.length > 0}
	<div class="mt-1 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm">
		<div class="space-y-1">
			<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				{title}
			</p>
			<p class="text-[0.82rem] text-muted-foreground">
				Execution-ledger state for this content, including recent attempts and any guidance before you retry or publish.
			</p>
		</div>

		<div class="space-y-2">
			{#each entries as entry (entry.id)}
				<div class="space-y-2 rounded-lg border border-border/70 bg-background px-3 py-2">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-medium text-foreground">{entry.label}</p>
						<Badge variant={entry.statusVariant}>{entry.statusLabel}</Badge>
						{#if entry.guidanceLabel && entry.guidanceVariant}
							<Badge variant={entry.guidanceVariant}>{entry.guidanceLabel}</Badge>
						{/if}
					</div>

					<p class="text-[0.82rem] text-muted-foreground">{entry.detailCopy}</p>

					<div class="flex flex-wrap gap-x-3 gap-y-1 text-[0.82rem] text-muted-foreground">
						<p>{entry.dueCopy}</p>
						{#if entry.lastAttemptCopy}
							<p>{entry.lastAttemptCopy}</p>
						{/if}
						{#if entry.processedCopy}
							<p>{entry.processedCopy}</p>
						{/if}
						{#if entry.attemptCountCopy}
							<p>{entry.attemptCountCopy}</p>
						{/if}
					</div>

					{#if entry.nextStepCopy}
						<p class="text-[0.82rem] text-muted-foreground">{entry.nextStepCopy}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}