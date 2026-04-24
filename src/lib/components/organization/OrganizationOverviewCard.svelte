<script lang="ts">
	import { Pencil } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatShortDate } from '$lib/utils/dateFormat';

	type OverviewSection = 'access' | 'members';
	type OverviewSectionOption = { id: OverviewSection; label: string };

	let {
		sections = [] as OverviewSectionOption[],
		activeSection = 'access' as OverviewSection,
		onSectionSelect = (_section: OverviewSection) => {}
	}: {
		sections?: OverviewSectionOption[];
		activeSection?: OverviewSection;
		onSectionSelect?: (section: OverviewSection) => void;
	} = $props();

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

	const memberCountLabel = $derived(
		currentOrganization.memberCount === null ? '— members' : `${currentOrganization.memberCount} members`
	);
	const inviteCountLabel = $derived(`${currentOrganization.invitations.length} pending invites`);
	const overviewChips = $derived.by(() => {
		const chips = [
			joinedLabel,
			createdLabel === '—' ? 'Created date pending' : `Created ${createdLabel}`,
			memberCountLabel
		];

		if (currentOrganization.isAdmin) {
			chips.push(inviteCountLabel);
		}

		return chips;
	});

	const showSectionNav = $derived(sections.length > 1);

</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Content class="space-y-2 px-4 py-3 sm:px-5 sm:py-3.25 lg:grid lg:grid-cols-[minmax(0,1.24fr)_minmax(14rem,0.76fr)] lg:items-start lg:gap-3.5 lg:space-y-0">
		<div class="space-y-2">
			<div class="space-y-1">
				<p class="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
				{#if isEditing}
					<form class="flex flex-col gap-2.5 sm:flex-row sm:items-center" onsubmit={(e) => { e.preventDefault(); saveName(); }}>
						<Input
							bind:value={editName}
							class="h-9 rounded-xl text-sm"
							placeholder="Organization name"
							disabled={currentOrganization.isMutating}
						/>
						<div class="flex items-center gap-2">
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
						</div>
					</form>
				{:else}
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="text-[1.08rem] font-semibold tracking-tight text-foreground sm:text-[1.46rem]">
							{currentOrganization.organization?.name ?? 'No organization yet'}
						</h2>
						{#if currentOrganization.isAdmin}
							<button
								type="button"
								class="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-black/56 sm:size-8"
								onclick={startEditing}
								aria-label="Edit organization name"
							>
								<Pencil class="h-3.5 w-3.5" />
							</button>
						{/if}
					</div>
				{/if}
				<p class="text-[0.88rem] leading-4.5 text-muted-foreground sm:text-[0.82rem]">
					{currentOrganization.membership?.role ?? '—'} access with join code, invitation, and roster controls below.
				</p>
			</div>

			<div class="flex flex-wrap gap-1.5 sm:gap-1.75">
				{#each overviewChips as chip (chip)}
					<div class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[0.82rem] font-medium text-foreground shadow-sm dark:border-white/10 dark:bg-black/56 sm:px-3 sm:py-1 sm:text-[0.86rem]">
						{chip}
					</div>
				{/each}
			</div>
		</div>

		<div class="space-y-1.75">
			{#if showSectionNav}
				<nav aria-label="Organization sections">
					<div class="segmented-control w-full rounded-full border border-border/70 bg-background/82 p-0.5 shadow-sm">
						{#each sections as section (section.id)}
							<button
								type="button"
								class={`h-7 min-w-0 flex-1 rounded-full px-3 text-center text-[0.88rem] font-medium transition-colors ${activeSection === section.id ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
								aria-current={activeSection === section.id ? 'page' : undefined}
								aria-pressed={activeSection === section.id}
								onclick={() => onSectionSelect(section.id)}
							>
								{section.label}
							</button>
						{/each}
					</div>
				</nav>
			{/if}

			<div class="grid grid-cols-3 gap-1.5">
				<div class="rounded-2xl border border-border/70 bg-muted/12 px-2.5 py-2 sm:px-3 sm:py-2.5">
					<p class="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Role</p>
					<p class="mt-0.5 text-[0.8rem] font-semibold text-foreground sm:text-[0.82rem]">{currentOrganization.membership?.role ?? '—'}</p>
				</div>
				<div class="rounded-2xl border border-border/70 bg-muted/12 px-2.5 py-2 sm:px-3 sm:py-2.5">
					<p class="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Members</p>
					<p class="mt-0.5 text-[0.8rem] font-semibold text-foreground sm:text-[0.82rem]">{currentOrganization.memberCount === null ? '—' : currentOrganization.memberCount}</p>
				</div>
				<div class="rounded-2xl border border-border/70 bg-muted/12 px-2.5 py-2 sm:px-3 sm:py-2.5">
					<p class="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Invites</p>
					<p class="mt-0.5 text-[0.8rem] font-semibold text-foreground sm:text-[0.82rem]">{currentOrganization.invitations.length}</p>
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
