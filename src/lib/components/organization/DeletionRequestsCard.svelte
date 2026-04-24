<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatShortDateTime } from '$lib/utils/dateFormat';

	async function reviewRequest(profileId: string, memberName: string) {
		try {
			await currentOrganization.resolvePendingDeletionRequest(profileId);
			toast({
				title: 'Deletion request reviewed',
				description: `${memberName || 'The member'} was removed from the pending deletion queue.`,
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not review request',
				description: error instanceof Error ? error.message : 'Failed to review the deletion request.',
				variant: 'error'
			});
		}
	}
</script>

{#if currentOrganization.isLoadingDeletionRequests && currentOrganization.deletionRequests.length === 0}
	<div class="rounded-2xl border border-border/70 bg-background/78 px-3 py-2">
		<p class="text-[0.86rem] text-muted-foreground">Loading pending requests…</p>
	</div>
{:else if currentOrganization.deletionRequests.length === 0}
	<!-- no pending deletion requests -->
{:else}
	{@const request = currentOrganization.deletionRequests[0]}
	<section class="rounded-2xl border border-border/70 bg-background/78 px-2.5 py-1.75 shadow-sm">
		<div class="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0 space-y-0.5">
				<p class="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deletion requests</p>
				<p class="text-[0.84rem] leading-4.5 text-muted-foreground">
					{#if currentOrganization.deletionRequests.length === 1}
						<span class="font-medium text-foreground">1 pending</span>
						 with <span class="font-medium text-foreground">{request.name || 'Unnamed member'}</span>
						 next in queue since {formatShortDateTime(request.deletion_requested_at)}.
					{:else}
						<span class="font-medium text-foreground">{currentOrganization.deletionRequests.length} pending</span>
						 with <span class="font-medium text-foreground">{request.name || 'Unnamed member'}</span>
						 next in the review queue.
					{/if}
				</p>
			</div>

			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="h-6.5 rounded-full px-2.5 text-[0.86rem] text-foreground hover:bg-muted/70"
				disabled={currentOrganization.isMutating}
				onclick={() => reviewRequest(request.profile_id, request.name)}
			>
				{currentOrganization.deletionRequests.length === 1 ? 'Mark reviewed' : 'Review next'}
			</Button>
		</div>
	</section>
{/if}