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
	<div class="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
		<p class="text-[0.8rem] text-muted-foreground">Loading pending requests…</p>
	</div>
{:else if currentOrganization.deletionRequests.length === 0}
	<!-- no pending deletion requests -->
{:else}
	{@const request = currentOrganization.deletionRequests[0]}
	<section class="rounded-xl border border-border/70 bg-background/70 px-3 py-2.25 shadow-sm">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div class="min-w-0 space-y-0.5">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deletion requests</p>
				<p class="text-[0.78rem] leading-5 text-muted-foreground">
					{#if currentOrganization.deletionRequests.length === 1}
						<span class="font-medium text-foreground">{request.name || 'Unnamed member'}</span>
						 requested deletion {formatShortDateTime(request.deletion_requested_at)}.
					{:else}
						<span class="font-medium text-foreground">{currentOrganization.deletionRequests.length} pending</span>
						 with {request.name || 'Unnamed member'} next in the review queue.
					{/if}
				</p>
			</div>

			<Button
				type="button"
				variant="outline"
				size="sm"
				class="h-8 rounded-xl px-3"
				disabled={currentOrganization.isMutating}
				onclick={() => reviewRequest(request.profile_id, request.name)}
			>
				{currentOrganization.deletionRequests.length === 1 ? 'Mark reviewed' : 'Review next'}
			</Button>
		</div>
	</section>
{/if}