<!--
  OrganizationOnboarding — create, join, or accept an invite.

  The user can either:
  1. Create a new organization (becomes admin)
  2. Join with a short code
  3. Paste an invitation token
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
</script>

<section aria-label="Organization onboarding">
	<h2>Join or create an organization</h2>

	<Field.Set>
		<Field.Legend>How do you want to join?</Field.Legend>
		<RadioGroup.Root bind:value={authBoundary.orgMode} name="orgMode" class="grid gap-2">
			<Field.Field orientation="horizontal">
				<RadioGroup.Item id="org-mode-create" value="create" />
				<Field.Content>
					<Field.Label for="org-mode-create" class="font-normal">Create new</Field.Label>
					<Field.Description>Start a new organization and become the admin.</Field.Description>
				</Field.Content>
			</Field.Field>
			<Field.Field orientation="horizontal">
				<RadioGroup.Item id="org-mode-join" value="join" />
				<Field.Content>
					<Field.Label for="org-mode-join" class="font-normal">Use join code</Field.Label>
					<Field.Description>Join with a short code shared by an admin.</Field.Description>
				</Field.Content>
			</Field.Field>
			<Field.Field orientation="horizontal">
				<RadioGroup.Item id="org-mode-invite" value="invite" />
				<Field.Content>
					<Field.Label for="org-mode-invite" class="font-normal">Invitation token</Field.Label>
					<Field.Description>Paste the invite token you received.</Field.Description>
				</Field.Content>
			</Field.Field>
		</RadioGroup.Root>
	</Field.Set>

	{#if authBoundary.orgMode === 'create'}
		<Field.Field>
			<Field.Content>
				<Field.Label for="organization-name">Organization name</Field.Label>
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
				<Input id="invite-token" type="text" bind:value={authBoundary.orgInviteToken} />
			</Field.Content>
		</Field.Field>
	{/if}

	<Button onclick={() => authBoundary.submitOrganization()} disabled={currentOrganization.isMutating}>
		{#if authBoundary.orgMode === 'create'}
			Create organization
		{:else if authBoundary.orgMode === 'join'}
			Join
		{:else}
			Accept invitation
		{/if}
	</Button>

	{#if authBoundary.orgFeedback}
		<p role="alert">{authBoundary.orgFeedback}</p>
	{/if}
</section>
