<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
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

	const supportingText = $derived.by(() => {
		if (currentOrganization.organization && currentUser.details.name.trim()) {
			return `${currentUser.details.name.trim()} is connected to ${currentOrganization.organization.name} and can manage account details from this page.`;
		}

		if (currentOrganization.organization) {
			return `Your account is connected to ${currentOrganization.organization.name}. Finish adding profile details so teammates know who is showing up.`;
		}

		return 'Profile details will appear here once your membership is loaded.';
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

	const overviewStats = $derived.by(() => [
		{
			label: 'Organization',
			value: currentOrganization.organization?.name ?? 'Not connected'
		},
		{
			label: 'Role',
			value: currentOrganization.membership?.role ?? '—'
		},
		{
			label: 'Contact',
			value: contactLabel
		},
		{
			label: 'Members',
			value: currentOrganization.memberCount === null ? 'Loading...' : String(currentOrganization.memberCount)
		}
	]);

	$effect(() => {
		if (currentOrganization.organization && currentOrganization.memberCount === null) {
			void currentOrganization.loadMemberCount();
		}
	});
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-3.5 border-b border-border/70">
		<div class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
			<Avatar.Root class="size-16 border border-border/70 bg-muted/50 shadow-sm after:hidden">
				{#if currentUser.details.avatar_url}
					<Avatar.Image
						src={currentUser.details.avatar_url}
						alt={`${currentUser.details.name || 'Member'} profile`}
					/>
				{:else}
					<Avatar.Fallback class="text-lg font-semibold tracking-tight text-foreground">
						{profileInitials}
					</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="min-w-0 space-y-2">
				<div class="space-y-1">
					<div class="space-y-1">
						<Card.Title class="text-lg font-semibold tracking-tight text-foreground">
							{currentUser.details.name || 'Profile snapshot'}
						</Card.Title>
						<Card.Description>{roleLabel}</Card.Description>
						<Card.Description>{joinLabel}</Card.Description>
					</div>
				</div>
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<div class="metric-grid">
			{#each overviewStats as stat (stat.label)}
				<div class="metric-card min-w-0">
					<div>
						<p class="metric-label">{stat.label}</p>
						<p class="metric-value metric-value--compact wrap-break-word">{stat.value}</p>
					</div>
				</div>
			{/each}
		</div>

		<p class="max-w-2xl text-sm leading-6 text-muted-foreground">{supportingText}</p>
	</Card.Content>

	<Card.Footer class="border-t border-border/70 pt-4">
		<div class="flex flex-wrap gap-2">
			<Badge variant="secondary">{currentOrganization.membership?.role ?? 'member'}</Badge>
			<Badge variant="outline">{currentOrganization.organization?.name ?? 'No organization'}</Badge>
		</div>
	</Card.Footer>
</Card.Root>
