<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';
	import HubActivityFeed from '$lib/components/hub/member/HubActivityFeed.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import {
		uiPreviewFixtures,
		uiPreviewMemberCount,
		uiPreviewNotifications,
		uiPreviewUnreadMessageCount
	} from '$lib/demo/uiPreviewFixtures';
</script>

<PageHeader
	preset="section"
	title={`${uiPreviewFixtures.organizationName} hub demo`}
	subtitle="Fixture-backed activity, broadcasts, and events."
/>

<main class="page-stack pb-6">
	<Card.Root size="sm" class="border-border/70 bg-card">
		<Card.Content class="metric-grid">
			<div class="metric-card">
				<div>
					<p class="metric-label">Members</p>
					<p class="metric-value">{uiPreviewFixtures.members.length}</p>
				</div>
				<p class="metric-copy">{uiPreviewMemberCount} members currently represented in the fixture roster.</p>
			</div>

			<div class="metric-card">
				<div>
					<p class="metric-label">Unread messages</p>
					<p class="metric-value">{uiPreviewUnreadMessageCount}</p>
				</div>
				<p class="metric-copy">Cross-check how the hub feels next to active conversation load.</p>
			</div>

			<div class="metric-card">
				<div>
					<p class="metric-label">Active sections</p>
					<p class="metric-value">2</p>
				</div>
				<p class="metric-copy">Broadcasts and events are both populated in this demo state.</p>
			</div>
		</Card.Content>
	</Card.Root>

	<HubActivityFeed items={uiPreviewNotifications} organizationName={uiPreviewFixtures.organizationName} isLoading={false} />

	<div class="card-grid">
		<BroadcastsSection broadcasts={uiPreviewFixtures.broadcasts} />
		<EventsSection events={uiPreviewFixtures.events} />
	</div>
</main>