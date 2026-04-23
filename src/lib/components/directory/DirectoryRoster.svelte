<script lang="ts">
	import { Search } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
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
	const spotlightMembers = $derived.by(() => {
		if (searchQuery.trim() || roleFilter !== 'all') {
			return [];
		}

		const adminMembers = [...members]
			.filter((member) => member.role === 'admin')
			.sort((left, right) => {
				if (left.profile_id === currentUserId) {
					return -1;
				}

				if (right.profile_id === currentUserId) {
					return 1;
				}

				return new Date(left.joined_at).getTime() - new Date(right.joined_at).getTime();
			});
		const recentMembers = [...members]
			.filter((member) => member.role !== 'admin')
			.sort((left, right) => new Date(right.joined_at).getTime() - new Date(left.joined_at).getTime());

		return [...adminMembers.slice(0, 2), ...recentMembers.slice(0, 1)];
	});
	const gridMembers = $derived.by(() => {
		if (spotlightMembers.length === 0) {
			return visibleMembers;
		}

		const spotlightIds = new Set(spotlightMembers.map((member) => member.profile_id));
		return visibleMembers.filter((member) => !spotlightIds.has(member.profile_id));
	});
	const recentMemberIds = $derived.by(() =>
		new Set(
			[...visibleMembers]
				.filter((member) => member.profile_id !== currentUserId && member.role !== 'admin')
				.sort((left, right) => new Date(right.joined_at).getTime() - new Date(left.joined_at).getTime())
				.slice(0, 2)
				.map((member) => member.profile_id)
		)
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

	function getSpotlightLabel(member: OrganizationMember) {
		if (member.profile_id === currentUserId) {
			return 'Your main profile';
		}

		return member.role === 'admin' ? 'Admin contact' : 'Joined recently';
	}

	function getGridSignal(member: OrganizationMember) {
		if (member.profile_id === currentUserId) {
			return { label: 'Your profile', variant: 'secondary' as const };
		}

		if (recentMemberIds.has(member.profile_id)) {
			return { label: 'Joined recently', variant: 'secondary' as const };
		}

		if (member.joined_via === 'code') {
			return { label: 'Joined by code', variant: 'muted' as const };
		}

		if (member.joined_via === 'invitation') {
			return { label: 'Invited', variant: 'muted' as const };
		}

		return { label: 'Created organization', variant: 'muted' as const };
	}

	function getBioPreview(member: OrganizationMember) {
		const bio = (member.bio ?? '').trim();

		if (!bio) {
			return '';
		}

		return bio.length > 108 ? `${bio.slice(0, 105).trimEnd()}...` : bio;
	}
</script>

<Card.Root size="sm" class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5 sm:py-4">
		<div class="space-y-2">
			<div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
				<label class="relative block w-full lg:max-w-md">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search members"
						class="h-8.5 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
						bind:value={searchQuery}
					/>
				</label>

				<div class="segmented-control w-full lg:w-auto">
					{#each roleOptions as option (option.id)}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="h-8.5 justify-center px-4"
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

			<div class="flex flex-wrap items-center justify-between gap-2.5 text-[0.74rem] text-muted-foreground">
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
			<div class="min-h-0 flex-1 overflow-auto p-2.5 md:p-3">
				<div class="space-y-3">
					{#if spotlightMembers.length > 0}
						<div class="grid gap-2.5 xl:grid-cols-3">
							{#each spotlightMembers as member (member.profile_id)}
								{@const bioPreview = getBioPreview(member)}
								<div class="rounded-[1.1rem] border border-border/60 bg-muted/10 px-3.5 py-3.5 shadow-sm">
									<div class="flex items-start gap-3">
										<Avatar.Root class="size-10 border border-border/70 bg-muted/30 shadow-sm after:hidden">
											{#if member.avatar_url}
												<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
											{:else}
												<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
													{getMemberInitials(member)}
												</Avatar.Fallback>
											{/if}
										</Avatar.Root>

										<div class="min-w-0 flex-1 space-y-0.5">
											<div class="flex flex-wrap items-center gap-2">
												<Button
													href={getDetailHref(member)}
													variant="ghost"
													size="sm"
													class="h-auto justify-start px-0 py-0 text-sm font-semibold hover:bg-transparent"
												>
													{member.name || 'Unnamed member'}
												</Button>
												<Badge variant="muted" class="rounded-full px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em]">
													{getMemberDirectoryRoleLabel(member.role)}
												</Badge>
											</div>
											<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{getSpotlightLabel(member)}</p>
											<p class="text-[0.84rem] leading-5 text-muted-foreground">{getMemberDirectoryMeta(member, currentUserId)}</p>
											{#if bioPreview}
												<p class="pt-1 text-[0.84rem] leading-5 text-foreground/80 wrap-break-word">{bioPreview}</p>
											{/if}
										</div>
									</div>

									<div class="mt-2.5 space-y-1.5 border-t border-border/50 pt-2.5">
										<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Best contact</p>
										<p class="text-[0.84rem] text-muted-foreground wrap-break-word">{formatContact(member)}</p>
										<p class="text-[0.74rem] text-muted-foreground">Joined {formatJoinedAt(member.joined_at)}</p>
									</div>

									<div class="mt-2 flex items-center justify-between gap-3 text-[0.76rem] text-muted-foreground">
										<span>{getSpotlightLabel(member)}</span>
										<div class="flex items-center gap-2.5">
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
							{/each}
						</div>
					{/if}

					<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{#each gridMembers as member (member.profile_id)}
							{@const signal = getGridSignal(member)}
							{@const bioPreview = getBioPreview(member)}
							<div class="rounded-[1.1rem] border border-border/60 bg-muted/10 px-3.5 py-3.5 shadow-sm">
							<div class="flex items-start gap-3">
								<Avatar.Root class="size-10 border border-border/70 bg-muted/40 after:hidden">
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
											<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
											<Button
												href={getDetailHref(member)}
												variant="ghost"
												size="sm"
												class="h-auto justify-start px-0 py-0 text-[0.98rem] font-semibold leading-5 hover:bg-transparent"
											>
												{member.name || 'Unnamed member'}
											</Button>
											<Badge variant="muted" class="rounded-full px-2 py-0.5 text-[0.64rem] font-medium uppercase tracking-[0.14em]">
												{getMemberDirectoryRoleLabel(member.role)}
											</Badge>
											<Badge variant={signal.variant} class="rounded-full px-2 py-0.5 text-[0.64rem] font-medium uppercase tracking-[0.14em]">
												{signal.label}
											</Badge>
										</div>
										<p class="text-[0.84rem] text-muted-foreground">
											{getMemberDirectoryMeta(member, currentUserId)}
										</p>
										{#if bioPreview}
											<p class="pt-1 text-[0.84rem] leading-5 text-foreground/80 wrap-break-word">{bioPreview}</p>
										{/if}
									</div>

										<div class="mt-2 space-y-1.5 border-t border-border/50 pt-2.5">
											<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Best contact</p>
											<p class="text-[0.84rem] text-muted-foreground wrap-break-word">{formatContact(member)}</p>
											<p class="text-[0.74rem] text-muted-foreground">Joined {formatJoinedAt(member.joined_at)}</p>
										</div>

									<div class="mt-2 flex flex-wrap items-center gap-2.5 text-[0.76rem]">
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
