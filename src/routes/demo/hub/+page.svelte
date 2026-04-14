<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';
	import HubActivityFeed from '$lib/components/hub/member/HubActivityFeed.svelte';
	import MemberCommitmentsCard from '$lib/components/hub/member/MemberCommitmentsCard.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { EventResponseStatus } from '$lib/repositories/hubRepository';
	import {
		uiPreviewFixtures,
		uiPreviewMemberCount,
		uiPreviewNotifications,
		uiPreviewOwnEventResponses,
		uiPreviewUnreadMessageCount
	} from '$lib/demo/uiPreviewFixtures';

	let previewResponses = $state<Record<string, EventResponseStatus | null>>({
		...uiPreviewOwnEventResponses
	});
	let previewResponseTargetId = $state('');

	async function handlePreviewResponse(eventId: string, response: EventResponseStatus) {
		previewResponseTargetId = eventId;

		try {
			previewResponses = {
				...previewResponses,
				[eventId]: response
			};
		} finally {
			previewResponseTargetId = '';
		}
	}
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

	<MemberCommitmentsCard
		events={uiPreviewFixtures.events}
		ownResponses={previewResponses}
		notifications={uiPreviewNotifications}
		responseTargetId={previewResponseTargetId}
		onRespond={handlePreviewResponse}
		eventHref="#demo-hub-events"
	/>

	<HubActivityFeed
		items={uiPreviewNotifications}
		organizationName={uiPreviewFixtures.organizationName}
		isLoading={false}
		broadcastHref="#demo-hub-broadcasts"
		eventHref="#demo-hub-events"
	/>

	<div class="card-grid">
		<BroadcastsSection broadcasts={uiPreviewFixtures.broadcasts} sectionId="demo-hub-broadcasts" />
		<EventsSection
			events={uiPreviewFixtures.events}
			ownResponses={previewResponses}
			notifications={uiPreviewNotifications}
			sectionId="demo-hub-events"
			organizationName={uiPreviewFixtures.organizationName}
		/>
	</div>
</main>