<!--
  OrganizationOnboarding — create, join, or accept an invite.

  The user can either:
  1. Create a new organization (becomes admin)
  2. Join with a short code
  3. Paste an invitation token
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
</script>

<section aria-label="Organization onboarding" class="w-full max-w-2xl">
	<Card.Root class="border-border/70 bg-card/95">
		<Card.Header class="gap-2 border-b border-border/70">
			<Card.Title class="text-lg font-semibold tracking-tight">Join or create an organization</Card.Title>
			<Card.Description>Choose how you want to connect this account to a group.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-5">
			<Field.Set disabled={currentOrganization.isMutating}>
				<Field.Legend class="sr-only">How do you want to join?</Field.Legend>
				<RadioGroup.Root bind:value={authBoundary.orgMode} name="orgMode" class="grid gap-3">
					<Field.Field orientation="horizontal" class="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
						<RadioGroup.Item id="org-mode-create" value="create" />
						<Field.Content>
							<Field.Label for="org-mode-create" class="font-normal">Create new</Field.Label>
							<Field.Description>Start a new organization and become the admin.</Field.Description>
						</Field.Content>
					</Field.Field>
					<Field.Field orientation="horizontal" class="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
						<RadioGroup.Item id="org-mode-join" value="join" />
						<Field.Content>
							<Field.Label for="org-mode-join" class="font-normal">Use join code</Field.Label>
							<Field.Description>Join with a short code shared by an admin.</Field.Description>
						</Field.Content>
					</Field.Field>
					<Field.Field orientation="horizontal" class="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
						<RadioGroup.Item id="org-mode-invite" value="invite" />
						<Field.Content>
							<Field.Label for="org-mode-invite" class="font-normal">Invitation token</Field.Label>
							<Field.Description>Paste the invite token you received.</Field.Description>
						</Field.Content>
					</Field.Field>
				</RadioGroup.Root>
			</Field.Set>

			<form
				class="space-y-5"
				onsubmit={(event) => {
					event.preventDefault();
					authBoundary.submitOrganization();
				}}
			>
				<div class="space-y-1">
					<h2 class="text-lg font-semibold tracking-tight text-foreground">
						{#if authBoundary.orgMode === 'create'}
							Create your organization
						{:else if authBoundary.orgMode === 'join'}
							Join with a code
						{:else}
							Accept your invitation
						{/if}
					</h2>
					<p class="text-sm text-muted-foreground">
						{#if authBoundary.orgMode === 'create'}
							Set up the shared space your members will use.
						{:else if authBoundary.orgMode === 'join'}
							Enter the short code shared by an organization admin.
						{:else}
							Paste the invitation token exactly as it was shared with you.
						{/if}
					</p>
				</div>

				{#if authBoundary.orgMode === 'create'}
					<Field.Field>
						<Field.Content>
							<Field.Label for="organization-name">Organization name</Field.Label>
							<Field.Description>Choose the name members will recognize immediately.</Field.Description>
							<Input id="organization-name" type="text" bind:value={authBoundary.orgName} />
						</Field.Content>
					</Field.Field>
				{:else if authBoundary.orgMode === 'join'}
					<Field.Field>
						<Field.Content>
							<Field.Label for="join-code">Join code</Field.Label>
							<Field.Description>Use the code shared by your organization admin.</Field.Description>
							<Input id="join-code" type="text" bind:value={authBoundary.orgJoinCode} />
						</Field.Content>
					</Field.Field>
				{:else}
					<Field.Field>
						<Field.Content>
							<Field.Label for="invite-token">Invitation token</Field.Label>
							<Field.Description>Paste the invitation token exactly as you received it.</Field.Description>
							<Input id="invite-token" type="text" bind:value={authBoundary.orgInviteToken} />
						</Field.Content>
					</Field.Field>
				{/if}

				<div class="flex justify-start pt-1">
					<Button type="submit" disabled={currentOrganization.isMutating}>
						{#if authBoundary.orgMode === 'create'}
							Create organization
						{:else if authBoundary.orgMode === 'join'}
							Join organization
						{:else}
							Accept invitation
						{/if}
					</Button>
				</div>

				{#if authBoundary.orgFeedback}
					<p
						role="alert"
						class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
					>
						{authBoundary.orgFeedback}
					</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</section>
