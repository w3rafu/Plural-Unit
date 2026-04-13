<script lang="ts">
	import { Search, MessageSquare, ChevronRight } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
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

	type MessageAction = (member: OrganizationMember) => void;

	let {
		members,
		currentUserId,
		sectionTitle = 'Directory',
		detailPathBase,
		detailLabel = 'View',
		isLoading = false,
		isRefreshing = false,
		loadingTitle = 'Loading directory',
		loadingDescription = 'Pulling the latest member list for this organization.',
		tableCaption = 'Organization member directory.',
		onMessageMember,
		openingThreadForProfileId = ''
	}: {
		members: OrganizationMember[];
		currentUserId: string;
		sectionTitle?: string;
		detailPathBase: string;
		detailLabel?: string;
		isLoading?: boolean;
		isRefreshing?: boolean;
		loadingTitle?: string;
		loadingDescription?: string;
		tableCaption?: string;
		onMessageMember?: MessageAction;
		openingThreadForProfileId?: string;
	} = $props();

	let searchQuery = $state('');

	const visibleMembers = $derived(
		filterMemberDirectory(members, {
			query: searchQuery,
			currentUserId
		})
	);
	const summary = $derived(
		buildMemberDirectorySummary(searchQuery, visibleMembers.length, members.length)
	);
	const emptyState = $derived(getMemberDirectoryEmptyState(searchQuery));
	const adminCount = $derived(members.filter((member) => member.role === 'admin').length);
	const memberCount = $derived(members.filter((member) => member.role === 'member').length);
	const isInitialLoading = $derived(isLoading && members.length === 0);
	const showsMessageAction = $derived(typeof onMessageMember === 'function');

	function getDetailHref(member: OrganizationMember) {
		return `${detailPathBase}/${member.profile_id}`;
	}

	function handleMessageMember(member: OrganizationMember) {
		onMessageMember?.(member);
	}
</script>

<Card.Root size="sm" class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
	<Card.Header class="gap-2.5 border-b border-border/70">
		<div class="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
			<div class="flex-1 space-y-2.5">
				<div class="space-y-1">
					<Card.Title class="text-lg font-semibold tracking-tight">{sectionTitle}</Card.Title>
					<Card.Description>
						{summary}. Search by name, role, email, or phone number.
					</Card.Description>
					{#if isRefreshing}
						<p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
							Refreshing the latest member list
						</p>
					{/if}
				</div>

				<div class="grid gap-2 sm:grid-cols-3">
					<div class="rounded-xl border border-border/70 bg-background px-3 py-2 shadow-sm">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Visible
						</p>
						<p class="mt-0.5 text-base font-semibold tracking-tight text-foreground">
							{visibleMembers.length}
						</p>
					</div>

					<div class="rounded-xl border border-border/70 bg-background px-3 py-2 shadow-sm">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Admins
						</p>
						<p class="mt-0.5 text-base font-semibold tracking-tight text-foreground">
							{adminCount}
						</p>
					</div>

					<div class="rounded-xl border border-border/70 bg-background px-3 py-2 shadow-sm">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Members
						</p>
						<p class="mt-0.5 text-base font-semibold tracking-tight text-foreground">
							{memberCount}
						</p>
					</div>
				</div>
			</div>

			<label class="relative block w-full lg:max-w-xs">
				<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search the directory"
					class="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
					bind:value={searchQuery}
				/>
			</label>
		</div>
	</Card.Header>

	<Card.Content class="flex min-h-0 flex-1 flex-col p-0">
		{#if isInitialLoading}
			<div class="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center">
				<div class="space-y-1">
					<p class="font-medium text-foreground">{loadingTitle}</p>
					<p class="text-sm text-muted-foreground">{loadingDescription}</p>
				</div>
			</div>
		{:else if visibleMembers.length > 0}
			<div class="min-h-0 flex-1 overflow-auto md:hidden">
				<div class="space-y-2.5 p-3">
					{#each visibleMembers as member (member.profile_id)}
						<div class="rounded-xl border border-border/70 bg-background px-3.5 py-3.5 shadow-sm">
							<div class="flex items-start gap-3">
								<Avatar.Root class="size-11 border border-border/70 bg-muted/50 shadow-sm after:hidden">
									{#if member.avatar_url}
										<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
									{:else}
										<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
											{getMemberInitials(member)}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>

								<div class="min-w-0 flex-1 space-y-2.5">
									<div class="space-y-1">
										<Button
											href={getDetailHref(member)}
											variant="ghost"
											size="sm"
											class="h-auto justify-start px-0 py-0 font-semibold hover:bg-transparent"
										>
											{member.name || 'Unnamed member'}
										</Button>
										<p class="text-xs text-muted-foreground">
											{getMemberDirectoryMeta(member, currentUserId)}
										</p>
									</div>

									<div class="flex flex-wrap gap-2">
										<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
											{getMemberDirectoryRoleLabel(member.role)}
										</Badge>
										<Badge variant="outline">Joined {formatJoinedAt(member.joined_at)}</Badge>
									</div>

									<p class="text-sm text-muted-foreground wrap-break-word">{formatContact(member)}</p>

									<div class="flex flex-wrap gap-2">
										<Button href={getDetailHref(member)} variant="outline" size="sm" class="flex-1 sm:flex-none">
											{detailLabel}
											<ChevronRight class="size-4" />
										</Button>

										{#if showsMessageAction && member.profile_id !== currentUserId}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												class="flex-1 sm:flex-none"
												onclick={() => handleMessageMember(member)}
												disabled={openingThreadForProfileId === member.profile_id}
											>
												<MessageSquare class="size-4" />
												{openingThreadForProfileId === member.profile_id ? 'Opening...' : 'Message'}
											</Button>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="hidden min-h-0 flex-1 overflow-auto md:block">
				<Table.Root class="min-w-184">
					<Table.Caption class="sr-only">{tableCaption}</Table.Caption>
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
												href={getDetailHref(member)}
												variant="ghost"
												size="sm"
												class="h-auto justify-start px-0 py-0 font-semibold hover:bg-transparent"
											>
												{member.name || 'Unnamed member'}
											</Button>
											<p class="text-xs text-muted-foreground">
												{getMemberDirectoryMeta(member, currentUserId)}
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
										<Button href={getDetailHref(member)} variant="outline" size="sm">
											{detailLabel}
											<ChevronRight class="size-4" />
										</Button>

										{#if showsMessageAction && member.profile_id !== currentUserId}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onclick={() => handleMessageMember(member)}
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
				<div class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-5 py-8">
					<p class="font-medium text-foreground">{emptyState.title}</p>
					<p class="mt-1 text-sm text-muted-foreground">{emptyState.description}</p>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
