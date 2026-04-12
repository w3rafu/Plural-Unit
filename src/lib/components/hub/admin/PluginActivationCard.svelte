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

	async function toggle(key: PluginKey, currentValue: boolean) {
		await currentHub.toggle(key, !currentValue);
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Hub sections</Card.Title>
		<Card.Description>Turn sections on or off for your members.</Card.Description>
	</Card.Header>

	<Card.Content>
		<Item.Group>
			{#each plugins as plugin (plugin.key)}
				<Item.Root variant="muted" size="sm" class="bg-muted/20">
					<Item.Content>
						<Field.Field orientation="horizontal">
							<Checkbox
								id={`plugin-${plugin.key}`}
								checked={currentHub.plugins[plugin.key]}
								onCheckedChange={() => toggle(plugin.key, currentHub.plugins[plugin.key])}
							/>
							<Field.Content>
								<Field.Label for={`plugin-${plugin.key}`}>
									<strong>{plugin.title}</strong>
								</Field.Label>
								<Field.Description>{plugin.description}</Field.Description>
							</Field.Content>
						</Field.Field>
					</Item.Content>
				</Item.Root>
			{/each}
		</Item.Group>
	</Card.Content>
</Card.Root>
