<!--
  Hub page — the org-centered root.

  Shows organization stats, recent activity, and plugin sections.
  Loads hub data on mount, delegates rendering to member components.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import HubOverviewCard from '$lib/components/hub/member/HubOverviewCard.svelte';
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

<main class="flex flex-col gap-4">
	<!-- Quick stats row -->
	<Card.Root class="border-border/70 bg-card/80">
		<Card.Content class="grid gap-3 sm:grid-cols-4">
			<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
				<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Members
				</p>
				<p class="mt-1 text-sm font-semibold text-foreground">
					{currentOrganization.memberCount === null ? '—' : currentOrganization.memberCount}
				</p>
			</div>

			<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
				<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Role
				</p>
				<p class="mt-1 text-sm font-semibold text-foreground">
					{currentOrganization.membership?.role ?? 'member'}
				</p>
			</div>

			<a href="/messages" class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3 transition-colors hover:bg-muted/55">
				<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Unread messages
				</p>
				<p class="mt-1 text-sm font-semibold text-foreground">
					{unreadMessages}
				</p>
			</a>

			{#if currentOrganization.isAdmin}
				<a href="/organization/access" class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3 transition-colors hover:bg-muted/55">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Pending invites
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{pendingInvites}
					</p>
				</a>
			{:else}
				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Active sections
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{activePlugins.length}
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<HubActivityFeed />

	{#if currentHub.isLoading}
		<Card.Root size="sm" class="border-border/70 bg-card/70">
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
