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

<OrganizationOverviewCard
	{sections}
	{activeSection}
	onSectionSelect={(section) => (activeSection = section)}
/>

{#if activeSection === 'access'}
	<OrganizationAccessCard />
{:else if activeSection === 'members'}
	<OrganizationMembersCard />
{/if}
