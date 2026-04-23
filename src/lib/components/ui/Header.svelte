<script lang="ts">
	import { page } from '$app/state';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import HouseIcon from '@lucide/svelte/icons/house';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import UsersIcon from '@lucide/svelte/icons/users';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { BOTTOM_NAV_TABS, getActiveBottomNavTab } from '$lib/components/ui/bottomNavModel';
	import HubNotificationsSheet from '$lib/components/ui/HubNotificationsSheet.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import {
		pageHeader,
		resolvePageHeaderPreset,
		shouldShowPageHeaderSubtitle
	} from '$lib/stores/pageHeader.svelte';
	import { cn } from '$lib/utils';

	const rawPreset = $derived(resolvePageHeaderPreset(pageHeader.config));
	const isBrandHeader = $derived(rawPreset === 'brand');
	const hasBack = $derived(Boolean(pageHeader.config.onBack));
	const backButtonLabel = $derived(pageHeader.config.backLabel?.trim() || '');
	const backButtonAriaLabel = $derived(backButtonLabel || 'Back');
	const showSubtitle = $derived(
		Boolean(pageHeader.config.subtitle) && shouldShowPageHeaderSubtitle(rawPreset)
	);
	const headerActions = $derived(pageHeader.config.actions ?? []);
	const showBrandMark = $derived(!hasBack);
	const showContextAvatar = $derived(
		hasBack && Boolean(pageHeader.config.avatarText)
	);
	const shellClass = $derived(
		isBrandHeader ? 'shell-header__surface' : 'shell-header__surface shell-header__surface--page'
	);
	const titleClass = $derived(
		isBrandHeader ? 'shell-header__title shell-header__title--brand' : 'shell-header__title shell-header__title--page'
	);
	const showOrganizationControl = $derived(currentUser.isLoggedIn && currentOrganization.isAdmin);
	const isOrganizationRoute = $derived(page.url.pathname.startsWith('/organization'));
	const hubBroadcastHref = $derived(page.url.pathname === '/' ? '#hub-broadcasts' : '/#hub-broadcasts');
	const hubEventHref = $derived(page.url.pathname === '/' ? '#hub-events' : '/#hub-events');
	const manageContentHref = $derived(
		currentUser.isLoggedIn && currentOrganization.isAdmin ? '/hub/manage/content' : undefined
	);
	const manageBroadcastsHref = $derived(
		currentUser.isLoggedIn && currentOrganization.isAdmin
			? '/hub/manage/content#manage-broadcasts'
			: undefined
	);
	const manageEventsHref = $derived(
		currentUser.isLoggedIn && currentOrganization.isAdmin
			? '/hub/manage/content#manage-events'
			: undefined
	);
	const controlButtonClass = 'shell-header__control';
	const activeSectionNavId = $derived(getActiveBottomNavTab(page.url.pathname));
	const showSectionNav = $derived(currentUser.isLoggedIn);
</script>

<header class="shell-header">
	<div class={shellClass}>
		<div class="shell-header__row">
			<div class="shell-header__identity">
				{#if hasBack}
					<Button
						variant="outline"
						size="sm"
						class={`shell-header__back-button ${controlButtonClass}`}
						onclick={() => pageHeader.config.onBack?.()}
						aria-label={backButtonAriaLabel}
					>
						<span aria-hidden="true" class="shell-header__back-icon">&larr;</span>
						{#if backButtonLabel}
							<span class="shell-header__back-label">{backButtonLabel}</span>
						{/if}
					</Button>
				{:else if showBrandMark}
					<a href="/" class="shell-header__brand-mark" aria-label="Go to hub">
						<img src="/logo-white.png" alt="CommunionLink logo" class="shell-header__brand-image" />
					</a>
				{/if}

				{#if showContextAvatar}
					<Avatar.Root class="shell-header__avatar-badge after:hidden" aria-hidden="true">
						{#if pageHeader.config.avatarImageUrl}
							<Avatar.Image
								class="shell-header__avatar-image"
								src={pageHeader.config.avatarImageUrl}
								alt=""
							/>
						{:else}
							<Avatar.Fallback class="shell-header__avatar-fallback">
								{pageHeader.config.avatarText}
							</Avatar.Fallback>
						{/if}
					</Avatar.Root>
				{/if}

				<div class="shell-header__title-block">
					<h1 class={titleClass}>{pageHeader.config.title}</h1>
					{#if showSubtitle}
						<p class="shell-header__subtitle">{pageHeader.config.subtitle}</p>
					{/if}
				</div>
			</div>

			{#if showSectionNav}
				<nav aria-label="Primary sections" class="shell-header__section-nav">
					{#each BOTTOM_NAV_TABS as tab (tab.id)}
						<a
							href={tab.href}
							class={cn(
								'shell-header__section-link',
								activeSectionNavId === tab.id && 'shell-header__section-link--active'
							)}
							aria-current={activeSectionNavId === tab.id ? 'page' : undefined}
						>
							{#if tab.id === 'hub'}
								<HouseIcon class="shell-header__section-icon" aria-hidden="true" />
							{:else if tab.id === 'messages'}
								<MessageSquareIcon class="shell-header__section-icon" aria-hidden="true" />
							{:else if tab.id === 'directory'}
								<UsersIcon class="shell-header__section-icon" aria-hidden="true" />
							{:else}
								<UserRoundIcon class="shell-header__section-icon" aria-hidden="true" />
							{/if}
							<span>{tab.shortLabel ?? tab.label}</span>
						</a>
					{/each}
				</nav>
			{/if}

			<div class="shell-header__controls">
				<div role="group" aria-label="Header controls" class="shell-header__control-group">
					{#each headerActions as action, index (action.id)}
						{#if action.href}
							<Button
								href={action.href}
								type="button"
								variant={index === 0 ? 'default' : 'outline'}
								size="sm"
								class={`${controlButtonClass} ${index === 0 ? 'shell-header__control--primary' : ''}`}
								disabled={action.disabled}
								aria-label={action.ariaLabel ?? action.label}
							>
								{action.label}
							</Button>
						{:else}
							<Button
								type="button"
								variant={index === 0 ? 'default' : 'outline'}
								size="sm"
								class={`${controlButtonClass} ${index === 0 ? 'shell-header__control--primary' : ''}`}
								disabled={action.disabled}
								aria-label={action.ariaLabel ?? action.label}
								onclick={() => action.onClick?.()}
							>
								{action.label}
							</Button>
						{/if}
					{/each}

					{#if showOrganizationControl}
						<Button
							href="/organization"
							type="button"
							variant="outline"
							size="sm"
							class={controlButtonClass}
							aria-current={isOrganizationRoute ? 'page' : undefined}
							aria-label="Open organization admin tools"
						>
							<Building2Icon class="shell-header__control-icon" aria-hidden="true" />
							<span class="shell-header__control-label">Admin</span>
						</Button>
					{/if}

					{#if currentUser.isLoggedIn}
						<HubNotificationsSheet
							triggerLabel="Alerts"
							triggerClass={controlButtonClass}
							broadcastHref={hubBroadcastHref}
							eventHref={hubEventHref}
							{manageContentHref}
							{manageBroadcastsHref}
							{manageEventsHref}
						/>
					{/if}

					<ThemeToggle class={controlButtonClass} />
				</div>
			</div>
		</div>
	</div>
</header>

<style>
	.shell-header {
		padding-top: max(0.05rem, env(safe-area-inset-top));
	}

	.shell-header__surface {
		display: grid;
		align-items: center;
		border: 0;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		padding: 0.55rem 0 0.7rem;
		min-height: 3.75rem;
		background: transparent;
		box-shadow: none;
	}

	.shell-header__surface--page {
		padding-block: 0.5rem 0.7rem;
		min-height: 3.9rem;
	}

	.shell-header__row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.85rem;
		width: 100%;
	}

	.shell-header__section-nav {
		display: none;
	}

	.shell-header__identity {
		display: flex;
		min-width: 0;
		flex: 1 1 auto;
		align-items: center;
		gap: 0.75rem;
	}

	.shell-header__brand-mark {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 3.72rem;
		height: 3.72rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
		overflow: visible;
	}

	.shell-header__brand-image {
		display: block;
		width: 3.08rem;
		height: 3.08rem;
		object-fit: contain;
		filter: invert(1) brightness(0.1);
		transform: none;
	}

	.shell-header__avatar-badge {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 2.7rem;
		height: 2.7rem;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 9999px;
		background: var(--background);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--foreground);
	}

	.shell-header__avatar-image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.shell-header__avatar-fallback {
		background: transparent;
		color: inherit;
		font-size: inherit;
		font-weight: inherit;
		letter-spacing: inherit;
	}

	.shell-header__title-block {
		min-width: 0;
		display: grid;
		gap: 0.08rem;
		align-content: center;
		max-width: min(100%, 34rem);
	}

	.shell-header__title {
		margin: 0;
		font-size: clamp(1.25rem, 2.5vw, 1.7rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.045em;
		color: var(--foreground);
		text-wrap: balance;
	}

	.shell-header__title--brand {
		font-size: clamp(1.45rem, 3vw, 1.95rem);
	}

	.shell-header__title--page {
		font-size: clamp(1.22rem, 2.45vw, 1.55rem);
	}

	.shell-header__surface--page .shell-header__brand-mark {
		width: 3.35rem;
		height: 3.35rem;
	}

	.shell-header__surface--page .shell-header__brand-image {
		width: 2.74rem;
		height: 2.74rem;
	}

	.shell-header__subtitle {
		margin: 0.14rem 0 0;
		max-width: 30rem;
		font-size: 0.8rem;
		line-height: 1.35;
		color: var(--muted-foreground);
	}

	.shell-header__back-button {
		gap: 0.45rem;
		flex: none;
		border-radius: 9999px;
		padding-inline: 0.75rem;
	}

	.shell-header__back-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.shell-header__controls {
		flex: none;
		display: flex;
		align-items: center;
		justify-self: end;
		min-width: 0;
	}

	:global(.shell-header__control-group) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.45rem;
	}

	:global(.shell-header__control) {
		border-color: color-mix(in srgb, var(--border) 86%, transparent);
		border-radius: 9999px;
		background: transparent;
		box-shadow: none;
		color: var(--foreground);
		min-width: 2.35rem;
		gap: 0.45rem;
		transition:
			background-color 150ms ease,
			color 150ms ease,
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	:global(.shell-header__control-icon) {
		flex: none;
		width: 1rem;
		height: 1rem;
	}

	:global(.shell-header__control-label) {
		display: inline-block;
		white-space: nowrap;
	}

	:global(.shell-header__control:visited) {
		color: var(--foreground);
	}

	:global(.shell-header__control:hover) {
		background: var(--muted);
		color: var(--foreground);
		opacity: 1;
	}

	:global(.shell-header__control--primary) {
		background: var(--foreground);
		border-color: var(--foreground);
		color: var(--background);
	}

	:global(.shell-header__control--primary:visited) {
		color: var(--background);
	}

	:global(.shell-header__control--primary:hover) {
		background: color-mix(in srgb, var(--foreground) 90%, white 10%);
		color: var(--background);
	}

	:global(.shell-header__control:active),
	:global(.shell-header__control[aria-expanded='true']),
	:global(.shell-header__control[aria-current='page']) {
		position: relative;
		z-index: 1;
		background: var(--muted);
		border-color: var(--border);
		box-shadow: none;
		opacity: 1;
	}

	:global(.shell-header__control:focus-visible) {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-ring) 24%, transparent);
	}

	:global(.shell-header__control:disabled),
	:global(.shell-header__control[aria-disabled='true']) {
		color: var(--muted-foreground);
		opacity: 0.72;
	}

	@media (min-width: 1024px) {
		.shell-header__surface--page .shell-header__title-block {
			max-width: min(100%, 25rem);
		}

		.shell-header__section-nav {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			padding: 0.25rem;
			border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
			border-radius: 9999px;
			background: color-mix(in srgb, var(--card) 92%, transparent);
			box-shadow: 0 1px 2px rgb(15 23 42 / 0.05);
		}

		.shell-header__section-link {
			display: inline-flex;
			align-items: center;
			gap: 0.45rem;
			min-height: 2.2rem;
			padding: 0.45rem 0.8rem;
			border: 1px solid transparent;
			border-radius: 9999px;
			font-size: 0.76rem;
			font-weight: 600;
			line-height: 1;
			color: var(--muted-foreground);
			transition:
				background-color 150ms ease,
				color 150ms ease,
				border-color 150ms ease,
				box-shadow 150ms ease;
		}

		.shell-header__section-link:hover {
			background: var(--muted);
			color: var(--foreground);
			opacity: 1;
		}

		.shell-header__section-link--active {
			border-color: color-mix(in srgb, var(--border) 88%, transparent);
			background: var(--card);
			color: var(--foreground);
			box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
		}

		.shell-header__section-icon {
			width: 0.95rem;
			height: 0.95rem;
			flex: none;
		}

		:global(.dark .shell-header__section-nav) {
			background: color-mix(in srgb, var(--card) 82%, transparent);
			box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
		}

		:global(.dark .shell-header__section-link:hover),
		:global(.dark .shell-header__section-link--active) {
			background: color-mix(in srgb, var(--muted) 88%, transparent);
			color: var(--foreground);
		}
	}

	@media (min-width: 1024px) and (max-width: 1180px) {
		.shell-header__surface--page .shell-header__title {
			font-size: clamp(1.16rem, 1.9vw, 1.42rem);
		}

		.shell-header__surface--page .shell-header__title-block {
			max-width: min(100%, 22rem);
		}
	}

	@media (min-width: 1024px) and (max-width: 1100px) {
		.shell-header__section-nav {
			gap: 0.15rem;
			padding: 0.2rem;
		}

		.shell-header__section-link {
			gap: 0;
			padding-inline: 0.58rem;
		}

		.shell-header__section-link span {
			display: none;
		}

		:global(.shell-header__control-group) {
			gap: 0.35rem;
		}

		.shell-header__surface--page .shell-header__title-block {
			max-width: min(100%, 20rem);
		}
	}

	:global(.dark .shell-header__surface) {
		background: transparent;
		box-shadow: none;
	}

	:global(.dark .shell-header__brand-image) {
		filter: none;
	}

	:global(.dark .shell-header__avatar-badge) {
		background: var(--background);
	}

	:global(.dark .shell-header__title) {
		color: var(--foreground);
	}

	:global(.dark .shell-header__subtitle) {
		color: var(--muted-foreground);
	}

	:global(.dark .shell-header__control) {
		color: var(--foreground);
		background: transparent;
	}

	:global(.dark .shell-header__control:visited) {
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:hover) {
		background: var(--muted);
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:active),
	:global(.dark .shell-header__control[aria-expanded='true']),
	:global(.dark .shell-header__control[aria-current='page']) {
		background: var(--muted);
	}

	:global(.dark .shell-header__control--primary),
	:global(.dark .shell-header__control--primary:visited) {
		background: var(--foreground);
		border-color: var(--foreground);
		color: var(--background);
	}

	:global(.dark .shell-header__control:disabled),
	:global(.dark .shell-header__control[aria-disabled='true']) {
		color: var(--muted-foreground);
	}

	@media (max-width: 720px) {
		.shell-header__surface,
		.shell-header__surface--page {
			padding-inline: 0.65rem;
		}

		.shell-header__row {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.shell-header__controls {
			justify-self: stretch;
		}

		:global(.shell-header__control-group) {
			justify-content: flex-start;
		}
	}

	@media (max-width: 640px) {
		.shell-header__surface {
			padding: 0.45rem 0.55rem 0.55rem;
		}

		.shell-header__row {
			grid-template-columns: 1fr;
			align-items: start;
			gap: 0.4rem;
		}

		.shell-header__identity {
			gap: 0.55rem;
		}

		.shell-header__controls {
			align-self: start;
			justify-self: stretch;
		}

		:global(.shell-header__control-group) {
			gap: 0.35rem;
			justify-content: flex-start;
		}

		.shell-header__title {
			font-size: clamp(0.98rem, 4.8vw, 1.16rem);
		}

		.shell-header__subtitle {
			max-width: none;
			font-size: 0.72rem;
			line-height: 1.25;
		}

		.shell-header__back-label,
		:global(.shell-header__control-label) {
			display: none;
		}

		:global(.shell-header__control) {
			min-width: 2.05rem;
			padding-inline: 0.45rem;
		}

		.shell-header__brand-mark {
			width: 2.3rem;
			height: 2.3rem;
		}

		.shell-header__brand-image {
			width: 1.85rem;
			height: 1.85rem;
		}

		.shell-header__avatar-badge {
			width: 2rem;
			height: 2rem;
		}
	}
</style>
