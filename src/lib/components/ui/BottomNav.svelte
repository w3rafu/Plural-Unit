<script lang="ts">
	import { page } from '$app/state';
	import HouseIcon from '@lucide/svelte/icons/house';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import UsersIcon from '@lucide/svelte/icons/users';
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
		class="app-bottom-nav z-20 flex-none pt-0.5"
		style:padding-bottom="max(0.6rem, env(safe-area-inset-bottom))"
	>
		<div
			class="grid grid-cols-4 gap-1.5 rounded-3xl border border-border/80 bg-card/95 px-1.5 py-1.5 shadow-[0_-1px_2px_rgba(15,23,42,0.04)] backdrop-blur"
		>
			{#each BOTTOM_NAV_TABS as tab (tab.id)}
				<a
					href={tab.href}
					class={cn(
						'relative flex min-h-[2.9rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-1.5 text-center text-[0.7rem] font-medium leading-tight transition-[background-color,border-color,color,box-shadow] duration-150 sm:text-[0.76rem]',
						activeTabId === tab.id
							? 'border-border/80 bg-background text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
							: 'border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground'
					)}
					aria-label={tab.label}
					title={tab.label}
					aria-current={activeTabId === tab.id ? 'page' : undefined}
				>
					<span class="relative flex items-center justify-center">
						{#if tab.id === 'hub'}
							<HouseIcon class="size-4" aria-hidden="true" />
						{:else if tab.id === 'messages'}
							<MessageSquareIcon class="size-4" aria-hidden="true" />
						{:else if tab.id === 'directory'}
							<UsersIcon class="size-4" aria-hidden="true" />
						{:else}
							<UserRoundIcon class="size-4" aria-hidden="true" />
						{/if}
					{#if tab.id === 'messages' && unreadCount > 0}
						<span
							class="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-none text-destructive-foreground"
							aria-label={`${unreadCount} unread`}
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					{/if}
					</span>
					<span>{tab.label}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}
