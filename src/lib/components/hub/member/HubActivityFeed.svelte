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

	const MAX_VISIBLE_ACTIVITY_ITEMS = 4;
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
			return 'border-primary/15 bg-primary/6';
		}

		return 'border-border/70 bg-background';
	}

	function getActivityActionTone(item: HubNotificationItem) {
		return item.isRead ? 'text-foreground/70' : 'text-primary';
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Content class="space-y-4 py-4" aria-busy={resolvedIsLoading}>
		<div class="flex items-end justify-between gap-3">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Recent activity</Card.Title>
				<Card.Description>
					The most recent updates from the sections you can see in {resolvedOrganizationName}.
				</Card.Description>
			</div>
			{#if totalItems.length > 0}
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
					{totalItems.length} recent
				</p>
			{/if}
		</div>

		{#if resolvedIsLoading && totalItems.length === 0}
			<div role="status" aria-live="polite" class="space-y-3">
				<span class="sr-only">Loading recent activity.</span>
				{#each Array.from({ length: 3 }) as _, index (`hub-activity-loading-${index}`)}
					<div class="animate-pulse rounded-2xl border border-border/70 bg-muted/20 px-4 py-3.5">
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
			<div class="space-y-2">
				{#each activityItems as item (item.id)}
					{@const primaryAction = getPrimaryAction(item)}
					<a href={primaryAction.href} class={`block rounded-3xl border px-4 py-4 shadow-sm transition-[transform,background-color,border-color] hover:-translate-y-px hover:bg-muted/20 hover:opacity-100 ${getActivityRowTone(item)}`}>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="flex min-w-0 gap-3">
								<div
									class={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${item.eventLifecycleSignal === 'canceled' ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-primary/15 bg-primary/10 text-primary'}`}
								>
									{#if item.kind === 'broadcast'}
										<Megaphone class="size-4" />
									{:else if item.eventLifecycleSignal === 'canceled'}
										<TriangleAlert class="size-4" />
									{:else if item.eventTimingState === 'today' || item.eventTimingState === 'in_progress'}
										<Sparkles class="size-4" />
									{:else}
										<CalendarDays class="size-4" />
									{/if}
								</div>

								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<p class="truncate text-sm font-medium text-foreground">{item.title}</p>
										<span class={`rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] ${item.kind === 'broadcast' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/80'}`}>
											{item.label}
										</span>
										{#if !item.isRead}
											<span class="inline-flex size-2 rounded-full bg-primary"></span>
										{/if}
									</div>
									<p class="mt-1 text-sm text-muted-foreground">{item.summary}</p>
									<p class="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
										{item.meta}
									</p>
								</div>
							</div>

							<p class={`shrink-0 text-xs font-semibold uppercase tracking-[0.16em] ${getActivityActionTone(item)}`}>
								{primaryAction.label}
							</p>
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
