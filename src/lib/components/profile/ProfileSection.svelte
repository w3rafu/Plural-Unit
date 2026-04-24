<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { computeAvatarInitials } from '$lib/components/profile/avatarUploadModel';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	const profileInitials = $derived.by(() => {
		return computeAvatarInitials(
			currentUser.details.name,
			currentOrganization.organization?.name,
			currentUser.details.email,
			'Profile'
		);
	});

	const roleLabel = $derived(
		currentOrganization.membership?.role === 'admin' ? 'Organization admin' : 'Organization member'
	);

	const joinLabel = $derived.by(() => {
		switch (currentOrganization.membership?.joined_via) {
			case 'created':
				return 'Created this organization';
			case 'invitation':
				return 'Joined by invitation';
			case 'code':
				return 'Joined with code';
			default:
				return 'Membership pending';
		}
	});

	const contactLabel = $derived.by(() => {
		if (currentUser.details.phone_number.trim()) {
			return currentUser.details.phone_number.trim();
		}

		if (currentUser.details.email.trim()) {
			return currentUser.details.email.trim();
		}

		return 'Add contact details';
	});
	const memberCountLabel = $derived(
		currentOrganization.memberCount === null
			? 'Loading members'
			: `${currentOrganization.memberCount} members`
	);
	const profileSummary = $derived.by(() => {
		const bio = currentUser.details.bio.trim();

		if (bio) {
			return bio;
		}

		return 'Keep your photo and contact details current so members know who to reach first.';
	});
	const unreadMessages = $derived(currentMessages.totalUnreadCount);
	const activeBroadcasts = $derived(currentHub.activeBroadcasts.length);
	const profileSupportLines = $derived.by(() => [
		{
			label: 'Inbox',
			value: unreadMessages,
			summary:
				unreadMessages > 0
					? `${unreadMessages} unread ${unreadMessages === 1 ? 'message still needs' : 'messages still need'} attention.`
					: 'Messages are caught up right now.'
		},
		{
			label: 'Broadcasts',
			value: activeBroadcasts,
			summary:
				activeBroadcasts > 0
					? `${activeBroadcasts} live ${activeBroadcasts === 1 ? 'broadcast is' : 'broadcasts are'} still in motion.`
					: 'No live broadcasts need review.'
		},
		{
			label: 'Roster',
			value: currentOrganization.memberCount ?? 0,
			summary: `${memberCountLabel} in ${currentOrganization.organization?.name ?? 'the organization'}.`
		}
	]);

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Content class="p-3.75 sm:p-4 lg:grid lg:grid-cols-[minmax(0,1.42fr)_12rem] lg:items-start lg:gap-3">
		<div class="space-y-2.25">
			<div class="flex items-start gap-3 sm:gap-3.25">
			<Avatar.Root class="size-10 border border-border/70 bg-muted/40 after:hidden sm:size-11">
				{#if currentUser.details.avatar_url}
					<Avatar.Image
						src={currentUser.details.avatar_url}
						alt={`${currentUser.details.name || 'Member'} profile`}
					/>
				{:else}
					<Avatar.Fallback class="text-base font-semibold tracking-tight text-foreground">
						{profileInitials}
					</Avatar.Fallback>
				{/if}
			</Avatar.Root>

				<div class="min-w-0 space-y-0.75">
					<Card.Title class="text-[1.16rem] font-semibold tracking-tight text-foreground sm:text-[1.34rem]">
						{currentUser.details.name || 'Profile snapshot'}
					</Card.Title>
					<p class="text-[0.88rem] text-muted-foreground">
						{roleLabel} · {currentOrganization.organization?.name ?? 'No organization'}
					</p>
					<p class="text-[0.88rem] text-muted-foreground">{contactLabel}</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-1.25 sm:gap-1.5">
				<div class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[0.68rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{joinLabel}</div>
				<div class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[0.68rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{memberCountLabel}</div>
				<div class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[0.68rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{unreadMessages} unread</div>
			</div>

			<p class="max-w-2xl text-[0.78rem] leading-4.75 text-muted-foreground">{profileSummary}</p>
		</div>

		<div class="rounded-[1rem] border border-border/70 bg-muted/16 px-2.75 py-2.5 shadow-sm">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Profile support</p>
			<div class="mt-1.75 space-y-1.75 border-t border-border/60 pt-1.75">
				{#each profileSupportLines as line (line.label)}
					<div class="flex items-start justify-between gap-3 text-[0.72rem]">
						<div>
							<p class="font-medium text-foreground">{line.label}</p>
							<p class="text-muted-foreground">{line.summary}</p>
						</div>
						<p class="text-[0.88rem] font-semibold text-foreground">{line.value}</p>
					</div>
				{/each}
			</div>
		</div>
	</Card.Content>
</Card.Root>
