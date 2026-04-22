<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { computeAvatarInitials } from '$lib/components/profile/avatarUploadModel';
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

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Content class="p-5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
			<Avatar.Root class="size-14 border border-border/70 bg-muted/50 shadow-sm after:hidden">
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
					<Card.Title class="text-xl font-semibold tracking-tight text-foreground">
						{currentUser.details.name || 'Profile snapshot'}
					</Card.Title>
					<p class="text-sm text-muted-foreground">
						{roleLabel} · {currentOrganization.organization?.name ?? 'No organization'}
					</p>
					<p class="text-sm text-muted-foreground">{contactLabel}</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-3 text-sm text-muted-foreground sm:justify-end">
				<span>{joinLabel}</span>
				<span>{memberCountLabel}</span>
			</div>
		</div>
	</Card.Content>
</Card.Root>
