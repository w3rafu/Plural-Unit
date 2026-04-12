<script lang="ts">
	import AuthHelpSheet from '$lib/components/ui/AuthHelpSheet.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import HubNotificationsSheet from '$lib/components/ui/HubNotificationsSheet.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
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
							<span>{backButtonLabel}</span>
						{/if}
					</Button>
				{:else if showBrandMark}
					<a href="/" class="shell-header__brand-mark" aria-label="Go to hub">
						<img src="/logo-white.png" alt="CommunionLink logo" class="shell-header__brand-image" />
					</a>
				{/if}

				{#if showContextAvatar}
					<div class="shell-header__avatar-badge" aria-hidden="true">
						{#if pageHeader.config.avatarImageUrl}
							<img
								class="shell-header__avatar-image"
								src={pageHeader.config.avatarImageUrl}
								alt=""
							/>
						{:else}
							{pageHeader.config.avatarText}
						{/if}
					</div>
				{/if}

				<div class="shell-header__title-block">
					<h1 class={titleClass}>{pageHeader.config.title}</h1>
					{#if showSubtitle}
						<p class={subtitleClass}>{pageHeader.config.subtitle}</p>
					{/if}
				</div>
			</div>

			<div class="shell-header__controls">
				<ButtonGroup.Root aria-label="Header controls" class="shell-header__control-group">
					{#if currentUser.isLoggedIn}
						<HubNotificationsSheet triggerLabel="Alerts" triggerClass={controlButtonClass} />
					{:else}
						<AuthHelpSheet triggerLabel="Help" triggerClass={controlButtonClass} />
					{/if}

					<ThemeToggle class={controlButtonClass} />
				</ButtonGroup.Root>
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
		padding: 0.5rem 0 0.65rem;
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
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
		width: 2.8rem;
		height: 2.8rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
		overflow: visible;
	}

	.shell-header__brand-image {
		display: block;
		width: 2.55rem;
		height: 2.55rem;
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
		width: 2.6rem;
		height: 2.6rem;
	}

	.shell-header__surface--section .shell-header__brand-image {
		width: 2.35rem;
		height: 2.35rem;
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
	}

	:global(.shell-header__control-group) {
		border: 1px solid var(--border);
		border-radius: 9999px;
		padding: 0.14rem;
		background: var(--card);
	}

	:global(.shell-header__control) {
		border-color: transparent;
		border-radius: 9999px;
		background: transparent;
		box-shadow: none;
		color: var(--foreground);
		transition:
			background-color 150ms ease,
			color 150ms ease,
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	:global(.shell-header__control:visited) {
		color: var(--foreground);
	}

	:global(.shell-header__control:hover) {
		background: color-mix(in srgb, var(--color-muted) 82%, white 18%);
		color: var(--foreground);
	}

	:global(.shell-header__control:active),
	:global(.shell-header__control[aria-expanded='true']) {
		background: var(--muted);
		border-color: color-mix(in srgb, var(--color-border) 82%, var(--color-foreground) 18%);
		box-shadow: inset 0 1px 1px rgb(15 23 42 / 0.05);
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
		left: 0;
		top: 22%;
		bottom: 22%;
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
	}

	:global(.dark .shell-header__control) {
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:visited) {
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:hover) {
		background: color-mix(in srgb, var(--color-muted) 88%, white 12%);
		color: var(--foreground);
	}

	:global(.dark .shell-header__control:active),
	:global(.dark .shell-header__control[aria-expanded='true']) {
		background: var(--muted);
		border-color: color-mix(in srgb, var(--color-border) 76%, white 24%);
		box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.16);
	}

	:global(.dark .shell-header__control:disabled),
	:global(.dark .shell-header__control[aria-disabled='true']) {
		color: var(--muted-foreground);
	}

	:global(.dark .shell-header__control-group > * + *::before) {
		background: var(--border);
	}

	@media (max-width: 480px) {
		.shell-header__surface {
			padding: 0.45rem 0 0.6rem;
		}

		.shell-header__row {
			flex-direction: column;
			align-items: stretch;
		}

		.shell-header__controls {
			align-self: flex-end;
		}

		.shell-header__brand-mark {
			width: 2.45rem;
			height: 2.45rem;
		}

		.shell-header__brand-image {
			width: 2.2rem;
			height: 2.2rem;
		}
	}
</style>
