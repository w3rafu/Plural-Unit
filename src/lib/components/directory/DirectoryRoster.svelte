<script lang="ts">
	import { Search } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
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

	type DirectoryRoleFilter = 'all' | OrganizationMember['role'];

	let searchQuery = $state('');
	let roleFilter = $state<DirectoryRoleFilter>('all');

	const searchResults = $derived(
		filterMemberDirectory(members, {
			query: searchQuery,
			currentUserId
		})
	);
	const visibleMembers = $derived(
		searchResults.filter((member) => roleFilter === 'all' || member.role === roleFilter)
	);
	const summary = $derived.by(() => {
		if (searchQuery.trim() || roleFilter !== 'all') {
			return `${visibleMembers.length} of ${members.length} members`;
		}

		return `${members.length} members`;
	});
	const roleOptions = $derived.by(() => [
		{ id: 'all' as const, label: 'All' },
		{ id: 'admin' as const, label: 'Admins' },
		{ id: 'member' as const, label: 'Members' }
	]);
	const summaryCopy = $derived.by(() =>
		roleFilter === 'all' ? summary : `${summary} · ${getMemberDirectoryRoleLabel(roleFilter)} filter`
	);
	const emptyState = $derived(getMemberDirectoryEmptyState(searchQuery));
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
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="space-y-3">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<label class="relative block w-full lg:max-w-md">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search members"
						class="h-10 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
						bind:value={searchQuery}
					/>
				</label>

				<div class="segmented-control w-full lg:w-auto">
					{#each roleOptions as option (option.id)}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="justify-center px-4"
							aria-current={roleFilter === option.id ? 'page' : undefined}
							onclick={() => {
								roleFilter = option.id;
							}}
						>
							{option.label}
						</Button>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
				<p>{summaryCopy}</p>
				{#if isRefreshing}
					<p class="font-medium uppercase tracking-[0.16em] text-muted-foreground">Refreshing</p>
				{/if}
			</div>
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
			<div class="min-h-0 flex-1 overflow-auto p-2.5 md:p-4">
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
					{#each visibleMembers as member (member.profile_id)}
						<div class="rounded-[1.15rem] bg-muted/10 px-3.5 py-3.5">
							<div class="flex items-start gap-3">
								<Avatar.Root class="size-10 border border-border/70 bg-muted/40 after:hidden sm:size-11">
									{#if member.avatar_url}
										<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
									{:else}
										<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
											{getMemberInitials(member)}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>

								<div class="min-w-0 flex-1">
									<div class="min-w-0 space-y-0.5">
										<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
											<Button
												href={getDetailHref(member)}
												variant="ghost"
												size="sm"
												class="h-auto justify-start px-0 py-0 text-[1.02rem] font-semibold hover:bg-transparent"
											>
												{member.name || 'Unnamed member'}
											</Button>
											<span class="text-[0.72rem] text-muted-foreground">
												{getMemberDirectoryRoleLabel(member.role)}
											</span>
										</div>
										<p class="text-sm text-muted-foreground">
											{getMemberDirectoryMeta(member, currentUserId)}
										</p>
									</div>

									<p class="mt-2 text-sm text-muted-foreground wrap-break-word">{formatContact(member)}</p>
									<p class="mt-1 text-xs text-muted-foreground">Joined {formatJoinedAt(member.joined_at)}</p>

									<div class="mt-2.5 flex flex-wrap items-center gap-3 text-[0.78rem]">
										<Button href={getDetailHref(member)} variant="ghost" size="xs" class="h-auto px-0 text-muted-foreground hover:text-foreground">
											{detailLabel}
										</Button>

										{#if showsMessageAction && member.profile_id !== currentUserId}
											<Button
												type="button"
												variant="ghost"
												size="xs"
												class="h-auto px-0 text-muted-foreground hover:text-foreground"
												onclick={() => handleMessageMember(member)}
												disabled={openingThreadForProfileId === member.profile_id}
											>
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
