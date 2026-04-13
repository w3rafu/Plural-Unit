<script lang="ts">
	import DirectoryRoster from '$lib/components/directory/DirectoryRoster.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { uiPreviewFixtures } from '$lib/demo/uiPreviewFixtures';
</script>

<PageHeader
	preset="section"
	title="Directory demo"
	subtitle={`Fixture roster for ${uiPreviewFixtures.organizationName}.`}
/>

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<DirectoryRoster
		members={uiPreviewFixtures.members}
		currentUserId={uiPreviewFixtures.currentUserProfileId}
		sectionTitle="Fixture directory"
		detailPathBase="/demo/directory"
		detailLabel="Open detail"
		tableCaption="Fixture member directory."
	/>
</main>