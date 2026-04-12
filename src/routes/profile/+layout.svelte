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

	const profileSections = [
		{ href: '/profile/details', label: 'Details' },
		{ href: '/profile/security', label: 'Security' }
	] as const;

	async function handleSignOut() {
		isSigningOut = true;
		await currentUser.logout();
	}
</script>

<PageHeader preset="section" title="Profile" subtitle="Member details and security" />

<main class="page-stack">
	<ProfileSection />

	<Card.Root size="sm" class="border-border/70 bg-card">
		<Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<p class="text-sm font-medium text-foreground">Choose a section</p>
				<p class="text-sm text-muted-foreground">Switch between profile details and security settings.</p>
			</div>

			<nav aria-label="Profile sections" class="w-full">
				<ButtonGroup.Root class="segmented-control flex w-full items-stretch">
					{#each profileSections as section (section.href)}
						<Button
							href={section.href}
							size="sm"
							variant="ghost"
							class="segmented-control__button min-w-0 flex-1 justify-center px-3 max-sm:text-[0.82rem]"
							aria-current={isActiveProfileSubroute(section.href) ? 'page' : undefined}
							onclick={(event) => {
								event.preventDefault();
								goToProfileSubroute(section.href);
							}}
						>
							{section.label}
						</Button>
					{/each}
				</ButtonGroup.Root>
			</nav>
		</Card.Content>
	</Card.Root>

	{@render children()}

	<Card.Root size="sm" class="border-border/70 bg-card">
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
