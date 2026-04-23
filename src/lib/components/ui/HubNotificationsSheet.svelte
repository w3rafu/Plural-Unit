<script lang="ts">
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BellIcon from '@lucide/svelte/icons/bell';
	import * as Avatar from '$lib/components/ui/avatar';
	import {
		getHubActivityPrimaryAction,
		getHubActivitySecondaryAction
	} from '$lib/components/hub/member/hubActivityModel';
	import {
		getEventAttendanceRosterSummaryCopy,
		isEventAttendanceWindowOpen,
		type EventAttendanceRoster
	} from '$lib/models/eventAttendanceModel';
	import { Button } from '$lib/components/ui/button';
	import * as Item from '$lib/components/ui/item';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import {
		buildHubExecutionFollowUpTriageKey,
		buildHubExecutionQueueItemTriageKey,
		type HubExecutionQueueItem
	} from '$lib/models/hubExecutionQueue';
	import {
		countHubNotifications,
		countUnreadHubNotifications,
		filterHubNotifications,
		type HubNotificationFilter,
		type HubNotificationItem
	} from '$lib/models/hubNotifications';
	import type { EventRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	type AttendanceInboxEntry = {
		event: EventRow;
		roster: EventAttendanceRoster;
	};

	let {
		triggerLabel = 'Alerts',
		triggerClass = '',
		isInteractive = true,
		broadcastHref = '/#hub-broadcasts',
		eventHref = '/#hub-events',
		settingsHref = '/profile#notification-preferences',
		manageContentHref = undefined as string | undefined,
		manageBroadcastsHref = undefined as string | undefined,
		manageEventsHref = undefined as string | undefined
	}: {
		triggerLabel?: string;
		triggerClass?: string;
		isInteractive?: boolean;
		broadcastHref?: string;
		eventHref?: string;
		settingsHref?: string;
		manageContentHref?: string | undefined;
		manageBroadcastsHref?: string | undefined;
		manageEventsHref?: string | undefined;
	} = $props();

	let open = $state(false);
	let loadError = $state('');
	let operatorInboxLoadError = $state('');
	let filter = $state<HubNotificationFilter>('all');

	const allNotifications = $derived(currentHub.allActivityFeed);
	const notifications = $derived(currentHub.activityFeed);
	const notificationCounts = $derived(countHubNotifications(allNotifications));
	const visibleNotifications = $derived(filterHubNotifications(notifications, filter));
	const visibleUnreadCount = $derived(countUnreadHubNotifications(visibleNotifications));
	const unreadCount = $derived(currentHub.unreadActivityCount);
	const hiddenNotificationCount = $derived(Math.max(0, allNotifications.length - notifications.length));
	const hasOperatorInbox = $derived(Boolean(manageContentHref) && currentOrganization.isAdmin);
	const isOperatorInboxLoading = $derived(
		hasOperatorInbox &&
			currentOrganization.isLoadingMembers &&
			currentOrganization.members.length === 0
	);
	const operatorRecoveryItems = $derived(
		hasOperatorInbox ? currentHub.getExecutionQueueSections().recovery.slice(0, 3) : []
	);
	const operatorRecoveryCount = $derived(
		hasOperatorInbox ? currentHub.getExecutionQueueSections().recovery.length : 0
	);

	function getAttendanceCloseoutEntries(): AttendanceInboxEntry[] {
		if (!hasOperatorInbox) {
			return [];
		}

		return currentHub.events
			.map((event) => ({ event, roster: currentHub.getEventAttendanceRoster(event.id) }))
			.filter(
				(entry): entry is AttendanceInboxEntry =>
					entry.roster !== null &&
					entry.roster.pendingCount > 0 &&
					isEventAttendanceWindowOpen(entry.event)
			)
			.sort(
				(left, right) =>
					new Date(right.event.starts_at).getTime() - new Date(left.event.starts_at).getTime()
			);
	}

	function getOperatorFollowUpSignals() {
		if (!hasOperatorInbox) {
			return [];
		}

		return currentHub.hubEventFollowUpSignals.filter((signal) => signal.kind !== 'attendance_review');
	}

	const operatorCloseoutItems = $derived(getAttendanceCloseoutEntries().slice(0, 3));
	const operatorCloseoutCount = $derived(getAttendanceCloseoutEntries().length);
	const operatorFollowUpSignals = $derived(getOperatorFollowUpSignals().slice(0, 3));
	const operatorFollowUpCount = $derived(getOperatorFollowUpSignals().length);
	const operatorInboxCount = $derived(
		operatorRecoveryCount + operatorCloseoutCount + operatorFollowUpCount
	);
	const recoveryQueueHref = '/hub/manage/content?queueBucket=recovery#manage-operations';
	const operatorHeadline = $derived(
		hasOperatorInbox
			? operatorInboxCount > 0
				? `${operatorInboxCount} operator item${operatorInboxCount === 1 ? '' : 's'} need attention.`
				: 'Operator inbox is clear right now.'
			: unreadCount > 0
				? `${unreadCount} member alert${unreadCount === 1 ? '' : 's'} still unread.`
				: 'Member alerts are caught up.'
	);

	function buildManageAnchorHref(baseHref: string | undefined, targetHash: string) {
		return baseHref ? `${baseHref.split('#')[0]}#${targetHash}` : null;
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function getInboxSectionClass(section: 'recovery' | 'closeout' | 'follow-up' | 'member-alerts') {
		if (section === 'recovery') {
			return 'border-chart-4/30 bg-chart-4/10 text-chart-4';
		}

		if (section === 'closeout') {
			return 'border-primary/20 bg-primary/10 text-primary';
		}

		if (section === 'follow-up') {
			return 'border-chart-2/25 bg-chart-2/10 text-chart-2';
		}

		return 'border-border bg-muted/55 text-foreground';
	}

	function getWorkflowSummaryClass(status: 'reviewed' | 'deferred') {
		return status === 'reviewed'
			? 'border-chart-2/25 bg-chart-2/10 text-chart-2'
			: 'border-chart-4/30 bg-chart-4/10 text-chart-4';
	}

	function getNotificationLabelClass(label: string) {
		const normalizedLabel = label.toLowerCase();

		if (normalizedLabel.includes('broadcast')) {
			return 'border-chart-4/30 bg-chart-4/10 text-chart-4';
		}

		if (normalizedLabel.includes('event')) {
			return 'border-primary/20 bg-primary/10 text-primary';
		}

		return 'border-border bg-muted/55 text-foreground';
	}

	function getManageEventHref(eventId: string) {
		return (
			buildManageAnchorHref(manageContentHref ?? manageEventsHref, `event-${eventId}`) ??
			manageEventsHref ??
			manageContentHref ??
			eventHref
		);
	}

	function getManageBroadcastHref(broadcastId: string) {
		return (
			buildManageAnchorHref(manageContentHref ?? manageBroadcastsHref, `broadcast-${broadcastId}`) ??
			manageBroadcastsHref ??
			manageContentHref ??
			broadcastHref
		);
	}

	function getRecoveryHref(item: HubExecutionQueueItem) {
		return item.subjectKind === 'broadcast'
			? getManageBroadcastHref(item.sourceId)
			: getManageEventHref(item.sourceId);
	}

	function getRecoveryWorkflowSummary(item: HubExecutionQueueItem) {
		return currentHub.getWorkflowSummary(buildHubExecutionQueueItemTriageKey(item));
	}

	function getCloseoutWorkflowSummary(eventId: string) {
		return currentHub.getWorkflowSummary(
			buildHubExecutionFollowUpTriageKey({ eventId, kind: 'attendance_review' })
		);
	}

	function getFollowUpWorkflowSummary(signal: {
		eventId: string;
		kind: 'attendance_review' | 'no_show' | 'low_turnout';
	}) {
		return currentHub.getWorkflowSummary(buildHubExecutionFollowUpTriageKey(signal));
	}

	function getOperatorFollowUpActionLabel(kind: 'attendance_review' | 'no_show' | 'low_turnout') {
		if (kind === 'no_show') {
			return 'Review no-shows';
		}

		if (kind === 'low_turnout') {
			return 'Review turnout';
		}

		return 'Review attendance';
	}

	function closeSheet() {
		open = false;
	}

	function getOperatorInboxLoadErrorMessage(error: unknown) {
		return error instanceof Error
			? error.message
			: 'Could not load the member roster for attendance closeout.';
	}

	function getPrimaryAction(notification: HubNotificationItem) {
		return getHubActivityPrimaryAction(notification, {
			broadcastHref,
			eventHref,
			manageContentHref,
			manageBroadcastsHref,
			manageEventsHref
		});
	}

	function getSecondaryAction(notification: HubNotificationItem) {
		return getHubActivitySecondaryAction(notification, {
			broadcastHref,
			eventHref,
			manageContentHref,
			manageBroadcastsHref,
			manageEventsHref
		});
	}

	function getEmptyStateCopy(activeFilter: HubNotificationFilter) {
		if (activeFilter === 'broadcast') {
			if (notificationCounts.broadcast > 0 && visibleNotifications.length === 0) {
				return 'Broadcast alerts are currently hidden by your notification settings.';
			}

			return 'No broadcast alerts are live right now.';
		}

		if (activeFilter === 'event') {
			if (notificationCounts.event > 0 && visibleNotifications.length === 0) {
				return 'Event alerts, reminders, and recent follow-up cues are currently hidden by your notification settings.';
			}

			return 'No event alerts, reminders, or recent follow-up cues are available right now.';
		}

		if (hiddenNotificationCount > 0 && notifications.length === 0) {
			return 'Your notification settings are hiding the hub alerts that are currently available.';
		}

		return 'No alerts yet. When the hub posts a broadcast, sends an event update, or processes a reminder, it will show up here.';
	}

	async function markNotificationRead(notification: HubNotificationItem) {
		loadError = '';

		try {
			await currentHub.markActivityRead(notification);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not update alert read state.';
		}
	}

	async function markVisibleRead() {
		loadError = '';

		try {
			await currentHub.markAllActivityRead(visibleNotifications);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not update alert read state.';
		}
	}

	function handleNotificationAction(notification: HubNotificationItem) {
		void markNotificationRead(notification);
		closeSheet();
	}

	async function handleOpenChange(nextOpen: boolean) {
		open = nextOpen;

		if (!nextOpen) {
			operatorInboxLoadError = '';
			return;
		}

		if (!currentOrganization.organization?.id) return;

		const shouldLoadMembers =
			hasOperatorInbox &&
			currentOrganization.members.length === 0 &&
			!currentOrganization.isLoadingMembers;

		if (shouldLoadMembers) {
			operatorInboxLoadError = '';
			void currentOrganization
				.loadMembers()
				.then(() => {
					operatorInboxLoadError = '';
				})
				.catch((error) => {
					operatorInboxLoadError = getOperatorInboxLoadErrorMessage(error);
				});
		} else if (hasOperatorInbox && currentOrganization.members.length > 0) {
			operatorInboxLoadError = '';
		}

		const shouldLoad = !currentHub.hasLoadedForCurrentOrg && !currentHub.isLoading;
		if (!shouldLoad) return;

		loadError = '';
		try {
			await currentHub.load();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not load alerts.';
		}
	}
</script>

{#if !isInteractive}
	<Button type="button" variant="outline" size="sm" class={`gap-2 ${triggerClass}`} aria-disabled="true">
		<BellIcon class="shell-header__control-icon" aria-hidden="true" />
		<span class="shell-header__control-label">{triggerLabel}</span>
		{#if unreadCount > 0}
			<span class="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-background">
				{unreadCount}
			</span>
		{/if}
	</Button>
{:else}
<Sheet.Root open={open} onOpenChange={handleOpenChange}>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} type="button" variant="outline" size="sm" class={`gap-2 ${triggerClass}`}>
				<BellIcon class="shell-header__control-icon" aria-hidden="true" />
				<span class="shell-header__control-label">{triggerLabel}</span>
				{#if unreadCount > 0}
					<span class="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-background">
						{unreadCount}
					</span>
				{/if}
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="top" class="mx-auto mt-4 flex max-h-[min(82vh,46rem)] w-[min(96vw,46rem)] flex-col rounded-[1.75rem] border border-border bg-background/96 shadow-2xl backdrop-blur supports-backdrop-filter:bg-background/92">
		<Sheet.Header>
			<Sheet.Title>Alerts</Sheet.Title>
			<Sheet.Description>
				{hasOperatorInbox
					? 'A compact inbox for operator work and member-facing activity.'
					: 'A compact inbox for broadcast, event, and reminder activity.'}
			</Sheet.Description>
		</Sheet.Header>

		<ScrollArea class="min-h-0 flex-1 px-4 py-4 sm:px-5">
			{#if loadError}
				<p
					role="alert"
					class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{loadError}
				</p>
			{:else}
				<section class="mb-4 rounded-[1.45rem] border border-border/70 bg-card/88 p-3.5 shadow-sm">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="space-y-1">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
								Inbox
							</p>
							<p class="text-base font-semibold tracking-tight text-foreground">{operatorHeadline}</p>
							<p class="text-sm text-muted-foreground">
								{hasOperatorInbox
									? 'Operator work stays at the top, with the published feed directly underneath.'
									: 'Unread activity and category totals are grouped before the full feed.'}
							</p>
						</div>
						<div class="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 sm:min-w-36">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
								Current view
							</p>
							<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{visibleUnreadCount}</p>
							<p class="text-xs text-muted-foreground">
								Unread {visibleUnreadCount === 1 ? 'alert' : 'alerts'}
							</p>
						</div>
					</div>

					<div class={`mt-4 grid gap-2.5 ${hasOperatorInbox ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
						{#if hasOperatorInbox}
							<div class="rounded-2xl border px-3 py-3 {getInboxSectionClass('recovery')}">
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">Recovery</p>
								<p class="mt-1 text-xl font-semibold tracking-tight">{operatorRecoveryCount}</p>
								<p class="text-xs text-current/80">Items back in queue</p>
							</div>
							<div class="rounded-2xl border px-3 py-3 {getInboxSectionClass('closeout')}">
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">Closeout</p>
								<p class="mt-1 text-xl font-semibold tracking-tight">{operatorCloseoutCount}</p>
								<p class="text-xs text-current/80">Attendance reviews</p>
							</div>
							<div class="rounded-2xl border px-3 py-3 {getInboxSectionClass('follow-up')}">
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">Follow-up</p>
								<p class="mt-1 text-xl font-semibold tracking-tight">{operatorFollowUpCount}</p>
								<p class="text-xs text-current/80">Recent turnout checks</p>
							</div>
						{/if}
						<div class="rounded-2xl border px-3 py-3 {getInboxSectionClass('member-alerts')}">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">Member alerts</p>
							<p class="mt-1 text-xl font-semibold tracking-tight">{notificationCounts.all}</p>
							<p class="text-xs text-current/80">{unreadCount} unread overall</p>
						</div>
					</div>
				</section>

				{#if hasOperatorInbox}
					<section class="mb-4 space-y-3 rounded-2xl border border-border/70 bg-card/76 p-3.5">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="space-y-1">
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
									Operator inbox
								</p>
								<p class="text-sm text-muted-foreground">A short triage list for the next admin action, not a full management surface.</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<span class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('recovery')}">
									{operatorRecoveryCount} recovery
								</span>
								<span class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('closeout')}">
									{operatorCloseoutCount} closeout
								</span>
								<span class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('follow-up')}">
									{operatorFollowUpCount} follow-up
								</span>
								{#if operatorRecoveryCount > 0}
									<Button href={recoveryQueueHref} variant="default" size="sm" class="shadow-sm" onclick={closeSheet}>
										Open recovery queue
									</Button>
								{/if}
							</div>
						</div>

						{#if operatorInboxLoadError}
							<p
								role="alert"
								class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
							>
								{operatorInboxLoadError}
							</p>
						{/if}

						{#if operatorInboxCount === 0}
							<div
								class={`rounded-xl px-4 py-4 text-sm ${operatorInboxLoadError ? 'border border-destructive/30 bg-destructive/10 text-destructive' : 'border border-dashed border-border bg-muted/35 text-muted-foreground'}`}
							>
								{#if isOperatorInboxLoading}
									Loading the member roster for attendance closeout...
								{:else if operatorInboxLoadError}
									{operatorInboxLoadError}
								{:else}
									No recovery, closeout, or follow-up work needs operator attention right now.
								{/if}
							</div>
						{:else}
							{#if isOperatorInboxLoading}
								<p class="text-xs text-muted-foreground">
									Loading the member roster for attendance closeout...
								</p>
							{/if}
							{#if operatorRecoveryItems.length > 0}
								<div class="space-y-2">
									<div class="flex items-center justify-between gap-3">
										<div class="flex items-center gap-2">
											<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
											Recovery
											</p>
											<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('recovery')}">
												{operatorRecoveryCount}
											</span>
										</div>
										{#if operatorRecoveryCount > operatorRecoveryItems.length}
											<p class="text-xs text-muted-foreground">
												+{operatorRecoveryCount - operatorRecoveryItems.length} more in queue
											</p>
										{/if}
									</div>
									<Item.Group>
										{#each operatorRecoveryItems as item (item.id)}
											<Item.Root variant="muted" size="sm">
												<Item.Content>
													{@const workflowSummary = getRecoveryWorkflowSummary(item)}
													<div class="flex flex-wrap items-center gap-2">
														<Item.Title>{item.subjectTitle}</Item.Title>
														<span class="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('recovery')}">
															Recovery
														</span>
														<span class="rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
															{item.jobLabel}
														</span>
														{#if item.isStaleReview}
															<span class="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-destructive">
																Needs re-review
															</span>
														{/if}
													</div>
													<Item.Description>{item.detailCopy}</Item.Description>
													{#if item.recoveryGuidance}
														<p class="text-xs text-muted-foreground">{item.recoveryGuidance.nextStepCopy}</p>
													{/if}
													{#if item.staleReviewCopy}
														<p class="text-xs text-destructive">{item.staleReviewCopy}</p>
													{/if}
													{#if workflowSummary}
														<div class="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
															<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-muted/35 after:hidden">
																<Avatar.Fallback class="text-[0.68rem] font-semibold tracking-tight text-foreground">
																	{getInitials(workflowSummary.actorLabel)}
																</Avatar.Fallback>
															</Avatar.Root>
															<div class="min-w-0 space-y-1">
																<div class="flex flex-wrap items-center gap-2">
																	<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] {getWorkflowSummaryClass(workflowSummary.status)}">
																		{workflowSummary.statusLabel}
																	</span>
																	<p class="text-xs font-medium text-foreground">{workflowSummary.actorLabel}</p>
																	<p class="text-xs text-muted-foreground">{workflowSummary.timestampCopy}</p>
																</div>
																<p class="text-xs text-muted-foreground">{workflowSummary.summaryCopy}</p>
															{#if workflowSummary.note}
																<p class="text-xs text-foreground">{workflowSummary.note}</p>
															{/if}
															</div>
														</div>
													{/if}
													<p class="text-xs text-muted-foreground">{item.timingCopy}</p>
												</Item.Content>
												<Item.Actions>
													<Button href={getRecoveryHref(item)} variant="default" size="sm" class="shadow-sm" onclick={closeSheet}>
														{item.recoveryGuidance?.openLabel ?? 'Open item'}
														<ArrowUpRightIcon class="size-4" />
													</Button>
												</Item.Actions>
											</Item.Root>
										{/each}
									</Item.Group>
								</div>
							{/if}

							{#if operatorCloseoutItems.length > 0}
								<div class="space-y-2">
									<div class="flex items-center justify-between gap-3">
										<div class="flex items-center gap-2">
											<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
											Closeout
											</p>
											<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('closeout')}">
												{operatorCloseoutCount}
											</span>
										</div>
										{#if operatorCloseoutCount > operatorCloseoutItems.length}
											<p class="text-xs text-muted-foreground">
												+{operatorCloseoutCount - operatorCloseoutItems.length} more event{operatorCloseoutCount - operatorCloseoutItems.length === 1 ? '' : 's'} need closeout
											</p>
										{/if}
									</div>
									<Item.Group>
										{#each operatorCloseoutItems as entry (entry.event.id)}
											<Item.Root variant="muted" size="sm">
												<Item.Content>
													{@const workflowSummary = getCloseoutWorkflowSummary(entry.event.id)}
													<div class="flex flex-wrap items-center gap-2">
														<Item.Title>{entry.event.title}</Item.Title>
														<span class="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('closeout')}">
															Closeout
														</span>
													</div>
													<Item.Description>{getEventAttendanceRosterSummaryCopy(entry.roster)}</Item.Description>
													{#if workflowSummary}
														<div class="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
															<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-muted/35 after:hidden">
																<Avatar.Fallback class="text-[0.68rem] font-semibold tracking-tight text-foreground">
																	{getInitials(workflowSummary.actorLabel)}
																</Avatar.Fallback>
															</Avatar.Root>
															<div class="min-w-0 space-y-1">
																<div class="flex flex-wrap items-center gap-2">
																	<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] {getWorkflowSummaryClass(workflowSummary.status)}">
																		{workflowSummary.statusLabel}
																	</span>
																	<p class="text-xs font-medium text-foreground">{workflowSummary.actorLabel}</p>
																	<p class="text-xs text-muted-foreground">{workflowSummary.timestampCopy}</p>
																</div>
																<p class="text-xs text-muted-foreground">{workflowSummary.summaryCopy}</p>
															{#if workflowSummary.note}
																<p class="text-xs text-foreground">{workflowSummary.note}</p>
															{/if}
															</div>
														</div>
													{/if}
												</Item.Content>
												<Item.Actions>
													<Button href={getManageEventHref(entry.event.id)} variant="default" size="sm" class="shadow-sm" onclick={closeSheet}>
														Review attendance
														<ArrowUpRightIcon class="size-4" />
													</Button>
												</Item.Actions>
											</Item.Root>
										{/each}
									</Item.Group>
								</div>
							{/if}

							{#if operatorFollowUpSignals.length > 0}
								<div class="space-y-2">
									<div class="flex items-center justify-between gap-3">
										<div class="flex items-center gap-2">
											<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
											Follow-up
											</p>
											<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('follow-up')}">
												{operatorFollowUpCount}
											</span>
										</div>
										{#if operatorFollowUpCount > operatorFollowUpSignals.length}
											<p class="text-xs text-muted-foreground">
												+{operatorFollowUpCount - operatorFollowUpSignals.length} more recent follow-up item{operatorFollowUpCount - operatorFollowUpSignals.length === 1 ? '' : 's'}
											</p>
										{/if}
									</div>
									<Item.Group>
										{#each operatorFollowUpSignals as signal (signal.eventId)}
											<Item.Root variant="muted" size="sm">
												<Item.Content>
													{@const workflowSummary = getFollowUpWorkflowSummary(signal)}
													<div class="flex flex-wrap items-center gap-2">
														<Item.Title>{signal.eventTitle}</Item.Title>
														<span class="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getInboxSectionClass('follow-up')}">
															Follow-up
														</span>
														<span class="rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
															{signal.statusLabel}
														</span>
														{#if signal.isStaleReview}
															<span class="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-destructive">
																Needs re-review
															</span>
														{/if}
													</div>
													<Item.Description>{signal.copy}</Item.Description>
													{#if signal.staleReviewCopy}
														<p class="text-xs text-destructive">{signal.staleReviewCopy}</p>
													{/if}
													{#if workflowSummary}
														<div class="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
															<Avatar.Root class="size-9 shrink-0 border border-border/70 bg-muted/35 after:hidden">
																<Avatar.Fallback class="text-[0.68rem] font-semibold tracking-tight text-foreground">
																	{getInitials(workflowSummary.actorLabel)}
																</Avatar.Fallback>
															</Avatar.Root>
															<div class="min-w-0 space-y-1">
																<div class="flex flex-wrap items-center gap-2">
																	<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] {getWorkflowSummaryClass(workflowSummary.status)}">
																		{workflowSummary.statusLabel}
																	</span>
																	<p class="text-xs font-medium text-foreground">{workflowSummary.actorLabel}</p>
																	<p class="text-xs text-muted-foreground">{workflowSummary.timestampCopy}</p>
																</div>
																<p class="text-xs text-muted-foreground">{workflowSummary.summaryCopy}</p>
															{#if workflowSummary.note}
																<p class="text-xs text-foreground">{workflowSummary.note}</p>
															{/if}
															</div>
														</div>
													{/if}
													<p class="text-xs text-muted-foreground">{signal.timingCopy}</p>
												</Item.Content>
												<Item.Actions>
													<Button href={getManageEventHref(signal.eventId)} variant="default" size="sm" class="shadow-sm" onclick={closeSheet}>
														{getOperatorFollowUpActionLabel(signal.kind)}
														<ArrowUpRightIcon class="size-4" />
													</Button>
												</Item.Actions>
											</Item.Root>
										{/each}
									</Item.Group>
								</div>
							{/if}
						{/if}
					</section>
				{/if}

				{#if currentHub.isLoading && notifications.length === 0 && (!hasOperatorInbox || operatorInboxCount === 0)}
					<div role="status" aria-live="polite" class="space-y-3">
						<span class="sr-only">Loading alerts.</span>
						{#each Array.from({ length: 3 }) as _, index (`loading-${index}`)}
							<div class="animate-pulse rounded-2xl border border-border bg-card/80 p-4">
								<div class="mb-3 h-3 w-16 rounded-full bg-muted/80"></div>
								<div class="mb-2 h-4 w-2/3 rounded-full bg-muted"></div>
								<div class="mb-2 h-3 w-full rounded-full bg-muted/75"></div>
								<div class="h-3 w-1/2 rounded-full bg-muted/75"></div>
							</div>
						{/each}
					</div>
				{:else}
					{#if hasOperatorInbox}
						<div class="mb-4 space-y-1">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
								Published alerts
							</p>
							<p class="text-sm text-muted-foreground">
								Broadcast, event, and reminder activity stays here once operator work is triaged.
							</p>
						</div>
					{/if}

					{#if notifications.length === 0}
						<div class="rounded-2xl border border-dashed border-border bg-muted/35 px-4 py-5 text-sm text-muted-foreground">
							{getEmptyStateCopy('all')}
						</div>
					{:else}
						<div class="mb-4 space-y-2.5">
							<div class="flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-card/80 p-3">
								<div class="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p class="text-sm font-medium text-foreground">Published alert feed</p>
										<p class="text-xs text-muted-foreground">
											{visibleNotifications.length} {visibleNotifications.length === 1 ? 'alert' : 'alerts'} visible
											{#if hiddenNotificationCount > 0}
												· {hiddenNotificationCount} hidden by settings
											{/if}
										</p>
									</div>
									{#if visibleUnreadCount > 0}
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={currentHub.isMarkingAllActivityRead}
											onclick={() => void markVisibleRead()}
										>
											{currentHub.isMarkingAllActivityRead ? 'Saving...' : 'Mark visible read'}
										</Button>
									{/if}
								</div>

								<div class="flex flex-wrap gap-2">
								<Button
									type="button"
									size="sm"
									variant={filter === 'all' ? 'secondary' : 'outline'}
									class="rounded-full"
									aria-pressed={filter === 'all'}
									onclick={() => (filter = 'all')}
								>
									All {notificationCounts.all}
								</Button>
								<Button
									type="button"
									size="sm"
									variant={filter === 'broadcast' ? 'secondary' : 'outline'}
									class="rounded-full"
									aria-pressed={filter === 'broadcast'}
									onclick={() => (filter = 'broadcast')}
								>
									Broadcasts {notificationCounts.broadcast}
								</Button>
								<Button
									type="button"
									size="sm"
									variant={filter === 'event' ? 'secondary' : 'outline'}
									class="rounded-full"
									aria-pressed={filter === 'event'}
									onclick={() => (filter = 'event')}
								>
									Events {notificationCounts.event}
								</Button>
								</div>
							</div>
						</div>

						{#if visibleNotifications.length === 0}
							<div class="rounded-2xl border border-dashed border-border bg-muted/35 px-4 py-5 text-sm text-muted-foreground">
								{getEmptyStateCopy(filter)}
							</div>
						{:else}
							<Item.Group>
								{#each visibleNotifications as notification (notification.id)}
									{@const primaryAction = getPrimaryAction(notification)}
									{@const secondaryAction = getSecondaryAction(notification)}
									<Item.Root
										variant="default"
										class={`bg-card ${notification.isRead ? '' : 'ring-1 ring-border/70'}`}
									>
										<Item.Content>
											<div class="flex items-center justify-between gap-3">
												<Item.Title>{notification.title}</Item.Title>
												<div class="flex flex-wrap items-center justify-end gap-2">
													<span class="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] {getNotificationLabelClass(notification.label)}">
														{notification.label}
													</span>
													{#if !notification.isRead}
														<span class="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
															New
														</span>
													{/if}
												</div>
											</div>
											<Item.Description>{notification.summary}</Item.Description>
											<p class="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
												{notification.meta}
											</p>
											<div class="flex flex-wrap gap-2 pt-2">
												<Button
													href={primaryAction.href}
													variant="default"
													size="sm"
													class="shadow-sm"
													onclick={() => handleNotificationAction(notification)}
												>
													{primaryAction.label}
													<ArrowUpRightIcon class="size-4" />
												</Button>
												{#if secondaryAction}
													<Button
														href={secondaryAction.href}
														variant="ghost"
														size="sm"
														onclick={() => handleNotificationAction(notification)}
													>
														{secondaryAction.label}
													</Button>
												{/if}
												{#if !notification.isRead}
													<Button
														type="button"
														variant="ghost"
														size="sm"
														disabled={currentHub.notificationReadTargetId === notification.id}
														onclick={() => void markNotificationRead(notification)}
													>
														{currentHub.notificationReadTargetId === notification.id ? 'Saving...' : 'Mark read'}
													</Button>
												{/if}
											</div>
										</Item.Content>
									</Item.Root>
								{/each}
							</Item.Group>
						{/if}
					{/if}
				{/if}
			{/if}
		</ScrollArea>

		<Sheet.Footer class="gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<p class="text-xs text-muted-foreground">
					{notificationCounts.all} {notificationCounts.all === 1 ? 'alert' : 'alerts'} total
					{#if hiddenNotificationCount > 0}
						· {hiddenNotificationCount} hidden by settings
					{/if}
				</p>
				{#if visibleUnreadCount > 0}
					<p class="text-xs text-muted-foreground">
						{visibleUnreadCount} unread {visibleUnreadCount === 1 ? 'alert' : 'alerts'} in this view
					</p>
				{/if}
			</div>

			<div class="flex flex-wrap gap-2">
				<Button href={settingsHref} variant="ghost" size="sm" onclick={closeSheet}>Settings</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={visibleUnreadCount === 0 || currentHub.isMarkingAllActivityRead}
					onclick={() => void markVisibleRead()}
				>
					{currentHub.isMarkingAllActivityRead ? 'Saving...' : 'Mark visible read'}
				</Button>
				<Sheet.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Close</Button>
					{/snippet}
				</Sheet.Close>
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
{/if}
