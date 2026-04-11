<!--
  Hub redirect — hub content now lives at the root route.
-->
<script lang="ts">
	import { goto } from '$app/navigation';

	$effect(() => {
		void goto('/', { replaceState: true });
	});
</script>
