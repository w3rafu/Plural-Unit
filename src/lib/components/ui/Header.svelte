<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		pageHeader,
		resolvePageHeaderPreset,
		shouldShowPageHeaderSubtitle
	} from '$lib/stores/pageHeader.svelte';

	const headerPreset = $derived(resolvePageHeaderPreset(pageHeader.config));
	const headerActions = $derived(pageHeader.config.actions ?? []);
	const showBack = $derived(Boolean(pageHeader.config.onBack && pageHeader.config.backLabel));
	const showSubtitle = $derived(
		Boolean(pageHeader.config.subtitle) && shouldShowPageHeaderSubtitle(headerPreset)
	);
	const showAvatarBadge = $derived(Boolean(pageHeader.config.avatarText) && !showBack);
</script>

<header class="bg-stone-100 px-4 py-3 rounded-2xl">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex min-w-0 items-start gap-3">
			{#if showBack}
				<Button variant="outline" size="sm" class="gap-2" onclick={() => pageHeader.config.onBack?.()}>
					<span aria-hidden="true">←</span>
					<span>{pageHeader.config.backLabel}</span>
				</Button>
			{:else if showAvatarBadge}
				<div class="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-sm font-semibold">
					{pageHeader.config.avatarText}
				</div>

			{/if}

			<div class="min-w-0">
				<h1 class="text-xl font-semibold =">{pageHeader.config.title}</h1>
				{#if showSubtitle}
					<p class="-mt-0.5 text-sm text-zinc-600">{pageHeader.config.subtitle}</p>
				{/if}
			</div>
		</div>

		{#if headerActions.length > 0}
			<nav aria-label="Page actions" class="flex flex-wrap gap-2">
				{#each headerActions as action (action.id)}
					{#if action.href}
						<Button href={action.href} variant="ghost" size="sm" class="px-3" aria-label={action.ariaLabel ?? action.label}>
							{action.label}
						</Button>
					{:else}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => action.onClick?.()}
							disabled={action.disabled}
							aria-label={action.ariaLabel ?? action.label}
						>
							{action.label}
						</Button>
					{/if}
				{/each}
			</nav>
		{/if}
	</div>
</header>
