<script lang="ts">
	import { LogOut } from '@lucide/svelte';
	import ProfileSection from '$lib/components/profile/ProfileSection.svelte';
	import ProfileDetailsCard from '$lib/components/profile/ProfileDetailsCard.svelte';
	import ProfileDangerZoneCard from '$lib/components/profile/ProfileDangerZoneCard.svelte';
	import ProfileNotificationPreferencesCard from '$lib/components/profile/ProfileNotificationPreferencesCard.svelte';
	import ProfileSecurityCard from '$lib/components/profile/ProfileSecurityCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	let isSigningOut = $state(false);

	async function handleSignOut() {
		isSigningOut = true;
		await currentUser.logout();
	}
</script>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-3 lg:gap-3.5">
	<ProfileSection />

	<div class="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_19.5rem] xl:items-start">
		<ProfileDetailsCard />

		<div class="space-y-3 xl:sticky xl:top-24">
			<ProfileSecurityCard />
		</div>
	</div>

	<ProfileNotificationPreferencesCard />

	<Card.Root size="sm" class="border-border/70 bg-muted/10 shadow-none">
		<Card.Content class="flex flex-wrap items-center justify-between gap-3 p-3.5">
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

	<ProfileDangerZoneCard />
</main>
