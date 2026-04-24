<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import HubManageSummaryCard from '$lib/components/hub/admin/HubManageSummaryCard.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let { children } = $props();
	let loadedHubOrgId = '';
	let loadedMembersOrgId = '';

	const managePath = $derived(page.url.pathname);
	const hasBlockingHubError = $derived(
		Boolean(currentHub.lastError) && !currentHub.hasLoadedForCurrentOrg
	);

	async function loadHubTools() {
		try {
			await currentHub.load();
		} catch {
			// `currentHub` stores the real error for this layout to render.
		}
	}

	function retryHubToolsLoad() {
		void loadHubTools();
	}

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId) {
			loadedHubOrgId = '';
			loadedMembersOrgId = '';
			return;
		}

		if (loadedHubOrgId !== organizationId) {
			loadedHubOrgId = organizationId;
			void loadHubTools();
		}

		if (
			currentOrganization.isAdmin &&
			loadedMembersOrgId !== organizationId &&
			!currentOrganization.isLoadingMembers
		) {
			loadedMembersOrgId = organizationId;
			void currentOrganization.loadMembers();
		}
	});

	function isActiveManageSubroute(pathname: string) {
		return managePath === pathname;
	}

	function goToManageSubroute(pathname: string) {
		void goto(pathname, { noScroll: true, keepFocus: true });
	}

	function goBackToHub() {
		void goto('/');
	}
</script>

<PageHeader title="Manage hub" subtitle="Admin tools" backLabel="Hub" onBack={goBackToHub} />

<main class="page-stack" aria-busy={currentHub.isLoading}>
	{#if !currentOrganization.isAdmin}
		<Card.Root class="border-dashed border-border/70 bg-muted/20">
			<Card.Content>
				<p class="text-sm text-muted-foreground">This area is only available to organization admins.</p>
			</Card.Content>
		</Card.Root>
	{:else if hasBlockingHubError}
		<Card.Root class="border-destructive/30 bg-destructive/5">
			<Card.Header>
				<Card.Title class="text-lg font-semibold tracking-tight">Could not load hub tools</Card.Title>
				<Card.Description role="alert" class="text-destructive">
					{currentHub.lastError?.message ??
						'The hub management tools could not be loaded right now. Try again in a moment.'}
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-wrap items-center gap-3 pt-0">
				<Button type="button" variant="outline" size="sm" onclick={retryHubToolsLoad}>
					Try again
				</Button>
				<p class="text-[0.82rem] text-muted-foreground">
					Section editors will reappear here once the hub load succeeds.
				</p>
			</Card.Content>
		</Card.Root>
	{:else if currentHub.isLoading}
		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Content>
				<p class="text-sm text-muted-foreground">Loading hub tools...</p>
			</Card.Content>
		</Card.Root>
	{:else}
		{#if currentHub.lastError}
			<Card.Root class="border-destructive/30 bg-destructive/5">
				<Card.Content class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="space-y-1">
						<p class="text-sm font-medium text-foreground">Hub tools may be showing stale data</p>
						<p role="alert" class="text-sm text-destructive">
							{currentHub.lastError.message}
						</p>
					</div>
					<Button type="button" variant="outline" size="sm" onclick={retryHubToolsLoad}>
						Refresh tools
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}

		<HubManageSummaryCard />

		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Content class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
				<div class="space-y-0.5">
					<p class="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Section</p>
					<p class="text-[0.84rem] font-medium text-foreground">Sections or content.</p>
				</div>

				<nav aria-label="Hub manage sections" class="w-full sm:max-w-sm">
					<ButtonGroup.Root class="segmented-control flex w-full items-stretch">
						<Button
							href="/hub/manage/sections"
							size="sm"
							variant="ghost"
							class="segmented-control__button h-9 min-w-0 flex-1 justify-center px-3 max-sm:text-[0.82rem]"
							aria-current={isActiveManageSubroute('/hub/manage/sections') ? 'page' : undefined}
							onclick={(event) => {
								event.preventDefault();
								goToManageSubroute('/hub/manage/sections');
							}}
						>
							Sections
						</Button>
						<Button
							href="/hub/manage/content"
							size="sm"
							variant="ghost"
							class="segmented-control__button h-9 min-w-0 flex-1 justify-center px-3 max-sm:text-[0.82rem]"
							aria-current={isActiveManageSubroute('/hub/manage/content') ? 'page' : undefined}
							onclick={(event) => {
								event.preventDefault();
								goToManageSubroute('/hub/manage/content');
							}}
						>
							Content
						</Button>
					</ButtonGroup.Root>
				</nav>
			</Card.Content>
		</Card.Root>

		{@render children()}
	{/if}
</main>
