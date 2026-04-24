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
	{#if currentOrganization.deletionRequests.length === 1}
		{@const request = currentOrganization.deletionRequests[0]}
		<section class="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 shadow-sm">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0 space-y-1">
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deletion requests</p>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<p class="text-sm font-medium text-foreground">{request.name || 'Unnamed member'}</p>
						<p class="text-[0.76rem] text-muted-foreground">{request.email || request.phone_number || 'No contact added'}</p>
						<p class="text-[0.76rem] text-muted-foreground">Requested {formatShortDateTime(request.deletion_requested_at)}</p>
					</div>
					{#if request.bio}
						<p class="text-[0.78rem] leading-5 text-muted-foreground wrap-break-word">{request.bio}</p>
					{/if}
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					class="h-8 rounded-xl px-3"
					disabled={currentOrganization.isMutating}
					onclick={() => reviewRequest(request.profile_id, request.name)}
				>
					Mark reviewed
				</Button>
			</div>
		</section>
	{:else}
		<section class="space-y-1.5 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
			<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deletion requests</p>
					<p class="text-[0.8rem] text-muted-foreground">
						{currentOrganization.deletionRequests.length} pending offboarding requests
					</p>
				</div>
			</div>

			<div class="space-y-1.5">
				{#each currentOrganization.deletionRequests as request (request.profile_id)}
					<div class="rounded-xl border border-border/60 bg-background px-3 py-2.25 shadow-sm">
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0 space-y-1">
								<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
									<p class="text-sm font-medium text-foreground">{request.name || 'Unnamed member'}</p>
									<p class="text-[0.76rem] text-muted-foreground">{request.email || request.phone_number || 'No contact added'}</p>
								</div>
								<p class="text-[0.76rem] text-muted-foreground">Requested {formatShortDateTime(request.deletion_requested_at)}</p>
								{#if request.bio}
									<p class="text-[0.78rem] leading-5 text-muted-foreground wrap-break-word">{request.bio}</p>
								{/if}
							</div>

							<Button
								type="button"
								variant="outline"
								size="sm"
								class="h-8 rounded-xl px-3"
								disabled={currentOrganization.isMutating}
								onclick={() => reviewRequest(request.profile_id, request.name)}
							>
								Mark reviewed
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
{/if}