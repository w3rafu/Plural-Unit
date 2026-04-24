<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		buildHubExecutionFollowUpTriageKey,
		buildHubExecutionQueueFocusHref,
		buildHubExecutionQueueItemTriageKey,
		isHubExecutionQueueFocusActive,
		parseHubExecutionQueueFocus,
		type HubExecutionQueueBucketFilter,
		type HubExecutionQueueFollowUpSignal,
		type HubExecutionQueueItem,
		type HubExecutionQueueJobFilter,
		type HubExecutionQueueSubjectFilter
	} from '$lib/models/hubExecutionQueue';
	import { MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH } from '$lib/models/hubOperatorWorkflowModel';
	import { currentHub } from '$lib/stores/currentHub.svelte';

	const bucketOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'due', label: 'Due' },
		{ value: 'recovery', label: 'Recovery' },
		{ value: 'processed', label: 'Processed' }
	] as const satisfies Array<{ value: HubExecutionQueueBucketFilter; label: string }>;
	const jobOptions = [
		{ value: 'all', label: 'All jobs' },
		{ value: 'broadcast_publish', label: 'Broadcast publish' },
		{ value: 'event_publish', label: 'Event publish' },
		{ value: 'event_reminder', label: 'Reminders' }
	] as const satisfies Array<{ value: HubExecutionQueueJobFilter; label: string }>;
	const subjectOptions = [
		{ value: 'all', label: 'All content' },
		{ value: 'broadcast', label: 'Broadcasts' },
		{ value: 'event', label: 'Events' }
	] as const satisfies Array<{ value: HubExecutionQueueSubjectFilter; label: string }>;

	let showTriagedItems = $state(false);
	let activeWorkflowNoteComposerKey = $state<string | null>(null);
	let workflowNoteDraft = $state('');
	const queueFocus = $derived(parseHubExecutionQueueFocus(page.url));

	const queueSections = $derived(
		currentHub.getExecutionQueueSections(queueFocus, {
			includeTriaged: showTriagedItems
		})
	);
	const dueCount = $derived(queueSections.due.length);
	const upcomingCount = $derived(currentHub.upcomingExecutionItems.length);
	const recoveryCount = $derived(queueSections.recovery.length);
	const visibleUpcomingCount = $derived(queueSections.upcoming.length);
	const processedCount = $derived(currentHub.processedExecutionItems.length);
	const visibleProcessedCount = $derived(queueSections.processed.length);
	const hiddenTriagedItemCount = $derived(currentHub.triagedQueueItemCount);
	const staleExecutionItemCount = $derived(currentHub.staleExecutionItemCount);
	const staleItemCount = $derived(currentHub.staleQueueItemCount);
	const hasHiddenTriagedItems = $derived(hiddenTriagedItemCount > 0);
	const followUpSignals = $derived(
		currentHub.getHubEventFollowUpSignals({ includeTriaged: showTriagedItems })
	);
	const followUpCount = $derived(followUpSignals.length);
	const hasQueueFocus = $derived(isHubExecutionQueueFocusActive(queueFocus));
	const shouldShowFollowUpSignals = $derived(!hasQueueFocus);
	const visibleQueueCount = $derived(
		dueCount + visibleUpcomingCount + recoveryCount + visibleProcessedCount
	);
	const hasVisibleQueueItems = $derived(visibleQueueCount > 0);
	const hasVisibleItems = $derived(
		hasVisibleQueueItems || (shouldShowFollowUpSignals && followUpCount > 0)
	);
	const summaryCopy = $derived.by(() => {
		if (hasQueueFocus) {
			if (!hasVisibleQueueItems) {
				return hasHiddenTriagedItems && !showTriagedItems
					? 'No active queue rows match the current filters. Reviewed or deferred rows are hidden.'
					: 'No queue rows match the current filters.';
			}

			const parts = [];

			if (dueCount > 0) {
				parts.push(`${dueCount} due`);
			}

			if (visibleUpcomingCount > 0) {
				parts.push(`${visibleUpcomingCount} upcoming`);
			}

			if (recoveryCount > 0) {
				parts.push(`${recoveryCount} recovery`);
			}

			if (visibleProcessedCount > 0) {
				parts.push(`${visibleProcessedCount} processed`);
			}

			if (staleExecutionItemCount > 0) {
				parts.push(`${staleExecutionItemCount} changed since review`);
			}

			return `Showing ${parts.join(' · ')}.`;
		}

		if (!hasVisibleItems) {
			if (hasHiddenTriagedItems && !showTriagedItems) {
				return `${hiddenTriagedItemCount} reviewed or deferred item${hiddenTriagedItemCount === 1 ? '' : 's'} hidden from the default queue view.`;
			}

			return 'Scheduled publishes and reminder windows will collect here once the hub has timed work to manage.';
		}

		const parts = [];

		if (dueCount > 0) {
			parts.push(`${dueCount} due now`);
		}

		if (recoveryCount > 0) {
			parts.push(`${recoveryCount} needing recovery`);
		}

		if (visibleProcessedCount > 0) {
			parts.push(`${visibleProcessedCount} already processed`);
		}

		if (followUpCount > 0) {
			parts.push(`${followUpCount} needing follow-up`);
		}

		if (staleItemCount > 0) {
			parts.push(`${staleItemCount} changed since review`);
		}

		if (hasHiddenTriagedItems && !showTriagedItems) {
			parts.push(`${hiddenTriagedItemCount} triaged`);
		}

		return `${parts.join(' · ')}.`;
	});

	function updateQueueFocus(partialFocus: {
		bucket?: HubExecutionQueueBucketFilter;
		jobKind?: HubExecutionQueueJobFilter;
		subjectKind?: HubExecutionQueueSubjectFilter;
		includeUpcoming?: boolean;
	}) {
		const href = buildHubExecutionQueueFocusHref({
			url: page.url,
			focus: partialFocus,
			hash: 'manage-operations'
		});
		const currentHref = `${page.url.pathname}${page.url.search}${page.url.hash}`;

		if (href === currentHref) {
			return;
		}

		void goto(href, { noScroll: true, keepFocus: true, replaceState: true });
	}

	function clearQueueFocus() {
		updateQueueFocus({
			bucket: 'all',
			jobKind: 'all',
			subjectKind: 'all',
			includeUpcoming: false
		});
	}

	function toggleUpcomingRows() {
		updateQueueFocus({ includeUpcoming: !queueFocus.includeUpcoming });
	}

	function toggleTriagedItems() {
		showTriagedItems = !showTriagedItems;
	}

	function shouldShowReviewActions(
		triageStatus: HubExecutionQueueItem['triageStatus'],
		isStaleReview: boolean
	) {
		return triageStatus === null || isStaleReview;
	}

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
		return buildHubExecutionQueueFocusHref({
			url: page.url,
			pathname: '/hub/manage/content',
			hash: item.sectionId
		});
	}

	function getOpenLabel(item: HubExecutionQueueItem) {
		return item.recoveryGuidance?.openLabel ?? 'Open';
	}

	function getRecoveryVariant(item: HubExecutionQueueItem) {
		return item.recoveryGuidance?.tone === 'neutral' ? 'outline' : 'destructive';
	}

	function getFollowUpVariant(tone: 'attention' | 'neutral') {
		return tone === 'attention' ? 'destructive' : 'outline';
	}

	function getTriageVariant(status: 'reviewed' | 'deferred') {
		return status === 'reviewed' ? 'secondary' : 'outline';
	}

	function getTriageLabel(status: 'reviewed' | 'deferred') {
		return status === 'reviewed' ? 'Reviewed' : 'Deferred';
	}

	function getStaleReviewLabel() {
		return 'Needs re-review';
	}

	function getFollowUpOpenHref() {
		return buildHubExecutionQueueFocusHref({
			url: page.url,
			pathname: '/hub/manage/content',
			hash: 'manage-events'
		});
	}

	function getFollowUpActionLabel(kind: 'attendance_review' | 'no_show' | 'low_turnout') {
		return kind === 'attendance_review' ? 'Review attendance' : 'Open event';
	}

	function getExecutionWorkflowKey(item: Pick<HubExecutionQueueItem, 'id'>) {
		return buildHubExecutionQueueItemTriageKey(item);
	}

	function getFollowUpWorkflowKey(signal: Pick<HubExecutionQueueFollowUpSignal, 'eventId' | 'kind'>) {
		return buildHubExecutionFollowUpTriageKey(signal);
	}

	function getWorkflowSummary(workflowKey: string) {
		return currentHub.getWorkflowSummary(workflowKey);
	}

	function isWorkflowNoteComposerOpen(workflowKey: string) {
		return activeWorkflowNoteComposerKey === workflowKey;
	}

	function closeWorkflowNoteComposer() {
		activeWorkflowNoteComposerKey = null;
		workflowNoteDraft = '';
	}

	function toggleWorkflowNoteComposer(workflowKey: string) {
		if (activeWorkflowNoteComposerKey === workflowKey) {
			closeWorkflowNoteComposer();
			return;
		}

		activeWorkflowNoteComposerKey = workflowKey;
		workflowNoteDraft = getWorkflowSummary(workflowKey)?.note ?? '';
	}

	function getWorkflowNoteToggleLabel(workflowKey: string) {
		if (isWorkflowNoteComposerOpen(workflowKey)) {
			return 'Close note';
		}

		return getWorkflowSummary(workflowKey)?.note ? 'Edit note' : 'Add note';
	}

	async function saveExecutionWorkflowNote(
		item: HubExecutionQueueItem,
		status: 'reviewed' | 'deferred'
	) {
		if (status === 'reviewed') {
			await currentHub.markExecutionQueueItemReviewed(item.id, { note: workflowNoteDraft });
		} else {
			await currentHub.deferExecutionQueueItem(item.id, { note: workflowNoteDraft });
		}

		if (activeWorkflowNoteComposerKey === getExecutionWorkflowKey(item)) {
			closeWorkflowNoteComposer();
		}
	}

	async function saveFollowUpWorkflowNote(
		signal: HubExecutionQueueFollowUpSignal,
		status: 'reviewed' | 'deferred'
	) {
		if (status === 'reviewed') {
			await currentHub.markFollowUpSignalReviewed(signal.eventId, signal.kind, {
				note: workflowNoteDraft
			});
		} else {
			await currentHub.deferFollowUpSignal(signal.eventId, signal.kind, {
				note: workflowNoteDraft
			});
		}

		if (activeWorkflowNoteComposerKey === getFollowUpWorkflowKey(signal)) {
			closeWorkflowNoteComposer();
		}
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Operations queue</Card.Title>
		<Card.Description>{summaryCopy}</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		<div class="space-y-3">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div class="space-y-1">
					<h3 class="text-sm font-semibold tracking-tight text-foreground">Focus queue</h3>
					<p class="text-sm text-muted-foreground">
						Filter queue rows by status, job, or content type without leaving manage.
					</p>
				</div>
				{#if hasQueueFocus}
					<Button type="button" variant="ghost" size="xs" onclick={clearQueueFocus}>
						Clear filters
					</Button>
				{/if}
			</div>

			<div class="space-y-3">
				<nav aria-label="Queue status filters" class="w-full">
					<ButtonGroup.Root class="segmented-control flex w-full items-stretch">
						{#each bucketOptions as option (option.value)}
							<Button
								type="button"
								size="sm"
								variant="ghost"
								class="segmented-control__button min-w-0 flex-1 justify-center px-3 max-sm:text-[0.82rem]"
								aria-current={queueFocus.bucket === option.value ? 'page' : undefined}
								onclick={() => updateQueueFocus({ bucket: option.value })}
							>
								{option.label}
							</Button>
						{/each}
					</ButtonGroup.Root>
				</nav>

				<div class="flex flex-wrap items-center gap-2">
					<p class="text-[0.88rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						Job
					</p>
					{#each jobOptions as option (option.value)}
						<Button
							type="button"
							size="xs"
							variant={queueFocus.jobKind === option.value ? 'secondary' : 'outline'}
							onclick={() => updateQueueFocus({ jobKind: option.value })}
						>
							{option.label}
						</Button>
					{/each}
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<p class="text-[0.88rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						Content
					</p>
					{#each subjectOptions as option (option.value)}
						<Button
							type="button"
							size="xs"
							variant={queueFocus.subjectKind === option.value ? 'secondary' : 'outline'}
							onclick={() => updateQueueFocus({ subjectKind: option.value })}
						>
							{option.label}
						</Button>
					{/each}
					<Button
						type="button"
						size="xs"
						variant={queueFocus.includeUpcoming ? 'secondary' : 'outline'}
						disabled={upcomingCount === 0 && !queueFocus.includeUpcoming}
						onclick={toggleUpcomingRows}
					>
						{#if queueFocus.includeUpcoming}
							Hide upcoming
						{:else if upcomingCount > 0}
							Show upcoming ({upcomingCount})
						{:else}
							Show upcoming
						{/if}
					</Button>
					{#if hasHiddenTriagedItems}
						<Button
							type="button"
							size="xs"
							variant={showTriagedItems ? 'secondary' : 'outline'}
							onclick={toggleTriagedItems}
						>
							{showTriagedItems
								? 'Hide triaged'
								: `Show triaged (${hiddenTriagedItemCount})`}
						</Button>
					{/if}
				</div>
			</div>
		</div>

		{#if !hasVisibleItems}
			<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
				<Card.Content class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-sm text-muted-foreground">
						{hasQueueFocus
							? 'No queue rows match the current filters right now.'
							: 'No due work, recovery items, post-event follow-up, or recent execution history needs review right now.'}
					</p>
					{#if hasQueueFocus}
						<Button type="button" variant="outline" size="xs" onclick={clearQueueFocus}>
							Clear filters
						</Button>
					{/if}
					{#if hasHiddenTriagedItems && !showTriagedItems}
						<Button type="button" variant="outline" size="xs" onclick={toggleTriagedItems}>
							Show triaged
						</Button>
					{/if}
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
							{@const workflowKey = getExecutionWorkflowKey(item)}
							{@const workflowSummary = getWorkflowSummary(workflowKey)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
										{#if item.isStaleReview}
											<Badge variant="destructive">{getStaleReviewLabel()}</Badge>
										{/if}
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<div class="space-y-1">
										{#if item.staleReviewCopy}
											<p class="text-[0.82rem] text-destructive">{item.staleReviewCopy}</p>
										{/if}
										{#if workflowSummary}
											<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
												<p class="text-[0.82rem] text-muted-foreground">{workflowSummary.summaryCopy}</p>
												{#if workflowSummary.note}
													<p class="mt-1 text-[0.82rem] text-foreground">{workflowSummary.note}</p>
												{/if}
											</div>
										{/if}
										<p class="text-[0.82rem] text-muted-foreground">{item.timingCopy}</p>
									</div>
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

			{#if queueSections.upcoming.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Upcoming work</h3>
						<p class="text-sm text-muted-foreground">
							Scheduled publish and reminder windows that are not due yet, but are worth scanning before they roll forward.
						</p>
					</div>
					<Item.Group>
						{#each queueSections.upcoming as item (item.id)}
							{@const workflowKey = getExecutionWorkflowKey(item)}
							{@const workflowSummary = getWorkflowSummary(workflowKey)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
										{#if item.isStaleReview}
											<Badge variant="destructive">{getStaleReviewLabel()}</Badge>
										{/if}
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<div class="space-y-1">
										{#if item.staleReviewCopy}
											<p class="text-[0.82rem] text-destructive">{item.staleReviewCopy}</p>
										{/if}
										{#if workflowSummary}
											<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
												<p class="text-[0.82rem] text-muted-foreground">{workflowSummary.summaryCopy}</p>
												{#if workflowSummary.note}
													<p class="mt-1 text-[0.82rem] text-foreground">{workflowSummary.note}</p>
												{/if}
											</div>
										{/if}
										<p class="text-[0.82rem] text-muted-foreground">{item.timingCopy}</p>
									</div>
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
							Each row now points toward the next operator move, so you can fix timing, restore content, or confirm an intentional skip without guesswork.
						</p>
					</div>
					<Item.Group>
						{#each queueSections.recovery as item (item.id)}
							{@const workflowKey = getExecutionWorkflowKey(item)}
							{@const workflowSummary = getWorkflowSummary(workflowKey)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
										{#if item.recoveryGuidance}
											<Badge variant={getRecoveryVariant(item)}>{item.recoveryGuidance.label}</Badge>
										{/if}
										{#if item.isStaleReview}
											<Badge variant="destructive">{getStaleReviewLabel()}</Badge>
										{/if}
										{#if item.triageStatus}
											<Badge variant={getTriageVariant(item.triageStatus)}>
												{getTriageLabel(item.triageStatus)}
											</Badge>
										{/if}
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<div class="space-y-1">
										{#if item.recoveryGuidance}
											<p class="text-[0.82rem] text-muted-foreground">{item.recoveryGuidance.nextStepCopy}</p>
										{/if}
										{#if item.staleReviewCopy}
											<p class="text-[0.82rem] text-destructive">{item.staleReviewCopy}</p>
										{/if}
										{#if workflowSummary}
											<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
												<p class="text-[0.82rem] text-muted-foreground">{workflowSummary.summaryCopy}</p>
												{#if workflowSummary.note}
													<p class="mt-1 text-[0.82rem] text-foreground">{workflowSummary.note}</p>
												{/if}
											</div>
										{/if}
										{#if isWorkflowNoteComposerOpen(workflowKey)}
											<div class="space-y-2 rounded-lg border border-border/70 bg-background/80 p-3">
												<Textarea
													bind:value={workflowNoteDraft}
													rows={3}
													maxlength={MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH}
													placeholder="Add a short handoff note for the next admin."
												/>
												<div class="flex flex-wrap gap-2">
													<Button type="button" variant="secondary" size="xs" onclick={() => saveExecutionWorkflowNote(item, 'reviewed')}>
														Save as reviewed
													</Button>
													<Button type="button" variant="outline" size="xs" onclick={() => saveExecutionWorkflowNote(item, 'deferred')}>
														Save as deferred
													</Button>
													<Button type="button" variant="ghost" size="xs" onclick={closeWorkflowNoteComposer}>
														Cancel
													</Button>
												</div>
											</div>
										{/if}
										<p class="text-[0.82rem] text-muted-foreground">{item.timingCopy}</p>
									</div>
								</Item.Content>
								<Item.Actions>
									{#if item.canRetry}
										<Button
											variant="ghost"
											size="xs"
											disabled={currentHub.executionTargetId === item.id}
											onclick={() => currentHub.retryExecutionEntry(item.id)}
										>
											{currentHub.executionTargetId === item.id
												? 'Checking...'
												: item.recoveryGuidance?.retryLabel ?? 'Re-check'}
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
									<Button href={getOpenHref(item)} variant="outline" size="xs">
										{getOpenLabel(item)}
									</Button>
									<Button
										type="button"
										variant={isWorkflowNoteComposerOpen(workflowKey) ? 'secondary' : 'ghost'}
										size="xs"
										onclick={() => toggleWorkflowNoteComposer(workflowKey)}
									>
										{getWorkflowNoteToggleLabel(workflowKey)}
									</Button>
									{#if item.triageStatus}
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.surfaceExecutionQueueItem(item.id)}
										>
											Surface again
										</Button>
									{/if}
									{#if shouldShowReviewActions(item.triageStatus, item.isStaleReview)}
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.markExecutionQueueItemReviewed(item.id)}
										>
											Reviewed
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.deferExecutionQueueItem(item.id)}
										>
											Defer
										</Button>
									{/if}
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>
				</div>
			{/if}

			{#if shouldShowFollowUpSignals && followUpSignals.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Follow-up now</h3>
						<p class="text-sm text-muted-foreground">
							Recent events that still need final attendance decisions or a quick operator follow-up.
						</p>
					</div>
					<Item.Group>
						{#each followUpSignals as signal (signal.eventId)}
							{@const workflowKey = getFollowUpWorkflowKey(signal)}
							{@const workflowSummary = getWorkflowSummary(workflowKey)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{signal.eventTitle}</Item.Title>
										<Badge variant={getFollowUpVariant(signal.tone)}>{signal.statusLabel}</Badge>
										{#if signal.isStaleReview}
											<Badge variant="destructive">{getStaleReviewLabel()}</Badge>
										{/if}
										{#if signal.triageStatus}
											<Badge variant={getTriageVariant(signal.triageStatus)}>
												{getTriageLabel(signal.triageStatus)}
											</Badge>
										{/if}
									</div>
									<Item.Description>{signal.copy}</Item.Description>
									<div class="space-y-1">
										{#if signal.staleReviewCopy}
											<p class="text-[0.82rem] text-destructive">{signal.staleReviewCopy}</p>
										{/if}
										{#if workflowSummary}
											<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
												<p class="text-[0.82rem] text-muted-foreground">{workflowSummary.summaryCopy}</p>
												{#if workflowSummary.note}
													<p class="mt-1 text-[0.82rem] text-foreground">{workflowSummary.note}</p>
												{/if}
											</div>
										{/if}
										{#if isWorkflowNoteComposerOpen(workflowKey)}
											<div class="space-y-2 rounded-lg border border-border/70 bg-background/80 p-3">
												<Textarea
													bind:value={workflowNoteDraft}
													rows={3}
													maxlength={MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH}
													placeholder="Add a short handoff note for the next admin."
												/>
												<div class="flex flex-wrap gap-2">
													<Button type="button" variant="secondary" size="xs" onclick={() => saveFollowUpWorkflowNote(signal, 'reviewed')}>
														Save as reviewed
													</Button>
													<Button type="button" variant="outline" size="xs" onclick={() => saveFollowUpWorkflowNote(signal, 'deferred')}>
														Save as deferred
													</Button>
													<Button type="button" variant="ghost" size="xs" onclick={closeWorkflowNoteComposer}>
														Cancel
													</Button>
												</div>
											</div>
										{/if}
										<p class="text-[0.82rem] text-muted-foreground">{signal.timingCopy}</p>
									</div>
								</Item.Content>
								<Item.Actions>
									<Button href={getFollowUpOpenHref()} variant="outline" size="xs">
										{getFollowUpActionLabel(signal.kind)}
									</Button>
									<Button
										type="button"
										variant={isWorkflowNoteComposerOpen(workflowKey) ? 'secondary' : 'ghost'}
										size="xs"
										onclick={() => toggleWorkflowNoteComposer(workflowKey)}
									>
										{getWorkflowNoteToggleLabel(workflowKey)}
									</Button>
									{#if signal.triageStatus}
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.surfaceFollowUpSignal(signal.eventId, signal.kind)}
										>
											Surface again
										</Button>
									{/if}
									{#if shouldShowReviewActions(signal.triageStatus, signal.isStaleReview)}
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.markFollowUpSignalReviewed(signal.eventId, signal.kind)}
										>
											Reviewed
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.deferFollowUpSignal(signal.eventId, signal.kind)}
										>
											Defer
										</Button>
									{/if}
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
							{@const workflowKey = getExecutionWorkflowKey(item)}
							{@const workflowSummary = getWorkflowSummary(workflowKey)}
							<Item.Root variant="muted" size="sm">
								<Item.Content>
									<div class="flex flex-wrap items-center gap-2">
										<Item.Title>{item.subjectTitle}</Item.Title>
										<Badge variant={getStatusVariant(item)}>{item.statusLabel}</Badge>
										<Badge variant="outline">{item.jobLabel}</Badge>
										{#if item.isStaleReview}
											<Badge variant="destructive">{getStaleReviewLabel()}</Badge>
										{/if}
										{#if item.triageStatus}
											<Badge variant={getTriageVariant(item.triageStatus)}>
												{getTriageLabel(item.triageStatus)}
											</Badge>
										{/if}
									</div>
									<Item.Description>{item.detailCopy}</Item.Description>
									<div class="space-y-1">
										{#if item.staleReviewCopy}
											<p class="text-[0.82rem] text-destructive">{item.staleReviewCopy}</p>
										{/if}
										{#if workflowSummary}
											<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
												<p class="text-[0.82rem] text-muted-foreground">{workflowSummary.summaryCopy}</p>
												{#if workflowSummary.note}
													<p class="mt-1 text-[0.82rem] text-foreground">{workflowSummary.note}</p>
												{/if}
											</div>
										{/if}
										{#if isWorkflowNoteComposerOpen(workflowKey)}
											<div class="space-y-2 rounded-lg border border-border/70 bg-background/80 p-3">
												<Textarea
													bind:value={workflowNoteDraft}
													rows={3}
													maxlength={MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH}
													placeholder="Add a short handoff note for the next admin."
												/>
												<div class="flex flex-wrap gap-2">
													<Button type="button" variant="secondary" size="xs" onclick={() => saveExecutionWorkflowNote(item, 'reviewed')}>
														Save as reviewed
													</Button>
													<Button type="button" variant="outline" size="xs" onclick={() => saveExecutionWorkflowNote(item, 'deferred')}>
														Save as deferred
													</Button>
													<Button type="button" variant="ghost" size="xs" onclick={closeWorkflowNoteComposer}>
														Cancel
													</Button>
												</div>
											</div>
										{/if}
										<p class="text-[0.82rem] text-muted-foreground">{item.timingCopy}</p>
									</div>
								</Item.Content>
								<Item.Actions>
									<Button href={getOpenHref(item)} variant="outline" size="xs">Open</Button>
									<Button
										type="button"
										variant={isWorkflowNoteComposerOpen(workflowKey) ? 'secondary' : 'ghost'}
										size="xs"
										onclick={() => toggleWorkflowNoteComposer(workflowKey)}
									>
										{getWorkflowNoteToggleLabel(workflowKey)}
									</Button>
									{#if item.triageStatus}
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.surfaceExecutionQueueItem(item.id)}
										>
											Surface again
										</Button>
									{/if}
									{#if shouldShowReviewActions(item.triageStatus, item.isStaleReview)}
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.markExecutionQueueItemReviewed(item.id)}
										>
											Reviewed
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="xs"
											onclick={() => currentHub.deferExecutionQueueItem(item.id)}
										>
											Defer
										</Button>
									{/if}
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>

					{#if !hasQueueFocus && processedCount > queueSections.processed.length}
						<p class="text-[0.82rem] text-muted-foreground">
							+{processedCount - queueSections.processed.length} more processed item{processedCount - queueSections.processed.length === 1 ? '' : 's'} retained in the execution ledger.
						</p>
					{/if}
				</div>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>