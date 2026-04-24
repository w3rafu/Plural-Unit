<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import PendingInvitationsTable from '$lib/components/organization/PendingInvitationsTable.svelte';
	import InviteForm from '$lib/components/organization/InviteForm.svelte';
	import ConfirmActionSheet from '$lib/components/ui/ConfirmActionSheet.svelte';
	import { Input } from '$lib/components/ui/input';
	import {
		buildPendingInvitationsSummary,
		countExpiredOrganizationInvitations,
		countExpiringSoonOrganizationInvitations,
		countStaleOrganizationInvitations,
		filterPendingInvitations,
		getInvitationChannel,
		getPendingInvitationsEmptyState,
		type InvitationReviewFilter
	} from '$lib/models/accessReviewModel';
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

	const invitationFilterOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'stale', label: 'Stale' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'email', label: 'Email' },
		{ value: 'phone', label: 'Phone' }
	] as const satisfies Array<{ value: InvitationReviewFilter; label: string }>;

	let confirmationOpen = $state(false);
	let pendingInviteAction = $state<PendingInviteAction>(null);
	let invitationQuery = $state('');
	let invitationFilter = $state<InvitationReviewFilter>('all');
	const expiredInviteCount = $derived(countExpiredOrganizationInvitations(currentOrganization.invitations));
	const expiringSoonInviteCount = $derived(
		countExpiringSoonOrganizationInvitations(currentOrganization.invitations)
	);
	const activeInviteCount = $derived(currentOrganization.invitations.length - expiredInviteCount);
	const staleInviteCount = $derived(countStaleOrganizationInvitations(currentOrganization.invitations));
	const visibleInvitations = $derived(
		filterPendingInvitations(currentOrganization.invitations, {
			query: invitationQuery,
			filter: invitationFilter
		})
	);
	const invitationSummary = $derived(
		buildPendingInvitationsSummary({
			query: invitationQuery,
			filter: invitationFilter,
			visibleCount: visibleInvitations.length,
			totalCount: currentOrganization.invitations.length
		})
	);
	const invitationEmptyState = $derived(
		getPendingInvitationsEmptyState(invitationQuery, invitationFilter)
	);

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
					description: `A new invite token and expiry window were generated for ${recipient}.`,
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
		<div class="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Header class="gap-2 border-b border-border/70">
					<Card.Title class="text-lg font-semibold tracking-tight">Join code</Card.Title>
					<Card.Description>Share this when someone should be able to join without a direct invite.</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-3 p-4 sm:p-5">
					<div class="rounded-[1.15rem] border border-border/70 bg-muted/12 px-4 py-3.5">
						<div>
							<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active code</p>
							<p class="mt-1.5 font-mono text-[1.45rem] font-semibold tracking-[0.18em] text-foreground wrap-break-word sm:text-[1.6rem]">
								{currentOrganization.organization?.join_code ?? '—'}
							</p>
						</div>
						<p class="mt-2 text-[0.82rem] leading-5 text-muted-foreground">Anyone with this code can join until you rotate it.</p>
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
				<Card.Description>Review active and expired invites, then resend anything that needs a fresh token.</Card.Description>
			</Card.Header>

				<Card.Content class="space-y-3 p-4 sm:p-5">
				{#if currentOrganization.invitations.length > 0}
						<div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
							<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
							<div>
									<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pending</p>
									<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{activeInviteCount}</p>
							</div>
						</div>

							<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
							<div>
									<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stale</p>
									<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{staleInviteCount}</p>
							</div>
						</div>

							<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
							<div>
									<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Expiring soon</p>
									<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{expiringSoonInviteCount}</p>
							</div>
						</div>

							<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
							<div>
									<p class="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Expired</p>
									<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{expiredInviteCount}</p>
							</div>
						</div>
					</div>
				{/if}

				{#if currentOrganization.invitations.length > 0}
					<div class="space-y-2.5">
						<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
							<div class="space-y-1">
								<p class="text-[0.84rem] text-muted-foreground">{invitationSummary}</p>
							</div>

							<label class="relative block w-full lg:max-w-xs">
								<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									type="search"
									placeholder="Search invitations"
									class="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
									bind:value={invitationQuery}
								/>
							</label>
						</div>

						<div class="flex flex-wrap gap-2">
							{#each invitationFilterOptions as option (option.value)}
								<Button
									type="button"
									size="sm"
									variant={invitationFilter === option.value ? 'secondary' : 'outline'}
									class="h-8 rounded-xl px-3 text-[0.82rem]"
									onclick={() => (invitationFilter = option.value)}
								>
									{option.label}
								</Button>
							{/each}
						</div>
					</div>
				{/if}

				{#if currentOrganization.invitations.length > 0}
					<PendingInvitationsTable
						invitations={visibleInvitations}
						isBusy={currentOrganization.isMutating}
						emptyTitle={invitationEmptyState.title}
						emptyDescription={invitationEmptyState.description}
						onResend={openResendConfirmation}
						onRevoke={openRevokeConfirmation}
					/>
				{:else}
					<p class="text-sm text-muted-foreground py-3">
						No invitations currently need review.
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<Card.Root size="sm" class="border-border/70 bg-card">
		<Card.Header class="gap-2 border-b border-border/70">
			<Card.Title class="text-lg font-semibold tracking-tight">Access</Card.Title>
			<Card.Description>Only admins can manage join codes and invitations.</Card.Description>
		</Card.Header>
	</Card.Root>
{/if}
