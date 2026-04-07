<!--
  PluginActivationCard — admin toggle card for enabling/disabling plugins.

  Reads the full plugin registry and shows a toggle for each.
-->
<script lang="ts">
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { getAllPluginsForAdmin, type PluginKey } from '$lib/stores/pluginRegistry';

	const plugins = getAllPluginsForAdmin();

	async function toggle(key: PluginKey, currentValue: boolean) {
		await currentHub.toggle(key, !currentValue);
	}
</script>

<section aria-label="Plugin activation">
	<h3>Hub sections</h3>
	<p>Turn sections on or off for your members.</p>

	<ul>
		{#each plugins as plugin (plugin.key)}
			<li>
				<label>
					<input
						type="checkbox"
						checked={currentHub.plugins[plugin.key]}
						onchange={() => toggle(plugin.key, currentHub.plugins[plugin.key])}
					/>
					<strong>{plugin.title}</strong> — {plugin.description}
				</label>
			</li>
		{/each}
	</ul>
</section>
