<!--
  Home page — profile summary + navigation links.
-->
<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { computeAvatarInitials } from '$lib/components/profile/avatarUploadModel';
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

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});

	const homeAvatarInitials = $derived(
		computeAvatarInitials(currentUser.details.name, currentUser.details.email, 'Profile')
	);
</script>

<PageHeader
	title="Plural Unit"
	actions={homeActions}
/>

<main class="flex flex-col gap-6">
	<Card.Root class="border-border/70 bg-card/80">
		<Card.Header class="gap-4 border-b border-border/70">
			<div class="flex items-center gap-4">
				{#if currentUser.details.avatar_url}
					<img
						src={currentUser.details.avatar_url}
						alt={`${currentUser.details.name || 'Member'} profile`}
						class="size-14 rounded-full border border-border/70 object-cover shadow-sm"
					/>
				{:else}
					<div
						class="flex size-14 items-center justify-center rounded-full bg-muted text-base font-semibold tracking-tight text-foreground"
						aria-hidden="true"
					>
						{homeAvatarInitials}
					</div>
				{/if}

				<div class="space-y-1">
					<Card.Title class="text-lg font-semibold tracking-tight">Account overview</Card.Title>
					<Card.Description>The essentials tied to your current organization and role.</Card.Description>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="space-y-5">
			<div class="grid gap-3 sm:grid-cols-3">
				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Name
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{currentUser.details.name || 'Not set'}
					</p>
				</div>

				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Organization
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{currentOrganization.organization?.name ?? 'Not connected'}
					</p>
				</div>

				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Members
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{currentOrganization.memberCount === null ? '—' : currentOrganization.memberCount}
					</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary">{currentOrganization.membership?.role ?? 'member'}</Badge>
				{#if currentUser.details.email}
					<Badge variant="outline">{currentUser.details.email}</Badge>
				{/if}
			</div>
		</Card.Content>

		<Card.Footer class="border-t border-border/70 pt-4">
			<Button variant="outline" onclick={() => currentUser.logout()}>Sign out</Button>
		</Card.Footer>
	</Card.Root>
</main>
