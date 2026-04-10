<script lang="ts">
	import { Portal } from 'bits-ui';

	let { ...restProps }: import('svelte/elements').HTMLAttributes<HTMLDivElement> = $props();
</script>

<Portal {...restProps} />