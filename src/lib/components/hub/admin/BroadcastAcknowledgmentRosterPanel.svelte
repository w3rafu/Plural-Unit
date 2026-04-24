<script lang="ts">
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { getBroadcastAcknowledgmentRosterSummaryCopy } from '$lib/models/broadcastAcknowledgmentModel';
	import type { BroadcastRow } from '$lib/repositories/hubRepository';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatShortDateTime } from '$lib/utils/dateFormat';

	let { broadcast }: { broadcast: BroadcastRow } = $props();

	let openingConversationForProfileId = $state('');
	const acknowledgmentRoster = $derived(currentHub.getBroadcastAcknowledgmentRoster(broadcast.id));
	const summaryCopy = $derived.by(() =>
		acknowledgmentRoster
			? getBroadcastAcknowledgmentRosterSummaryCopy(acknowledgmentRoster)
			: 'Current member roster unavailable.'
	);

	async function messageProfile(profileId: string) {
		openingConversationForProfileId = profileId;

		try {
			await currentMessages.openConversationForProfile(profileId, currentUser.details.id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description:
					error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		} finally {
			openingConversationForProfileId = '';
		}
	}
</script>

{#if acknowledgmentRoster}
	<div class="mt-1 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm">
		<div class="space-y-1">
			<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Acknowledgment follow-up
			</p>
			<p class="text-[0.82rem] text-muted-foreground">{summaryCopy}</p>
			{#if acknowledgmentRoster.externalAcknowledgmentCount > 0}
				<p class="text-[0.82rem] text-muted-foreground">
					{acknowledgmentRoster.externalAcknowledgmentCount} saved acknowledgment outcome{acknowledgmentRoster.externalAcknowledgmentCount === 1 ? '' : 's'} belong{acknowledgmentRoster.externalAcknowledgmentCount === 1 ? 's' : ''} to people no longer on the current roster.
				</p>
			{/if}
		</div>

		<div class="space-y-2">
			<p class="text-[0.82rem] font-medium text-foreground">Still needs follow-up</p>
			{#if acknowledgmentRoster.pendingEntries.length === 0}
				<p class="text-[0.82rem] text-muted-foreground">
					Everyone on the current roster has acknowledged this broadcast.
				</p>
			{:else}
				<div class="space-y-2">
					{#each acknowledgmentRoster.pendingEntries.slice(0, 4) as entry (entry.member.profile_id)}
						<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
							<div class="min-w-0 flex-1 space-y-0.5">
								<div class="flex flex-wrap items-center gap-2">
									<p class="truncate text-sm font-medium text-foreground">
										{entry.member.name || 'Unnamed member'}
									</p>
									{#if entry.isCurrentUser}
										<Badge variant="outline">You</Badge>
									{/if}
								</div>
								<p class="text-[0.82rem] text-muted-foreground">
									{entry.member.email || entry.member.phone_number || 'No contact added'}
								</p>
							</div>
							{#if !entry.isCurrentUser}
								<Button
									type="button"
									variant="ghost"
									size="xs"
									disabled={openingConversationForProfileId === entry.member.profile_id}
									onclick={() => messageProfile(entry.member.profile_id)}
								>
									{openingConversationForProfileId === entry.member.profile_id ? 'Opening...' : 'Message'}
								</Button>
							{/if}
						</div>
					{/each}
				</div>
				{#if acknowledgmentRoster.pendingEntries.length > 4}
					<p class="text-[0.82rem] text-muted-foreground">
						+{acknowledgmentRoster.pendingEntries.length - 4} more member{acknowledgmentRoster.pendingEntries.length - 4 === 1 ? '' : 's'} still need acknowledgment follow-up.
					</p>
				{/if}
			{/if}
		</div>

		{#if acknowledgmentRoster.acknowledgedEntries.length > 0}
			<div class="space-y-2">
				<p class="text-[0.82rem] font-medium text-foreground">Recently acknowledged</p>
				<div class="space-y-2">
					{#each acknowledgmentRoster.acknowledgedEntries.slice(0, 4) as entry (entry.member.profile_id)}
						<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
							<div class="min-w-0 flex-1 space-y-0.5">
								<div class="flex flex-wrap items-center gap-2">
									<p class="truncate text-sm font-medium text-foreground">
										{entry.member.name || 'Unnamed member'}
									</p>
									<Badge variant="secondary">Acknowledged</Badge>
									{#if entry.isCurrentUser}
										<Badge variant="outline">You</Badge>
									{/if}
								</div>
								<p class="text-[0.82rem] text-muted-foreground">
									{entry.acknowledgedAt
										? `Acknowledged ${formatShortDateTime(entry.acknowledgedAt)}.`
										: 'Acknowledged.'}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}