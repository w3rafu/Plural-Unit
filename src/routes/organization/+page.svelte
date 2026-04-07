<!--
  Organization page — view org details, manage invitations, share join code.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let inviteEmail = $state('');
	let invitePhone = $state('');
	let inviteMethod = $state<'email' | 'phone'>('email');
	let inviteFeedback = $state('');

	onMount(() => {
		if (currentOrganization.isAdmin) {
			currentOrganization.loadInvitations();
			currentOrganization.loadMemberCount();
		}
	});

	async function sendInvite() {
		inviteFeedback = '';
		const contact = inviteMethod === 'email'
			? { email: inviteEmail.trim() }
			: { phone: invitePhone.trim() };

		if (inviteMethod === 'email' && !inviteEmail.trim()) {
			inviteFeedback = 'Enter an email.';
			return;
		}
		if (inviteMethod === 'phone' && !invitePhone.trim()) {
			inviteFeedback = 'Enter a phone number.';
			return;
		}

		try {
			await currentOrganization.sendInvitation(contact);
			inviteEmail = '';
			invitePhone = '';
		} catch (e) {
			inviteFeedback = e instanceof Error ? e.message : 'Failed to send invitation.';
		}
	}

	async function regenerateCode() {
		try {
			await currentOrganization.regenerateCode();
		} catch (e) {
			inviteFeedback = e instanceof Error ? e.message : 'Failed to regenerate code.';
		}
	}
</script>

<main>
	<h1>Organization</h1>
	<p><a href="/">← Home</a></p>

	{#if !currentOrganization.organization}
		<p>No organization found.</p>
	{:else}
		<section aria-label="Organization details">
			<p>Name: {currentOrganization.organization.name}</p>
			<p>Join code: <code>{currentOrganization.organization.join_code}</code></p>
			{#if currentOrganization.memberCount !== null}
				<p>Members: {currentOrganization.memberCount}</p>
			{/if}
		</section>

		{#if currentOrganization.isAdmin}
			<section aria-label="Join code">
				<h2>Join code</h2>
				<p>Share this code with people who want to join:</p>
				<code>{currentOrganization.organization.join_code}</code>
				<button onclick={regenerateCode} disabled={currentOrganization.isMutating}>
					Regenerate code
				</button>
			</section>

			<section aria-label="Invite members">
				<h2>Invite members</h2>

				<fieldset>
					<legend>Send via</legend>
					<label>
						<input type="radio" name="inviteMethod" value="email"
							checked={inviteMethod === 'email'}
							onchange={() => inviteMethod = 'email'} />
						Email
					</label>
					<label>
						<input type="radio" name="inviteMethod" value="phone"
							checked={inviteMethod === 'phone'}
							onchange={() => inviteMethod = 'phone'} />
						Phone
					</label>
				</fieldset>

				{#if inviteMethod === 'email'}
					<label>
						Email
						<input type="email" bind:value={inviteEmail} />
					</label>
				{:else}
					<label>
						Phone
						<input type="tel" bind:value={invitePhone} />
					</label>
				{/if}

				<button onclick={sendInvite} disabled={currentOrganization.isMutating}>
					Send invitation
				</button>

				{#if inviteFeedback}
					<p role="alert">{inviteFeedback}</p>
				{/if}
			</section>

			{#if currentOrganization.invitations.length > 0}
				<section aria-label="Pending invitations">
					<h2>Pending invitations</h2>
					<ul>
						{#each currentOrganization.invitations as inv (inv.id)}
							<li>{inv.email ?? inv.phone} — {inv.status}</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/if}
	{/if}
</main>
