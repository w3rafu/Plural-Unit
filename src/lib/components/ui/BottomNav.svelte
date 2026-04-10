<script lang="ts">
	import { page } from '$app/state';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { BOTTOM_NAV_TABS, getActiveBottomNavTab } from '$lib/components/ui/bottomNavModel';
	import { cn } from '$lib/utils';

	const activeTabId = $derived(getActiveBottomNavTab(page.url.pathname));
</script>

{#if currentUser.isLoggedIn}
	<nav
		id="bottom-nav"
		aria-label="Primary"
		class="app-bottom-nav sticky bottom-3 z-20 mt-2 pb-[max(0px,env(safe-area-inset-bottom))]"
	>
		<div
			class="grid grid-cols-4 gap-2 rounded-[1.55rem] border border-border/70 bg-card/90 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(24,24,27,0.08),0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/92 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_44px_rgba(0,0,0,0.24)]"
		>
			{#each BOTTOM_NAV_TABS as tab (tab.id)}
				<a
					href={tab.href}
					class={cn(
						'flex min-h-14 items-center justify-center rounded-[1rem] border px-3 py-2 text-center text-sm font-medium transition-colors duration-150',
						activeTabId === tab.id
							? 'border-border bg-background text-foreground shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
							: 'border-transparent text-muted-foreground hover:bg-muted/65 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800/90 dark:hover:text-zinc-50'
					)}
					aria-current={activeTabId === tab.id ? 'page' : undefined}
				>
					{tab.label}
				</a>
			{/each}
		</div>
	</nav>
{/if}
