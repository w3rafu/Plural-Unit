<!--
  ProfileAvatarSection — avatar display, upload, and removal controls.

  Presentational component that renders the avatar preview and action buttons.
  File selection and removal events are dispatched to the parent.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let {
		activeAvatarUrl,
		initials,
		previewUrl,
		hasStoredAvatar,
		isSubmitting = false,
		fieldError = '',
		willRemove = false,
		onFileChange,
		onRemove
	}: {
		activeAvatarUrl: string;
		initials: string;
		previewUrl: string;
		hasStoredAvatar: boolean;
		isSubmitting?: boolean;
		fieldError?: string;
		willRemove?: boolean;
		onFileChange: (event: Event) => void;
		onRemove: () => void;
	} = $props();

	let avatarInput = $state<HTMLInputElement | null>(null);
</script>

<div class="rounded-xl border border-border/70 bg-muted/25 p-4">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			{#if activeAvatarUrl}
				<img
					src={activeAvatarUrl}
					alt="Profile preview"
					class="size-20 rounded-full border border-border/70 object-cover shadow-sm"
				/>
			{:else}
				<div
					class="flex size-20 items-center justify-center rounded-full border border-border/70 bg-muted text-xl font-semibold tracking-tight text-foreground"
					aria-hidden="true"
				>
					{initials}
				</div>
			{/if}

			<div class="space-y-1">
				<p class="text-sm font-medium text-foreground">Profile photo</p>
				<p class="text-sm text-muted-foreground">
					{#if willRemove}
						Photo will be removed when you save.
					{:else if previewUrl}
						New photo selected.
					{:else if hasStoredAvatar}
						Your current profile photo is ready.
					{:else}
						Upload a photo or keep the monogram fallback.
					{/if}
				</p>
			</div>
		</div>

		<div class="flex flex-wrap gap-2">
			<Button
				type="button"
				variant="outline"
				onclick={() => avatarInput?.click()}
				disabled={isSubmitting}
			>
				Upload photo
			</Button>
			{#if previewUrl || hasStoredAvatar}
				<Button
					type="button"
					variant="ghost"
					onclick={onRemove}
					disabled={isSubmitting}
				>
					Remove
				</Button>
			{/if}
		</div>
	</div>

	<input
		bind:this={avatarInput}
		class="sr-only"
		type="file"
		accept="image/png,image/jpeg,image/webp"
		onchange={onFileChange}
	/>

	{#if fieldError}
		<p class="mt-4 text-sm text-destructive" role="alert">{fieldError}</p>
	{/if}
</div>
