<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let { children } = $props();
</script>

<PageHeader preset="section" title="Organization" subtitle="Join code, invitations, and membership" />

<main class="page-stack">
	{#if !currentOrganization.organization}
		<Card.Root class="border-dashed border-border/70 bg-muted/20">
			<Card.Content>
				<p class="text-sm text-muted-foreground">No organization is connected to this account yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		{@render children()}
	{/if}
</main>
