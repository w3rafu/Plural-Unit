<script lang="ts">
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BellIcon from '@lucide/svelte/icons/bell';
	import {
		getHubActivityPrimaryAction,
		getHubActivitySecondaryAction
	} from '$lib/components/hub/member/hubActivityModel';
	import { Button } from '$lib/components/ui/button';
	import * as Item from '$lib/components/ui/item';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import {
		countHubNotifications,
		filterHubNotifications,
		type HubNotificationFilter,
		type HubNotificationItem
	} from '$lib/models/hubNotifications';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let {
		triggerLabel = 'Alerts',
		triggerClass = '',
		broadcastHref = '/#hub-broadcasts',
		eventHref = '/#hub-events',
		manageContentHref = undefined as string | undefined,
		manageBroadcastsHref = undefined as string | undefined,
		manageEventsHref = undefined as string | undefined
	}: {
		triggerLabel?: string;
		triggerClass?: string;
		broadcastHref?: string;
		eventHref?: string;
		manageContentHref?: string | undefined;
		manageBroadcastsHref?: string | undefined;
		manageEventsHref?: string | undefined;
	} = $props();

	let open = $state(false);
	let loadError = $state('');
	let filter = $state<HubNotificationFilter>('all');

	const notifications = $derived(currentHub.activityFeed);
	const notificationCounts = $derived(countHubNotifications(notifications));
	const visibleNotifications = $derived(filterHubNotifications(notifications, filter));

	function closeSheet() {
		open = false;
	}

	function getPrimaryAction(notification: HubNotificationItem) {
		return getHubActivityPrimaryAction(notification, {
			broadcastHref,
			eventHref,
			manageContentHref,
			manageBroadcastsHref,
			manageEventsHref
		});
	}

	function getSecondaryAction(notification: HubNotificationItem) {
		return getHubActivitySecondaryAction(notification, {
			broadcastHref,
			eventHref,
			manageContentHref,
			manageBroadcastsHref,
			manageEventsHref
		});
	}

	function getEmptyStateCopy(activeFilter: HubNotificationFilter) {
		if (activeFilter === 'broadcast') {
			return 'No broadcast alerts are live right now.';
		}

		if (activeFilter === 'event') {
			return 'No event alerts are live right now.';
		}

		return 'No alerts yet. When the hub posts a broadcast or publishes an event, it will show up here.';
	}

	async function handleOpenChange(nextOpen: boolean) {
		open = nextOpen;
		if (!nextOpen || !currentOrganization.organization?.id) return;

		const shouldLoad = !currentHub.hasLoadedForCurrentOrg && !currentHub.isLoading;
		if (!shouldLoad) return;

		loadError = '';
		try {
			await currentHub.load();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not load alerts.';
		}
	}
</script>

<Sheet.Root open={open} onOpenChange={handleOpenChange}>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} type="button" variant="outline" size="sm" class={`gap-2 ${triggerClass}`}>
				<BellIcon class="shell-header__control-icon" aria-hidden="true" />
				<span class="shell-header__control-label">{triggerLabel}</span>
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="right" class="w-[92vw] max-w-104 border-border bg-background">
		<Sheet.Header>
			<Sheet.Title>Alerts</Sheet.Title>
			<Sheet.Description>
				A live feed of broadcasts and event updates, with shortcuts to open or manage what needs attention.
			</Sheet.Description>
		</Sheet.Header>

		<ScrollArea class="h-[calc(100vh-9rem)] px-5 py-4">
			{#if loadError}
				<p role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{loadError}
				</p>
			{:else if currentHub.isLoading && notifications.length === 0}
				<div class="space-y-3">
					{#each Array.from({ length: 3 }) as _, index (`loading-${index}`)}
						<div class="animate-pulse rounded-2xl border border-border bg-card p-4">
							<div class="mb-3 h-3 w-16 rounded bg-zinc-200"></div>
							<div class="mb-2 h-4 w-2/3 rounded bg-zinc-300"></div>
							<div class="mb-2 h-3 w-full rounded bg-zinc-200"></div>
							<div class="h-3 w-1/2 rounded bg-zinc-200"></div>
						</div>
					{/each}
				</div>
			{:else if notifications.length === 0}
				<div class="rounded-2xl border border-dashed border-border bg-muted/35 px-4 py-5 text-sm text-muted-foreground">
					{getEmptyStateCopy('all')}
				</div>
			{:else}
				<div class="mb-4 space-y-3">
					<div class="flex flex-wrap gap-2">
						<Button
							type="button"
							size="sm"
							variant={filter === 'all' ? 'secondary' : 'outline'}
							class="rounded-full"
							onclick={() => (filter = 'all')}
						>
							All {notificationCounts.all}
						</Button>
						<Button
							type="button"
							size="sm"
							variant={filter === 'broadcast' ? 'secondary' : 'outline'}
							class="rounded-full"
							onclick={() => (filter = 'broadcast')}
						>
							Broadcasts {notificationCounts.broadcast}
						</Button>
						<Button
							type="button"
							size="sm"
							variant={filter === 'event' ? 'secondary' : 'outline'}
							class="rounded-full"
							onclick={() => (filter = 'event')}
						>
							Events {notificationCounts.event}
						</Button>
					</div>

					<p class="text-xs text-muted-foreground">
						{visibleNotifications.length} {visibleNotifications.length === 1 ? 'alert' : 'alerts'} visible
					</p>
				</div>

				{#if visibleNotifications.length === 0}
					<div class="rounded-2xl border border-dashed border-border bg-muted/35 px-4 py-5 text-sm text-muted-foreground">
						{getEmptyStateCopy(filter)}
					</div>
				{:else}
					<Item.Group>
						{#each visibleNotifications as notification (notification.id)}
							{@const primaryAction = getPrimaryAction(notification)}
							{@const secondaryAction = getSecondaryAction(notification)}
							<Item.Root variant="default" class="bg-card">
								<Item.Content>
									<div class="flex items-center justify-between gap-3">
										<Item.Title>{notification.title}</Item.Title>
										<span class="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary-foreground">
											{notification.label}
										</span>
									</div>
									<Item.Description>{notification.summary}</Item.Description>
									<p class="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
										{notification.meta}
									</p>
									<div class="flex flex-wrap gap-2 pt-2">
										<Button
											href={primaryAction.href}
											variant="outline"
											size="sm"
											onclick={closeSheet}
										>
											{primaryAction.label}
											<ArrowUpRightIcon class="size-4" />
										</Button>
										{#if secondaryAction}
											<Button
												href={secondaryAction.href}
												variant="ghost"
												size="sm"
												onclick={closeSheet}
											>
												{secondaryAction.label}
											</Button>
										{/if}
									</div>
								</Item.Content>
							</Item.Root>
						{/each}
					</Item.Group>
				{/if}
			{/if}
		</ScrollArea>

		<Sheet.Footer class="justify-between">
			<p class="text-xs text-muted-foreground">
				{notificationCounts.all} {notificationCounts.all === 1 ? 'alert' : 'alerts'} total
			</p>
			<Sheet.Close>
				{#snippet child({ props })}
					<Button {...props} type="button" variant="outline">Close</Button>
				{/snippet}
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
