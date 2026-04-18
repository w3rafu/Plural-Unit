<!--
  PluginActivationCard — admin toggle card for enabling/disabling plugins.

  Reads the full plugin registry and shows a toggle for each.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Item from '$lib/components/ui/item';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import {
		getAllPluginsForAdmin,
		getPluginAudienceLabel,
		type PluginKey,
		type PluginVisibilityMode
	} from '$lib/stores/pluginRegistry';

	const plugins = getAllPluginsForAdmin();
	let pendingPluginKey = $state<PluginKey | null>(null);
	let pendingStatus = $state('');
	let feedback = $state('');

	const isTogglingPlugin = $derived(pendingPluginKey !== null);
	const pluginMutationStatus = $derived(pendingStatus);

	async function toggle(key: PluginKey, currentValue: boolean) {
		feedback = '';
		pendingPluginKey = key;
		const plugin = plugins.find((entry) => entry.key === key);
		pendingStatus = `Turning ${plugin?.title ?? 'section'} ${currentValue ? 'off' : 'on'}...`;

		try {
			await currentHub.toggle(key, !currentValue);
		} catch (error) {
			feedback =
				error instanceof Error ? error.message : 'Could not update the hub section right now.';
		} finally {
			if (pendingPluginKey === key) {
				pendingPluginKey = null;
				pendingStatus = '';
			}
		}
	}

	async function updateVisibility(key: PluginKey, visibility: PluginVisibilityMode) {
		feedback = '';
		pendingPluginKey = key;
		const plugin = plugins.find((entry) => entry.key === key);
		pendingStatus = `Updating ${plugin?.title ?? 'section'} visibility to ${getPluginAudienceLabel(visibility).toLowerCase()}...`;

		try {
			await currentHub.setVisibility(key, visibility);
		} catch (error) {
			feedback =
				error instanceof Error ? error.message : 'Could not update the hub section audience right now.';
		} finally {
			if (pendingPluginKey === key) {
				pendingPluginKey = null;
				pendingStatus = '';
			}
		}
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Hub sections</Card.Title>
		<Card.Description>Turn sections on or off, then choose whether everyone or only admins can see them on the hub home.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4" aria-busy={isTogglingPlugin}>
		{#if isTogglingPlugin}
			<p
				role="status"
				aria-live="polite"
				class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
			>
				{pluginMutationStatus}
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

		<Item.Group>
			{#each plugins as plugin (plugin.key)}
				{@const pluginState = currentHub.plugins[plugin.key]}
				<Item.Root variant="muted" size="sm" class="bg-muted/20">
					<Item.Content>
						<Field.Field orientation="horizontal">
							<Checkbox
								id={`plugin-${plugin.key}`}
								checked={pluginState.isEnabled}
								disabled={isTogglingPlugin}
								onCheckedChange={() => toggle(plugin.key, pluginState.isEnabled)}
							/>
							<Field.Content>
								<Field.Label for={`plugin-${plugin.key}`}>
									<strong>{plugin.title}</strong>
								</Field.Label>
								<Field.Description>
									{plugin.description}
									{#if pendingPluginKey === plugin.key}
										<span class="block pt-1 text-foreground">
											{pluginMutationStatus}
										</span>
									{/if}
								</Field.Description>
								<div class="pt-3">
									<p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Audience</p>
									<div class="mt-2 flex flex-wrap gap-2">
										<Button
											type="button"
											size="sm"
											variant={pluginState.visibility === 'all_members' ? 'secondary' : 'outline'}
											disabled={isTogglingPlugin}
											aria-label={`Set ${plugin.title} visibility to everyone`}
											aria-pressed={pluginState.visibility === 'all_members'}
											onclick={() => updateVisibility(plugin.key, 'all_members')}
										>
											Everyone
										</Button>
										<Button
											type="button"
											size="sm"
											variant={pluginState.visibility === 'admins_only' ? 'secondary' : 'outline'}
											disabled={isTogglingPlugin}
											aria-label={`Set ${plugin.title} visibility to admins only`}
											aria-pressed={pluginState.visibility === 'admins_only'}
											onclick={() => updateVisibility(plugin.key, 'admins_only')}
										>
											Admins only
										</Button>
									</div>
									<p class="pt-2 text-xs text-muted-foreground">
										{#if pluginState.isEnabled}
											Enabled for {getPluginAudienceLabel(pluginState.visibility).toLowerCase()} on the hub home.
										{:else}
											Off right now. When enabled, this section will be shown to {getPluginAudienceLabel(pluginState.visibility).toLowerCase()}.
										{/if}
									</p>
								</div>
							</Field.Content>
						</Field.Field>
					</Item.Content>
				</Item.Root>
			{/each}
		</Item.Group>
	</Card.Content>
</Card.Root>
