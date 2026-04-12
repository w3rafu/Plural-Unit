<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import PendingInvitationsTable from '$lib/components/organization/PendingInvitationsTable.svelte';
	import InviteForm from '$lib/components/organization/InviteForm.svelte';
	import ConfirmActionSheet from '$lib/components/ui/ConfirmActionSheet.svelte';
	import type { OrganizationInvitation } from '$lib/models/organizationModel';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		type PendingInviteAction,
		getInviteConfirmationTitle,
		getInviteConfirmationDescription,
		getInviteConfirmationDetails,
		getInviteConfirmationLabel,
		getInviteConfirmationBusyLabel,
		getInviteConfirmationVariant
	} from '$lib/models/invitationHelpers';

	let confirmationOpen = $state(false);
	let pendingInviteAction = $state<PendingInviteAction>(null);

	function openResendConfirmation(invitation: OrganizationInvitation) {
		pendingInviteAction = { type: 'resend', invitation };
		confirmationOpen = true;
	}

	function openRevokeConfirmation(invitation: OrganizationInvitation) {
		pendingInviteAction = { type: 'revoke', invitation };
		confirmationOpen = true;
	}

	function closeConfirmation() {
		pendingInviteAction = null;
	}

	const confirmationTitle = $derived(getInviteConfirmationTitle(pendingInviteAction));
	const confirmationDescription = $derived(getInviteConfirmationDescription(pendingInviteAction));
	const confirmationDetails = $derived(getInviteConfirmationDetails(pendingInviteAction));
	const confirmationLabel = $derived(getInviteConfirmationLabel(pendingInviteAction));
	const confirmationBusyLabel = $derived(getInviteConfirmationBusyLabel(pendingInviteAction));
	const confirmationVariant = $derived(getInviteConfirmationVariant(pendingInviteAction));

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
	<div class="page-stack">
		<div class="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Header class="gap-2 border-b border-border/70">
					<Card.Title class="text-lg font-semibold tracking-tight">Join code</Card.Title>
					<Card.Description>Share this when someone should be able to join without a direct invite.</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-4">
					<div class="metric-card min-h-0">
						<div>
							<p class="metric-label">Active code</p>
							<p class="mt-2 font-mono text-[1.9rem] font-semibold tracking-[0.24em] text-foreground wrap-break-word">
								{currentOrganization.organization?.join_code ?? '—'}
							</p>
						</div>
						<p class="metric-copy">Anyone with this code can join until you rotate it.</p>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button variant="outline" onclick={copyJoinCode}>Copy code</Button>
						<Button onclick={regenerateCode} disabled={currentOrganization.isMutating}>
							{currentOrganization.isMutating ? 'Generating...' : 'Generate new code'}
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<InviteForm />
		</div>

		<Card.Root size="sm" class="border-border/70 bg-card">
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
	<Card.Root size="sm" class="border-border/70 bg-card">
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
