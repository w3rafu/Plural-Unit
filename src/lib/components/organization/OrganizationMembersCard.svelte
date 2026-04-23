<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import {
		buildOrganizationMembersSummary,
		countRecentOrganizationMembers,
		filterOrganizationMembers,
		getOrganizationMembersEmptyState,
		type MemberReviewFilter
	} from '$lib/models/accessReviewModel';
	import {
		type PendingMemberAction,
		getConfirmationBusyLabel,
		getConfirmationDescription,
		getConfirmationDetails,
		getConfirmationLabel,
		getConfirmationTitle,
		getConfirmationVariant,
		isLastAdmin,
		wouldDemoteLastAdmin
	} from '$lib/models/memberManagementHelpers';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import ConfirmActionSheet from '$lib/components/ui/ConfirmActionSheet.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import DeletionRequestsCard from './DeletionRequestsCard.svelte';
	import MemberRow from './MemberRow.svelte';

	const organizationMembers = $derived(currentOrganization.members);
	const memberFilterOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'admin', label: 'Admins' },
		{ value: 'member', label: 'Members' },
		{ value: 'recent', label: 'Recent' }
	] as const satisfies Array<{ value: MemberReviewFilter; label: string }>;

	const adminCount = $derived.by(
		() => organizationMembers.filter((member) => member.role === 'admin').length
	);
	const recentJoinCount = $derived(countRecentOrganizationMembers(organizationMembers));
	let roleDrafts = $state<Record<string, OrganizationMember['role']>>({});
	let searchQuery = $state('');
	let memberFilter = $state<MemberReviewFilter>('all');
	let confirmationOpen = $state(false);
	let pendingAction = $state<PendingMemberAction>(null);

	const visibleMembers = $derived(
		filterOrganizationMembers(organizationMembers, {
			query: searchQuery,
			filter: memberFilter
		})
	);
	const reviewSummary = $derived(
		buildOrganizationMembersSummary({
			query: searchQuery,
			filter: memberFilter,
			visibleCount: visibleMembers.length,
			totalCount: organizationMembers.length
		})
	);
	const emptyState = $derived(getOrganizationMembersEmptyState(searchQuery, memberFilter));

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
		<Card.Description>Who belongs to this organization and their roles.</Card.Description>
	</Card.Header>

	{#if !currentOrganization.isAdmin}
		<Card.Content>
			<p class="text-sm text-muted-foreground">Only admins can view and manage members.</p>
		</Card.Content>
	{:else}
		<Card.Content class="space-y-3 p-4 sm:p-5">
			<DeletionRequestsCard />

			<div class="grid gap-2.5 sm:grid-cols-3">
				<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
					<div>
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total members</p>
						<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{organizationMembers.length}</p>
					</div>
				</div>

				<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
					<div>
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Admins</p>
						<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{adminCount}</p>
					</div>
				</div>

				<div class="rounded-[1.05rem] border border-border/70 bg-muted/12 px-3.5 py-3">
					<div>
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent joins</p>
						<p class="mt-1 text-[1.1rem] font-semibold text-foreground">{recentJoinCount}</p>
					</div>
				</div>
			</div>

			<div class="space-y-2.5">
				<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div class="space-y-1">
						<p class="text-[0.84rem] text-muted-foreground">{reviewSummary}</p>
						{#if currentOrganization.isLoadingMembers && organizationMembers.length > 0}
							<p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
								Refreshing the latest access roster
							</p>
						{/if}
					</div>

					<label class="relative block w-full lg:max-w-xs">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search members"
							class="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
							bind:value={searchQuery}
						/>
					</label>
				</div>

				<div class="flex flex-wrap gap-2">
					{#each memberFilterOptions as option (option.value)}
						<Button
							type="button"
							size="sm"
							variant={memberFilter === option.value ? 'secondary' : 'outline'}
							class="h-8 rounded-xl px-3 text-[0.72rem]"
							onclick={() => (memberFilter = option.value)}
						>
							{option.label}
						</Button>
					{/each}
				</div>
			</div>

			<div class="overflow-x-auto overflow-y-hidden rounded-xl border border-border/70 bg-muted/10">
				<Table.Root class="min-w-176">
					<Table.Caption class="sr-only">Organization members and roles.</Table.Caption>
					<Table.Header class="bg-muted/25">
						<Table.Row>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Member</Table.Head>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Role</Table.Head>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Joined via</Table.Head>
							<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Joined</Table.Head>
							<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if currentOrganization.isLoadingMembers && organizationMembers.length === 0}
							<Table.Row class="border-0 hover:bg-transparent">
								<Table.Cell colspan={5} class="py-10 text-center">
									<p class="text-sm text-muted-foreground">Loading members…</p>
								</Table.Cell>
							</Table.Row>
						{:else if visibleMembers.length > 0}
							{#each visibleMembers as member (member.profile_id)}
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
										<p class="font-medium text-foreground">{emptyState.title}</p>
										<p class="text-sm text-muted-foreground">{emptyState.description}</p>
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