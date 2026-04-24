<script lang="ts">
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import {
		getHubEngagementAttendanceCopy,
		getHubEngagementCoverageCopy,
		getHubEngagementFollowUpCopy
	} from '$lib/models/hubEngagementModel';
	import { buildHubExecutionQueueFocusHref } from '$lib/models/hubExecutionQueue';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { getResourceEngagementSignal } from '$lib/models/resourcesModel';
	import {
		getAllPluginsForAdmin,
		getEnabledPlugins,
		getPluginAudienceLabel,
		getVisiblePluginsForRole
	} from '$lib/stores/pluginRegistry';

	const adminPlugins = getAllPluginsForAdmin();

	const enabledPlugins = $derived(getEnabledPlugins(currentHub.plugins));
	const memberVisiblePlugins = $derived(getVisiblePluginsForRole(currentHub.plugins, 'member'));
	const draftBroadcastCount = $derived(currentHub.draftBroadcasts.length);
	const scheduledBroadcastCount = $derived(currentHub.scheduledBroadcasts.length);
	const liveBroadcastCount = $derived(currentHub.activeBroadcasts.length);
	const inactiveBroadcastCount = $derived(currentHub.inactiveBroadcasts.length);
	const liveEventCount = $derived(currentHub.liveEvents.length);
	const scheduledEventCount = $derived(currentHub.scheduledEvents.length);
	const inactiveEventCount = $derived(currentHub.inactiveEvents.length);
	const liveResourceCount = $derived(currentHub.orderedResources.length);
	const inactiveResourceCount = $derived(currentHub.inactiveResources.length);
	const resourceAttentionCount = $derived(
		currentHub.orderedResources.filter((resource) => getResourceEngagementSignal(resource).needsAttention).length
	);
	const publishedCount = $derived(liveBroadcastCount + liveEventCount + liveResourceCount);
	const queuedContentCount = $derived(
		draftBroadcastCount + scheduledBroadcastCount + scheduledEventCount
	);
	const historyCount = $derived(inactiveBroadcastCount + inactiveEventCount + inactiveResourceCount);
	const dueExecutionCount = $derived(currentHub.dueExecutionCount);
	const recoverableExecutionCount = $derived(currentHub.visibleRecoverableExecutionCount);
	const processedExecutionCount = $derived(currentHub.getExecutionQueueSections().processed.length);
	const staleRecoverableExecutionCount = $derived(
		currentHub.getExecutionQueueSections().recovery.filter((item) => item.isStaleReview).length
	);
	const triagedExecutionItemCount = $derived(currentHub.triagedExecutionItemCount);
	const staleFollowUpSignalCount = $derived(currentHub.staleFollowUpSignalCount);
	const triagedFollowUpSignalCount = $derived(currentHub.triagedFollowUpSignalCount);
	const engagementSummary = $derived(currentHub.hubEngagementSummary);
	const attendanceReviewCount = $derived(engagementSummary.attendanceReviewCount);
	const responseCoverageValue = $derived.by(() => {
		if (engagementSummary.liveEventCount === 0) {
			return '—';
		}

		return `${engagementSummary.respondedLiveEventCount} / ${engagementSummary.liveEventCount}`;
	});
	const responseCoverageCopy = $derived(getHubEngagementCoverageCopy(engagementSummary));
	const attendanceReviewCopy = $derived(getHubEngagementAttendanceCopy(engagementSummary));
	const followUpCopy = $derived.by(() => {
		const baseCopy = getHubEngagementFollowUpCopy(engagementSummary);

		if (staleFollowUpSignalCount > 0) {
			return `${baseCopy} ${staleFollowUpSignalCount} changed since review.`;
		}

		if (engagementSummary.followUpCount === 0 && triagedFollowUpSignalCount > 0) {
			return `${baseCopy} ${triagedFollowUpSignalCount} reviewed or deferred item${triagedFollowUpSignalCount === 1 ? '' : 's'} hidden from the default queue.`;
		}

		return baseCopy;
	});
	const dueExecutionCopy = $derived.by(() => {
		if (dueExecutionCount === 0) {
			return processedExecutionCount === 0
				? triagedExecutionItemCount === 0
					? 'Scheduled publishes and reminder windows are clear right now.'
					: `${triagedExecutionItemCount} reviewed or deferred execution item${triagedExecutionItemCount === 1 ? '' : 's'} hidden from the default queue.`
				: `${processedExecutionCount} execution item${processedExecutionCount === 1 ? '' : 's'} already processed and retained in the ledger.`;
		}

		return `${dueExecutionCount} execution item${dueExecutionCount === 1 ? '' : 's'} is ready for operator review in content tools.`;
	});
	const recoveryQueueCopy = $derived.by(() => {
		if (recoverableExecutionCount === 0) {
			return triagedExecutionItemCount === 0
				? 'No failed or skipped execution rows need recovery.'
				: `${triagedExecutionItemCount} reviewed or deferred execution item${triagedExecutionItemCount === 1 ? '' : 's'} hidden from the default queue.`;
		}

		return `${recoverableExecutionCount} failed or skipped row${recoverableExecutionCount === 1 ? '' : 's'} can be retried or opened for correction.${staleRecoverableExecutionCount > 0 ? ` ${staleRecoverableExecutionCount} changed since review.` : ''}`;
	});
	const sectionSummary = $derived.by(() => {
		if (enabledPlugins.length === 0) {
			return 'No hub sections are enabled yet.';
		}

		if (memberVisiblePlugins.length === 0) {
			return `${enabledPlugins.length} enabled section${enabledPlugins.length === 1 ? '' : 's'}, but only admins can see them on the hub home.`;
		}

		const adminOnlyCount = enabledPlugins.length - memberVisiblePlugins.length;
		return `${memberVisiblePlugins.length} section${memberVisiblePlugins.length === 1 ? '' : 's'} currently visible to members.${adminOnlyCount > 0 ? ` ${adminOnlyCount} admin-only.` : ''}`;
	});

	const contentSummary = $derived.by(() => {
		if (
			publishedCount === 0 &&
			draftBroadcastCount === 0 &&
			scheduledBroadcastCount === 0 &&
			scheduledEventCount === 0 &&
			historyCount === 0
		) {
			return 'No broadcasts, events, or resources are live right now.';
		}

		const parts = [];

		if (publishedCount > 0) {
			parts.push(`${publishedCount} live item${publishedCount === 1 ? '' : 's'} ready for members.`);
		}

		if (scheduledEventCount > 0) {
			parts.push(
				`${scheduledEventCount} event${scheduledEventCount === 1 ? '' : 's'} scheduled for later visibility.`
			);
		}

		if (draftBroadcastCount > 0) {
			parts.push(
				`${draftBroadcastCount} broadcast draft${draftBroadcastCount === 1 ? '' : 's'} waiting for publication.`
			);
		}

		if (scheduledBroadcastCount > 0) {
			parts.push(
				`${scheduledBroadcastCount} broadcast${scheduledBroadcastCount === 1 ? '' : 's'} scheduled for later visibility.`
			);
		}

		if (historyCount > 0) {
			parts.push(`${historyCount} item${historyCount === 1 ? '' : 's'} in history.`);
		}

		if (resourceAttentionCount > 0) {
			parts.push(
				`${resourceAttentionCount} live resource${resourceAttentionCount === 1 ? '' : 's'} may need cleanup.`
			);
		}

		return parts.join(' ');
	});

	const summaryMetrics = $derived.by(() => [
		{
			label: 'Enabled sections',
			value: String(enabledPlugins.length),
			detail: `${adminPlugins.length} available`
		},
		{
			label: 'Member-visible',
			value: String(memberVisiblePlugins.length),
			detail:
				enabledPlugins.length === 0
					? 'No live sections'
					: `${Math.max(enabledPlugins.length - memberVisiblePlugins.length, 0)} admin-only`
		},
		{
			label: 'Live content',
			value: String(publishedCount),
			detail:
				queuedContentCount > 0
					? `${queuedContentCount} queued`
					: historyCount > 0
						? `${historyCount} in history`
						: 'Nothing queued'
		},
		{
			label: 'Due work',
			value: String(dueExecutionCount),
			detail: dueExecutionCount === 0 ? 'Queue clear' : 'Ready now',
			href: getQueueFocusHref('due')
		}
	]);

	const signalItems = $derived.by(() => [
		{
			label: 'Replies',
			value: responseCoverageValue
		},
		{
			label: 'Day-of',
			value: String(attendanceReviewCount)
		},
		{
			label: 'Recovery',
			value: String(recoverableExecutionCount),
			href: getQueueFocusHref('recovery')
		},
		{
			label: 'Follow-up',
			value: String(engagementSummary.followUpCount)
		}
	]);

	function getQueueFocusHref(bucket: 'due' | 'recovery') {
		return buildHubExecutionQueueFocusHref({
			url: page.url,
			pathname: '/hub/manage/content',
			hash: 'manage-operations',
			focus: {
				bucket,
				jobKind: 'all',
				subjectKind: 'all',
				includeUpcoming: false
			}
		});
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2.5 border-b border-border/70">
		<div class="space-y-1">
			<Card.Title class="text-lg font-semibold tracking-tight">Hub setup</Card.Title>
			<Card.Description>
				Manage what members can see in {currentOrganization.organization?.name ?? 'your organization'}.
			</Card.Description>
		</div>
	</Card.Header>

	<Card.Content class="space-y-3 p-2.5 sm:p-4">
		<div class="grid grid-cols-2 gap-2 xl:grid-cols-4">
			{#each summaryMetrics as metric (metric.label)}
				{#if metric.href}
					<a
						href={metric.href}
						class="flex min-w-0 flex-col gap-1 rounded-[0.95rem] border border-border/70 bg-muted/16 px-2.5 py-2.75 no-underline transition-colors hover:bg-muted/24 dark:border-white/10 dark:bg-black/36 dark:hover:bg-black/52 sm:rounded-[1rem] sm:px-3 sm:py-3"
					>
						<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</p>
						<p class="text-[1.25rem] font-semibold tracking-tight text-foreground sm:text-[1.45rem]">{metric.value}</p>
						<p class="text-[0.82rem] text-muted-foreground sm:text-[0.86rem]">{metric.detail}</p>
					</a>
				{:else}
					<div class="flex min-w-0 flex-col gap-1 rounded-[0.95rem] border border-border/70 bg-muted/16 px-2.5 py-2.75 dark:border-white/10 dark:bg-black/36 sm:rounded-[1rem] sm:px-3 sm:py-3">
						<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</p>
						<p class="text-[1.25rem] font-semibold tracking-tight text-foreground sm:text-[1.45rem]">{metric.value}</p>
						<p class="text-[0.82rem] text-muted-foreground sm:text-[0.86rem]">{metric.detail}</p>
					</div>
				{/if}
			{/each}
		</div>

		<p class="hidden text-[0.8rem] leading-5 text-muted-foreground sm:block">{contentSummary}</p>

		<div class="flex flex-wrap gap-1.5 sm:gap-2">
			{#each signalItems as item (item.label)}
				{#if item.href}
					<a
						href={item.href}
						class="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1.25 text-[0.8rem] font-medium text-foreground no-underline transition-colors hover:bg-muted/18 dark:border-white/10 dark:bg-black/44 dark:hover:bg-black/58 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[0.84rem]"
					>
						<span class="text-[0.75rem] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</span>
						<span>{item.value}</span>
					</a>
				{:else}
					<div class="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1.25 text-[0.8rem] font-medium text-foreground dark:border-white/10 dark:bg-black/44 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[0.84rem]">
						<span class="text-[0.75rem] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</span>
						<span>{item.value}</span>
					</div>
				{/if}
			{/each}
		</div>
	</Card.Content>

	<Card.Footer class="border-t border-border/70 pt-3.5">
		<div class="flex flex-wrap gap-2">
			{#each adminPlugins as plugin (plugin.key)}
				<Badge variant={currentHub.plugins[plugin.key].isEnabled ? 'secondary' : 'outline'}>
					{plugin.title}
					{#if currentHub.plugins[plugin.key].isEnabled}
						&nbsp;&middot;&nbsp;{getPluginAudienceLabel(currentHub.plugins[plugin.key].visibility)}
					{/if}
				</Badge>
			{/each}
		</div>
	</Card.Footer>
</Card.Root>
