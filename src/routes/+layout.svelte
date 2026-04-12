<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import AuthGate from '$lib/components/auth/AuthGate.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import BottomNav from '$lib/components/ui/BottomNav.svelte';
	import Toaster from '$lib/components/ui/Toaster.svelte';
	import UnsavedChangesGuard from '$lib/components/ui/UnsavedChangesGuard.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { pageHeader } from '$lib/stores/pageHeader.svelte';

	let { children } = $props();

	const shouldRenderHeader = $derived(
		currentUser.hasResolvedSession && (!currentUser.isLoggedIn || pageHeader.hasRegisteredHeader)
	);

	// Load messages early so the unread badge is visible before navigating to /messages.
	let messagesLoadedForUserId = '';
	$effect(() => {
		const userId = currentUser.isLoggedIn ? currentUser.details.id : '';
		if (!userId || messagesLoadedForUserId === userId) return;
		messagesLoadedForUserId = userId;
		void currentMessages.loadForUser(userId);
	});
</script>

<ModeWatcher defaultMode="dark" themeColors={{ dark: '#09090b', light: '#fafafa' }} />
<UnsavedChangesGuard />

<!--
  Root layout — wraps every page with the AuthGate.

  The AuthGate handles login, name onboarding, and organization
  onboarding before any page content is shown.
-->
<div class="flex h-dvh min-h-dvh flex-col overflow-hidden">
	<div class="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden px-4">
		<div class="z-30 flex-none pt-2" style:min-height={'4.85rem'}>
			{#if shouldRenderHeader}
				<Header />
			{/if}
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3 sm:py-4">
			<AuthGate>{@render children()}</AuthGate>
		</div>
		<BottomNav />
	</div>
	<Toaster />
</div>
