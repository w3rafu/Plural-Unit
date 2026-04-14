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
		countUnreadHubNotifications,
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
		settingsHref = '/profile/details#notification-preferences',
		manageContentHref = undefined as string | undefined,
		manageBroadcastsHref = undefined as string | undefined,
		manageEventsHref = undefined as string | undefined
	}: {
		triggerLabel?: string;
		triggerClass?: string;
		broadcastHref?: string;
		eventHref?: string;
		settingsHref?: string;
		manageContentHref?: string | undefined;
		manageBroadcastsHref?: string | undefined;
		manageEventsHref?: string | undefined;
	} = $props();

	let open = $state(false);
	let loadError = $state('');
	let filter = $state<HubNotificationFilter>('all');

	const allNotifications = $derived(currentHub.allActivityFeed);
	const notifications = $derived(currentHub.activityFeed);
	const notificationCounts = $derived(countHubNotifications(allNotifications));
	const visibleNotifications = $derived(filterHubNotifications(notifications, filter));
	const visibleUnreadCount = $derived(countUnreadHubNotifications(visibleNotifications));
	const unreadCount = $derived(currentHub.unreadActivityCount);
	const hiddenNotificationCount = $derived(Math.max(0, allNotifications.length - notifications.length));

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
			if (notificationCounts.broadcast > 0 && visibleNotifications.length === 0) {
				return 'Broadcast alerts are currently hidden by your notification settings.';
			}

			return 'No broadcast alerts are live right now.';
		}

		if (activeFilter === 'event') {
			if (notificationCounts.event > 0 && visibleNotifications.length === 0) {
				return 'Event alerts and reminders are currently hidden by your notification settings.';
			}

			return 'No event alerts or reminders are live right now.';
		}

		if (hiddenNotificationCount > 0 && notifications.length === 0) {
			return 'Your notification settings are hiding the hub alerts that are currently available.';
		}

		return 'No alerts yet. When the hub posts a broadcast, publishes an event, or sends a reminder, it will show up here.';
	}

	async function markNotificationRead(notification: HubNotificationItem) {
		loadError = '';

		try {
			await currentHub.markActivityRead(notification);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not update alert read state.';
		}
	}

	async function markVisibleRead() {
		loadError = '';

		try {
			await currentHub.markAllActivityRead(visibleNotifications);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not update alert read state.';
		}
	}

	function handleNotificationAction(notification: HubNotificationItem) {
		void markNotificationRead(notification);
		closeSheet();
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
				{#if unreadCount > 0}
					<span class="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-background">
						{unreadCount}
					</span>
				{/if}
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="right" class="w-[92vw] max-w-104 border-border bg-background">
		<Sheet.Header>
			<Sheet.Title>Alerts</Sheet.Title>
			<Sheet.Description>
				A live feed of broadcasts, event launches, and reminders, with shortcuts to open or manage what needs attention.
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
						{#if hiddenNotificationCount > 0}
							· {hiddenNotificationCount} hidden by settings
						{/if}
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
							<Item.Root
								variant="default"
								class={`bg-card ${notification.isRead ? '' : 'ring-1 ring-border/70'}`}
							>
								<Item.Content>
									<div class="flex items-center justify-between gap-3">
										<Item.Title>{notification.title}</Item.Title>
										<div class="flex flex-wrap items-center justify-end gap-2">
											<span class="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary-foreground">
												{notification.label}
											</span>
											{#if !notification.isRead}
												<span class="rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
													New
												</span>
											{/if}
										</div>
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
											onclick={() => handleNotificationAction(notification)}
										>
											{primaryAction.label}
											<ArrowUpRightIcon class="size-4" />
										</Button>
										{#if secondaryAction}
											<Button
												href={secondaryAction.href}
												variant="ghost"
												size="sm"
												onclick={() => handleNotificationAction(notification)}
											>
												{secondaryAction.label}
											</Button>
										{/if}
										{#if !notification.isRead}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={currentHub.notificationReadTargetId === notification.id}
												onclick={() => void markNotificationRead(notification)}
											>
												{currentHub.notificationReadTargetId === notification.id ? 'Saving...' : 'Mark read'}
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

		<Sheet.Footer class="gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<p class="text-xs text-muted-foreground">
					{notificationCounts.all} {notificationCounts.all === 1 ? 'alert' : 'alerts'} total
					{#if hiddenNotificationCount > 0}
						· {hiddenNotificationCount} hidden by settings
					{/if}
				</p>
				{#if visibleUnreadCount > 0}
					<p class="text-xs text-muted-foreground">
						{visibleUnreadCount} unread {visibleUnreadCount === 1 ? 'alert' : 'alerts'} in this view
					</p>
				{/if}
			</div>

			<div class="flex flex-wrap gap-2">
				<Button href={settingsHref} variant="ghost" size="sm" onclick={closeSheet}>Settings</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={visibleUnreadCount === 0 || currentHub.isMarkingAllActivityRead}
					onclick={() => void markVisibleRead()}
				>
					{currentHub.isMarkingAllActivityRead ? 'Saving...' : 'Mark visible read'}
				</Button>
				<Sheet.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Close</Button>
					{/snippet}
				</Sheet.Close>
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
