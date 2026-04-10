<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import {
		computeAvatarInitials,
		createAvatarPreview,
		revokeAvatarPreview,
		validateAvatarFile
	} from '$lib/components/profile/avatarUploadModel';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { mapLoginErrorMessage, validateOnboardingName, validatePhoneNumberInput } from '$lib/models/authHelpers';
	import { toast } from '$lib/stores/toast.svelte';

	let name = $state(currentUser.details.name);
	let phoneNumber = $state(currentUser.details.phone_number);
	let selectedAvatarFile = $state<File | null>(null);
	let avatarPreviewUrl = $state('');
	let removeAvatar = $state(false);

	let detailsFieldError = $state('');
	let avatarFieldError = $state('');
	let avatarInput = $state<HTMLInputElement | null>(null);

	const activeAvatarUrl = $derived(avatarPreviewUrl || (removeAvatar ? '' : currentUser.details.avatar_url));
	const avatarPreviewInitials = $derived(
		computeAvatarInitials(name, currentUser.details.name, currentUser.details.email, phoneNumber)
	);

	function clearAvatarPreview() {
		revokeAvatarPreview(avatarPreviewUrl);
		avatarPreviewUrl = '';
	}

	onDestroy(() => {
		revokeAvatarPreview(avatarPreviewUrl);
	});

	function onAvatarFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		avatarFieldError = '';
		selectedAvatarFile = null;

		if (!file) {
			clearAvatarPreview();
			return;
		}

		const fileError = validateAvatarFile(file);
		if (fileError) {
			clearAvatarPreview();
			avatarFieldError = fileError;
			input.value = '';
			return;
		}

		clearAvatarPreview();
		selectedAvatarFile = file;
		removeAvatar = false;
		avatarPreviewUrl = createAvatarPreview(file);
	}

	function removeSelectedAvatar() {
		avatarFieldError = '';
		selectedAvatarFile = null;

		if (avatarPreviewUrl) {
			clearAvatarPreview();
			removeAvatar = false;
			if (avatarInput) {
				avatarInput.value = '';
			}
			return;
		}

		if (currentUser.details.avatar_url) {
			removeAvatar = true;
		}
	}

	async function saveProfileDetails() {
		detailsFieldError = '';
		avatarFieldError = '';

		const nameResult = validateOnboardingName(name);
		if (!nameResult.ok) {
			detailsFieldError = nameResult.feedback;
			return;
		}

		const normalizedPhoneNumber = phoneNumber.trim();
		if (normalizedPhoneNumber) {
			const phoneResult = validatePhoneNumberInput(normalizedPhoneNumber);
			if (!phoneResult.ok) {
				detailsFieldError = phoneResult.feedback;
				return;
			}
			phoneNumber = phoneResult.normalizedPhoneNumber;
		}

		const avatarValidationError = validateAvatarFile(selectedAvatarFile);
		if (avatarValidationError) {
			avatarFieldError = avatarValidationError;
			return;
		}

		try {
			let avatarUrl = currentUser.details.avatar_url;

			if (selectedAvatarFile) {
				avatarUrl = await currentUser.uploadProfileAvatar(selectedAvatarFile);
			} else if (removeAvatar && currentUser.details.avatar_url) {
				avatarUrl = await currentUser.removeProfileAvatar();
			}

			await currentUser.updateProfileDetails({
				name: nameResult.normalizedName,
				phone_number: normalizedPhoneNumber,
				avatar_url: avatarUrl
			});

			name = currentUser.details.name;
			phoneNumber = currentUser.details.phone_number;
			clearAvatarPreview();
			selectedAvatarFile = null;
			removeAvatar = false;
			if (avatarInput) {
				avatarInput.value = '';
			}

			toast({
				title: 'Profile updated',
				description: 'Your profile details were saved.',
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not save profile',
				description: mapLoginErrorMessage(error),
				variant: 'error'
			});
		}
	}
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Profile details</Card.Title>
		<Card.Description>Keep your name, phone number, and photo current for the rest of your organization.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-5">
		<form
			class="space-y-5"
			onsubmit={(event) => {
				event.preventDefault();
				saveProfileDetails();
			}}
		>
			<Field.Group class="gap-5">
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
									{avatarPreviewInitials}
								</div>
							{/if}

							<div class="space-y-1">
								<p class="text-sm font-medium text-foreground">Profile photo</p>
								<p class="text-sm text-muted-foreground">
									{#if removeAvatar}
										Photo will be removed when you save.
									{:else if avatarPreviewUrl}
										New photo selected.
									{:else if currentUser.details.avatar_url}
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
								disabled={currentUser.isLoggingIn}
							>
								Upload photo
							</Button>
							{#if avatarPreviewUrl || currentUser.details.avatar_url}
								<Button
									type="button"
									variant="ghost"
									onclick={removeSelectedAvatar}
									disabled={currentUser.isLoggingIn}
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
						onchange={onAvatarFileChange}
					/>

					{#if avatarFieldError}
						<p class="mt-4 text-sm text-destructive" role="alert">{avatarFieldError}</p>
					{/if}
				</div>

				<Field.Field>
					<Field.Content>
						<Field.Label for="profile-name">Name</Field.Label>
						<Field.Description>Use the name other members should see around the app.</Field.Description>
						<Input id="profile-name" type="text" bind:value={name} />
					</Field.Content>
				</Field.Field>

				<Field.Field>
					<Field.Content>
						<Field.Label for="profile-phone">Phone</Field.Label>
						<Field.Description>Add the number connected to your account.</Field.Description>
						<Input id="profile-phone" type="tel" bind:value={phoneNumber} />
					</Field.Content>
				</Field.Field>

				{#if detailsFieldError}
					<Field.Error role="alert">{detailsFieldError}</Field.Error>
				{/if}
			</Field.Group>

			<div class="flex justify-start">
				<Button type="submit" disabled={currentUser.isLoggingIn}>Save details</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
