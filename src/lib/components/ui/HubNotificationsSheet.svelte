<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Item from '$lib/components/ui/item';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';

	let {
		triggerLabel = 'Alerts',
		triggerClass = ''
	}: {
		triggerLabel?: string;
		triggerClass?: string;
	} = $props();

	let open = $state(false);
	let loadError = $state('');
	let hasLoadedOnce = $state(false);

	const notifications = $derived(currentHub.activityFeed);

	async function handleOpenChange(nextOpen: boolean) {
		open = nextOpen;
		if (!nextOpen || !currentOrganization.organization?.id) return;

		const shouldLoad = !hasLoadedOnce || (!currentHub.isLoading && notifications.length === 0);
		if (!shouldLoad) return;

		loadError = '';
		try {
			await currentHub.load();
			hasLoadedOnce = true;
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not load alerts.';
		}
	}
</script>

<Sheet.Root open={open} onOpenChange={handleOpenChange}>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} type="button" variant="outline" size="sm" class={triggerClass}>
				{triggerLabel}
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="right" class="w-[92vw] max-w-104 border-border bg-background">
		<Sheet.Header>
			<Sheet.Title>Alerts</Sheet.Title>
			<Sheet.Description>
				A running feed of broadcasts and event updates sent through the hub.
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
					No alerts yet. When the hub posts a broadcast or publishes an event, it will show up here.
				</div>
			{:else}
				<Item.Group>
					{#each notifications as notification (notification.id)}
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
							</Item.Content>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</ScrollArea>

		<Sheet.Footer class="justify-between">
			<p class="text-xs text-muted-foreground">
				{notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
			</p>
			<Sheet.Close>
				{#snippet child({ props })}
					<Button {...props} type="button" variant="outline">Close</Button>
				{/snippet}
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
