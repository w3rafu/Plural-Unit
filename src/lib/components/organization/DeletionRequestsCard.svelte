<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
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

<Card.Root size="sm" class="border-border/70 bg-muted/10 shadow-none">
	<Card.Header class="gap-1.5 border-b border-border/60 pb-3">
		<Card.Title class="text-base font-semibold tracking-tight">Deletion requests</Card.Title>
		<Card.Description>Pending member offboarding requests that still need admin review.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-3 p-4 sm:p-4.5">
		{#if currentOrganization.isLoadingDeletionRequests && currentOrganization.deletionRequests.length === 0}
			<p class="text-sm text-muted-foreground">Loading pending requests…</p>
		{:else if currentOrganization.deletionRequests.length === 0}
			<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
				<p class="font-medium text-foreground">No pending deletion requests</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Member offboarding requests will appear here once someone flags their account for removal.
				</p>
			</div>
		{:else}
			<div class="space-y-2.5">
				{#each currentOrganization.deletionRequests as request (request.profile_id)}
					<div class="rounded-[1.15rem] border border-border/70 bg-background px-3.5 py-3.5">
						<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0 space-y-2">
								<div class="space-y-1">
									<p class="text-sm font-medium text-foreground">{request.name || 'Unnamed member'}</p>
									<p class="text-xs text-muted-foreground">
										{request.email || request.phone_number || 'No contact added'}
									</p>
								</div>

								<p class="text-sm text-muted-foreground">
									Requested {formatShortDateTime(request.deletion_requested_at)}
								</p>

								{#if request.bio}
									<p class="text-sm text-muted-foreground wrap-break-word">{request.bio}</p>
								{/if}
							</div>

							<div class="flex shrink-0 items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={currentOrganization.isMutating}
									onclick={() => reviewRequest(request.profile_id, request.name)}
								>
									Mark reviewed
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>