<!--
  NameOnboarding — collects the user's display name after first login.
-->
<script lang="ts">
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
</script>

<section aria-label="Name onboarding">
	<h2>What should we call you?</h2>
	<label>
		Display name
		<input type="text" bind:value={authBoundary.onboardingName} />
	</label>
	<button onclick={() => authBoundary.submitName()} disabled={currentUser.isLoading}>
		Continue
	</button>
	{#if authBoundary.onboardingFeedback}
		<p role="alert">{authBoundary.onboardingFeedback}</p>
	{/if}
</section>
