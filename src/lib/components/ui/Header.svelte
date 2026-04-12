<script lang="ts">
	import { page } from '$app/state';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import AuthHelpSheet from '$lib/components/ui/AuthHelpSheet.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import HubNotificationsSheet from '$lib/components/ui/HubNotificationsSheet.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import {
		pageHeader,
		resolvePageHeaderPreset,
		shouldShowPageHeaderSubtitle,
		type PageHeaderAction
	} from '$lib/stores/pageHeader.svelte';

	const headerPreset = $derived(resolvePageHeaderPreset(pageHeader.config));
	const headerActions = $derived(pageHeader.config.actions ?? []);
	const isBrandHeader = $derived(headerPreset === 'brand');
	const hasBack = $derived(Boolean(pageHeader.config.onBack));
	const backButtonLabel = $derived(pageHeader.config.backLabel?.trim() || '');
	const backButtonAriaLabel = $derived(backButtonLabel || 'Back');
	const showSubtitle = $derived(
		Boolean(pageHeader.config.subtitle) && shouldShowPageHeaderSubtitle(headerPreset)
	);
	const showBrandMark = $derived(!hasBack);
	const showContextAvatar = $derived(
		hasBack && headerPreset === 'context' && Boolean(pageHeader.config.avatarText)
	);
	const shellClass = $derived(
		[
			'shell-header__surface',
			isBrandHeader ? 'shell-header__surface--brand' : '',
			headerPreset === 'section' ? 'shell-header__surface--section' : '',
			headerPreset === 'context' ? 'shell-header__surface--context' : '',
			headerPreset === 'detail' ? 'shell-header__surface--detail' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
	const titleClass = $derived(
		[
			'shell-header__title',
			headerPreset === 'brand' ? 'shell-header__title--brand' : '',
			headerPreset === 'section' ? 'shell-header__title--section' : '',
			headerPreset === 'context' ? 'shell-header__title--context' : '',
			headerPreset === 'detail' ? 'shell-header__title--detail' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
	const subtitleClass = $derived(
		[
			'shell-header__subtitle',
			headerPreset === 'brand' ? 'shell-header__subtitle--brand' : '',
			headerPreset === 'context' ? 'shell-header__subtitle--context' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
	const showOrganizationControl = $derived(currentUser.isLoggedIn && currentOrganization.isAdmin);
	const isOrganizationRoute = $derived(page.url.pathname.startsWith('/organization'));
	const controlButtonClass = 'shell-header__control';
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
						<p class={subtitleClass}>{pageHeader.config.subtitle}</p>
					{/if}
				</div>
			</div>

			<div class="shell-header__controls">
				<div role="group" aria-label="Header controls" class="shell-header__control-group">
					{#if showOrganizationControl}
						<Button
							href="/organization/access"
							type="button"
							variant="outline"
							size="sm"
							class={controlButtonClass}
							aria-current={isOrganizationRoute ? 'page' : undefined}
							aria-label="Open organization admin tools"
						>
							<Building2Icon class="shell-header__control-icon" aria-hidden="true" />
							<span class="shell-header__control-label">Org</span>
						</Button>
					{/if}

					{#if currentUser.isLoggedIn}
						<HubNotificationsSheet triggerLabel="Alerts" triggerClass={controlButtonClass} />
					{:else}
						<AuthHelpSheet triggerLabel="Help" triggerClass={controlButtonClass} />
					{/if}

					<ThemeToggle class={controlButtonClass} />
				</div>
			</div>
		</div>
	</div>
</header>

<style>
	.shell-header {
		padding-top: max(0.1rem, env(safe-area-inset-top));
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

	.shell-header__surface--section,
	.shell-header__surface--context,
	.shell-header__surface--detail {
		padding-block: 0.5rem 0.7rem;
		min-height: 3.9rem;
	}

	.shell-header__row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.85rem;
		width: 100%;
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
		width: 3.05rem;
		height: 3.05rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
		overflow: visible;
	}

	.shell-header__brand-image {
		display: block;
		width: 2.45rem;
		height: 2.45rem;
		object-fit: contain;
		filter: invert(1) brightness(0.1);
		transform: none;
	}

	.shell-header__avatar-badge {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 2.35rem;
		height: 2.35rem;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 9999px;
		background: var(--background);
		font-size: 0.92rem;
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
		gap: 0;
		align-content: center;
	}

	.shell-header__title {
		margin: 0;
		font-size: clamp(1.25rem, 2.5vw, 1.7rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.045em;
		color: var(--foreground);
	}

	.shell-header__title--brand {
		font-size: clamp(1.45rem, 3vw, 1.95rem);
	}

	.shell-header__title--section,
	.shell-header__title--context,
	.shell-header__title--detail {
		font-size: clamp(1.22rem, 2.45vw, 1.55rem);
	}

	.shell-header__surface--section .shell-header__brand-mark {
		width: 2.75rem;
		height: 2.75rem;
	}

	.shell-header__surface--section .shell-header__brand-image {
		width: 2.2rem;
		height: 2.2rem;
	}

	.shell-header__subtitle {
		margin: 0.16rem 0 0;
		max-width: 34rem;
		font-size: 0.82rem;
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
	}

	:global(.shell-header__control-group) {
		display: inline-flex;
		align-items: center;
		gap: 0.12rem;
		border: 1px solid var(--border);
		border-radius: 9999px;
		padding: 0.16rem;
		background: color-mix(in srgb, var(--card) 92%, var(--background) 8%);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.32);
	}

	:global(.shell-header__control) {
		border-color: transparent;
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
		background: color-mix(in srgb, var(--color-muted) 88%, white 12%);
		color: var(--foreground);
		opacity: 1;
	}

	:global(.shell-header__control:active),
	:global(.shell-header__control[aria-expanded='true']),
	:global(.shell-header__control[aria-current='page']) {
		position: relative;
		z-index: 1;
		background: color-mix(in srgb, var(--color-muted) 76%, var(--foreground) 8%);
		border-color: transparent;
		box-shadow:
			0 1px 2px rgb(15 23 42 / 0.08),
			inset 0 1px 0 rgb(255 255 255 / 0.18);
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

	:global(.shell-header__control-group > * + *) {
		position: relative;
	}

	:global(.shell-header__control-group > * + *::before) {
		content: '';
		position: absolute;
		left: -0.06rem;
		top: 0.5rem;
		bottom: 0.5rem;
		width: 1px;
		background: var(--border);
	}

	:global(.dark .shell-header__surface) {
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

	:global(.dark .shell-header__control-group) {
		background: var(--card);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
	}

	:global(.dark .shell-header__control) {
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:visited) {
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:hover) {
		background: color-mix(in srgb, var(--color-muted) 82%, white 10%);
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:active),
	:global(.dark .shell-header__control[aria-expanded='true']),
	:global(.dark .shell-header__control[aria-current='page']) {
		background: color-mix(in srgb, var(--color-muted) 72%, white 14%);
		border-color: transparent;
		box-shadow:
			0 1px 3px rgb(0 0 0 / 0.24),
			inset 0 1px 0 rgb(255 255 255 / 0.08);
	}

	:global(.dark .shell-header__control:disabled),
	:global(.dark .shell-header__control[aria-disabled='true']) {
		color: var(--muted-foreground);
	}

	:global(.dark .shell-header__control-group > * + *::before) {
		background: var(--border);
	}

	@media (max-width: 640px) {
		.shell-header__surface {
			padding: 0.45rem 0 0.55rem;
		}

		.shell-header__row {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
			gap: 0.5rem;
		}

		.shell-header__identity {
			gap: 0.6rem;
		}

		.shell-header__controls {
			align-self: center;
			justify-self: end;
		}

		.shell-header__title {
			font-size: clamp(1.02rem, 5vw, 1.22rem);
		}

		.shell-header__subtitle {
			max-width: 14rem;
			font-size: 0.74rem;
			line-height: 1.25;
		}

		.shell-header__back-label,
		:global(.shell-header__control-label) {
			display: none;
		}

		:global(.shell-header__control) {
			min-width: 2.2rem;
			padding-inline: 0.55rem;
		}

		:global(.shell-header__control-group) {
			padding: 0.12rem;
		}

		.shell-header__brand-mark {
			width: 2.45rem;
			height: 2.45rem;
		}

		.shell-header__brand-image {
			width: 2rem;
			height: 2rem;
		}

		.shell-header__avatar-badge {
			width: 2.1rem;
			height: 2.1rem;
		}
	}
</style>
