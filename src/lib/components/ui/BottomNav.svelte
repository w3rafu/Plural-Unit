<script lang="ts">
	import { page } from '$app/state';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { BOTTOM_NAV_TABS, getActiveBottomNavTab } from '$lib/components/ui/bottomNavModel';

	const activeTabId = $derived(getActiveBottomNavTab(page.url.pathname));
</script>

{#if currentUser.isLoggedIn}
	<nav aria-label="Primary" class="app-bottom-nav sticky bottom-4 z-20 mt-auto">
		<div class="grid grid-cols-4 gap-2 rounded-2xl border border-slate-300 bg-stone-100 p-2 shadow-sm">
			{#each BOTTOM_NAV_TABS as tab (tab.id)}
				<a
					href={tab.href}
					class="flex min-h-14 items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-medium no-underline transition-colors"
					class:border-slate-900={activeTabId === tab.id}
					class:border-transparent={activeTabId !== tab.id}
					class:bg-stone-200={activeTabId === tab.id}
					class:text-slate-900={activeTabId === tab.id}
					class:text-slate-600={activeTabId !== tab.id}
					aria-current={activeTabId === tab.id ? 'page' : undefined}
				>
					{tab.label}
				</a>
			{/each}
		</div>
	</nav>
{/if}