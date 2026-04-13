<script lang="ts">
	import { goto } from '$app/navigation';
	import DirectoryRoster from '$lib/components/directory/DirectoryRoster.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	let openingThreadForProfileId = $state('');
	const isRefreshingDirectory = $derived(
		currentOrganization.isLoadingMembers && currentOrganization.members.length > 0
	);

	async function messageMember(member: OrganizationMember) {
		openingThreadForProfileId = member.profile_id;

		try {
			await currentMessages.openConversationForProfile(member.profile_id, currentUser.details.id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description:
					error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		} finally {
			openingThreadForProfileId = '';
		}
	}
</script>

<PageHeader preset="section" title="Directory" subtitle="Find people in your organization." />

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<DirectoryRoster
		members={currentOrganization.members}
		currentUserId={currentUser.details.id}
		detailPathBase="/directory"
		isLoading={currentOrganization.isLoadingMembers}
		isRefreshing={isRefreshingDirectory}
		onMessageMember={messageMember}
		{openingThreadForProfileId}
	/>
</main>