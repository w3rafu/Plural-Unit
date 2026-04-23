<!--
  ProfileAvatarSection — avatar display, upload, and removal controls.

  Presentational component that renders the avatar preview and action buttons.
  File selection and removal events are dispatched to the parent.
-->
<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
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


	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<Avatar.Root class="size-16 border border-border/70 bg-muted/40 after:hidden">
				{#if activeAvatarUrl}
					<Avatar.Image src={activeAvatarUrl} alt="Profile preview" />
				{:else}
					<Avatar.Fallback class="text-lg font-semibold tracking-tight text-foreground">
						{initials}
					</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="space-y-1">
				<p class="text-sm font-medium text-foreground">Photo</p>
				<p class="text-xs text-muted-foreground">
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
				size="xs"
				onclick={() => avatarInput?.click()}
				disabled={isSubmitting}
			>
				Upload photo
			</Button>
			{#if previewUrl || hasStoredAvatar}
				<Button
					type="button"
					variant="ghost"
					size="xs"
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
		<p class="mt-3 text-sm text-destructive" role="alert">{fieldError}</p>
	{/if}
