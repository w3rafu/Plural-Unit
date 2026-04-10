<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

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

		return new Date(createdAt).toLocaleDateString([], {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	});

	const overviewStats = $derived.by(() => [
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
	]);
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Overview</Card.Title>
		<Card.Description>Review the basics tied to your organization membership.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-5">
		<div class="grid gap-3 sm:grid-cols-2">
			{#each overviewStats as stat (stat.label)}
				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						{stat.label}
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">{stat.value}</p>
				</div>
			{/each}
		</div>

		<p class="text-sm leading-6 text-muted-foreground">
			{#if currentOrganization.isAdmin}
				Your account can manage join access and invitations from the access section.
			{:else}
				Your account is connected to this shared organization space.
			{/if}
		</p>
	</Card.Content>
</Card.Root>
