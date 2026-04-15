<script lang="ts">
	import type { HubOperatorWorkflowSummary } from '$lib/models/hubOperatorWorkflowModel';

	type WorkflowSummaryPanelEntry = {
		id: string;
		label: string;
		summary: HubOperatorWorkflowSummary;
		contextCopy?: string | null;
	};

	type Props = {
		entries: WorkflowSummaryPanelEntry[];
		title?: string;
		description?: string;
	};

	let {
		entries,
		title = 'Workflow handoff',
		description = 'Shared review and defer notes stay with each workflow row until it is surfaced again or the underlying work changes.'
	}: Props = $props();
</script>

{#if entries.length > 0}
	<div class="mt-1 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm">
		<div class="space-y-1">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				{title}
			</p>
			<p class="text-xs text-muted-foreground">{description}</p>
		</div>

		<div class="space-y-2">
			{#each entries as entry (entry.id)}
				<div class="space-y-1 rounded-lg border border-border/70 bg-background px-3 py-2">
					<p class="text-xs font-medium text-foreground">{entry.label}</p>
					{#if entry.contextCopy}
						<p class="text-xs text-muted-foreground">{entry.contextCopy}</p>
					{/if}
					<p class="text-xs text-muted-foreground">{entry.summary.summaryCopy}</p>
					{#if entry.summary.note}
						<p class="text-xs text-foreground">{entry.summary.note}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}