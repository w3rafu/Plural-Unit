<!--
  ProfileDangerZoneCard — account deletion request UI.

  Shows a red-bordered card with a "Delete my account" button.
  On confirm, calls currentUser.requestAccountDeletion().
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import ConfirmActionSheet from '$lib/components/ui/ConfirmActionSheet.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatShortDateTime } from '$lib/utils/dateFormat';

	let confirmOpen = $state(false);
	let isSubmitting = $state(false);

	const deletionRequestedAt = $derived(currentUser.details.deletion_requested_at);
	const deletionReviewedAt = $derived(currentUser.details.deletion_reviewed_at);
	const hasPendingDeletionRequest = $derived(!!deletionRequestedAt && !deletionReviewedAt);
	const hasReviewedDeletionRequest = $derived(!!deletionReviewedAt);

	async function handleConfirm() {
		isSubmitting = true;
		try {
			await currentUser.requestAccountDeletion();
			confirmOpen = false;
			toast({
				title: 'Deletion requested',
				description: 'Your account has been flagged for deletion. An admin will process this shortly.',
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not request deletion',
				description: error instanceof Error ? error.message : 'Please try again later.',
				variant: 'error'
			});
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card.Root size="sm" class="border-destructive/30 bg-card">
	<Card.Header class="gap-2 border-b border-destructive/20">
		<Card.Title class="text-lg font-semibold tracking-tight text-destructive">Danger zone</Card.Title>
		<Card.Description>Irreversible actions that affect your account.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-3">
		{#if hasPendingDeletionRequest && deletionRequestedAt}
			<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
				<p class="text-sm font-medium text-foreground">Deletion request pending</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Requested {formatShortDateTime(deletionRequestedAt)}. An admin still needs to review this request.
				</p>
			</div>
		{:else if hasReviewedDeletionRequest && deletionRequestedAt && deletionReviewedAt}
			<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
				<p class="text-sm font-medium text-foreground">Deletion request reviewed</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Requested {formatShortDateTime(deletionRequestedAt)} and reviewed {formatShortDateTime(deletionReviewedAt)}. Final account removal is handled outside the app.
				</p>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">
				Requesting account deletion will flag your profile for removal. An admin will review and process
				the request. This action cannot be undone.
			</p>
			<Button type="button" variant="destructive" size="sm" onclick={() => (confirmOpen = true)}>
				Delete my account
			</Button>
		{/if}
	</Card.Content>
</Card.Root>

<ConfirmActionSheet
	bind:open={confirmOpen}
	title="Delete your account?"
	description="This will flag your account for permanent deletion. An admin will process the request and all your data will be removed."
	details={['Your profile, messages, and responses will be permanently deleted.', 'This action cannot be undone.']}
	confirmLabel="Yes, delete my account"
	confirmBusyLabel="Requesting deletion..."
	confirmVariant="destructive"
	{isSubmitting}
	onConfirm={handleConfirm}
/>
