<!--
  PluginActivationCard — admin toggle card for enabling/disabling plugins.

  Reads the full plugin registry and shows a toggle for each.
-->
<script lang="ts">
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

<Item.Root variant="outline">
	<Item.Content>
		<Item.Title>Hub sections</Item.Title>
		<Item.Description>Turn sections on or off for your members.</Item.Description>
		<Item.Group>
			{#each plugins as plugin (plugin.key)}
				<Item.Root variant="muted" size="sm">
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
	</Item.Content>
</Item.Root>
