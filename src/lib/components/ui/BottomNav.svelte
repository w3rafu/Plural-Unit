<script lang="ts">
	import { page } from '$app/state';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { BOTTOM_NAV_TABS, getActiveBottomNavTab } from '$lib/components/ui/bottomNavModel';
	import { cn } from '$lib/utils';

	const activeTabId = $derived(getActiveBottomNavTab(page.url.pathname));
	const unreadCount = $derived(currentMessages.totalUnreadCount);
</script>

{#if currentUser.isLoggedIn}
	<nav
		id="bottom-nav"
		aria-label="Primary"
		class="app-bottom-nav z-20 flex-none"
		style:padding-bottom="max(0.6rem, env(safe-area-inset-bottom))"
	>
		<div
			class="grid grid-cols-4 gap-1 border-t border-border/80 bg-transparent px-0 pt-2 pb-0 shadow-none"
		>
			{#each BOTTOM_NAV_TABS as tab (tab.id)}
				<a
					href={tab.href}
					class={cn(
						'relative flex min-h-12 min-w-0 items-center justify-center rounded-xl border px-2 py-2 text-center text-[0.82rem] font-medium leading-tight transition-[background-color,border-color,color] duration-150 sm:px-3 sm:text-sm',
						activeTabId === tab.id
							? 'border-border bg-card text-foreground after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-foreground/85 sm:after:w-8'
							: 'border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground'
					)}
					aria-label={tab.label}
					title={tab.label}
					aria-current={activeTabId === tab.id ? 'page' : undefined}
				>
					<span class={tab.shortLabel ? 'hidden sm:inline' : ''}>{tab.label}</span>
					{#if tab.shortLabel}
						<span class="sm:hidden">{tab.shortLabel}</span>
					{/if}
					{#if tab.id === 'messages' && unreadCount > 0}
						<span
							class="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-none text-destructive-foreground"
							aria-label={`${unreadCount} unread`}
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	</nav>
{/if}
