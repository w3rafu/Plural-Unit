<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
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
	<Card.Header class="gap-1.5 border-b border-border/70 py-4">
		<Card.Title class="text-lg font-semibold tracking-tight">Members</Card.Title>
	</Card.Header>

	{#if !currentOrganization.isAdmin}
		<Card.Content>
			<p class="text-sm text-muted-foreground">Only admins can view and manage members.</p>
		</Card.Content>
	{:else}
		<Card.Content class="space-y-2.5 p-4 sm:p-4.5">
			<div class="space-y-1.75 rounded-2xl border border-border/70 bg-muted/10 p-2.5 sm:p-3">
				<div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
					<div class="flex flex-wrap items-center gap-1.5">
						<div class="rounded-full border border-border/70 bg-background px-3 py-1.15 text-[0.7rem] font-medium text-foreground shadow-sm">
							{organizationMembers.length} members
						</div>
						<div class="rounded-full border border-border/70 bg-background px-3 py-1.15 text-[0.7rem] font-medium text-foreground shadow-sm">
							{adminCount} admins
						</div>
						<div class="rounded-full border border-border/70 bg-background px-3 py-1.15 text-[0.7rem] font-medium text-foreground shadow-sm">
							{recentJoinCount} recent
						</div>
						{#if currentOrganization.isLoadingMembers && organizationMembers.length > 0}
							<p class="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
								Refreshing roster
							</p>
						{/if}
						<p class="text-[0.78rem] text-muted-foreground">{reviewSummary}</p>
					</div>

					<label class="relative block w-full xl:max-w-xs">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search members"
							class="h-8 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
							bind:value={searchQuery}
						/>
					</label>
				</div>

				<div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
					<DeletionRequestsCard />

					<div class="flex flex-wrap gap-1">
						{#each memberFilterOptions as option (option.value)}
							<Button
								type="button"
								size="sm"
								variant={memberFilter === option.value ? 'secondary' : 'ghost'}
								class={`h-7 rounded-full px-3 text-[0.7rem] ${memberFilter === option.value ? 'shadow-sm ring-1 ring-border/70' : 'text-muted-foreground'}`}
								onclick={() => (memberFilter = option.value)}
							>
								{option.label}
							</Button>
						{/each}
					</div>
				</div>
			</div>

			<div class="rounded-2xl border border-border/70 bg-muted/10 p-1.5 sm:p-2">
				{#if currentOrganization.isLoadingMembers && organizationMembers.length === 0}
					<div class="py-10 text-center">
						<p class="text-sm text-muted-foreground">Loading members…</p>
					</div>
				{:else if visibleMembers.length > 0}
					<div class="space-y-2">
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
					</div>
				{:else}
					<div class="py-10 text-center">
						<div class="space-y-1">
							<p class="font-medium text-foreground">{emptyState.title}</p>
							<p class="text-sm text-muted-foreground">{emptyState.description}</p>
						</div>
					</div>
				{/if}
			</div>
		</Card.Content>
	{/if}
</Card.Root>