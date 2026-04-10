<!--
  NameOnboarding — collects the user's display name after first login.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
</script>

<section aria-label="Name onboarding" class="w-full max-w-lg">
	<Card.Root class="border-border/70 bg-card/95">
		<Card.Header class="gap-2 border-b border-border/70">
			<Card.Title class="text-lg font-semibold tracking-tight">What should we call you?</Card.Title>
			<Card.Description>This is the name other members will see in shared spaces.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-5">
			<Field.Field>
				<Field.Content>
					<Field.Label for="display-name">Display name</Field.Label>
					<Field.Description>Use the name you want to appear in your organization.</Field.Description>
					<Input id="display-name" type="text" bind:value={authBoundary.onboardingName} />
				</Field.Content>
			</Field.Field>

			<div class="flex justify-start">
				<Button onclick={() => authBoundary.submitName()} disabled={currentUser.isLoggingIn}>
					Continue
				</Button>
			</div>

			{#if authBoundary.onboardingFeedback}
				<p
					role="alert"
					class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
				>
					{authBoundary.onboardingFeedback}
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</section>
