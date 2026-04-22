<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';

	let { children } = $props();
</script>

<PageHeader preset="section" title="Profile" subtitle="Account and preferences" />

<main class="mx-auto flex w-full max-w-3xl flex-col gap-4">
	{@render children()}
</main>
