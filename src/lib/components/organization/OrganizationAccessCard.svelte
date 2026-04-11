<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import PendingInvitationsTable from '$lib/components/organization/PendingInvitationsTable.svelte';
	import ConfirmActionSheet from '$lib/components/ui/ConfirmActionSheet.svelte';
	import * as Select from '$lib/components/ui/select';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import type { OrganizationInvitation } from '$lib/models/organizationModel';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';
	import { onDestroy } from 'svelte';

	let inviteEmail = $state('');
	let invitePhone = $state('');
	let inviteMethod = $state<'email' | 'phone'>('email');
	let confirmationOpen = $state(false);
	let pendingInviteAction = $state<
		| {
				type: 'resend' | 'revoke';
				invitation: OrganizationInvitation;
		  }
		| null
	>(null);
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

	function openResendConfirmation(invitation: OrganizationInvitation) {
		pendingInviteAction = {
			type: 'resend',
			invitation
		};
		confirmationOpen = true;
	}

	function openRevokeConfirmation(invitation: OrganizationInvitation) {
		pendingInviteAction = {
			type: 'revoke',
			invitation
		};
		confirmationOpen = true;
	}

	function closeConfirmation() {
		pendingInviteAction = null;
	}

	const confirmationTitle = $derived.by(() => {
		if (!pendingInviteAction) return '';
		return pendingInviteAction.type === 'resend' ? 'Resend invitation?' : 'Revoke invitation?';
	});

	const confirmationDescription = $derived.by(() => {
		if (!pendingInviteAction) return '';

		const recipient =
			pendingInviteAction.invitation.email ?? pendingInviteAction.invitation.phone ?? 'this invite';

		return pendingInviteAction.type === 'resend'
			? `A new invitation token will be generated for ${recipient}.`
			: `${recipient} will no longer be able to use this pending invitation.`;
	});

	const confirmationDetails = $derived.by(() => {
		if (!pendingInviteAction) return [];

		const invitation = pendingInviteAction.invitation;
		const recipient = invitation.email ?? invitation.phone ?? 'Unknown recipient';
		const channel = invitation.email ? 'Email' : 'Phone';

		if (pendingInviteAction.type === 'resend') {
			return [
				`Recipient: ${recipient}`,
				`Delivery channel: ${channel}`,
				'The original pending invite will be refreshed with a new token and timestamp.'
			];
		}

		return [
			`Recipient: ${recipient}`,
			`Delivery channel: ${channel}`,
			'This action keeps the record for admins, but the invite will no longer be active.'
		];
	});

	const confirmationLabel = $derived.by(() => {
		if (!pendingInviteAction) return 'Confirm';
		return pendingInviteAction.type === 'resend' ? 'Resend invitation' : 'Revoke invitation';
	});

	const confirmationBusyLabel = $derived.by(() => {
		if (!pendingInviteAction) return 'Working...';
		return pendingInviteAction.type === 'resend' ? 'Resending...' : 'Revoking...';
	});

	const confirmationVariant = $derived.by(() =>
		pendingInviteAction?.type === 'revoke' ? 'destructive' : 'default'
	);

	async function confirmInviteAction() {
		if (!pendingInviteAction) {
			return;
		}

		const invitation = pendingInviteAction.invitation;
		const recipient = invitation.email ?? invitation.phone ?? 'this invite';

		if (pendingInviteAction.type === 'resend') {
			try {
				await currentOrganization.resendPendingInvitation(invitation.id);
				confirmationOpen = false;
				toast({
					title: 'Invitation refreshed',
					description: `A new invite token was generated for ${recipient}.`,
					variant: 'success'
				});
			} catch (error) {
				toast({
					title: 'Could not resend invitation',
					description: error instanceof Error ? error.message : 'Failed to resend the invitation.',
					variant: 'error'
				});
			}

			return;
		}

		try {
			await currentOrganization.revokePendingInvitation(invitation.id);
			confirmationOpen = false;
			toast({
				title: 'Invitation revoked',
				description: `The invitation for ${recipient} is no longer active.`,
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not revoke invitation',
				description: error instanceof Error ? error.message : 'Failed to revoke the invitation.',
				variant: 'error'
			});
		}
	}

	async function copyJoinCode() {
		const joinCode = currentOrganization.organization?.join_code;
		if (!joinCode) return;

		try {
			await navigator.clipboard.writeText(joinCode);
			toast({
				title: 'Join code copied',
				description: 'The join code is ready to paste.',
				variant: 'success'
			});
		} catch (e) {
			toast({
				title: 'Could not copy join code',
				description: e instanceof Error ? e.message : 'Could not copy the join code.',
				variant: 'error'
			});
		}
	}

	async function regenerateCode() {
		try {
			await currentOrganization.regenerateCode();
			toast({
				title: 'Join code updated',
				description: 'A new join code was generated.',
				variant: 'success'
			});
		} catch (e) {
			toast({
				title: 'Could not generate join code',
				description: e instanceof Error ? e.message : 'Failed to regenerate code.',
				variant: 'error'
			});
		}
	}
</script>

<ConfirmActionSheet
	bind:open={confirmationOpen}
	title={confirmationTitle}
	description={confirmationDescription}
	details={confirmationDetails}
	confirmLabel={confirmationLabel}
	confirmBusyLabel={confirmationBusyLabel}
	confirmVariant={confirmationVariant}
	isSubmitting={currentOrganization.isMutating}
	onConfirm={confirmInviteAction}
	onCancel={closeConfirmation}
/>

{#if currentOrganization.isAdmin}
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
			<Card.Root class="border-border/70 bg-card/80">
				<Card.Header class="gap-2 border-b border-border/70">
					<Card.Title class="text-lg font-semibold tracking-tight">Join code</Card.Title>
					<Card.Description>Share this when someone should be able to join without a direct invite.</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-5">
					<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-4">
						<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
							Active code
						</p>
						<p class="mt-2 font-mono text-2xl font-semibold tracking-[0.28em] text-foreground">
							{currentOrganization.organization?.join_code ?? '—'}
						</p>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button variant="outline" onclick={copyJoinCode}>Copy code</Button>
						<Button onclick={regenerateCode} disabled={currentOrganization.isMutating}>
							{currentOrganization.isMutating ? 'Generating...' : 'Generate new code'}
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-border/70 bg-card/80">
				<Card.Header class="gap-2 border-b border-border/70">
					<div class="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
						<div class="space-y-1">
							<Card.Title class="text-lg font-semibold tracking-tight">Invite members</Card.Title>
							<Card.Description>Send an email or phone invitation to bring someone in directly.</Card.Description>
						</div>
						<Badge variant="outline">
							{currentOrganization.invitations.length}
							{` pending`}
						</Badge>
					</div>
				</Card.Header>

				<Card.Content class="space-y-5">
					<form
						class="space-y-5"
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
		</div>

		<Card.Root class="border-border/70 bg-card/80">
			<Card.Header class="gap-2 border-b border-border/70">
				<Card.Title class="text-lg font-semibold tracking-tight">Pending invitations</Card.Title>
				<Card.Description>Review the invites that are still waiting to be accepted.</Card.Description>
			</Card.Header>

			<Card.Content>
				{#if currentOrganization.invitations.length > 0}
					<PendingInvitationsTable
						invitations={currentOrganization.invitations}
						isBusy={currentOrganization.isMutating}
						onResend={openResendConfirmation}
						onRevoke={openRevokeConfirmation}
					/>
				{:else}
					<div class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
						<p class="text-sm text-muted-foreground">
							No pending invitations right now. Send one above when you are ready to add someone.
						</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<Card.Root class="border-border/70 bg-card/80">
		<Card.Header class="gap-2 border-b border-border/70">
			<Card.Title class="text-lg font-semibold tracking-tight">Access</Card.Title>
			<Card.Description>Join code and invitations are only available to organization admins.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground">
				Ask an admin if you need a new invite or help bringing in another member.
			</p>
		</Card.Content>
	</Card.Root>
{/if}
