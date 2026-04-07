<!--
  AuthGate — top-level access controller.

  Renders the correct surface based on auth/onboarding state:
  1. Not logged in → LoginForm
  2. Logged in, no name → NameOnboarding
  3. Logged in, no organization → OrganizationOnboarding
  4. Fully onboarded → slot content (the rest of the app)
-->
<script lang="ts">
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import LoginForm from './LoginForm.svelte';
	import NameOnboarding from './NameOnboarding.svelte';
	import OrganizationOnboarding from './OrganizationOnboarding.svelte';

	let { children } = $props();

	const showOnboarding = $derived(
		authBoundary.needsNameOnboarding ||
		authBoundary.needsOrganizationOnboarding ||
		(currentOrganization.isLoading && !currentOrganization.isMember)
	);
</script>

{#if !currentUser.isLoggedIn}
	<LoginForm />
{:else}
	{@render children()}
	{#if authBoundary.needsNameOnboarding}
		<dialog open>
			<NameOnboarding />
		</dialog>
	{:else if authBoundary.needsOrganizationOnboarding}
		<dialog open>
			<OrganizationOnboarding />
		</dialog>
	{:else if currentOrganization.isLoading && !currentOrganization.isMember}
		<p>Loading organization...</p>
	{/if}
{/if}
