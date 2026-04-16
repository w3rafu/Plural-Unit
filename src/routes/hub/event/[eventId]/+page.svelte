<!--
  Event detail page — displays a single event with full context.

  Reads the eventId from route params, looks up the event in the
  currentHub store, and renders the detail card.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import EventDetailCard from '$lib/components/hub/member/EventDetailCard.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let { data } = $props();

	const event = $derived(currentHub.events.find((e) => e.id === data.eventId) ?? null);

	let loadedHubOrgId = '';
	let loadedMembersOrgId = '';

	async function loadHubData() {
		try {
			await currentHub.load();
		} catch {
			// currentHub captures the error for page-level UI.
		}
	}

	$effect(() => {
		const organizationId = currentOrganization.organization?.id ?? '';

		if (!organizationId) {
			loadedHubOrgId = '';
			loadedMembersOrgId = '';
			return;
		}

		if (loadedHubOrgId !== organizationId) {
			loadedHubOrgId = organizationId;
			void loadHubData();
		}

		if (
			currentOrganization.isAdmin &&
			loadedMembersOrgId !== organizationId &&
			!currentOrganization.isLoadingMembers
		) {
			loadedMembersOrgId = organizationId;
			void currentOrganization.loadMembers();
		}
	});

	function goBack() {
		void goto('/');
	}
</script>

<PageHeader
	title={event?.title ?? 'Event'}
	subtitle="Event detail"
	backLabel="Back to hub"
	onBack={goBack}
/>

<main class="page-stack">
	{#if currentHub.isLoading}
		<p class="text-sm text-muted-foreground">Loading event...</p>
	{:else if !event}
		<Card.Root class="border-destructive/30 bg-destructive/5">
			<Card.Content class="flex flex-wrap items-center gap-3 py-4">
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-foreground">Event not found</p>
					<p class="text-sm text-muted-foreground">
						This event may have been removed or is no longer available.
					</p>
				</div>
				<Button variant="outline" size="sm" href="/">Back to hub</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<EventDetailCard {event} />
	{/if}
</main>
