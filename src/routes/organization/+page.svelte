<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import OrganizationOverviewCard from '$lib/components/organization/OrganizationOverviewCard.svelte';
	import OrganizationAccessCard from '$lib/components/organization/OrganizationAccessCard.svelte';
	import OrganizationMembersCard from '$lib/components/organization/OrganizationMembersCard.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	type OrgSection = 'access' | 'members';

	let activeSection = $state<OrgSection>('access');

	let loadedMemberCountOrgId = '';
	let loadedInvitationsOrgId = '';
	let loadedMembersOrgId = '';
	let loadedDeletionRequestsOrgId = '';

	$effect(() => {
		if (!currentOrganization.organization) {
			loadedMemberCountOrgId = '';
			loadedInvitationsOrgId = '';
			loadedMembersOrgId = '';
			loadedDeletionRequestsOrgId = '';
		}

		if (!currentOrganization.isAdmin) {
			loadedInvitationsOrgId = '';
			loadedDeletionRequestsOrgId = '';
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
			activeSection === 'members' && currentOrganization.isAdmin
				? (currentOrganization.organization?.id ?? '')
				: '';

		if (!organizationId || loadedMembersOrgId === organizationId) {
			return;
		}

		loadedMembersOrgId = organizationId;
		void currentOrganization.loadMembers();
	});

	$effect(() => {
		const organizationId =
			activeSection === 'members' && currentOrganization.isAdmin
				? (currentOrganization.organization?.id ?? '')
				: '';

		if (!organizationId || loadedDeletionRequestsOrgId === organizationId) {
			return;
		}

		loadedDeletionRequestsOrgId = organizationId;
		void currentOrganization.loadPendingDeletionRequests();
	});

	const sections = $derived.by(() => {
		const base: Array<{ id: OrgSection; label: string }> = [
			{ id: 'access', label: 'Access' }
		];

		if (currentOrganization.isAdmin) {
			base.push({ id: 'members', label: 'Members' });
		}

		return base;
	});
</script>

<OrganizationOverviewCard />

{#if currentOrganization.isAdmin}
	<div class="flex flex-col gap-1.5 rounded-[1.15rem] border border-border/60 bg-muted/10 px-4 py-2.75 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
		<div class="space-y-0.5">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Section</p>
			<p class="text-[0.8rem] font-medium text-foreground">Review access or roster changes.</p>
		</div>

		<nav aria-label="Organization sections" class="w-full sm:max-w-sm">
			<ButtonGroup.Root class="segmented-control flex w-full items-stretch">
				{#each sections as section (section.id)}
					<Button
						size="sm"
						variant="ghost"
						class={`segmented-control__button h-8 min-w-0 flex-1 justify-center px-3 max-sm:text-[0.8rem] ${activeSection === section.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
						aria-current={activeSection === section.id ? 'page' : undefined}
						onclick={() => (activeSection = section.id)}
					>
						{section.label}
					</Button>
				{/each}
			</ButtonGroup.Root>
		</nav>
	</div>
{/if}

{#if activeSection === 'access'}
	<OrganizationAccessCard />
{:else if activeSection === 'members'}
	<OrganizationMembersCard />
{/if}
