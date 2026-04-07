<!--
  Organization page — view org details, manage invitations, share join code.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import PendingInvitationsTable from '$lib/components/organization/PendingInvitationsTable.svelte';
	import * as Select from '$lib/components/ui/select';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
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

	function goHome() {
		void goto('/');
	}
</script>

<PageHeader title="Organization" subtitle="Join code, invitations, and membership" backLabel="Home" onBack={goHome} />

<main class="flex flex-col gap-4">
	{#if !currentOrganization.organization}
		<p>No organization found.</p>
	{:else}
		<Item.Group>
			<Item.Root variant="outline">
				<Item.Content>
					<Item.Title>Organization details</Item.Title>
					<Item.Description>Name: {currentOrganization.organization.name}</Item.Description>
					<Item.Description>Join code: <code>{currentOrganization.organization.join_code}</code></Item.Description>
					{#if currentOrganization.memberCount !== null}
						<Item.Description>Members: {currentOrganization.memberCount}</Item.Description>
					{/if}
				</Item.Content>
			</Item.Root>

			{#if currentOrganization.isAdmin}
				<Item.Root variant="outline">
					<Item.Content>
						<Item.Title>Join code</Item.Title>
						<Item.Description>Share this code with people who want to join:</Item.Description>
						<Item.Description><code>{currentOrganization.organization.join_code}</code></Item.Description>
						<Item.Actions>
							<Button onclick={regenerateCode} disabled={currentOrganization.isMutating}>
								Regenerate code
							</Button>
						</Item.Actions>
					</Item.Content>
				</Item.Root>

				<Item.Root variant="outline">
					<Item.Content>
						<Item.Title>Invite members</Item.Title>

						<Field.Field>
							<Field.Content>
								<Field.Label for="invite-method">Send via</Field.Label>
								<Field.Description>Choose how the invitation should be delivered.</Field.Description>
								<Select.Root type="single" bind:value={inviteMethod} name="inviteMethod">
									<Select.Trigger id="invite-method">
										{inviteMethod === 'email' ? 'Email' : 'Phone'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="email">Email</Select.Item>
										<Select.Item value="phone">Phone</Select.Item>
									</Select.Content>
								</Select.Root>
							</Field.Content>
						</Field.Field>

						{#if inviteMethod === 'email'}
							<Field.Field>
								<Field.Content>
									<Field.Label for="invite-email">Email</Field.Label>
									<Input id="invite-email" type="email" bind:value={inviteEmail} />
								</Field.Content>
							</Field.Field>
						{:else}
							<Field.Field>
								<Field.Content>
									<Field.Label for="invite-phone">Phone</Field.Label>
									<Input id="invite-phone" type="tel" bind:value={invitePhone} />
								</Field.Content>
							</Field.Field>
						{/if}

						<Item.Actions>
							<Button onclick={sendInvite} disabled={currentOrganization.isMutating}>
								Send invitation
							</Button>
						</Item.Actions>

						{#if inviteFeedback}
							<p role="alert">{inviteFeedback}</p>
						{/if}
					</Item.Content>
				</Item.Root>

				{#if currentOrganization.invitations.length > 0}
					<Item.Root variant="outline">
						<Item.Content>
							<Item.Title>Pending invitations</Item.Title>
							<PendingInvitationsTable invitations={currentOrganization.invitations} />
						</Item.Content>
					</Item.Root>
				{/if}
			{/if}
		</Item.Group>
	{/if}
</main>
