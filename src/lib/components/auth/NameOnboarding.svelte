<!--
  NameOnboarding — collects the user's display name after first login.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
</script>

<section aria-label="Name onboarding">
	<h2>What should we call you?</h2>
	<Field.Field>
		<Field.Content>
			<Field.Label for="display-name">Display name</Field.Label>
			<Field.Description>This is how your name appears to other members.</Field.Description>
			<Input id="display-name" type="text" bind:value={authBoundary.onboardingName} />
		</Field.Content>
	</Field.Field>
	<Button onclick={() => authBoundary.submitName()} disabled={currentUser.isLoggingIn}>
		Continue
	</Button>
	{#if authBoundary.onboardingFeedback}
		<p role="alert">{authBoundary.onboardingFeedback}</p>
	{/if}
</section>
