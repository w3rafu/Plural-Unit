<!--
  OrganizationOnboarding — create, join, or accept an invite.

  The user can either:
  1. Create a new organization (becomes admin)
  2. Join with a short code
  3. Paste an invitation token
-->
<script lang="ts">
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
</script>

<section aria-label="Organization onboarding">
	<h2>Join or create an organization</h2>

	<fieldset>
		<legend>How do you want to join?</legend>
		<label>
			<input type="radio" name="orgMode" value="create"
				checked={authBoundary.orgMode === 'create'}
				onchange={() => authBoundary.setOrgMode('create')} />
			Create new
		</label>
		<label>
			<input type="radio" name="orgMode" value="join"
				checked={authBoundary.orgMode === 'join'}
				onchange={() => authBoundary.setOrgMode('join')} />
			Use join code
		</label>
		<label>
			<input type="radio" name="orgMode" value="invite"
				checked={authBoundary.orgMode === 'invite'}
				onchange={() => authBoundary.setOrgMode('invite')} />
			Invitation token
		</label>
	</fieldset>

	{#if authBoundary.orgMode === 'create'}
		<label>
			Organization name
			<input type="text" bind:value={authBoundary.orgName} />
		</label>
	{:else if authBoundary.orgMode === 'join'}
		<label>
			Join code
			<input type="text" bind:value={authBoundary.orgJoinCode} />
		</label>
	{:else}
		<label>
			Invitation token
			<input type="text" bind:value={authBoundary.orgInviteToken} />
		</label>
	{/if}

	<button onclick={() => authBoundary.submitOrganization()} disabled={currentOrganization.isMutating}>
		{#if authBoundary.orgMode === 'create'}
			Create organization
		{:else if authBoundary.orgMode === 'join'}
			Join
		{:else}
			Accept invitation
		{/if}
	</button>

	{#if authBoundary.orgFeedback}
		<p role="alert">{authBoundary.orgFeedback}</p>
	{/if}
</section>
