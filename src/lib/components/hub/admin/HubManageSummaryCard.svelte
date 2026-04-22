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
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="space-y-1">
			<Card.Title class="text-lg font-semibold tracking-tight">Hub setup</Card.Title>
			<Card.Description>
				Manage what members can see in {currentOrganization.organization?.name ?? 'your organization'}.
			</Card.Description>
		</div>
	</Card.Header>

	<Card.Content class="metric-grid">
		<div class="metric-card">
			<div>
				<p class="metric-label">Available sections</p>
				<p class="metric-value">{adminPlugins.length}</p>
			</div>
			<p class="metric-copy">Broadcasts, events, and resources can be turned on independently.</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Live now</p>
				<p class="metric-value">{memberVisiblePlugins.length}</p>
			</div>
			<p class="metric-copy">{sectionSummary}</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Live content</p>
				<p class="metric-value">{publishedCount}</p>
			</div>
			<p class="metric-copy">{contentSummary}</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Event replies</p>
				<p class="metric-value metric-value--compact">{responseCoverageValue}</p>
			</div>
			<p class="metric-copy">{responseCoverageCopy}</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Day-of status</p>
				<p class="metric-value">{attendanceReviewCount}</p>
			</div>
			<p class="metric-copy">{attendanceReviewCopy}</p>
		</div>

		<a href={getQueueFocusHref('due')} class="metric-card metric-card--link no-underline">
			<div>
				<p class="metric-label">Due work</p>
				<p class="metric-value">{dueExecutionCount}</p>
			</div>
			<p class="metric-copy">{dueExecutionCopy}</p>
		</a>

		<a href={getQueueFocusHref('recovery')} class="metric-card metric-card--link no-underline">
			<div>
				<p class="metric-label">Recovery queue</p>
				<p class="metric-value">{recoverableExecutionCount}</p>
			</div>
			<p class="metric-copy">{recoveryQueueCopy}</p>
		</a>

		<div class="metric-card">
			<div>
				<p class="metric-label">Needs follow-up</p>
				<p class="metric-value">{engagementSummary.followUpCount}</p>
			</div>
			<p class="metric-copy">{followUpCopy}</p>
		</div>
	</Card.Content>

	<Card.Footer class="border-t border-border/70 pt-4">
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
