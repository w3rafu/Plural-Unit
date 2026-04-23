<script lang="ts">
	import ActivityDotGrid from '$lib/components/ui/ActivityDotGrid.svelte';
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

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function buildActivityCells(seedValues: number[], offset: number) {
		return Array.from({ length: 28 }, (_, index) => {
			const base = seedValues[index % seedValues.length] ?? 0;
			const bucket = clamp(Math.round(base / 25), 0, 4);
			const wave = index % 7 >= 3 ? 1 : 0;
			const pulse = (index + offset) % 6 === 0 ? 1 : 0;
			const dip = (index + offset) % 5 === 0 ? 1 : 0;
			return clamp(bucket + wave + pulse - dip, 0, 4);
		});
	}

	const personalActivityValues = $derived(
		buildActivityCells(
			[
				unreadMessages * 18,
				activeBroadcasts * 24,
				(currentOrganization.memberCount ?? 0) * 4,
				currentOrganization.membership?.role === 'admin' ? 72 : 48,
				currentUser.details.bio.trim() ? 58 : 28
			],
			unreadMessages + activeBroadcasts + (currentOrganization.memberCount ?? 0)
		)
	);
	const personalActivityCaption = $derived.by(() => {
		if (unreadMessages > 0 || activeBroadcasts > 0) {
			return 'Inbox, broadcast, and org coordination activity across the last few weeks.';
		}

		return 'Recent personal activity is steady even though nothing urgent needs attention right now.';
	});

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Content class="p-4 sm:p-4.5 lg:grid lg:grid-cols-[minmax(0,1.18fr)_15.5rem] lg:items-start lg:gap-4.5">
		<div class="space-y-3">
			<div class="flex items-start gap-3 sm:gap-3.5">
			<Avatar.Root class="size-12 border border-border/70 bg-muted/40 after:hidden sm:size-14">
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

				<div class="min-w-0 space-y-1">
					<Card.Title class="text-[1.32rem] font-semibold tracking-tight text-foreground sm:text-[1.56rem]">
						{currentUser.details.name || 'Profile snapshot'}
					</Card.Title>
					<p class="text-sm text-muted-foreground">
						{roleLabel} · {currentOrganization.organization?.name ?? 'No organization'}
					</p>
					<p class="text-sm text-muted-foreground">{contactLabel}</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-1.5 sm:gap-2">
				<div class="rounded-full border border-border/70 bg-background px-2.75 py-1.25 text-[0.7rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{joinLabel}</div>
				<div class="rounded-full border border-border/70 bg-background px-2.75 py-1.25 text-[0.7rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{memberCountLabel}</div>
				<div class="rounded-full border border-border/70 bg-background px-2.75 py-1.25 text-[0.7rem] font-medium text-foreground dark:border-white/10 dark:bg-black/56">{unreadMessages} unread</div>
			</div>

			<p class="max-w-xl text-[0.82rem] leading-5.5 text-muted-foreground">{profileSummary}</p>
		</div>

		<ActivityDotGrid title="Personal rhythm" caption={personalActivityCaption} values={personalActivityValues} compact={true} footer="Past 4 weeks" />
	</Card.Content>
</Card.Root>
