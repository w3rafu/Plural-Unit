<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import DirectoryMemberProfile from '$lib/components/directory/DirectoryMemberProfile.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { getMemberInitials } from '$lib/models/memberManagementHelpers';
	import { getUiPreviewMember, uiPreviewFixtures } from '$lib/demo/uiPreviewFixtures';

	const memberId = $derived(page.params.memberId ?? '');
	const member = $derived(getUiPreviewMember(memberId));

	function goBackToDirectory() {
		void goto('/demo/directory', { noScroll: true, keepFocus: true });
	}
</script>

<PageHeader
	preset="detail"
	title={member?.name || 'Fixture member profile'}
	avatarText={member ? getMemberInitials(member) : ''}
	avatarImageUrl={member?.avatar_url || ''}
	backLabel="Demo directory"
	onBack={goBackToDirectory}
/>

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<Card.Root size="sm" class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		<Card.Content class="min-h-0 flex-1 overflow-auto p-4">
			<DirectoryMemberProfile
				{member}
				currentUserId={uiPreviewFixtures.currentUserProfileId}
				emptyTitle="Fixture member not found"
				emptyDescription="That sample profile is not available in the demo directory."
			/>
		</Card.Content>
	</Card.Root>
</main>