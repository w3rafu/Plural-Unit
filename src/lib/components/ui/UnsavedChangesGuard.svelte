<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';

	beforeNavigate((navigation) => {
		if (typeof window === 'undefined' || !unsavedChanges.hasUnsavedChanges || navigation.willUnload) {
			return;
		}

		const shouldLeave = window.confirm(unsavedChanges.prompt);
		if (!shouldLeave) {
			navigation.cancel();
		}
	});

	onMount(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!unsavedChanges.hasUnsavedChanges) {
				return;
			}

			event.preventDefault();
			event.returnValue = '';
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});
</script>
