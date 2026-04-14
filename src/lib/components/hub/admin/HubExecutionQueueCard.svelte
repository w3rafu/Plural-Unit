<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import { buildHubExecutionQueueSections, type HubExecutionQueueItem } from '$lib/models/hubExecutionQueue';
	import { currentHub } from '$lib/stores/currentHub.svelte';

	const queueSections = $derived(
		buildHubExecutionQueueSections({
			rows: currentHub.executionLedger,
			broadcasts: currentHub.broadcasts,
			events: currentHub.events
		})
	);
	const dueCount = $derived(queueSections.due.length);
	const recoveryCount = $derived(queueSections.recovery.length);
	const processedCount = $derived(currentHub.processedExecutionItems.length);
	const followUpSignals = $derived(currentHub.hubEventFollowUpSignals);
	const followUpCount = $derived(followUpSignals.length);
	const hasQueueItems = $derived(
		dueCount > 0 || recoveryCount > 0 || processedCount > 0 || followUpCount > 0
	);
	const summaryCopy = $derived.by(() => {
		if (!hasQueueItems) {
			return 'Scheduled publishes and reminder windows will collect here once the hub has timed work to manage.';
		}

		const parts = [];

		if (dueCount > 0) {
			parts.push(`${dueCount} due now`);
		}

		if (recoveryCount > 0) {
			parts.push(`${recoveryCount} needing recovery`);
		}

		if (processedCount > 0) {
			parts.push(`${processedCount} already processed`);
		}

		if (followUpCount > 0) {
			parts.push(`${followUpCount} needing follow-up`);
		}

		return `${parts.join(' · ')}.`;
	});

	function getStatusVariant(item: HubExecutionQueueItem) {
		switch (item.bucket) {
			case 'failed':
				return 'destructive';
			case 'skipped':
				return 'outline';
			case 'processed':
				return 'secondary';
			default:
				return 'secondary';
		}
	}

	function getOpenHref(item: HubExecutionQueueItem) {
		return `/hub/manage/content#${item.sectionId}`;
	}

	function getFollowUpVariant(tone: 'attention' | 'neutral') {
		return tone === 'attention' ? 'destructive' : 'outline';
	}

	function getFollowUpOpenHref() {
		return '/hub/manage/content#manage-events';
	}

	function getFollowUpActionLabel(kind: 'attendance_review' | 'no_show' | 'low_turnout') {
		return kind === 'attendance_review' ? 'Review attendance' : 'Open event';
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Operations queue</Card.Title>
		<Card.Description>{summaryCopy}</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		{#if !hasQueueItems}
			<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
				<Card.Content>
					<p class="text-sm text-muted-foreground">
						No due work, recovery items, post-event follow-up, or recent execution history needs review right now.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			{#if queueSections.due.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Due now</h3>
						<p class="text-sm text-muted-foreground">
							Run or review work that has crossed its scheduled publish or reminder time.
						</p>
					</div>
					<Item.Group>
						{#each queueSections.due as item (item.id)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<p class="text-xs text-muted-foreground">{item.timingCopy}</p>
								</Item.Content>
								<Item.Actions>
									{#if item.canRunNow}
										<Button
											variant="ghost"
											size="xs"
											disabled={currentHub.executionTargetId === item.id}
											onclick={() => currentHub.runExecutionEntryNow(item.id)}
										>
											{currentHub.executionTargetId === item.id ? 'Running...' : 'Run now'}
										</Button>
									{/if}
									<Button href={getOpenHref(item)} variant="outline" size="xs">Open</Button>
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>
				</div>
			{/if}

			{#if queueSections.recovery.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Needs recovery</h3>
						<p class="text-sm text-muted-foreground">
							Retry queue evaluation after a fix, or jump straight into the related content to correct it.
						</p>
					</div>
					<Item.Group>
						{#each queueSections.recovery as item (item.id)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<p class="text-xs text-muted-foreground">{item.timingCopy}</p>
								</Item.Content>
								<Item.Actions>
									{#if item.canRetry}
										<Button
											variant="ghost"
											size="xs"
											disabled={currentHub.executionTargetId === item.id}
											onclick={() => currentHub.retryExecutionEntry(item.id)}
										>
											{currentHub.executionTargetId === item.id ? 'Retrying...' : 'Retry'}
										</Button>
									{/if}
									{#if item.canRunNow}
										<Button
											variant="ghost"
											size="xs"
											disabled={currentHub.executionTargetId === item.id}
											onclick={() => currentHub.runExecutionEntryNow(item.id)}
										>
											{currentHub.executionTargetId === item.id ? 'Running...' : 'Run now'}
										</Button>
									{/if}
									<Button href={getOpenHref(item)} variant="outline" size="xs">Open</Button>
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>
				</div>
			{/if}

			{#if followUpSignals.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Follow-up now</h3>
						<p class="text-sm text-muted-foreground">
							Recent events that still need final attendance decisions or a quick operator follow-up.
						</p>
					</div>
					<Item.Group>
						{#each followUpSignals as signal (signal.eventId)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{signal.eventTitle}</Item.Title>
										<Badge variant={getFollowUpVariant(signal.tone)}>{signal.statusLabel}</Badge>
									</div>
									<Item.Description>{signal.copy}</Item.Description>
									<p class="text-xs text-muted-foreground">{signal.timingCopy}</p>
								</Item.Content>
								<Item.Actions>
									<Button href={getFollowUpOpenHref()} variant="outline" size="xs">
										{getFollowUpActionLabel(signal.kind)}
									</Button>
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>
				</div>
			{/if}

			{#if queueSections.processed.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Recently processed</h3>
						<p class="text-sm text-muted-foreground">
							Keep a short audit trail visible without turning manage into a reporting dashboard.
						</p>
					</div>
					<Item.Group>
						{#each queueSections.processed as item (item.id)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<p class="text-xs text-muted-foreground">{item.timingCopy}</p>
								</Item.Content>
								<Item.Actions>
									<Button href={getOpenHref(item)} variant="outline" size="xs">Open</Button>
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>

					{#if processedCount > queueSections.processed.length}
						<p class="text-xs text-muted-foreground">
							+{processedCount - queueSections.processed.length} more processed item{processedCount - queueSections.processed.length === 1 ? '' : 's'} retained in the execution ledger.
						</p>
					{/if}
				</div>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>