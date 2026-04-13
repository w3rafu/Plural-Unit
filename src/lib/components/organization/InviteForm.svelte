<!--
  InviteForm — send email or phone invitations to new members.

  Manages its own form state, unsaved-changes tracking, and validation.
  Calls currentOrganization.sendInvitation() on submit.
-->
<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';
	import { onDestroy } from 'svelte';

	let inviteEmail = $state('');
	let invitePhone = $state('');
	let inviteMethod = $state<'email' | 'phone'>('email');
	const UNSAVED_CHANGES_KEY = 'organization-access';
	const initialInviteSnapshot = createDirtySnapshot({
		method: 'email',
		email: '',
		phone: ''
	});
	const currentInviteSnapshot = $derived.by(() =>
		createDirtySnapshot({
			method: inviteMethod,
			email: inviteEmail.trim(),
			phone: invitePhone.trim()
		})
	);
	const isInviteDirty = $derived(currentInviteSnapshot !== initialInviteSnapshot);

	$effect(() => {
		unsavedChanges.set(UNSAVED_CHANGES_KEY, 'organization access', isInviteDirty);
	});

	onDestroy(() => {
		unsavedChanges.clear(UNSAVED_CHANGES_KEY);
	});

	async function sendInvite() {
		const contact = inviteMethod === 'email'
			? { email: inviteEmail.trim() }
			: { phone: invitePhone.trim() };

		if (inviteMethod === 'email' && !inviteEmail.trim()) {
			toast({
				title: 'Email required',
				description: 'Enter an email before sending the invitation.',
				variant: 'error'
			});
			return;
		}
		if (inviteMethod === 'phone' && !invitePhone.trim()) {
			toast({
				title: 'Phone required',
				description: 'Enter a phone number before sending the invitation.',
				variant: 'error'
			});
			return;
		}

		try {
			await currentOrganization.sendInvitation(contact);
			inviteEmail = '';
			invitePhone = '';
			toast({
				title: 'Invitation sent',
				description: inviteMethod === 'email'
					? 'The invitation was sent by email.'
					: 'The invitation was sent by phone.',
				variant: 'success'
			});
		} catch (e) {
			toast({
				title: 'Could not send invitation',
				description: e instanceof Error ? e.message : 'Failed to send invitation.',
				variant: 'error'
			});
		}
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<div class="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Invite members</Card.Title>
				<Card.Description>Send an email or phone invitation to bring someone in directly.</Card.Description>
			</div>
			<Badge variant="outline">{currentOrganization.invitations.length} pending</Badge>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<form
			class="space-y-4"
			onsubmit={(event) => {
				event.preventDefault();
				sendInvite();
			}}
		>
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
						<Field.Description>Use the address they can access right away.</Field.Description>
						<Input id="invite-email" type="email" bind:value={inviteEmail} />
					</Field.Content>
				</Field.Field>
			{:else}
				<Field.Field>
					<Field.Content>
						<Field.Label for="invite-phone">Phone</Field.Label>
						<Field.Description>Use the number where they should receive the invite.</Field.Description>
						<Input id="invite-phone" type="tel" bind:value={invitePhone} />
					</Field.Content>
				</Field.Field>
			{/if}

			<div class="flex justify-start">
				<Button type="submit" disabled={currentOrganization.isMutating}>
					{currentOrganization.isMutating ? 'Sending...' : 'Send invitation'}
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
