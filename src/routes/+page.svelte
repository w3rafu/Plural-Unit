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
	import BroadcastsSection from '$lib/components/hub/member/BroadcastsSection.svelte';
	import EventsSection from '$lib/components/hub/member/EventsSection.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { getActivePluginsForMember } from '$lib/stores/pluginRegistry';

	let loadedHubOrgId = '';

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId || loadedHubOrgId === organizationId) {
			return;
		}

		loadedHubOrgId = organizationId;
		void currentHub.load();
	});

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});

	const activePlugins = $derived(getActivePluginsForMember(currentHub.plugins));
	const unreadMessages = $derived(currentMessages.totalUnreadCount);
	const pendingInvites = $derived(currentOrganization.invitations.length);

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

<main class="page-stack">
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

	<HubActivityFeed />

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
					<BroadcastsSection />
				{:else if plugin.key === 'events'}
					<EventsSection />
				{/if}
			{/each}
		</div>
	{/if}
</main>
