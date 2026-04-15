<!--
  Hub page — the org-centered root.

  Shows organization stats, recent activity, and plugin sections.
  Loads hub data on mount, delegates rendering to member components.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
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
	import { getActivePluginsForMember } from '$lib/stores/pluginRegistry';

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

	const activePlugins = $derived(getActivePluginsForMember(currentHub.plugins));
	const unreadMessages = $derived(currentMessages.totalUnreadCount);
	const pendingInvites = $derived(currentOrganization.invitations.length);
	const manageBroadcastsHref = $derived(
		currentOrganization.isAdmin ? '/hub/manage/content#manage-broadcasts' : undefined
	);
	const manageEventsHref = $derived(
		currentOrganization.isAdmin ? '/hub/manage/content#manage-events' : undefined
	);
	const manageContentHref = $derived(
		currentOrganization.isAdmin ? '/hub/manage/content' : undefined
	);
	const manageSectionsHref = $derived(
		currentOrganization.isAdmin ? '/hub/manage/sections' : undefined
	);
	const hasBlockingHubError = $derived(
		Boolean(currentHub.lastError) && !currentHub.hasLoadedForCurrentOrg
	);

	const hubActions = $derived.by(() => [
		...(currentOrganization.isAdmin
			? [{ id: 'hub-manage', label: 'Manage hub', href: '/hub/manage' }]
			: [])
	]);
</script>

<PageHeader
	title={currentOrganization.organization?.name ?? 'Hub'}
	subtitle="Organization hub"
	actions={hubActions}
/>

<main class="page-stack" aria-busy={currentHub.isLoading}>
	{#if currentOrganization.isAdmin}
		<Card.Root class="overflow-hidden border-primary/30 bg-linear-to-br from-primary/10 via-background to-secondary/30 shadow-sm">
			<Card.Content class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-2">
					<Badge
						variant="secondary"
						class="w-fit rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]"
					>
						Admin shortcut
					</Badge>
					<div class="space-y-1">
						<p class="text-lg font-semibold tracking-tight text-foreground">
							Need to publish, edit, or end a broadcast?
						</p>
						<p class="max-w-2xl text-sm text-muted-foreground">
							Open hub manage to reach the broadcast editor, archive live broadcasts, and switch over to section setup when something is missing.
						</p>
					</div>
				</div>

				<div class="flex w-full flex-col gap-2 sm:w-auto sm:min-w-72">
					<Button
						href={manageContentHref}
						size="lg"
						class="w-full justify-center text-sm font-semibold"
					>
						Open Hub Manage
					</Button>
					<Button href={manageSectionsHref} variant="outline" size="sm" class="w-full">
						Hub sections
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Quick stats row -->
	<Card.Root size="sm" class="border-border/70 bg-card">
		<Card.Content class="metric-grid">
			<div class="metric-card">
				<div>
					<p class="metric-label">Members</p>
					<p class="metric-value">
						{currentOrganization.memberCount === null ? '—' : currentOrganization.memberCount}
					</p>
				</div>
				<p class="metric-copy">People currently connected to this organization.</p>
			</div>

			<div class="metric-card">
				<div>
					<p class="metric-label">Role</p>
					<p class="metric-value metric-value--compact capitalize">
						{currentOrganization.membership?.role ?? 'member'}
					</p>
				</div>
				<p class="metric-copy">Your current level of access in the organization.</p>
			</div>

			<a href="/messages" class="metric-card metric-card--link">
				<div>
					<p class="metric-label">Unread messages</p>
					<p class="metric-value">{unreadMessages}</p>
				</div>
				<p class="metric-copy">Open your conversation queue.</p>
			</a>

			{#if currentOrganization.isAdmin}
				<a href="/organization/access" class="metric-card metric-card--link">
					<div>
						<p class="metric-label">Pending invites</p>
						<p class="metric-value">{pendingInvites}</p>
					</div>
					<p class="metric-copy">Review who still needs to accept access.</p>
				</a>
			{:else}
				<div class="metric-card">
					<div>
						<p class="metric-label">Active sections</p>
						<p class="metric-value">{activePlugins.length}</p>
					</div>
					<p class="metric-copy">Broadcasts and events visible to members.</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if hasBlockingHubError}
		<Card.Root class="border-destructive/30 bg-destructive/5">
			<Card.Header>
				<Card.Title class="text-lg font-semibold tracking-tight">Could not load the hub</Card.Title>
				<Card.Description role="alert" class="text-destructive">
					{currentHub.lastError?.message ??
						'The hub content could not be loaded right now. Try again in a moment.'}
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-wrap items-center gap-3 pt-0">
				<Button type="button" variant="outline" size="sm" onclick={retryHubLoad}>
					Try again
				</Button>
				<p class="text-xs text-muted-foreground">
					Organization stats are still available above while the hub content reconnects.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		{#if currentHub.lastError}
			<Card.Root class="border-destructive/30 bg-destructive/5">
				<Card.Content class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="space-y-1">
						<p class="text-sm font-medium text-foreground">Hub content may be out of date</p>
						<p role="alert" class="text-sm text-destructive">
							{currentHub.lastError.message}
						</p>
					</div>
					<Button type="button" variant="outline" size="sm" onclick={retryHubLoad}>
						Refresh hub
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}

		<MemberCommitmentsCard eventHref="#hub-events" />

		<HubActivityFeed
			broadcastHref="#hub-broadcasts"
			eventHref="#hub-events"
			{manageBroadcastsHref}
			{manageEventsHref}
		/>

		{#if currentHub.isLoading}
			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Content>
					<p class="text-sm text-muted-foreground">Loading the hub...</p>
				</Card.Content>
			</Card.Root>
		{:else if activePlugins.length === 0}
			<Card.Root class="border-dashed border-border/70 bg-muted/20">
				<Card.Header>
					<Card.Title class="text-lg font-semibold tracking-tight">The hub is ready for setup</Card.Title>
					<Card.Description>No sections are live yet.</Card.Description>
				</Card.Header>
				{#if currentOrganization.isAdmin}
					<Card.Content class="pt-0">
						<Button href="/hub/manage" variant="outline" size="sm">Open hub manage</Button>
					</Card.Content>
				{/if}
			</Card.Root>
		{:else}
			<div class="card-grid">
				{#each activePlugins as plugin (plugin.key)}
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
