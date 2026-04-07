<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Item from '$lib/components/ui/item';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
</script>

<Item.Root variant="outline">
	<Item.Content>
		<Item.Title>Profile details</Item.Title>
		<Item.Description>Name: {currentUser.details.name || '(not set)'}</Item.Description>
		<Item.Description>Email: {currentUser.details.email || '—'}</Item.Description>
		<Item.Description>Phone: {currentUser.details.phone_number || '—'}</Item.Description>
		<Item.Description>Organization: {currentOrganization.organization?.name ?? '—'}</Item.Description>
		<Item.Description>Role: {currentOrganization.membership?.role ?? '—'}</Item.Description>
	</Item.Content>
	<Item.Actions class="justify-end">
		<Button href="/hub" variant="ghost" size="sm">Hub</Button>
		<Button href="/organization" variant="ghost" size="sm">Organization</Button>
		{#if currentOrganization.isAdmin}
			<Button href="/hub/manage" variant="ghost" size="sm">Manage hub</Button>
		{/if}
		<Button variant="outline" size="sm" onclick={() => currentUser.logout()}>Sign out</Button>
	</Item.Actions>
</Item.Root>
