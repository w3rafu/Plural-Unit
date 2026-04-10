<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ProfileSection from '$lib/components/profile/ProfileSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';

	let { children } = $props();

	const profilePath = $derived(page.url.pathname);

	function isActiveProfileSubroute(pathname: string) {
		return profilePath === pathname;
	}

	function goHome() {
		void goto('/');
	}

	function goToProfileSubroute(pathname: string) {
		void goto(pathname, { noScroll: true, keepFocus: true });
	}
</script>

<PageHeader title="Profile" subtitle="Member details and security" backLabel="Home" onBack={goHome} />

<main class="flex flex-col gap-4">
	<ProfileSection />

	<Card.Root class="border-border/70 bg-card/80">
		<Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<p class="text-sm font-medium text-foreground">Choose a section</p>
				<p class="text-sm text-muted-foreground">Switch between profile details and security settings.</p>
			</div>

			<ButtonGroup.Root class="w-full sm:w-auto">
				<Button
					type="button"
					variant={isActiveProfileSubroute('/profile/details') ? 'default' : 'outline'}
					class="w-full sm:w-auto"
					onclick={() => goToProfileSubroute('/profile/details')}
				>
					Details
				</Button>
				<Button
					type="button"
					variant={isActiveProfileSubroute('/profile/security') ? 'default' : 'outline'}
					class="w-full sm:w-auto"
					onclick={() => goToProfileSubroute('/profile/security')}
				>
					Security
				</Button>
			</ButtonGroup.Root>
		</Card.Content>
	</Card.Root>

	{@render children()}
</main>
