<script lang="ts">
	import { Pencil } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatShortDate } from '$lib/utils/dateFormat';

	let isEditing = $state(false);
	let editName = $state('');

	function startEditing() {
		editName = currentOrganization.organization?.name ?? '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	async function saveName() {
		const trimmed = editName.trim();
		if (!trimmed) return;
		if (trimmed === currentOrganization.organization?.name) {
			isEditing = false;
			return;
		}

		try {
			await currentOrganization.updateName(trimmed);
			isEditing = false;
			toast({
				title: 'Organization updated',
				description: 'The organization name was changed.',
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not update name',
				description: error instanceof Error ? error.message : 'Failed to save the organization name.',
				variant: 'error'
			});
		}
	}

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
		<Card.Description>Your organization membership at a glance.</Card.Description>
	</Card.Header>

	<Card.Content>
		<div class="metric-grid">
			{#each overviewStats as stat (stat.label)}
				<div class="metric-card">
					<div>
						<p class="metric-label">{stat.label}</p>
						{#if stat.label === 'Organization' && isEditing}
							<form
								class="mt-1 flex items-center gap-2"
								onsubmit={(e) => { e.preventDefault(); saveName(); }}
							>
								<Input
									bind:value={editName}
									class="h-8 text-sm"
									placeholder="Organization name"
									disabled={currentOrganization.isMutating}
								/>
								<Button
									type="submit"
									size="sm"
									variant="default"
									disabled={!editName.trim() || currentOrganization.isMutating}
								>
									{currentOrganization.isMutating ? 'Saving…' : 'Save'}
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={currentOrganization.isMutating}
									onclick={cancelEditing}
								>
									Cancel
								</Button>
							</form>
						{:else}
							<p class="metric-value metric-value--compact">
								{stat.value}
								{#if stat.label === 'Organization' && currentOrganization.isAdmin}
									<button
										type="button"
										class="text-muted-foreground hover:text-foreground ml-1 inline-flex align-middle transition-colors"
										onclick={startEditing}
										aria-label="Edit organization name"
									>
										<Pencil class="h-3.5 w-3.5" />
									</button>
								{/if}
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
