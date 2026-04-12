<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, MessageSquare, ChevronRight } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import * as Table from '$lib/components/ui/table';
	import {
		buildMemberDirectorySummary,
		filterMemberDirectory,
		getMemberDirectoryEmptyState,
		getMemberDirectoryMeta,
		getMemberDirectoryRoleLabel
	} from '$lib/models/memberDirectoryModel';
	import { formatContact, formatJoinedAt, getMemberInitials } from '$lib/models/memberManagementHelpers';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	let searchQuery = $state('');
	let openingThreadForProfileId = $state('');

	const visibleMembers = $derived(
		filterMemberDirectory(currentOrganization.members, {
			query: searchQuery,
			currentUserId: currentUser.details.id
		})
	);
	const summary = $derived(
		buildMemberDirectorySummary(searchQuery, visibleMembers.length, currentOrganization.members.length)
	);
	const emptyState = $derived(getMemberDirectoryEmptyState(searchQuery));

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

<PageHeader preset="section" title="Directory" subtitle="Find people in your organization." />

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<Card.Root size="sm" class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		<Card.Header class="gap-2.5 border-b border-border/70">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div class="space-y-1">
					<Card.Title class="text-lg font-semibold tracking-tight">Directory</Card.Title>
					<Card.Description>
						{summary}. Search by name, role, email, or phone number.
					</Card.Description>
				</div>

				<label class="relative block w-full sm:max-w-xs">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search the directory"
						class="pl-9"
						bind:value={searchQuery}
					/>
				</label>
			</div>
		</Card.Header>

		<Card.Content class="flex min-h-0 flex-1 flex-col p-0">
			{#if currentOrganization.isLoadingMembers && currentOrganization.members.length === 0}
				<div class="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center">
					<div class="space-y-1">
						<p class="font-medium text-foreground">Loading directory</p>
						<p class="text-sm text-muted-foreground">
							Pulling the latest member list for this organization.
						</p>
					</div>
				</div>
			{:else if visibleMembers.length > 0}
				<div class="min-h-0 flex-1 overflow-auto">
					<Table.Root class="min-w-184">
						<Table.Caption class="sr-only">Organization member directory.</Table.Caption>
						<Table.Header class="bg-muted/25">
							<Table.Row>
								<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Member</Table.Head>
								<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Role</Table.Head>
								<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Joined</Table.Head>
								<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Contact</Table.Head>
								<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each visibleMembers as member (member.profile_id)}
								<Table.Row class="border-border/70">
									<Table.Cell class="whitespace-normal">
										<div class="flex items-center gap-3">
											<Avatar.Root class="size-10 border border-border/70 bg-muted/50 shadow-sm after:hidden">
												{#if member.avatar_url}
													<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
												{:else}
													<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
														{getMemberInitials(member)}
													</Avatar.Fallback>
												{/if}
											</Avatar.Root>

											<div class="min-w-0 space-y-1">
												<Button
													href={`/directory/${member.profile_id}`}
													variant="ghost"
													size="sm"
													class="h-auto justify-start px-0 py-0 font-semibold hover:bg-transparent"
												>
													{member.name || 'Unnamed member'}
												</Button>
												<p class="text-xs text-muted-foreground">
													{getMemberDirectoryMeta(member, currentUser.details.id)}
												</p>
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
											{getMemberDirectoryRoleLabel(member.role)}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">
										{formatJoinedAt(member.joined_at)}
									</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">
										<div class="max-w-52 wrap-break-word">{formatContact(member)}</div>
									</Table.Cell>
									<Table.Cell class="text-right">
										<div class="flex flex-wrap justify-end gap-2">
											<Button href={`/directory/${member.profile_id}`} variant="outline" size="sm">
												View
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
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{:else}
				<div class="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center">
					<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
						<p class="font-medium text-foreground">{emptyState.title}</p>
						<p class="mt-1 text-sm text-muted-foreground">{emptyState.description}</p>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</main>