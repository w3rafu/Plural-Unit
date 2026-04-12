<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import DirectoryMemberProfile from '$lib/components/directory/DirectoryMemberProfile.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { getMemberInitials } from '$lib/models/memberManagementHelpers';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	const memberId = $derived(page.params.memberId ?? '');
	const member = $derived(
		currentOrganization.members.find((entry) => entry.profile_id === memberId) ?? null
	);
	const existingThreadId = $derived(
		member ? currentMessages.getThreadIdForProfile(member.profile_id) : null
	);
	let isOpeningConversation = $state(false);

	function goBackToDirectory() {
		void goto('/directory', { noScroll: true, keepFocus: true });
	}

	async function messageMember() {
		if (!member) {
			return;
		}

		isOpeningConversation = true;

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
			isOpeningConversation = false;
		}
	}
</script>

<PageHeader
	preset="detail"
	title={member?.name || 'Member profile'}
	avatarText={member ? getMemberInitials(member) : ''}
	avatarImageUrl={member?.avatar_url || ''}
	backLabel="Directory"
	onBack={goBackToDirectory}
/>

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<Card.Root size="sm" class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		<Card.Content class="min-h-0 flex-1 overflow-auto p-4">
			<DirectoryMemberProfile
				{member}
				currentUserId={currentUser.details.id}
				isLoading={currentOrganization.isLoadingMembers}
				hasConversation={Boolean(existingThreadId)}
				{isOpeningConversation}
				onMessage={messageMember}
			/>
		</Card.Content>
	</Card.Root>
</main>