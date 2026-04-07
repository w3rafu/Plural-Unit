<!--
  Home page — profile summary + navigation links.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Item from '$lib/components/ui/item';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	const homeActions = $derived.by(() => [
		{ id: 'home-hub', label: 'Hub', href: '/hub' },
		{ id: 'home-profile', label: 'Profile', href: '/profile' },
		{ id: 'home-organization', label: 'Organization', href: '/organization' },
		...(currentOrganization.isAdmin
			? [{ id: 'home-manage', label: 'Manage hub', href: '/hub/manage' }]
			: [])
	]);
</script>

<PageHeader title="Plural Unit" subtitle="Privacy-first communication hub for organizations" actions={homeActions} />

<main class="flex flex-col gap-6">
	<Item.Root variant="outline">
		<Item.Content>
			<Item.Title>Profile</Item.Title>
			<Item.Description><strong>Name:</strong> {currentUser.details.name || '(not set)'}</Item.Description>
			<Item.Description><strong>Organization:</strong> <a href="/organization">{currentOrganization.organization?.name ?? '—'}</a></Item.Description>
			<Item.Description>
				<strong>Role:</strong> <span class="rounded-4xl bg-stone-200 p-2">{currentOrganization.membership?.role ?? '—'}</span>
			</Item.Description>
		</Item.Content>
	</Item.Root>
	<Button class="w-fit" variant="outline" onclick={() => currentUser.logout()}>Sign out</Button>
</main>
