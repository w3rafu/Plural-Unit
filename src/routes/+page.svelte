<!--
  Hub page — the org-centered root.

  Shows a compact summary, recent activity, and plugin sections.
  Loads hub data on mount, delegates rendering to member components.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import HubActivityFeed from '$lib/components/hub/member/HubActivityFeed.svelte';
	import MemberCommitmentsCard from '$lib/components/hub/member/MemberCommitmentsCard.svelte';
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';
	import ResourcesSection from '$lib/components/hub/member/ResourcesSection.svelte';
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
	const visibleOwnResponses = $derived.by(() =>
		Object.fromEntries(
			visibleEvents.map((event) => [event.id, currentHub.getOwnEventResponse(event.id)])
		)
	);
	const visibleOwnAttendance = $derived.by(() =>
		Object.fromEntries(
			visibleEvents.map((event) => [event.id, currentHub.getOwnEventAttendance(event.id)])
		)
	);
	const unreadMessages = $derived(currentMessages.totalUnreadCount);
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
	subtitle="Organization hub"
	actions={hubActions}
/>

<main class="page-stack" aria-busy={currentHub.isLoading}>
	{#if currentOrganization.isAdmin}
		<div class="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
			<span class="mr-auto text-sm text-muted-foreground">
				{memberCount} members &middot; {pendingInvites} pending invites
			</span>
			<Button href="/hub/manage/content" size="sm">Open Hub Manage</Button>
		</div>
	{:else}
		<div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
			<span>{memberCount} members</span>
			<span class="capitalize">{roleName}</span>
			{#if unreadMessages > 0}
				<a href="/messages" class="font-medium text-foreground underline underline-offset-4">
					{unreadMessages} unread
				</a>
			{/if}
		</div>
	{/if}

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

		{#if canSeeEvents}
			<MemberCommitmentsCard
				events={visibleEvents}
				ownResponses={visibleOwnResponses}
				ownAttendance={visibleOwnAttendance}
				notifications={visibleActivityItems}
				eventHref="#hub-events"
			/>
		{/if}

		{#if canSeeBroadcasts || canSeeEvents}
			<HubActivityFeed
				items={visibleActivityItems}
				broadcastHref="#hub-broadcasts"
				eventHref="#hub-events"
				{manageBroadcastsHref}
				{manageEventsHref}
			/>
		{/if}

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
			<div class="card-grid">
				{#each visiblePlugins as plugin (plugin.key)}
					{#if plugin.key === 'broadcasts'}
						<BroadcastsSection sectionId="hub-broadcasts" />
					{:else if plugin.key === 'events'}
						<EventsSection sectionId="hub-events" />
					{:else if plugin.key === 'resources'}
						<ResourcesSection sectionId="hub-resources" />
					{/if}
				{/each}
			</div>
		{/if}
	{/if}
</main>
