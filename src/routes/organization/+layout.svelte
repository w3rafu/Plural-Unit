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
	let loadedMemberCountOrgId = '';
	let loadedInvitationsOrgId = '';
	let loadedMembersOrgId = '';

	$effect(() => {
		if (!currentOrganization.organization) {
			loadedMemberCountOrgId = '';
			loadedInvitationsOrgId = '';
			loadedMembersOrgId = '';
		}

		if (!currentOrganization.isAdmin) {
			loadedInvitationsOrgId = '';
			loadedMembersOrgId = '';
		}
	});

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

	$effect(() => {
		const organizationId =
			currentOrganization.isAdmin && organizationPath === '/organization/members'
				? (currentOrganization.organization?.id ?? '')
				: '';

		if (!organizationId || loadedMembersOrgId === organizationId) {
			return;
		}

		loadedMembersOrgId = organizationId;
		void currentOrganization.loadMembers();
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
					<p class="text-sm text-muted-foreground">
						Switch between overview, access tools, and member visibility.
					</p>
				</div>

				<nav aria-label="Organization sections" class="w-full sm:w-auto">
					<ButtonGroup.Root class="w-full sm:w-auto">
						<Button
							href="/organization/overview"
							variant={isActiveOrganizationSubroute('/organization/overview') ? 'default' : 'outline'}
							class="w-full sm:w-auto"
							aria-current={isActiveOrganizationSubroute('/organization/overview') ? 'page' : undefined}
							onclick={(event) => {
								event.preventDefault();
								goToOrganizationSubroute('/organization/overview');
							}}
						>
							Overview
						</Button>
						<Button
							href="/organization/access"
							variant={isActiveOrganizationSubroute('/organization/access') ? 'default' : 'outline'}
							class="w-full sm:w-auto"
							aria-current={isActiveOrganizationSubroute('/organization/access') ? 'page' : undefined}
							onclick={(event) => {
								event.preventDefault();
								goToOrganizationSubroute('/organization/access');
							}}
						>
							Access
						</Button>
						{#if currentOrganization.isAdmin}
							<Button
								href="/organization/members"
								variant={isActiveOrganizationSubroute('/organization/members') ? 'default' : 'outline'}
								class="w-full sm:w-auto"
								aria-current={isActiveOrganizationSubroute('/organization/members') ? 'page' : undefined}
								onclick={(event) => {
									event.preventDefault();
									goToOrganizationSubroute('/organization/members');
								}}
							>
								Members
							</Button>
						{/if}
					</ButtonGroup.Root>
				</nav>
			</Card.Content>
		</Card.Root>

		{@render children()}
	{/if}
</main>
