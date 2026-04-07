<!--
  Root layout — wraps every page with the AuthGate.

  The AuthGate handles login, name onboarding, and organization
  onboarding before any page content is shown.
-->
<script lang="ts">
	import AuthGate from '$lib/components/auth/AuthGate.svelte';

	let { children } = $props();
</script>

<AuthGate>
	{@render children()}
</AuthGate>
