<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import {
		getHubEngagementAttendanceCopy,
		getHubEngagementCoverageCopy,
		getHubEngagementFollowUpCopy
	} from '$lib/models/hubEngagementModel';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { getAllPluginsForAdmin } from '$lib/stores/pluginRegistry';

	const adminPlugins = getAllPluginsForAdmin();

	const activePlugins = $derived(adminPlugins.filter((plugin) => currentHub.plugins[plugin.key]));
	const draftBroadcastCount = $derived(currentHub.draftBroadcasts.length);
	const scheduledBroadcastCount = $derived(currentHub.scheduledBroadcasts.length);
	const liveBroadcastCount = $derived(currentHub.activeBroadcasts.length);
	const inactiveBroadcastCount = $derived(currentHub.inactiveBroadcasts.length);
	const liveEventCount = $derived(currentHub.liveEvents.length);
	const scheduledEventCount = $derived(currentHub.scheduledEvents.length);
	const inactiveEventCount = $derived(currentHub.inactiveEvents.length);
	const liveResourceCount = $derived(currentHub.orderedResources.length);
	const publishedCount = $derived(liveBroadcastCount + liveEventCount + liveResourceCount);
	const historyCount = $derived(inactiveBroadcastCount + inactiveEventCount);
	const dueExecutionCount = $derived(currentHub.dueExecutionCount);
	const recoverableExecutionCount = $derived(currentHub.recoverableExecutionCount);
	const processedExecutionCount = $derived(currentHub.processedExecutionItems.length);
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
	const followUpCopy = $derived(getHubEngagementFollowUpCopy(engagementSummary));
	const dueExecutionCopy = $derived.by(() => {
		if (dueExecutionCount === 0) {
			return processedExecutionCount === 0
				? 'Scheduled publishes and reminder windows are clear right now.'
				: `${processedExecutionCount} execution item${processedExecutionCount === 1 ? '' : 's'} already processed and retained in the ledger.`;
		}

		return `${dueExecutionCount} execution item${dueExecutionCount === 1 ? '' : 's'} is ready for operator review in content tools.`;
	});
	const recoveryQueueCopy = $derived.by(() => {
		if (recoverableExecutionCount === 0) {
			return 'No failed or skipped execution rows need recovery.';
		}

		return `${recoverableExecutionCount} failed or skipped row${recoverableExecutionCount === 1 ? '' : 's'} can be retried or opened for correction.`;
	});
	const sectionSummary = $derived.by(() => {
		if (activePlugins.length === 0) {
			return 'No hub sections are live yet.';
		}

		return `${activePlugins.length} section${activePlugins.length === 1 ? '' : 's'} currently visible to members.`;
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

		return parts.join(' ');
	});
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
				<p class="metric-value">{activePlugins.length}</p>
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

		<div class="metric-card">
			<div>
				<p class="metric-label">Due work</p>
				<p class="metric-value">{dueExecutionCount}</p>
			</div>
			<p class="metric-copy">{dueExecutionCopy}</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Recovery queue</p>
				<p class="metric-value">{recoverableExecutionCount}</p>
			</div>
			<p class="metric-copy">{recoveryQueueCopy}</p>
		</div>

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
				<Badge variant={currentHub.plugins[plugin.key] ? 'secondary' : 'outline'}>
					{plugin.title}
				</Badge>
			{/each}
		</div>
	</Card.Footer>
</Card.Root>
