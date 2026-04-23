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

<ProfileSection />

<ProfileDetailsCard />
<ProfileNotificationPreferencesCard />
<ProfileSecurityCard />

<ProfileDangerZoneCard />

<Card.Root size="sm" class="border-transparent bg-muted/10 shadow-none">
	<Card.Content class="flex items-center justify-between p-3.5">
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
