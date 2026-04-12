<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
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

	const organizationSections = $derived.by(() => [
		{ href: '/organization/overview', label: 'Overview' },
		{ href: '/organization/access', label: 'Access' },
		...(currentOrganization.isAdmin ? [{ href: '/organization/members', label: 'Members' }] : [])
	]);
</script>

<PageHeader preset="section" title="Organization" subtitle="Join code, invitations, and membership" />

<main class="flex flex-col gap-4">
	{#if !currentOrganization.organization}
		<Card.Root class="border-dashed border-border/70 bg-muted/20">
			<Card.Content>
				<p class="text-sm text-muted-foreground">No organization is connected to this account yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="border-border/70 bg-card">
			<Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-1">
					<p class="text-sm font-medium text-foreground">Choose a section</p>
					<p class="text-sm text-muted-foreground">
						Switch between overview, access tools, and member visibility.
					</p>
				</div>

				<nav aria-label="Organization sections" class="w-full">
					<div class={currentOrganization.isAdmin ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2'}>
						{#each organizationSections as section (section.href)}
							<Button
								href={section.href}
								size="sm"
								variant={isActiveOrganizationSubroute(section.href) ? 'default' : 'outline'}
								class="w-full min-w-0 justify-center px-3 max-sm:text-[0.82rem]"
								aria-current={isActiveOrganizationSubroute(section.href) ? 'page' : undefined}
								onclick={(event) => {
									event.preventDefault();
									goToOrganizationSubroute(section.href);
								}}
							>
								{section.label}
							</Button>
						{/each}
					</div>
				</nav>
			</Card.Content>
		</Card.Root>

		{@render children()}
	{/if}
</main>
