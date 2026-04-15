<!--
  PluginActivationCard — admin toggle card for enabling/disabling plugins.

  Reads the full plugin registry and shows a toggle for each.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Item from '$lib/components/ui/item';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { getAllPluginsForAdmin, type PluginKey } from '$lib/stores/pluginRegistry';

	const plugins = getAllPluginsForAdmin();
	let pendingPluginKey = $state<PluginKey | null>(null);
	let feedback = $state('');

	const isTogglingPlugin = $derived(pendingPluginKey !== null);
	const pluginMutationStatus = $derived.by(() => {
		if (!pendingPluginKey) {
			return '';
		}

		const plugin = plugins.find((entry) => entry.key === pendingPluginKey);
		const nextState = currentHub.plugins[pendingPluginKey] ? 'off' : 'on';
		return `Turning ${plugin?.title ?? 'section'} ${nextState}...`;
	});

	async function toggle(key: PluginKey, currentValue: boolean) {
		feedback = '';
		pendingPluginKey = key;

		try {
			await currentHub.toggle(key, !currentValue);
		} catch (error) {
			feedback =
				error instanceof Error ? error.message : 'Could not update the hub section right now.';
		} finally {
			if (pendingPluginKey === key) {
				pendingPluginKey = null;
			}
		}
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Hub sections</Card.Title>
		<Card.Description>Turn sections on or off for your members.</Card.Description>
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
				<Item.Root variant="muted" size="sm" class="bg-muted/20">
					<Item.Content>
						<Field.Field orientation="horizontal">
							<Checkbox
								id={`plugin-${plugin.key}`}
								checked={currentHub.plugins[plugin.key]}
								disabled={isTogglingPlugin}
								onCheckedChange={() => toggle(plugin.key, currentHub.plugins[plugin.key])}
							/>
							<Field.Content>
								<Field.Label for={`plugin-${plugin.key}`}>
									<strong>{plugin.title}</strong>
								</Field.Label>
								<Field.Description>
									{plugin.description}
									{#if pendingPluginKey === plugin.key}
										<span class="block pt-1 text-foreground">
											{currentHub.plugins[plugin.key] ? 'Turning off...' : 'Turning on...'}
										</span>
									{/if}
								</Field.Description>
							</Field.Content>
						</Field.Field>
					</Item.Content>
				</Item.Root>
			{/each}
		</Item.Group>
	</Card.Content>
</Card.Root>
