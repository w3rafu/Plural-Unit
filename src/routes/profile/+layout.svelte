<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';

	let { children } = $props();
</script>

<PageHeader preset="section" title="Profile" subtitle="Member details and security" />

<main class="page-stack">
	{@render children()}
</main>
