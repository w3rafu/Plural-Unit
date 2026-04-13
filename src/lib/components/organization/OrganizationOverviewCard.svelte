<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { formatShortDate } from '$lib/utils/dateFormat';

	const joinedLabel = $derived.by(() => {
		switch (currentOrganization.membership?.joined_via) {
			case 'created':
				return 'Created this organization';
			case 'invitation':
				return 'Joined by invitation';
			case 'code':
				return 'Joined with join code';
			default:
				return 'Membership pending';
		}
	});

	const createdLabel = $derived.by(() => {
		const createdAt = currentOrganization.organization?.created_at;
		if (!createdAt) return '—';

		return formatShortDate(createdAt) || '—';
	});

	const overviewStats = $derived.by(() => {
		const base = [
			{
				label: 'Organization',
				value: currentOrganization.organization?.name ?? 'No organization yet'
			},
			{
				label: 'Role',
				value: currentOrganization.membership?.role ?? '—'
			},
			{
				label: 'Joined',
				value: joinedLabel
			},
			{
				label: 'Created',
				value: createdLabel
			}
		];

		const membersValue =
			currentOrganization.memberCount === null ? '—' : String(currentOrganization.memberCount);

		if (currentOrganization.isAdmin) {
			return [
				...base,
				{ label: 'Members', value: membersValue },
				{ label: 'Pending invites', value: String(currentOrganization.invitations.length) }
			];
		}

		return [...base, { label: 'Members', value: membersValue }];
	});
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Overview</Card.Title>
		<Card.Description>Review the basics tied to your organization membership.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-3">
		<div class="metric-grid">
			{#each overviewStats as stat (stat.label)}
				<div class="metric-card">
					<div>
						<p class="metric-label">{stat.label}</p>
						<p class="metric-value metric-value--compact">{stat.value}</p>
					</div>
				</div>
			{/each}
		</div>

		<p class="text-sm leading-5 text-muted-foreground">
			{#if currentOrganization.isAdmin}
				Your account can manage join access and invitations from the access section.
			{:else}
				Your account is connected to this shared organization space.
			{/if}
		</p>
	</Card.Content>
</Card.Root>
