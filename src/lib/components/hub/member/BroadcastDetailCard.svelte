<!--
  BroadcastDetailCard — full detail view for a single hub broadcast.

  Shows title, message, lifecycle state, publish/expiry metadata,
  delivery context, and acknowledgment actions.
-->
<script lang="ts">
	import { Clock } from '@lucide/svelte';
	import BroadcastAcknowledgmentRosterPanel from '$lib/components/hub/admin/BroadcastAcknowledgmentRosterPanel.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		getBroadcastStateLabel,
		isBroadcastDraft,
		isBroadcastScheduled
	} from '$lib/models/broadcastLifecycleModel';
	import type { BroadcastRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatShortDateTime } from '$lib/utils/dateFormat';

	let { broadcast } = $props<{ broadcast: BroadcastRow }>();

	const stateLabel = $derived(getBroadcastStateLabel(broadcast));
	const deliveryStatus = $derived(currentHub.getBroadcastDeliveryStatus(broadcast.id));
	const engagementSignal = $derived(currentHub.getBroadcastEngagementSignal(broadcast.id));
	const hasAcknowledged = $derived(currentHub.hasAcknowledged(broadcast.id));
	const acknowledgmentCount = $derived(currentHub.getAcknowledgmentCount(broadcast.id));
	const isSavingAcknowledgment = $derived(currentHub.broadcastAcknowledgmentTargetId === broadcast.id);
	const isAdmin = $derived(currentOrganization.isAdmin);
	const acknowledgmentRoster = $derived(currentHub.getBroadcastAcknowledgmentRoster(broadcast.id));
	const isLoadingMemberRoster = $derived(
		currentOrganization.isAdmin &&
			currentOrganization.isLoadingMembers &&
			currentOrganization.members.length === 0
	);
	const manageHref = $derived(`/hub/manage/content#broadcast-${broadcast.id}`);
	const publishedAtLabel = $derived.by(() => {
		if (broadcast.publish_at) {
			return formatShortDateTime(broadcast.publish_at);
		}

		if (isBroadcastDraft(broadcast)) {
			return 'Not published yet';
		}

		return formatShortDateTime(broadcast.created_at);
	});
	const detailCopy = $derived.by(() => {
		if (isBroadcastDraft(broadcast)) {
			return 'This broadcast is still in draft and not visible to members yet.';
		}

		if (isBroadcastScheduled(broadcast)) {
			return deliveryStatus?.copy ?? 'This broadcast is scheduled for later publication.';
		}

		return deliveryStatus?.copy ?? engagementSignal?.copy ?? 'This broadcast is live.';
	});
	const engagementCopy = $derived.by(() => engagementSignal?.copy ?? 'No additional engagement context available.');
	const acknowledgmentRosterCopy = $derived.by(() => {
		if (isLoadingMemberRoster) {
			return 'Loading current member roster for acknowledgment follow-up...';
		}

		if (!acknowledgmentRoster) {
			return 'Current member roster unavailable.';
		}

		if (acknowledgmentRoster.totalMembers === 0) {
			return 'Current member roster unavailable.';
		}

		if (acknowledgmentRoster.pendingCount === 0) {
			return `All ${acknowledgmentRoster.totalMembers} current member${acknowledgmentRoster.totalMembers === 1 ? '' : 's'} acknowledged.`;
		}

		const snapshot = `${acknowledgmentRoster.acknowledgedCount} acknowledged, ${acknowledgmentRoster.pendingCount} pending on the current roster.`;

		if (acknowledgmentRoster.externalAcknowledgmentCount > 0) {
			return `${snapshot} ${acknowledgmentRoster.externalAcknowledgmentCount} saved acknowledgment${acknowledgmentRoster.externalAcknowledgmentCount === 1 ? '' : 's'} belong${acknowledgmentRoster.externalAcknowledgmentCount === 1 ? 's' : ''} to former members.`;
		}

		return snapshot;
	});
	const metadataRows = $derived.by(() => {
		const rows = [
			`${broadcast.publish_at ? 'Published' : 'Created'} ${publishedAtLabel}`,
			`Last updated ${formatShortDateTime(broadcast.updated_at)}`
		];

		if (broadcast.expires_at) {
			rows.push(`Expires ${formatShortDateTime(broadcast.expires_at)}`);
		}

		return rows;
	});
	const utilityButtonClass = 'h-7 rounded-full px-2.5 text-[0.82rem] font-medium text-muted-foreground hover:text-foreground';

	async function toggleAcknowledgment() {
		try {
			if (hasAcknowledged) {
				await currentHub.unacknowledgeBroadcast(broadcast.id);
			} else {
				await currentHub.acknowledgeBroadcast(broadcast.id);
			}
		} catch (error) {
			toast({
				title: hasAcknowledged ? 'Could not update acknowledgment' : 'Could not acknowledge broadcast',
				description:
					error instanceof Error
						? error.message
						: 'The broadcast acknowledgment could not be updated.',
				variant: 'error'
			});
		}
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Content class="space-y-4">
		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="outline" class="rounded-xl px-2.5 py-1 text-[0.88rem] uppercase tracking-[0.16em]">
				{stateLabel}
			</Badge>
		</div>

		<div class="space-y-1.5">
			<h1 class="text-xl font-semibold text-foreground">{broadcast.title}</h1>
			<p class="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
				{broadcast.body || 'No details have been shared yet.'}
			</p>
		</div>

		<div class="space-y-2.5 border-t border-border/70 pt-3.5">
			<div class="grid grid-cols-2 gap-2 sm:gap-2.5">
				<div class="space-y-0.75 rounded-[0.95rem] border border-border/70 bg-background/70 px-2.5 py-2.25 shadow-sm sm:space-y-1 sm:rounded-[1rem] sm:px-3 sm:py-2.5">
					<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Visibility
					</p>
					<p class="text-[0.84rem] font-medium text-foreground sm:text-sm">{deliveryStatus?.label ?? stateLabel}</p>
					<p class="text-[0.84rem] leading-4 text-muted-foreground sm:text-[0.82rem]">{detailCopy}</p>
				</div>

				<div class="space-y-0.75 rounded-[0.95rem] border border-border/70 bg-background/70 px-2.5 py-2.25 shadow-sm sm:space-y-1 sm:rounded-[1rem] sm:px-3 sm:py-2.5">
					<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Acknowledgments
					</p>
					<p class="text-[0.84rem] font-medium text-foreground sm:text-sm">
						{acknowledgmentCount} {acknowledgmentCount === 1 ? 'member' : 'members'} acknowledged
					</p>
					<p class="text-[0.84rem] leading-4 text-muted-foreground sm:text-[0.82rem]">
						{hasAcknowledged
							? 'You already acknowledged this broadcast.'
							: 'Acknowledge it once you have read and understood the update.'}
					</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.84rem] text-muted-foreground">
				{#each metadataRows as row, index (row)}
					<div class={`flex items-center gap-2 ${index === 0 ? '' : 'sm:pl-0'}`}>
						{#if index === 0}
							<Clock class="size-4 shrink-0" />
						{/if}
						<span>{row}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="space-y-2.5 border-t border-border/70 pt-3.5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-sm font-semibold text-foreground">Your acknowledgment</h2>
				<p class="text-[0.82rem] text-muted-foreground">
					{acknowledgmentCount} {acknowledgmentCount === 1 ? 'acknowledgment' : 'acknowledgments'} total
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					variant={hasAcknowledged ? 'secondary' : 'outline'}
					size="sm"
					disabled={isSavingAcknowledgment}
					onclick={toggleAcknowledgment}
				>
					{#if isSavingAcknowledgment}
						Saving...
					{:else if hasAcknowledged}
						Acknowledged ✓
					{:else}
						Acknowledge
					{/if}
				</Button>
			</div>
		</div>

		{#if isAdmin}
			<div class="space-y-2.5 border-t border-border/70 pt-3.5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="space-y-1">
						<h2 class="text-sm font-semibold text-foreground">Admin context</h2>
					</div>
					<Button href={manageHref} variant="ghost" size="xs" class={utilityButtonClass}>
						Open in manage
					</Button>
				</div>

				<div class="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
					<div class="space-y-1 rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2.5 shadow-sm">
						<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Acknowledgment follow-up
						</p>
						<p class="text-sm font-medium text-foreground">{acknowledgmentCount} acknowledged so far</p>
						<p class="text-[0.82rem] text-muted-foreground">{acknowledgmentRosterCopy}</p>
					</div>

					<div class="space-y-1 rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2.5 shadow-sm">
						<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Lifecycle
						</p>
						<p class="text-sm font-medium text-foreground">
							{broadcast.expires_at ? 'Expiry set' : 'No expiry set'}
						</p>
						<p class="text-[0.82rem] text-muted-foreground">{engagementCopy}</p>
					</div>
				</div>

				{#if isLoadingMemberRoster}
					<p class="text-[0.82rem] text-muted-foreground">Loading member roster for admin follow-up...</p>
				{:else}
					<BroadcastAcknowledgmentRosterPanel {broadcast} />
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>