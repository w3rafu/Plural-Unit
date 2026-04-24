<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import HubActivityFeed from '$lib/components/hub/member/HubActivityFeed.svelte';
	import HubOverviewCards from '$lib/components/hub/member/HubOverviewCards.svelte';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';
	import ResourcesSection from '$lib/components/hub/member/ResourcesSection.svelte';
	import VolunteersSection from '$lib/components/hub/member/VolunteersSection.svelte';
	import { getMemberEventTimingState } from '$lib/models/memberCommitmentModel';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import {
		getEnabledPlugins,
		getVisiblePluginsForRole,
		isPluginVisibleToRole
	} from '$lib/stores/pluginRegistry';

	let loadedHubOrgId = '';

	async function loadHubData() {
		try {
			await currentHub.load();
		} catch {
			// `currentHub` captures the real error for the page-level UI.
		}
	}

	function retryHubLoad() {
		void loadHubData();
	}

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId || loadedHubOrgId === organizationId) {
			return;
		}

		loadedHubOrgId = organizationId;
		void loadHubData();
	});

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});

	const viewerRole = $derived(currentOrganization.membership?.role ?? 'member');
	const visiblePlugins = $derived(getVisiblePluginsForRole(currentHub.plugins, viewerRole));
	const enabledPlugins = $derived(getEnabledPlugins(currentHub.plugins));
	const canSeeBroadcasts = $derived(
		isPluginVisibleToRole(currentHub.plugins.broadcasts, viewerRole)
	);
	const canSeeEvents = $derived(isPluginVisibleToRole(currentHub.plugins.events, viewerRole));
	const visibleActivityItems = $derived(
		currentHub.activityFeed.filter((item) =>
			item.kind === 'broadcast' ? canSeeBroadcasts : canSeeEvents
		)
	);
	const visibleEvents = $derived(canSeeEvents ? currentHub.events : []);
	const upcomingVisibleEvents = $derived(
		visibleEvents.filter((event) => getMemberEventTimingState(event) !== 'recently_completed')
	);
	const unreadMessages = $derived(currentMessages.totalUnreadCount);
	const unreadActivityItems = $derived(visibleActivityItems.filter((item) => !item.isRead).length);
	const spotlightThreads = $derived(currentMessages.sortedThreads.slice(0, 3));
	const pendingInvites = $derived(currentOrganization.invitations.length);
	const manageBroadcastsHref = $derived(
		currentOrganization.isAdmin ? '/hub/manage/content#manage-broadcasts' : undefined
	);
	const manageEventsHref = $derived(
		currentOrganization.isAdmin ? '/hub/manage/content#manage-events' : undefined
	);
	const hasBlockingHubError = $derived(
		Boolean(currentHub.lastError) && !currentHub.hasLoadedForCurrentOrg
	);
	const broadcastReachPercent = $derived.by(() => {
		const totalMembers = currentOrganization.memberCount ?? 0;
		const liveBroadcast = canSeeBroadcasts ? currentHub.activeBroadcasts[0] ?? null : null;

		if (!liveBroadcast || totalMembers <= 0) {
			return 0;
		}

		return Math.min(
			100,
			Math.round((currentHub.getAcknowledgmentCount(liveBroadcast.id) / totalMembers) * 100)
		);
	});
	const eventResponsePercent = $derived.by(() => {
		const totalMembers = currentOrganization.memberCount ?? 0;
		const sampleEvents = upcomingVisibleEvents.slice(0, 3);

		if (sampleEvents.length === 0 || totalMembers <= 0) {
			return 0;
		}

		const totalResponses = sampleEvents.reduce(
			(sum, event) => sum + currentHub.getEventAttendanceSummary(event.id).total,
			0
		);

		return Math.min(
			100,
			Math.round((totalResponses / (sampleEvents.length * totalMembers)) * 100)
		);
	});
	const inboxClearPercent = $derived.by(() => {
		const threads = currentMessages.sortedThreads;

		if (threads.length === 0) {
			return 100;
		}

		const clearThreads = threads.filter((thread) => thread.unreadCount === 0).length;
		return Math.round((clearThreads / threads.length) * 100);
	});
	const hubSubtitle = $derived.by(() => {
		const parts: string[] = [];

		if (currentOrganization.memberCount !== null) {
			parts.push(`${currentOrganization.memberCount} members`);
		}

		if (currentOrganization.isAdmin) {
			parts.push(`${pendingInvites} pending invites`);
		} else {
			parts.push(roleName);
		}

		if (!currentOrganization.isAdmin && unreadMessages > 0) {
			parts.push(`${unreadMessages} unread`);
		}

		return parts.join(' · ') || 'Organization hub';
	});

	const hubActions = $derived.by(() => [
		...(currentOrganization.isAdmin
			? [{ id: 'hub-manage', label: 'Manage hub', href: '/hub/manage' }]
			: [])
	]);

	const memberCount = $derived(
		currentOrganization.memberCount === null ? '—' : String(currentOrganization.memberCount)
	);
	const roleName = $derived(viewerRole);
</script>

<PageHeader
	title={currentOrganization.organization?.name ?? 'Hub'}
	subtitle={hubSubtitle}
	actions={hubActions}
/>

<main class="mx-auto flex w-full max-w-[74rem] flex-col gap-4 lg:gap-5" aria-busy={currentHub.isLoading}>
	{#if hasBlockingHubError}
		<Card.Root class="border-destructive/30 bg-destructive/5">
			<Card.Content class="flex flex-wrap items-center gap-3 py-4">
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-foreground">Could not load the hub</p>
					<p role="alert" class="text-sm text-destructive">
						{currentHub.lastError?.message ?? 'Try again in a moment.'}
					</p>
				</div>
				<Button type="button" variant="outline" size="sm" onclick={retryHubLoad}>
					Try again
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		{#if currentHub.lastError}
			<Card.Root class="border-destructive/30 bg-destructive/5">
				<Card.Content class="flex flex-wrap items-center gap-3 py-4">
					<p class="min-w-0 flex-1 text-sm text-destructive" role="alert">
						{currentHub.lastError.message}
					</p>
					<Button type="button" variant="outline" size="sm" onclick={retryHubLoad}>
						Refresh
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}

		<div class="grid gap-3.5 xl:grid-cols-[minmax(0,1.9fr)_minmax(16.5rem,0.66fr)] xl:items-start">
			<HubOverviewCards
				memberCount={currentOrganization.memberCount}
				{pendingInvites}
				liveBroadcasts={canSeeBroadcasts ? currentHub.activeBroadcasts.length : 0}
				upcomingEvents={upcomingVisibleEvents.length}
				{unreadMessages}
				{unreadActivityItems}
				{broadcastReachPercent}
				{eventResponsePercent}
				{inboxClearPercent}
				threads={spotlightThreads}
			/>

			{#if canSeeBroadcasts || canSeeEvents}
				<div class="min-w-0">
					<HubActivityFeed
						items={visibleActivityItems}
						broadcastHref="#hub-broadcasts"
						eventHref="#hub-events"
						{manageBroadcastsHref}
						{manageEventsHref}
					/>
				</div>
			{/if}
		</div>

		{#if currentHub.isLoading}
			<p class="text-sm text-muted-foreground">Loading the hub...</p>
		{:else if visiblePlugins.length === 0}
			<Card.Root class="border-dashed border-border/70 bg-muted/20">
				<Card.Content class="py-6 text-center">
					<p class="font-medium text-foreground">
						{#if enabledPlugins.length === 0}
							No sections are live yet.
						{:else if !currentOrganization.isAdmin}
							Hub sections are currently limited to admins.
						{:else}
							No sections are live yet.
						{/if}
					</p>
					{#if enabledPlugins.length > 0 && !currentOrganization.isAdmin}
						<p class="mt-1 text-sm text-muted-foreground">
							An admin has enabled hub tools that are only visible to admins on this home view.
						</p>
					{/if}
					{#if currentOrganization.isAdmin}
						<Button href="/hub/manage" variant="outline" size="sm" class="mt-3">Open hub manage</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="flex flex-col gap-3.5">
				{#each visiblePlugins as plugin (plugin.key)}
					{#if plugin.key === 'broadcasts'}
						<BroadcastsSection sectionId="hub-broadcasts" />
					{:else if plugin.key === 'events'}
						<EventsSection sectionId="hub-events" />
					{:else if plugin.key === 'resources'}
						<ResourcesSection sectionId="hub-resources" />
					{:else if plugin.key === 'volunteers'}
						<VolunteersSection sectionId="hub-volunteers" />
					{/if}
				{/each}
			</div>
		{/if}
	{/if}
</main>
