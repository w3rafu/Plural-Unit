<script lang="ts">
	import { CalendarDays, Megaphone, Sparkles, TriangleAlert } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { getHubActivityPrimaryAction } from '$lib/components/hub/member/hubActivityModel';
	import {
		hasEnabledHubNotificationPreferences,
		type HubNotificationItem
	} from '$lib/models/hubNotifications';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let {
		items = undefined as HubNotificationItem[] | undefined,
		organizationName = undefined as string | undefined,
		isLoading = undefined as boolean | undefined,
		broadcastHref = '#hub-broadcasts',
		eventHref = '#hub-events',
		manageContentHref = undefined as string | undefined,
		manageBroadcastsHref = undefined as string | undefined,
		manageEventsHref = undefined as string | undefined
	} = $props();

	const MAX_VISIBLE_ACTIVITY_ITEMS = 3;
	let showAll = $state(false);

	const allItems = $derived(items ?? currentHub.allActivityFeed);
	const totalItems = $derived(items ?? currentHub.activityFeed);
	const resolvedOrganizationName = $derived(
		organizationName ?? currentOrganization.organization?.name ?? 'your organization'
	);
	const resolvedIsLoading = $derived(isLoading ?? currentHub.isLoading);
	const hiddenItemCount = $derived(items ? 0 : Math.max(0, allItems.length - totalItems.length));
	const hasMore = $derived(totalItems.length > MAX_VISIBLE_ACTIVITY_ITEMS);
	const activityItems = $derived(
		showAll ? totalItems : totalItems.slice(0, MAX_VISIBLE_ACTIVITY_ITEMS)
	);

	function getPrimaryAction(item: HubNotificationItem) {
		return getHubActivityPrimaryAction(item, {
			broadcastHref,
			eventHref,
			manageContentHref,
			manageBroadcastsHref,
			manageEventsHref
		});
	}

	function getEmptyStateCopy() {
		if (!items && hiddenItemCount > 0) {
			return 'Your notification settings are hiding the recent hub activity that is currently available.';
		}

		if (!items && !hasEnabledHubNotificationPreferences(currentHub.notificationPreferences)) {
			return 'All in-app hub alerts are turned off in your notification settings.';
		}

		return 'When a broadcast goes live, an event update lands, or a reminder is processed, it will appear here first.';
	}

	function getActivityRowTone(item: HubNotificationItem) {
		if (!item.isRead) {
			return 'bg-primary/[0.045]';
		}

		return 'bg-transparent hover:bg-muted/18';
	}
</script>

<Card.Root size="sm" class="h-full border-border/70 bg-card">
	<Card.Content class="space-y-3 py-3.5" aria-busy={resolvedIsLoading}>
		<div class="flex items-end justify-between gap-3">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Recent activity</Card.Title>
				<Card.Description>
					What changed most recently in {resolvedOrganizationName}.
				</Card.Description>
			</div>
			{#if totalItems.length > 0}
				<p class="text-xs text-muted-foreground">
					{totalItems.length} item{totalItems.length === 1 ? '' : 's'}
				</p>
			{/if}
		</div>

		{#if resolvedIsLoading && totalItems.length === 0}
			<div role="status" aria-live="polite" class="space-y-3">
				<span class="sr-only">Loading recent activity.</span>
				{#each Array.from({ length: 3 }) as _, index (`hub-activity-loading-${index}`)}
					<div class="animate-pulse rounded-[1.4rem] border border-border/70 bg-muted/20 px-3.5 py-3">
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="h-4 w-28 rounded bg-muted"></div>
							<div class="h-5 w-18 rounded-full bg-muted"></div>
						</div>
						<div class="mb-2 h-4 w-3/5 rounded bg-muted"></div>
						<div class="mb-2 h-3 w-full rounded bg-muted/80"></div>
						<div class="h-3 w-1/2 rounded bg-muted/80"></div>
					</div>
				{/each}
			</div>
		{:else if totalItems.length === 0}
			<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
				<p class="font-medium text-foreground">No recent activity yet</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{getEmptyStateCopy()}
				</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/70 shadow-sm">
				{#each activityItems as item, index (item.id)}
					{@const primaryAction = getPrimaryAction(item)}
					<a
						href={primaryAction.href}
						class={`group block px-3.5 py-3 transition-colors ${index > 0 ? 'border-t border-border/55' : ''} ${getActivityRowTone(item)}`}
					>
						<div class="flex items-start gap-3">
							<div
								class={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[0.8rem] border ${item.eventLifecycleSignal === 'canceled' ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-primary/15 bg-primary/10 text-primary'}`}
							>
								{#if item.kind === 'broadcast'}
									<Megaphone class="size-3.5" />
								{:else if item.eventLifecycleSignal === 'canceled'}
									<TriangleAlert class="size-3.5" />
								{:else if item.eventTimingState === 'today' || item.eventTimingState === 'in_progress'}
									<Sparkles class="size-3.5" />
								{:else}
									<CalendarDays class="size-3.5" />
								{/if}
							</div>

							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2 text-[0.63rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
											<span>{item.label}</span>
											{#if !item.isRead}
												<span class="inline-flex size-1.5 rounded-full bg-primary"></span>
												<span class="normal-case tracking-normal text-primary">Needs review</span>
											{/if}
										</div>
										<p class="mt-1 truncate text-sm font-semibold text-foreground">{item.title}</p>
									</div>
									<span class="shrink-0 pt-0.5 text-[0.7rem] font-medium text-primary/90 transition-colors group-hover:text-primary">{primaryAction.label}</span>
								</div>
								<p class="mt-1 text-[0.78rem] leading-5 text-muted-foreground">{item.summary}</p>
								<div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-muted-foreground">
									<span>{item.meta}</span>
									{#if item.kind === 'broadcast'}
										<span>Broadcast update</span>
									{:else}
										<span>Event update</span>
									{/if}
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>

			{#if hasMore}
				<div class="text-center">
					<Button
						variant="ghost"
						size="sm"
						onclick={() => (showAll = !showAll)}
					>
						{showAll ? 'Show less' : `View all ${totalItems.length} items`}
					</Button>
				</div>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
