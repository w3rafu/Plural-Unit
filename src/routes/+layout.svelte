<script lang="ts">
	import './layout.css';
	import AuthGate from '$lib/components/auth/AuthGate.svelte';
  import Header from '$lib/components/ui/Header.svelte';
  import BottomNav from '$lib/components/ui/BottomNav.svelte';

	let { children } = $props();
</script>

<!--
  Root layout — wraps every page with the AuthGate.

  The AuthGate handles login, name onboarding, and organization
  onboarding before any page content is shown.
-->
<div class="min-h-screen">
  <div class="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 p-4">
    <Header />
    <div class="flex-1">
      <AuthGate>{@render children()}</AuthGate>
    </div>
    <BottomNav />
  </div>
</div>
