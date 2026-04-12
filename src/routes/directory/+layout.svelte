<script lang="ts">
	import { onMount } from 'svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let { children } = $props();

	onMount(() => {
		if (!currentOrganization.organization) {
			return;
		}

		void currentOrganization.loadMembers();
	});
</script>

<div class="flex h-full min-h-0 flex-col">
	{@render children()}
</div>