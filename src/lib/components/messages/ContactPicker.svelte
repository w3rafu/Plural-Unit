<!--
  ContactPicker — searchable list of organization members for starting a new conversation.

  Opens as a Sheet. Selecting a member triggers onSelectMember.
-->
<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import type { OrganizationMember } from '$lib/models/organizationModel';

	let {
		open = $bindable(false),
		members,
		currentProfileId = '',
		onSelectMember
	}: {
		open?: boolean;
		members: OrganizationMember[];
		currentProfileId?: string;
		onSelectMember: (profileId: string) => void;
	} = $props();

	let query = $state('');

	const filteredMembers = $derived.by(() => {
		const eligible = members.filter((m) => m.profile_id !== currentProfileId);
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return eligible;
		}

		return eligible.filter((m) => {
			const haystack = [m.name, m.email, m.role].join(' ').toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	});

	function handleSelect(profileId: string) {
		open = false;
		query = '';
		onSelectMember(profileId);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="right"
		class="w-full max-w-md border-border/70 bg-background/98 backdrop-blur-sm"
	>
		<Sheet.Header class="gap-2 border-border/70">
			<Sheet.Title class="text-lg font-semibold tracking-tight text-foreground">
				New message
			</Sheet.Title>
			<Sheet.Description class="text-sm leading-6 text-muted-foreground">
				Choose a member to start a conversation with.
			</Sheet.Description>
		</Sheet.Header>

		<div class="space-y-3 px-5 py-4">
			<label class="relative block">
				<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search by name or email"
					class="h-10 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
					bind:value={query}
				/>
			</label>

			{#if filteredMembers.length === 0}
				<p class="py-4 text-center text-sm text-muted-foreground">
					{query ? 'No members match your search.' : 'No other members in this organization.'}
				</p>
			{:else}
				<div class="max-h-[60vh] space-y-1 overflow-y-auto">
					{#each filteredMembers as member (member.profile_id)}
						<Button
							type="button"
							variant="ghost"
							class="w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left"
							onclick={() => handleSelect(member.profile_id)}
						>
							<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
								{member.name.trim().charAt(0) || '?'}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">{member.name}</p>
								<p class="truncate text-xs text-muted-foreground">{member.email}</p>
							</div>
						</Button>
					{/each}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
