<script lang="ts">
	import DemoMessagesWorkspace from '$lib/components/messages/DemoMessagesWorkspace.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { cloneUiPreviewThreads, uiPreviewFixtures } from '$lib/demo/uiPreviewFixtures';
</script>

<PageHeader
	preset="section"
	title="Messages demo"
	subtitle={`Fixture-backed conversations for ${uiPreviewFixtures.organizationName}.`}
/>

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<DemoMessagesWorkspace getInitialThreads={cloneUiPreviewThreads} />
</main>