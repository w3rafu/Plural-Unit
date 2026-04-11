<!--
  AuthGate — top-level access controller.

  Renders the correct surface based on auth/onboarding state:
  1. Not logged in → LoginForm
  2. Logged in, no name → NameOnboarding
  3. Logged in, no organization → OrganizationOnboarding
  4. Fully onboarded → slot content (the rest of the app)
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import LoginForm from './LoginForm.svelte';
	import NameOnboarding from './NameOnboarding.svelte';
	import OrganizationOnboarding from './OrganizationOnboarding.svelte';

	let { children } = $props();
</script>

{#if !currentUser.isLoggedIn || authBoundary.isPasswordRecovery}
	<LoginForm />
{:else}
	{@render children()}
	{#if authBoundary.needsNameOnboarding}
		<div
			class="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label="Complete your profile"
		>
			<div class="flex min-h-full items-center justify-center">
				<NameOnboarding />
			</div>
		</div>
	{:else if authBoundary.needsOrganizationOnboarding}
		<div
			class="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label="Connect to an organization"
		>
			<div class="flex min-h-full items-center justify-center">
				<OrganizationOnboarding />
			</div>
		</div>
	{:else if currentOrganization.isLoading && !currentOrganization.isMember}
		<div
			class="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm"
			role="status"
			aria-live="polite"
		>
			<div class="flex min-h-full items-center justify-center">
				<Card.Root class="w-full max-w-md border-border/70 bg-card/95">
					<Card.Header class="gap-2 border-b border-border/70">
						<Card.Title class="text-lg font-semibold tracking-tight">Loading organization</Card.Title>
						<Card.Description>We’re checking your membership and getting the next screen ready.</Card.Description>
					</Card.Header>
				</Card.Root>
			</div>
		</div>
	{/if}
{/if}
