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

	const managePath = $derived(page.url.pathname);

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId || loadedHubOrgId === organizationId) {
			return;
		}

		loadedHubOrgId = organizationId;
		void currentHub.load();
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

<main class="flex flex-col gap-4">
	{#if !currentOrganization.isAdmin}
		<Card.Root class="border-dashed border-border/70 bg-muted/20">
			<Card.Content>
				<p class="text-sm text-muted-foreground">This area is only available to organization admins.</p>
			</Card.Content>
		</Card.Root>
	{:else if currentHub.isLoading}
		<Card.Root size="sm" class="border-border/70 bg-card/70">
			<Card.Content>
				<p class="text-sm text-muted-foreground">Loading hub tools...</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<HubManageSummaryCard />

		<Card.Root class="border-border/70 bg-card/80">
			<Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-1">
					<p class="text-sm font-medium text-foreground">Choose a section</p>
					<p class="text-sm text-muted-foreground">Switch between section setup and content editors.</p>
				</div>

				<nav aria-label="Hub manage sections" class="w-full sm:w-auto">
					<ButtonGroup.Root class="w-full sm:w-auto">
						<Button
							href="/hub/manage/sections"
							variant={isActiveManageSubroute('/hub/manage/sections') ? 'default' : 'outline'}
							class="w-full sm:w-auto"
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
							variant={isActiveManageSubroute('/hub/manage/content') ? 'default' : 'outline'}
							class="w-full sm:w-auto"
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
