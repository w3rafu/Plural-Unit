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
					<a href="/" class="shell-header__brand-mark" aria-label="Go to home">
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
		position: sticky;
		top: 0;
		z-index: 30;
		padding-top: max(0.35rem, env(safe-area-inset-top));
	}

	.shell-header__surface {
		display: grid;
		align-items: center;
		border: 1px solid rgb(24 24 27 / 0.08);
		border-radius: 1.55rem;
		padding: 1.05rem 1.1rem;
		min-height: 4.75rem;
		background:
			radial-gradient(circle at top left, rgb(255 255 255 / 0.78), transparent 34%),
			linear-gradient(180deg, rgb(255 255 255 / 0.92), rgb(244 244 245 / 0.96));
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.7),
			inset 0 -1px 0 rgb(24 24 27 / 0.08),
			0 16px 34px rgb(15 23 42 / 0.08);
		backdrop-filter: blur(18px) saturate(1.08);
	}

	.shell-header__surface--brand {
		background:
			radial-gradient(circle at top left, rgb(255 211 153 / 0.22), transparent 28%),
			radial-gradient(circle at top right, rgb(255 255 255 / 0.34), transparent 24%),
			linear-gradient(180deg, rgb(255 255 255 / 0.94), rgb(243 244 246 / 0.98));
	}

	.shell-header__surface--section,
	.shell-header__surface--context,
	.shell-header__surface--detail {
		padding-block: 0.9rem;
		min-height: 4.9375rem;
	}

	.shell-header__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.9rem;
		width: 100%;
	}

	.shell-header__identity {
		display: flex;
		min-width: 0;
		flex: 1 1 auto;
		align-items: center;
		gap: 0.9rem;
	}

	.shell-header__brand-mark {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 3.35rem;
		height: 3.35rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
		overflow: visible;
	}

	.shell-header__brand-image {
		display: block;
		width: 3.15rem;
		height: 3.15rem;
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
		border: 1px solid rgb(24 24 27 / 0.08);
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.82);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.7),
			0 6px 16px rgb(15 23 42 / 0.06);
		font-size: 0.92rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: rgb(24 24 27);
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
		font-size: clamp(1.45rem, 2.8vw, 1.95rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.045em;
		color: rgb(24 24 27);
	}

	.shell-header__title--brand {
		font-size: clamp(1.7rem, 3.3vw, 2.15rem);
	}

	.shell-header__title--section,
	.shell-header__title--context,
	.shell-header__title--detail {
		font-size: clamp(1.45rem, 2.7vw, 1.8rem);
	}

	.shell-header__surface--section .shell-header__brand-mark {
		width: 3rem;
		height: 3rem;
	}

	.shell-header__surface--section .shell-header__brand-image {
		width: 2.8rem;
		height: 2.8rem;
	}

	.shell-header__subtitle {
		margin: 0.28rem 0 0;
		max-width: 34rem;
		font-size: 0.88rem;
		line-height: 1.5;
		color: rgb(82 82 91);
	}

	.shell-header__back-button {
		gap: 0.45rem;
		flex: none;
		border-radius: 9999px;
		padding-inline: 0.9rem;
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
		border: 1px solid rgb(24 24 27 / 0.08);
		border-radius: 1rem;
		padding: 0.18rem;
		background: rgb(255 255 255 / 0.62);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.75),
			0 1px 2px rgb(15 23 42 / 0.06);
		backdrop-filter: blur(10px);
	}

	:global(.shell-header__control) {
		border-color: transparent;
		background: transparent;
		box-shadow: none;
		color: rgb(39 39 42);
	}

	:global(.shell-header__control:visited) {
		color: rgb(39 39 42);
	}

	:global(.shell-header__control:hover) {
		background: rgb(24 24 27 / 0.06);
		color: rgb(24 24 27);
	}

	:global(.shell-header__control:disabled),
	:global(.shell-header__control[aria-disabled='true']) {
		color: rgb(113 113 122);
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
		background: rgb(24 24 27 / 0.08);
	}

	:global(.dark .shell-header__surface) {
		border-color: rgb(255 255 255 / 0.1);
		background:
			radial-gradient(circle at top left, rgb(255 255 255 / 0.08), transparent 34%),
			linear-gradient(180deg, rgb(18 18 22 / 0.92), rgb(9 9 11 / 0.98));
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.05),
			0 18px 44px rgb(0 0 0 / 0.24);
	}

	:global(.dark .shell-header__surface--brand) {
		background:
			radial-gradient(circle at top left, rgb(255 211 153 / 0.18), transparent 28%),
			radial-gradient(circle at top right, rgb(255 255 255 / 0.08), transparent 24%),
			linear-gradient(180deg, rgb(24 24 27 / 0.94), rgb(10 10 12 / 0.98));
	}

	:global(.dark .shell-header__brand-image) {
		filter: none;
	}

	:global(.dark .shell-header__avatar-badge) {
		border-color: rgb(255 255 255 / 0.1);
		background: rgb(255 255 255 / 0.05);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.04),
			0 10px 22px rgb(0 0 0 / 0.18);
		color: rgb(250 250 250);
	}

	:global(.dark .shell-header__title) {
		color: rgb(250 250 250);
	}

	:global(.dark .shell-header__subtitle) {
		color: rgb(161 161 170);
	}

	:global(.dark .shell-header__control-group) {
		border-color: rgb(255 255 255 / 0.1);
		background: rgb(255 255 255 / 0.04);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
	}

	:global(.dark .shell-header__control) {
		color: rgb(244 244 245);
	}

	:global(.dark .shell-header__control:visited) {
		color: rgb(244 244 245);
	}

	:global(.dark .shell-header__control:hover) {
		background: rgb(255 255 255 / 0.08);
		color: rgb(255 255 255);
	}

	:global(.dark .shell-header__control:disabled),
	:global(.dark .shell-header__control[aria-disabled='true']) {
		color: rgb(161 161 170);
	}

	:global(.dark .shell-header__control-group > * + *::before) {
		background: rgb(255 255 255 / 0.1);
	}

	@media (max-width: 480px) {
		.shell-header__surface {
			padding: 0.95rem 1rem;
			border-radius: 1.3rem;
		}

		.shell-header__row {
			flex-direction: column;
			align-items: stretch;
		}

		.shell-header__controls {
			align-self: flex-end;
		}

		.shell-header__brand-mark {
			width: 2.95rem;
			height: 2.95rem;
		}

		.shell-header__brand-image {
			width: 2.7rem;
			height: 2.7rem;
		}
	}
</style>
