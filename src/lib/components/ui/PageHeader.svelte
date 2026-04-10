<script lang="ts">
	import { onDestroy } from 'svelte';
	import { pageHeader } from '$lib/stores/pageHeader.svelte';
	import type { PageHeaderAction, PageHeaderPreset } from '$lib/stores/pageHeader.svelte';

	let {
		preset = undefined as PageHeaderPreset | undefined,
		title,
		subtitle = '',
		avatarText = '',
		avatarImageUrl = '',
		backLabel = '',
		onBack = null as (() => void) | null,
		actions = [] as PageHeaderAction[]
	} = $props();

	$effect(() => {
		pageHeader.set({
			preset,
			title,
			subtitle,
			avatarText,
			avatarImageUrl,
			backLabel,
			onBack,
			actions
		});
	});

	onDestroy(() => {
		pageHeader.reset();
	});
</script>
