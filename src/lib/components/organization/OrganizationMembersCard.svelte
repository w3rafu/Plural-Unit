<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import ConfirmActionSheet from '$lib/components/ui/ConfirmActionSheet.svelte';
	import MemberRow from './MemberRow.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		type PendingMemberAction,
		formatContact,
		isLastAdmin,
		wouldDemoteLastAdmin,
		getConfirmationTitle,
		getConfirmationDescription,
		getConfirmationDetails,
		getConfirmationLabel,
		getConfirmationBusyLabel,
		getConfirmationVariant
	} from '$lib/models/memberManagementHelpers';

	const organizationMembers = $derived(currentOrganization.members);

	const adminCount = $derived.by(
		() => organizationMembers.filter((member) => member.role === 'admin').length
	);
	let roleDrafts = $state<Record<string, OrganizationMember['role']>>({});
	let confirmationOpen = $state(false);
	let pendingAction = $state<PendingMemberAction>(null);

	function getDraftRole(member: OrganizationMember) {
		return roleDrafts[member.profile_id] ?? member.role;
	}

	function setDraftRole(member: OrganizationMember, role: OrganizationMember['role']) {
		roleDrafts = { ...roleDrafts, [member.profile_id]: role };
	}

	function openRoleConfirmation(member: OrganizationMember) {
		const nextRole = getDraftRole(member);

		if (nextRole === member.role || wouldDemoteLastAdmin(member, nextRole, adminCount)) {
			return;
		}

		pendingAction = { type: 'role', member, nextRole };
		confirmationOpen = true;
	}

	function openRemoveConfirmation(member: OrganizationMember) {
		if (isLastAdmin(member, adminCount)) {
			return;
		}

		pendingAction = { type: 'remove', member };
		confirmationOpen = true;
	}

	function closeConfirmation() {
		pendingAction = null;
	}

	async function messageMember(member: OrganizationMember) {
		try {
			await currentMessages.openConversationForProfile(member.profile_id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description: error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		}
	}

	const confirmationTitle = $derived(getConfirmationTitle(pendingAction));
	const confirmationDescription = $derived(getConfirmationDescription(pendingAction));
	const confirmationDetails = $derived(
		getConfirmationDetails(
			pendingAction,
			currentUser.details.id,
			currentOrganization.organization?.name ?? 'Current organization'
		)
	);
	const confirmationLabel = $derived(getConfirmationLabel(pendingAction));
	const confirmationBusyLabel = $derived(getConfirmationBusyLabel(pendingAction));
	const confirmationVariant = $derived(getConfirmationVariant(pendingAction));

	async function confirmAction() {
		if (!pendingAction) {
			return;
		}

		if (pendingAction.type === 'role') {
			const member = pendingAction.member;
			const nextRole = pendingAction.nextRole;
			const isCurrentUser = member.profile_id === currentUser.details.id;

			try {
				await currentOrganization.updateMemberRole(member.profile_id, nextRole);
				confirmationOpen = false;
				toast({
					title: 'Member updated',
					description: isCurrentUser
						? 'Your role was updated.'
						: `${member.name || 'The member'} now has the ${nextRole} role.`,
					variant: 'success'
				});
			} catch (error) {
				toast({
					title: 'Could not update member',
					description: error instanceof Error ? error.message : 'Failed to change the member role.',
					variant: 'error'
				});
			}

			return;
		}

		const member = pendingAction.member;

		const isCurrentUser = member.profile_id === currentUser.details.id;

		try {
			await currentOrganization.removeMember(member.profile_id);
			confirmationOpen = false;
			toast({
				title: 'Member removed',
				description: isCurrentUser
					? 'You were removed from the organization.'
					: `${member.name || 'The member'} was removed from the organization.`,
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not remove member',
				description: error instanceof Error ? error.message : 'Failed to remove the member.',
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
	onConfirm={confirmAction}
	onCancel={closeConfirmation}
/>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Members</Card.Title>
		<Card.Description>
			Review who belongs to this organization and which accounts can manage it.
		</Card.Description>
	</Card.Header>

	{#if !currentOrganization.isAdmin}
		<Card.Content>
			<div class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
				<p class="font-medium text-foreground">Members are visible to organization admins.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Ask an admin if you need help reviewing who has access.
				</p>
			</div>
		</Card.Content>
	{:else}
		<Card.Content class="space-y-4">
			<div class="metric-grid">
				<div class="metric-card">
					<div>
						<p class="metric-label">Total members</p>
						<p class="metric-value">{organizationMembers.length}</p>
					</div>
					<p class="metric-copy">Everyone who currently has access.</p>
				</div>

				<div class="metric-card">
					<div>
						<p class="metric-label">Admins</p>
						<p class="metric-value">{adminCount}</p>
					</div>
					<p class="metric-copy">Accounts that can manage membership and access.</p>
				</div>

				<div class="metric-card">
					<div>
						<p class="metric-label">Members</p>
						<p class="metric-value">{Math.max(organizationMembers.length - adminCount, 0)}</p>
					</div>
					<p class="metric-copy">People with standard organization access.</p>
				</div>
			</div>

			<div class="overflow-x-auto overflow-y-hidden rounded-2xl border border-border/70 bg-muted/10">
				<Table.Root class="min-w-176">
					<Table.Caption class="sr-only">Organization members and roles.</Table.Caption>
					<Table.Header class="bg-muted/25">
						<Table.Row>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Member</Table.Head>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Role</Table.Head>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Joined</Table.Head>
							<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Added</Table.Head>
							<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if currentOrganization.isLoadingMembers}
							<Table.Row class="border-0 hover:bg-transparent">
								<Table.Cell colspan={5} class="py-10 text-center">
									<div class="space-y-1">
										<p class="font-medium text-foreground">Loading members</p>
										<p class="text-sm text-muted-foreground">
											Pulling the latest organization access list now.
										</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else if organizationMembers.length > 0}
							{#each organizationMembers as member (member.profile_id)}
								<MemberRow
									{member}
									{adminCount}
									draftRole={getDraftRole(member)}
									isMutating={currentOrganization.isMutating}
									canMessage={member.profile_id !== currentUser.details.id}
									onDraftRoleChange={(role) => setDraftRole(member, role)}
									onRoleConfirm={() => openRoleConfirmation(member)}
									onRemove={() => openRemoveConfirmation(member)}
									onMessage={() => messageMember(member)}
								/>
							{/each}
						{:else}
							<Table.Row class="border-0 hover:bg-transparent">
								<Table.Cell colspan={5} class="py-10 text-center">
									<div class="space-y-1">
										<p class="font-medium text-foreground">No members found</p>
										<p class="text-sm text-muted-foreground">
											New members will appear here after they join or accept an invitation.
										</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	{/if}
</Card.Root>
