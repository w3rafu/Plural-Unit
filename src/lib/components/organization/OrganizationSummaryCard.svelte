<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	const organizationInitials = $derived.by(() => {
		const source = currentOrganization.organization?.name?.trim() || 'Organization';

		return (
			source
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((part) => part[0]?.toUpperCase() ?? '')
				.join('') || 'O'
		);
	});

	const joinLabel = $derived.by(() => {
		switch (currentOrganization.membership?.joined_via) {
			case 'created':
				return 'Created here';
			case 'invitation':
				return 'Joined by invite';
			case 'code':
				return 'Joined by code';
			default:
				return 'Membership pending';
		}
	});

	const roleLabel = $derived(
		currentOrganization.membership?.role === 'admin' ? 'Organization admin' : 'Organization member'
	);

	const summaryText = $derived.by(() => {
		if (currentOrganization.isAdmin) {
			return 'Manage join access, keep the join code current, and review pending invitations from this page.';
		}

		return 'Find the join code, member count, and the shared organization details your account belongs to.';
	});

	const stats = $derived.by(() => {
		const membersValue =
			currentOrganization.memberCount === null ? '—' : String(currentOrganization.memberCount);

		if (currentOrganization.isAdmin) {
			return [
				{ label: 'Members', value: membersValue },
				{ label: 'Pending invites', value: String(currentOrganization.invitations.length) },
				{ label: 'Join code', value: currentOrganization.organization?.join_code ?? '—' }
			];
		}

		return [
			{ label: 'Members', value: membersValue },
			{ label: 'Joined', value: joinLabel },
			{ label: 'Join code', value: currentOrganization.organization?.join_code ?? '—' }
		];
	});
</script>

<Card.Root size="sm" class="border-border/70 bg-card/80">
	<Card.Header class="gap-4 border-b border-border/70">
		<div class="flex items-center gap-4">
			<div
				class="flex size-14 items-center justify-center rounded-full bg-muted text-base font-semibold tracking-tight text-foreground"
				aria-hidden="true"
			>
				{organizationInitials}
			</div>

			<div class="min-w-0 space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">
					{currentOrganization.organization?.name ?? 'Organization'}
				</Card.Title>
				<Card.Description>{roleLabel}</Card.Description>
				<Card.Description>{joinLabel}</Card.Description>
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-5">
		<div class="grid gap-3 sm:grid-cols-3">
			{#each stats as stat (stat.label)}
				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						{stat.label}
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">{stat.value}</p>
				</div>
			{/each}
		</div>

		<p class="text-sm leading-6 text-muted-foreground">{summaryText}</p>
	</Card.Content>

	<Card.Footer class="border-t border-border/70 pt-4">
		<div class="flex flex-wrap gap-2">
			<Badge variant="secondary">{currentOrganization.membership?.role ?? 'member'}</Badge>
			<Badge variant="outline">{currentOrganization.organization?.join_code ?? 'No join code'}</Badge>
		</div>
	</Card.Footer>
</Card.Root>
