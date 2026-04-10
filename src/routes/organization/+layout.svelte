<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import OrganizationSummaryCard from '$lib/components/organization/OrganizationSummaryCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let { children } = $props();
	const organizationPath = $derived(page.url.pathname);
	let loadedMemberCountOrgId = $state('');
	let loadedInvitationsOrgId = $state('');

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId || loadedMemberCountOrgId === organizationId) {
			return;
		}

		loadedMemberCountOrgId = organizationId;
		void currentOrganization.loadMemberCount();
	});

	$effect(() => {
		const organizationId = currentOrganization.isAdmin
			? (currentOrganization.organization?.id ?? '')
			: '';

		if (!organizationId || loadedInvitationsOrgId === organizationId) {
			return;
		}

		loadedInvitationsOrgId = organizationId;
		void currentOrganization.loadInvitations();
	});

	function isActiveOrganizationSubroute(pathname: string) {
		return organizationPath === pathname;
	}

	function goToOrganizationSubroute(pathname: string) {
		void goto(pathname, { noScroll: true, keepFocus: true });
	}

	function goHome() {
		void goto('/');
	}
</script>

<PageHeader title="Organization" subtitle="Join code, invitations, and membership" backLabel="Home" onBack={goHome} />

<main class="flex flex-col gap-4">
	{#if !currentOrganization.organization}
		<Card.Root class="border-dashed border-border/70 bg-muted/20">
			<Card.Content>
				<p class="text-sm text-muted-foreground">No organization is connected to this account yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<OrganizationSummaryCard />

		<Card.Root class="border-border/70 bg-card/80">
			<Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-1">
					<p class="text-sm font-medium text-foreground">Choose a section</p>
					<p class="text-sm text-muted-foreground">Switch between organization overview and access tools.</p>
				</div>

				<ButtonGroup.Root class="w-full sm:w-auto">
					<Button
						type="button"
						variant={isActiveOrganizationSubroute('/organization/overview') ? 'default' : 'outline'}
						class="w-full sm:w-auto"
						onclick={() => goToOrganizationSubroute('/organization/overview')}
					>
						Overview
					</Button>
					<Button
						type="button"
						variant={isActiveOrganizationSubroute('/organization/access') ? 'default' : 'outline'}
						class="w-full sm:w-auto"
						onclick={() => goToOrganizationSubroute('/organization/access')}
					>
						Access
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>

		{@render children()}
	{/if}
</main>
