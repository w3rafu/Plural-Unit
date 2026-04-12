<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, MessageSquare, ChevronRight } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import OrganizationMembersCard from '$lib/components/organization/OrganizationMembersCard.svelte';
	import {
		buildMemberDirectorySummary,
		filterMemberDirectory,
		getMemberDirectoryEmptyState,
		getMemberDirectoryMeta,
		getMemberDirectoryRoleLabel,
		getMemberDirectoryRoleOptions
	} from '$lib/models/memberDirectoryModel';
	import { formatContact, formatJoinedAt, getMemberInitials } from '$lib/models/memberManagementHelpers';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	let searchQuery = $state('');
	let roleFilter = $state('');
	let openingThreadForProfileId = $state('');

	const organizationMembers = $derived(currentOrganization.members);
	const roleOptions = $derived(getMemberDirectoryRoleOptions(organizationMembers));
	const visibleMembers = $derived(
		filterMemberDirectory(organizationMembers, {
			query: searchQuery,
			roleFilter,
			currentUserId: currentUser.details.id
		})
	);
	const summary = $derived(
		buildMemberDirectorySummary(searchQuery, visibleMembers.length, organizationMembers.length)
	);
	const emptyState = $derived(getMemberDirectoryEmptyState(searchQuery));

	function clearFilters() {
		searchQuery = '';
		roleFilter = '';
	}

	async function messageMember(member: OrganizationMember) {
		openingThreadForProfileId = member.profile_id;

		try {
			await currentMessages.openConversationForProfile(member.profile_id, currentUser.details.id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description:
					error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		} finally {
			openingThreadForProfileId = '';
		}
	}
</script>

<div class="space-y-4">
	<Card.Root class="border-border/70 bg-card">
		<Card.Header class="gap-2 border-b border-border/70">
			<Card.Title class="text-lg font-semibold tracking-tight">Directory</Card.Title>
			<Card.Description>
				Browse everyone in this organization and jump into their profile details.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-sm font-medium text-foreground">{summary}</p>
					<p class="text-sm text-muted-foreground">
						Search by name, role, email, or phone number.
					</p>
				</div>

				{#if searchQuery || roleFilter}
					<Button type="button" variant="ghost" size="sm" onclick={clearFilters}>
						Clear filters
					</Button>
				{/if}
			</div>

			<div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
				<label class="relative block">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search the directory"
						class="pl-9"
						bind:value={searchQuery}
					/>
				</label>

				{#if roleOptions.length > 1}
					<div class="flex flex-wrap gap-2 lg:justify-end">
						<Button
							type="button"
							size="xs"
							variant={roleFilter === '' ? 'default' : 'outline'}
							onclick={() => (roleFilter = '')}
						>
							All
						</Button>
						{#each roleOptions as role (role)}
							<Button
								type="button"
								size="xs"
								variant={roleFilter === role ? 'default' : 'outline'}
								onclick={() => (roleFilter = roleFilter === role ? '' : role)}
							>
								{role}
							</Button>
						{/each}
					</div>
				{/if}
			</div>

			{#if currentOrganization.isLoadingMembers && organizationMembers.length === 0}
				<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
					<p class="font-medium text-foreground">Loading directory</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Pulling the latest member list for this organization.
					</p>
				</div>
			{:else if visibleMembers.length > 0}
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each visibleMembers as member (member.profile_id)}
						<Card.Root class="border-border/70 bg-muted/10">
							<Card.Content class="space-y-4 p-4">
								<div class="flex items-start gap-3">
									<Avatar.Root class="size-12 border border-border/70 bg-muted/50 shadow-sm after:hidden">
										{#if member.avatar_url}
											<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
										{:else}
											<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
												{getMemberInitials(member)}
											</Avatar.Fallback>
										{/if}
									</Avatar.Root>

									<div class="min-w-0 space-y-2">
										<div class="space-y-1">
											<p class="truncate text-sm font-semibold text-foreground">
												{member.name || 'Unnamed member'}
											</p>
											<p class="text-xs text-muted-foreground">
												{getMemberDirectoryMeta(member, currentUser.details.id)}
											</p>
										</div>

										<div class="flex flex-wrap gap-2">
											<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
												{getMemberDirectoryRoleLabel(member.role)}
											</Badge>
											<Badge variant="outline">Joined {formatJoinedAt(member.joined_at)}</Badge>
										</div>
									</div>
								</div>

								<div class="space-y-1">
									<p class="text-sm text-foreground">{formatContact(member)}</p>
									<p class="text-xs text-muted-foreground">
										Open the full profile for joined info and contact details.
									</p>
								</div>

								<div class="flex flex-wrap gap-2">
									<Button
										href={`/organization/members/${member.profile_id}`}
										variant="outline"
										size="sm"
										class="flex-1"
									>
										View profile
										<ChevronRight class="size-4" />
									</Button>

									{#if member.profile_id !== currentUser.details.id}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => messageMember(member)}
											disabled={openingThreadForProfileId === member.profile_id}
										>
											<MessageSquare class="size-4" />
											{openingThreadForProfileId === member.profile_id ? 'Opening...' : 'Message'}
										</Button>
									{/if}
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{:else}
				<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
					<p class="font-medium text-foreground">{emptyState.title}</p>
					<p class="mt-1 text-sm text-muted-foreground">{emptyState.description}</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if currentOrganization.isAdmin}
		<OrganizationMembersCard />
	{/if}
</div>
