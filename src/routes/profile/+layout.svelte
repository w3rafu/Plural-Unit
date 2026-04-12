<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { LogOut } from '@lucide/svelte';
	import ProfileSection from '$lib/components/profile/ProfileSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	let { children } = $props();

	const profilePath = $derived(page.url.pathname);

	function isActiveProfileSubroute(pathname: string) {
		return profilePath === pathname;
	}

	let isSigningOut = $state(false);

	function goToProfileSubroute(pathname: string) {
		void goto(pathname, { noScroll: true, keepFocus: true });
	}

	async function handleSignOut() {
		isSigningOut = true;
		await currentUser.logout();
	}
</script>

<PageHeader preset="section" title="Profile" subtitle="Member details and security" />

<main class="flex flex-col gap-4">
	<ProfileSection />

	<Card.Root class="border-border/70 bg-card">
		<Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<p class="text-sm font-medium text-foreground">Choose a section</p>
				<p class="text-sm text-muted-foreground">Switch between profile details and security settings.</p>
			</div>

			<nav aria-label="Profile sections" class="w-full sm:w-auto">
				<ButtonGroup.Root class="w-full sm:w-auto">
					<Button
						href="/profile/details"
						variant={isActiveProfileSubroute('/profile/details') ? 'default' : 'outline'}
						class="w-full sm:w-auto"
						aria-current={isActiveProfileSubroute('/profile/details') ? 'page' : undefined}
						onclick={(event) => {
							event.preventDefault();
							goToProfileSubroute('/profile/details');
						}}
					>
						Details
					</Button>
					<Button
						href="/profile/security"
						variant={isActiveProfileSubroute('/profile/security') ? 'default' : 'outline'}
						class="w-full sm:w-auto"
						aria-current={isActiveProfileSubroute('/profile/security') ? 'page' : undefined}
						onclick={(event) => {
							event.preventDefault();
							goToProfileSubroute('/profile/security');
						}}
					>
						Security
					</Button>
				</ButtonGroup.Root>
			</nav>
		</Card.Content>
	</Card.Root>

	{@render children()}

	<Card.Root class="border-border/70 bg-card">
		<Card.Content class="flex items-center justify-between p-4">
			<div class="space-y-1">
				<p class="text-sm font-medium text-foreground">Sign out</p>
				<p class="text-sm text-muted-foreground">End your current session.</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				disabled={isSigningOut}
				onclick={handleSignOut}
			>
				<LogOut class="mr-2 size-4" />
				{isSigningOut ? 'Signing out…' : 'Sign out'}
			</Button>
		</Card.Content>
	</Card.Root>
</main>
