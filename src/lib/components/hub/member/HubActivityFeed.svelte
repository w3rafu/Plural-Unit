<script lang="ts">
	import { ArrowUpRight, ChevronRight, Sparkles } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		getHubActivityPrimaryAction,
		getHubActivitySecondaryAction
	} from '$lib/components/hub/member/hubActivityModel';
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
	const featuredItem = $derived(totalItems[0] ?? null);
	const broadcastCount = $derived(totalItems.filter((item) => item.kind === 'broadcast').length);
	const eventCount = $derived(totalItems.filter((item) => item.kind !== 'broadcast').length);
	const remainingItems = $derived(totalItems.slice(1));
	const hasMore = $derived(remainingItems.length > MAX_VISIBLE_ACTIVITY_ITEMS);
	const activityItems = $derived(
		showAll ? remainingItems : remainingItems.slice(0, MAX_VISIBLE_ACTIVITY_ITEMS)
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

	function getSecondaryAction(item: HubNotificationItem) {
		return getHubActivitySecondaryAction(item, {
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

		return 'When a broadcast goes live, an event is published, or a reminder is sent, it will appear here first.';
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Recent activity</Card.Title>
				<Card.Description>
					The latest broadcasts, event launches, and reminders from {resolvedOrganizationName}.
				</Card.Description>
			</div>

			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary" class="rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
					{broadcastCount} broadcasts
				</Badge>
				<Badge variant="outline" class="rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em]">
					{eventCount} event alerts
				</Badge>
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-3">
		{#if resolvedIsLoading && totalItems.length === 0}
			<div class="space-y-3">
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
			{#if featuredItem}
				{@const featuredPrimaryAction = getPrimaryAction(featuredItem)}
				{@const featuredSecondaryAction = getSecondaryAction(featuredItem)}
				<div class="rounded-3xl border border-border/70 bg-background px-5 py-5 shadow-sm">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="flex items-center gap-2">
							<div class="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
								<Sparkles class="size-4 text-muted-foreground" />
							</div>
							<div>
								<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
									Featured update
								</p>
								<p class="text-sm font-semibold text-foreground">{featuredItem.title}</p>
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<Badge variant={featuredItem.kind === 'broadcast' ? 'secondary' : 'outline'}>
								{featuredItem.label}
							</Badge>
							<p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
								{featuredItem.meta}
							</p>
						</div>
					</div>

					<p class="mt-4 text-sm leading-6 text-muted-foreground">{featuredItem.summary}</p>

					<div class="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-xs text-muted-foreground">{featuredPrimaryAction.description}</p>
						<div class="flex flex-wrap gap-2">
							<Button href={featuredPrimaryAction.href} size="sm">
								{featuredPrimaryAction.label}
								<ArrowUpRight class="size-4" />
							</Button>
							{#if featuredSecondaryAction}
								<Button href={featuredSecondaryAction.href} variant="ghost" size="sm">
									{featuredSecondaryAction.label}
								</Button>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-3">
				{#each activityItems as item (item.id)}
					{@const primaryAction = getPrimaryAction(item)}
					<div class="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold text-foreground">{item.title}</p>
								<p class="mt-1 text-xs text-muted-foreground">{item.summary}</p>
							</div>
							<Badge variant={item.kind === 'broadcast' ? 'secondary' : 'outline'}>
								{item.label}
							</Badge>
						</div>
						<div class="mt-3 flex flex-col gap-3 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
							<p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
								{item.meta}
							</p>
							<Button href={primaryAction.href} variant="ghost" size="sm" class="self-start sm:self-auto">
								{primaryAction.label}
								<ChevronRight class="size-4" />
							</Button>
						</div>
					</div>
				{/each}
			</div>

			{#if hasMore}
				<div class="mt-3 text-center">
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
