<!--
	BroadcastEditor — admin form to create, edit, and manage broadcasts.

  Rendered by the hub manage page when the `broadcasts` plugin is active.
-->
<script lang="ts">
	import { syncUnsavedChanges } from '$lib/actions/unsavedChanges';
	import ExecutionDiagnosticsPanel from '$lib/components/hub/admin/ExecutionDiagnosticsPanel.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import * as Select from '$lib/components/ui/select';
	import {
		getBroadcastStateLabel,
		isBroadcastDraft,
		isBroadcastExpired,
		isBroadcastScheduled,
		parseBroadcastDateTimeLocalValue,
		toBroadcastDateTimeLocalValue
	} from '$lib/models/broadcastLifecycleModel';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import type { BroadcastRow } from '$lib/repositories/hubRepository';
	import { Textarea } from '$lib/components/ui/textarea';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { formatShortDate, formatShortDateTime } from '$lib/utils/dateFormat';

	type BroadcastDeliveryMode = 'draft' | 'now' | 'schedule';

	const BROADCAST_DELIVERY_OPTIONS = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'now', label: 'Publish now' },
		{ value: 'schedule', label: 'Schedule' }
	] as const satisfies Array<{ value: BroadcastDeliveryMode; label: string }>;

	let editingId = $state<string | null>(null);
	let title = $state('');
	let body = $state('');
	let deliveryMode = $state<BroadcastDeliveryMode>('now');
	let publishAt = $state('');
	let expiresAt = $state('');
	let feedback = $state('');
	const UNSAVED_CHANGES_KEY = 'hub-broadcast-editor';

	function getBroadcastDeliveryMode(broadcast: BroadcastRow | null): BroadcastDeliveryMode {
		if (!broadcast) {
			return 'now';
		}

		if (isBroadcastDraft(broadcast)) {
			return 'draft';
		}

		if (isBroadcastScheduled(broadcast)) {
			return 'schedule';
		}

		return 'now';
	}

	const editingBroadcast = $derived(
		editingId ? currentHub.broadcasts.find((broadcast) => broadcast.id === editingId) ?? null : null
	);
	const initialBroadcastSnapshot = $derived.by(() =>
		{
			const mode = getBroadcastDeliveryMode(editingBroadcast);

			return createDirtySnapshot({
				title: editingBroadcast?.title.trim() ?? '',
				body: editingBroadcast?.body.trim() ?? '',
				deliveryMode: mode,
				publishAt:
					mode === 'schedule'
						? toBroadcastDateTimeLocalValue(editingBroadcast?.publish_at ?? null)
						: '',
				expiresAt: toBroadcastDateTimeLocalValue(editingBroadcast?.expires_at ?? null)
			});
		}
	);
	const currentBroadcastSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			body: body.trim(),
			deliveryMode,
			publishAt: deliveryMode === 'schedule' ? publishAt.trim() : '',
			expiresAt: expiresAt.trim()
		})
	);
	const draftBroadcasts = $derived(currentHub.draftBroadcasts);
	const scheduledBroadcasts = $derived(currentHub.scheduledBroadcasts);
	const isEditing = $derived(!!editingBroadcast);
	const activeBroadcasts = $derived(currentHub.activeBroadcasts);
	const inactiveBroadcasts = $derived(currentHub.inactiveBroadcasts);
	const isBroadcastDirty = $derived(currentBroadcastSnapshot !== initialBroadcastSnapshot);
	const isBroadcastMutating = $derived(currentHub.broadcastTargetId !== '');
	const broadcastMutationStatus = $derived.by(() => {
		if (!isBroadcastMutating) {
			return '';
		}

		if (currentHub.broadcastTargetId === 'draft') {
			return isEditing ? 'Saving broadcast changes...' : 'Saving broadcast...';
		}

		if (editingId && currentHub.broadcastTargetId === editingId) {
			return 'Saving changes to this broadcast...';
		}

		return 'Updating broadcast list...';
	});
	const visibilityDescription = $derived.by(() => {
		switch (deliveryMode) {
			case 'draft':
				return 'Keep the broadcast private until the content is ready.';
			case 'schedule':
				return 'Set a future publish time so members see the broadcast later.';
			default:
				return 'Publish the broadcast to members immediately.';
		}
	});
	const submitLabel = $derived.by(() => {
		switch (deliveryMode) {
			case 'draft':
				return 'Save draft';
			case 'schedule':
				return isEditing ? 'Save scheduled broadcast' : 'Schedule broadcast';
			default:
				return isEditing ? 'Save live broadcast' : 'Publish now';
		}
	});

	function resetForm() {
		editingId = null;
		title = '';
		body = '';
		deliveryMode = 'now';
		publishAt = '';
		expiresAt = '';
		feedback = '';
	}

	function startEditing(broadcast: BroadcastRow) {
		editingId = broadcast.id;
		title = broadcast.title;
		body = broadcast.body;
		deliveryMode = getBroadcastDeliveryMode(broadcast);
		publishAt =
			deliveryMode === 'schedule' ? toBroadcastDateTimeLocalValue(broadcast.publish_at) : '';
		expiresAt = toBroadcastDateTimeLocalValue(broadcast.expires_at);
		feedback = '';
	}

	function getMetaCopy(broadcast: BroadcastRow) {
		const parts = [];

		if (isBroadcastDraft(broadcast)) {
			parts.push(`Updated ${formatShortDateTime(broadcast.updated_at)}`);
		} else if (isBroadcastScheduled(broadcast)) {
			parts.push(`Publishes ${formatShortDateTime(broadcast.publish_at ?? broadcast.created_at)}`);
		} else if (broadcast.publish_at) {
			parts.push(`Published ${formatShortDateTime(broadcast.publish_at)}`);
		} else {
			parts.push(`Posted ${formatShortDate(broadcast.created_at)}`);
		}

		if (broadcast.expires_at) {
			parts.push(`Expires ${formatShortDateTime(broadcast.expires_at)}`);
		}

		return parts.join(' · ');
	}

	function getHistoryCopy(broadcast: BroadcastRow) {
		if (broadcast.archived_at) {
			return `Archived ${formatShortDateTime(broadcast.archived_at)}.`;
		}

		if (isBroadcastExpired(broadcast)) {
			return `Expired ${formatShortDateTime(broadcast.expires_at ?? broadcast.updated_at)}.`;
		}

		return `Last updated ${formatShortDateTime(broadcast.updated_at)}.`;
	}

	function getEngagementSignal(broadcastId: string) {
		return currentHub.getBroadcastEngagementSignal(broadcastId);
	}

	function getDeliveryStatus(broadcastId: string) {
		return currentHub.getBroadcastDeliveryStatus(broadcastId);
	}

	function getEngagementClass(broadcastId: string) {
		return getEngagementSignal(broadcastId)?.needsAttention
			? 'text-xs text-foreground'
			: 'text-xs text-muted-foreground';
	}

	function getDeliveryClass(broadcastId: string) {
		return getDeliveryStatus(broadcastId)?.needsAttention
			? 'text-xs text-foreground'
			: 'text-xs text-muted-foreground';
	}

	function getDeliveryCopy(broadcastId: string) {
		const deliveryStatus = getDeliveryStatus(broadcastId);
		if (!deliveryStatus) {
			return null;
		}

		return deliveryStatus.state === 'scheduled'
			? 'Delivery scheduled.'
			: deliveryStatus.copy;
	}

	async function submit() {
		feedback = '';
		if (!title.trim()) {
			feedback = 'Enter a title.';
			return;
		}
		if (!body.trim()) {
			feedback = 'Enter a message.';
			return;
		}
		try {
			const parsedPublishAt = parseBroadcastDateTimeLocalValue(
				publishAt,
				'Pick a valid publish date and time.'
			);
			const parsedExpiresAt = parseBroadcastDateTimeLocalValue(
				expiresAt,
				'Pick a valid expiration date and time.'
			);
			const now = Date.now();

			if (deliveryMode === 'schedule' && !parsedPublishAt) {
				feedback = 'Pick a publish date and time.';
				return;
			}

			if (deliveryMode === 'schedule' && parsedPublishAt) {
				if (new Date(parsedPublishAt).getTime() <= now) {
					feedback = 'Scheduled publish time must be in the future.';
					return;
				}

				if (
					parsedExpiresAt &&
					new Date(parsedExpiresAt).getTime() <= new Date(parsedPublishAt).getTime()
				) {
					feedback = 'Expiration must be after the publish time.';
					return;
				}
			}

			if (parsedExpiresAt && new Date(parsedExpiresAt).getTime() <= now) {
				feedback = 'Expiration must be in the future.';
				return;
			}

			const payload = {
				title: title.trim(),
				body: body.trim(),
				expires_at: parsedExpiresAt,
				is_draft: deliveryMode === 'draft',
				publish_at: deliveryMode === 'schedule' ? parsedPublishAt : null
			};

			if (editingId) {
				await currentHub.updateBroadcast(editingId, payload);
			} else {
				await currentHub.addBroadcast(payload);
			}

			resetForm();
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to save the broadcast.';
		}
	}

	async function publishNow(broadcast: BroadcastRow) {
		try {
			await currentHub.publishBroadcastNow(broadcast.id);
			if (editingId === broadcast.id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to publish the broadcast.';
		}
	}

	async function moveToDraft(broadcast: BroadcastRow) {
		try {
			await currentHub.saveBroadcastDraft(broadcast.id);
			if (editingId === broadcast.id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to move the broadcast back to draft.';
		}
	}

	async function togglePin(broadcast: BroadcastRow) {
		try {
			await currentHub.setBroadcastPinned(broadcast.id, !broadcast.is_pinned);
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to update the pinned broadcast.';
		}
	}

	async function archive(id: string) {
		try {
			await currentHub.archiveBroadcast(id);
			if (editingId === id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to archive the broadcast.';
		}
	}

	async function restore(id: string) {
		try {
			await currentHub.restoreBroadcast(id);
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to restore the broadcast.';
		}
	}

	async function remove(id: string) {
		try {
			await currentHub.removeBroadcast(id);
			if (editingId === id) {
				resetForm();
			}
		} catch (e) {
			feedback = e instanceof Error ? e.message : 'Failed to delete.';
		}
	}

</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Broadcasts</Card.Title>
		<Card.Description>Write a short update that all members can scan quickly.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6" aria-busy={isBroadcastMutating}>
		<form
			class="space-y-5"
			use:syncUnsavedChanges={{
				key: UNSAVED_CHANGES_KEY,
				label: isEditing ? 'broadcast edits' : 'broadcast draft',
				isDirty: isBroadcastDirty
			}}
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<Field.Set disabled={isBroadcastMutating}>
				<Field.Group class="gap-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="broadcast-title">Title</Field.Label>
							<Field.Description>Keep it short so the broadcast is easy to scan.</Field.Description>
							<Input id="broadcast-title" type="text" bind:value={title} disabled={isBroadcastMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="broadcast-visibility">Visibility</Field.Label>
							<Field.Description>{visibilityDescription}</Field.Description>
							<Select.Root type="single" bind:value={deliveryMode} name="broadcastVisibility" disabled={isBroadcastMutating}>
								<Select.Trigger id="broadcast-visibility" disabled={isBroadcastMutating}>
									{BROADCAST_DELIVERY_OPTIONS.find((option) => option.value === deliveryMode)?.label ?? 'Publish now'}
								</Select.Trigger>
								<Select.Content>
									{#each BROADCAST_DELIVERY_OPTIONS as option (option.value)}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Content>
					</Field.Field>
					{#if deliveryMode === 'schedule'}
						<Field.Field>
							<Field.Content>
								<Field.Label for="broadcast-publish-at">Publish at</Field.Label>
								<Field.Description>
									Members will not see this broadcast until the scheduled publish time.
								</Field.Description>
								<Input id="broadcast-publish-at" type="datetime-local" bind:value={publishAt} disabled={isBroadcastMutating} />
							</Field.Content>
						</Field.Field>
					{/if}
					<Field.Field>
						<Field.Content>
							<Field.Label for="broadcast-expires-at">Expire at</Field.Label>
							<Field.Description>
								Optional. After this time the broadcast moves out of the live member view.
							</Field.Description>
							<Input id="broadcast-expires-at" type="datetime-local" bind:value={expiresAt} disabled={isBroadcastMutating} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="broadcast-message">Message</Field.Label>
							<Textarea id="broadcast-message" bind:value={body} disabled={isBroadcastMutating} />
						</Field.Content>
					</Field.Field>
				</Field.Group>
			</Field.Set>
			<div class="flex flex-wrap justify-start gap-2">
				<Button type="submit" disabled={isBroadcastMutating}>
					{submitLabel}
				</Button>
				{#if isEditing}
					<Button type="button" variant="ghost" onclick={resetForm} disabled={isBroadcastMutating}>
						Cancel
					</Button>
				{/if}
			</div>
		</form>

		{#if isBroadcastMutating}
			<p
				role="status"
				aria-live="polite"
				class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
			>
				{broadcastMutationStatus}
			</p>
		{/if}

		{#if feedback}
			<p
				role="alert"
				class="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
			>
				{feedback}
			</p>
		{/if}

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Draft broadcasts</h3>
				<p class="text-sm text-muted-foreground">
					{draftBroadcasts.length === 0
						? 'Drafts stay private until you publish them.'
						: `${draftBroadcasts.length} draft broadcast${draftBroadcasts.length === 1 ? '' : 's'} waiting for a publish decision.`}
				</p>
			</div>

			{#if draftBroadcasts.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">Nothing is sitting in draft right now.</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group aria-busy={isBroadcastMutating}>
					{#each draftBroadcasts as broadcast (broadcast.id)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								{@const engagementSignal = getEngagementSignal(broadcast.id)}
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{broadcast.title}</Item.Title>
									<Badge variant="outline">{getBroadcastStateLabel(broadcast)}</Badge>
								</div>
								<Item.Description>{broadcast.body}</Item.Description>
								<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
									{getMetaCopy(broadcast)}
								</p>
								{#if engagementSignal}
									<p class={getEngagementClass(broadcast.id)}>{engagementSignal.copy}</p>
								{/if}
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(broadcast)} disabled={isBroadcastMutating}>
									Edit
								</Button>
								<Button variant="ghost" size="sm" onclick={() => publishNow(broadcast)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Publishing...' : 'Publish now'}
								</Button>
								<Button variant="destructive" size="sm" onclick={() => remove(broadcast.id)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Deleting...' : 'Delete'}
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Scheduled broadcasts</h3>
				<p class="text-sm text-muted-foreground">
					{scheduledBroadcasts.length === 0
						? 'Scheduled broadcasts will queue here until their publish time.'
						: `${scheduledBroadcasts.length} broadcast${scheduledBroadcasts.length === 1 ? '' : 's'} queued for later.`}
				</p>
			</div>

			{#if scheduledBroadcasts.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">Nothing is scheduled to publish right now.</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group aria-busy={isBroadcastMutating}>
					{#each scheduledBroadcasts as broadcast (broadcast.id)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								{@const engagementSignal = getEngagementSignal(broadcast.id)}
								{@const deliveryCopy = getDeliveryCopy(broadcast.id)}
								{@const executionDiagnostics = currentHub.getBroadcastExecutionDiagnostics(broadcast.id)}
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{broadcast.title}</Item.Title>
									<Badge variant="outline">{getBroadcastStateLabel(broadcast)}</Badge>
								</div>
								<Item.Description>{broadcast.body}</Item.Description>
								<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
									{getMetaCopy(broadcast)}
								</p>
								{#if deliveryCopy}
									<p class={getDeliveryClass(broadcast.id)}>{deliveryCopy}</p>
								{/if}
								<ExecutionDiagnosticsPanel entries={executionDiagnostics} />
								{#if engagementSignal}
									<p class={getEngagementClass(broadcast.id)}>{engagementSignal.copy}</p>
								{/if}
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(broadcast)} disabled={isBroadcastMutating}>
									Edit
								</Button>
								<Button variant="ghost" size="sm" onclick={() => publishNow(broadcast)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Publishing...' : 'Publish now'}
								</Button>
								<Button variant="ghost" size="sm" onclick={() => moveToDraft(broadcast)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Saving...' : 'Save as draft'}
								</Button>
								<Button variant="destructive" size="sm" onclick={() => remove(broadcast.id)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Deleting...' : 'Delete'}
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Live broadcasts</h3>
				<p class="text-sm text-muted-foreground">
					{activeBroadcasts.length === 0
						? 'No broadcasts are live yet.'
						: `${activeBroadcasts.length} broadcast${activeBroadcasts.length === 1 ? '' : 's'} currently visible to members.`}
				</p>
			</div>

		{#if activeBroadcasts.length === 0}
			<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
				<Card.Content>
					<p class="text-sm text-muted-foreground">Publish your first broadcast when you are ready.</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<Item.Group aria-busy={isBroadcastMutating}>
				{#each activeBroadcasts as broadcast (broadcast.id)}
					<Item.Root variant="muted" size="sm">
						<Item.Content>
							{@const engagementSignal = getEngagementSignal(broadcast.id)}
							{@const deliveryCopy = getDeliveryCopy(broadcast.id)}
							{@const executionDiagnostics = currentHub.getBroadcastExecutionDiagnostics(broadcast.id)}
							<div class="flex flex-wrap items-center gap-2">
								<Item.Title>{broadcast.title}</Item.Title>
								<Badge variant={broadcast.is_pinned ? 'secondary' : 'outline'}>
									{getBroadcastStateLabel(broadcast)}
								</Badge>
							</div>
							<Item.Description>{broadcast.body}</Item.Description>
							<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
								{getMetaCopy(broadcast)}
							</p>
							{#if deliveryCopy}
								<p class={getDeliveryClass(broadcast.id)}>{deliveryCopy}</p>
							{/if}
							<ExecutionDiagnosticsPanel entries={executionDiagnostics} />
							{#if engagementSignal}
								<p class={getEngagementClass(broadcast.id)}>{engagementSignal.copy}</p>
							{/if}
						</Item.Content>
						<Item.Actions>
							<Button variant="ghost" size="sm" onclick={() => startEditing(broadcast)} disabled={isBroadcastMutating}>
								Edit
							</Button>
							<Button variant="ghost" size="sm" onclick={() => togglePin(broadcast)} disabled={isBroadcastMutating}>
								{currentHub.broadcastTargetId === broadcast.id
									? broadcast.is_pinned
										? 'Unpinning...'
										: 'Pinning...'
									: broadcast.is_pinned
										? 'Unpin'
										: 'Pin'}
							</Button>
							<Button variant="ghost" size="sm" onclick={() => archive(broadcast.id)} disabled={isBroadcastMutating}>
								{currentHub.broadcastTargetId === broadcast.id ? 'Archiving...' : 'Archive'}
							</Button>
							<Button variant="destructive" size="sm" onclick={() => remove(broadcast.id)} disabled={isBroadcastMutating}>
								{currentHub.broadcastTargetId === broadcast.id ? 'Deleting...' : 'Delete'}
							</Button>
						</Item.Actions>
					</Item.Root>
				{/each}
			</Item.Group>
		{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Inactive broadcasts</h3>
				<p class="text-sm text-muted-foreground">
					{inactiveBroadcasts.length === 0
						? 'Archived or expired broadcasts will collect here.'
						: `${inactiveBroadcasts.length} broadcast${inactiveBroadcasts.length === 1 ? '' : 's'} in history.`}
				</p>
			</div>

			{#if inactiveBroadcasts.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">Nothing has been archived or expired yet.</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group aria-busy={isBroadcastMutating}>
					{#each inactiveBroadcasts as broadcast (broadcast.id)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								{@const engagementSignal = getEngagementSignal(broadcast.id)}
								{@const deliveryStatus = getDeliveryStatus(broadcast.id)}
								{@const deliveryCopy = getDeliveryCopy(broadcast.id)}
								{@const executionDiagnostics = currentHub.getBroadcastExecutionDiagnostics(broadcast.id)}
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{broadcast.title}</Item.Title>
									<Badge variant="outline">{getBroadcastStateLabel(broadcast)}</Badge>
								</div>
								<Item.Description>{broadcast.body}</Item.Description>
								<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
									{getMetaCopy(broadcast)}
								</p>
								<p class="text-xs text-muted-foreground">{getHistoryCopy(broadcast)}</p>
								{#if deliveryCopy}
									<p class={getDeliveryClass(broadcast.id)}>{deliveryCopy}</p>
								{/if}
								<ExecutionDiagnosticsPanel entries={executionDiagnostics} />
								{#if engagementSignal}
									<p class={getEngagementClass(broadcast.id)}>{engagementSignal.copy}</p>
								{/if}
							</Item.Content>
							<Item.Actions>
								{#if getDeliveryStatus(broadcast.id)}
									<Button variant="ghost" size="sm" onclick={() => startEditing(broadcast)} disabled={isBroadcastMutating}>
										Edit
									</Button>
								{/if}
								<Button variant="ghost" size="sm" onclick={() => restore(broadcast.id)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Restoring...' : 'Restore'}
								</Button>
								<Button variant="destructive" size="sm" onclick={() => remove(broadcast.id)} disabled={isBroadcastMutating}>
									{currentHub.broadcastTargetId === broadcast.id ? 'Deleting...' : 'Delete'}
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
