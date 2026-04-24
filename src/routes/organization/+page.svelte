<script lang="ts">
	import OrganizationOverviewCard from '$lib/components/organization/OrganizationOverviewCard.svelte';
	import OrganizationAccessCard from '$lib/components/organization/OrganizationAccessCard.svelte';
	import OrganizationMembersCard from '$lib/components/organization/OrganizationMembersCard.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	type OrgSection = 'access' | 'members';

	let activeSection = $state<OrgSection>('access');
	let initializedSectionForOrgId = $state('');

	let loadedMemberCountOrgId = '';
	let loadedInvitationsOrgId = '';
	let loadedMembersOrgId = '';
	let loadedDeletionRequestsOrgId = '';

	$effect(() => {
		if (!currentOrganization.organization) {
			activeSection = 'access';
			initializedSectionForOrgId = '';
			loadedMemberCountOrgId = '';
			loadedInvitationsOrgId = '';
			loadedMembersOrgId = '';
			loadedDeletionRequestsOrgId = '';
		}

		if (!currentOrganization.isAdmin) {
			activeSection = 'access';
			loadedInvitationsOrgId = '';
			loadedDeletionRequestsOrgId = '';
		}
	});

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId || !currentOrganization.isAdmin) {
			return;
		}

		if (initializedSectionForOrgId === organizationId) {
			return;
		}

		activeSection = 'members';
		initializedSectionForOrgId = organizationId;
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
	<div class="flex flex-col gap-1 rounded-2xl border border-border/60 bg-muted/10 px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-1.75">
		<div class="space-y-px">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Section</p>
			<p class="text-[0.7rem] text-muted-foreground">Move between membership and access controls.</p>
		</div>

		<nav aria-label="Organization sections" class="w-full sm:max-w-72">
			<div class="flex w-full items-stretch gap-1 rounded-full border border-border/70 bg-background/82 p-0.75 shadow-sm">
				{#each sections as section (section.id)}
					<button
						type="button"
						class={`h-7 min-w-0 flex-1 rounded-full px-3 text-center text-[0.78rem] font-medium transition-colors ${activeSection === section.id ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
						aria-current={activeSection === section.id ? 'page' : undefined}
						aria-pressed={activeSection === section.id}
						onclick={() => (activeSection = section.id)}
					>
						{section.label}
					</button>
				{/each}
			</div>
		</nav>
	</div>
{/if}

{#if activeSection === 'access'}
	<OrganizationAccessCard />
{:else if activeSection === 'members'}
	<OrganizationMembersCard />
{/if}
