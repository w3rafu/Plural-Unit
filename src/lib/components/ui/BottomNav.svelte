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
		class="app-bottom-nav z-20 flex-none pt-px lg:hidden"
		style:padding-bottom="max(0.5rem, env(safe-area-inset-bottom))"
	>
		<div
			class="grid grid-cols-4 gap-0.75 rounded-[1.6rem] border border-border/70 bg-card/92 px-1 py-1 shadow-[0_-1px_1px_rgba(15,23,42,0.03)] backdrop-blur"
		>
			{#each BOTTOM_NAV_TABS as tab (tab.id)}
				<a
					href={tab.href}
					class={cn(
						'relative flex min-h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.95rem] px-1.25 py-1.1 text-center text-[0.66rem] font-medium leading-tight transition-[background-color,color,box-shadow] duration-150 sm:text-[0.74rem]',
						activeTabId === tab.id
							? 'bg-background/92 text-foreground shadow-[0_1px_1px_rgba(15,23,42,0.06)]'
							: 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'
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
							class="absolute -right-2.1 -top-1.2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.75 text-[0.56rem] font-bold leading-none text-destructive-foreground"
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
