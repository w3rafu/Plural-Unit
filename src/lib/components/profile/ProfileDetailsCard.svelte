<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import ProfileAvatarSection from '$lib/components/profile/ProfileAvatarSection.svelte';
	import {
		computeAvatarInitials,
		createAvatarPreview,
		revokeAvatarPreview,
		validateAvatarFile
	} from '$lib/components/profile/avatarUploadModel';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';
	import { mapLoginErrorMessage, validateOnboardingName, validatePhoneNumberInput } from '$lib/models/authHelpers';
	import { toast } from '$lib/stores/toast.svelte';

	const UNSAVED_CHANGES_KEY = 'profile-details';

	let name = $state(currentUser.details.name);
	let phoneNumber = $state(currentUser.details.phone_number);
	let selectedAvatarFile = $state<File | null>(null);
	let avatarPreviewUrl = $state('');
	let removeAvatar = $state(false);
	let hasEditedDetails = $state(false);

	let detailsFieldError = $state('');
	let avatarFieldError = $state('');

	const activeAvatarUrl = $derived(avatarPreviewUrl || (removeAvatar ? '' : currentUser.details.avatar_url));
	const avatarPreviewInitials = $derived(
		computeAvatarInitials(name, currentUser.details.name, currentUser.details.email, phoneNumber)
	);
	const initialDetailsSnapshot = $derived.by(() =>
		createDirtySnapshot({
			name: currentUser.details.name.trim(),
			phoneNumber: currentUser.details.phone_number.trim(),
			avatarState: currentUser.details.avatar_url ? 'stored-avatar' : 'no-avatar'
		})
	);
	const currentDetailsSnapshot = $derived.by(() =>
		createDirtySnapshot({
			name: name.trim(),
			phoneNumber: phoneNumber.trim(),
			avatarState: selectedAvatarFile
				? `${selectedAvatarFile.name}:${selectedAvatarFile.size}:${selectedAvatarFile.lastModified}`
				: removeAvatar
					? 'remove-avatar'
					: currentUser.details.avatar_url
						? 'stored-avatar'
						: 'no-avatar'
		})
	);
	const isProfileDetailsDirty = $derived(currentDetailsSnapshot !== initialDetailsSnapshot);

	$effect(() => {
		unsavedChanges.set(UNSAVED_CHANGES_KEY, 'profile details', isProfileDetailsDirty);
	});

	$effect(() => {
		if (!hasEditedDetails && !selectedAvatarFile && !removeAvatar) {
			name = currentUser.details.name;
			phoneNumber = currentUser.details.phone_number;
		}
	});

	function clearAvatarPreview() {
		revokeAvatarPreview(avatarPreviewUrl);
		avatarPreviewUrl = '';
	}

	onDestroy(() => {
		revokeAvatarPreview(avatarPreviewUrl);
		unsavedChanges.clear(UNSAVED_CHANGES_KEY);
	});

	function onAvatarFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		avatarFieldError = '';
		selectedAvatarFile = null;
		hasEditedDetails = true;

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
		hasEditedDetails = true;

		if (avatarPreviewUrl) {
			clearAvatarPreview();
			removeAvatar = false;
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
			hasEditedDetails = false;
			clearAvatarPreview();
			selectedAvatarFile = null;
			removeAvatar = false;

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

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Profile details</Card.Title>
		<Card.Description>Keep your name, phone number, and photo current for the rest of your organization.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4">
		<form
			class="space-y-4"
			onsubmit={(event) => {
				event.preventDefault();
				saveProfileDetails();
			}}
		>
			<Field.Group class="gap-4">
				<ProfileAvatarSection
					{activeAvatarUrl}
					initials={avatarPreviewInitials}
					previewUrl={avatarPreviewUrl}
					hasStoredAvatar={!!currentUser.details.avatar_url}
					isSubmitting={currentUser.isLoggingIn}
					fieldError={avatarFieldError}
					willRemove={removeAvatar}
					onFileChange={onAvatarFileChange}
					onRemove={removeSelectedAvatar}
				/>

				<Field.Field>
					<Field.Content>
						<Field.Label for="profile-name">Name</Field.Label>
						<Field.Description>Use the name other members should see around the app.</Field.Description>
						<Input
							id="profile-name"
							type="text"
							bind:value={name}
							oninput={() => {
								hasEditedDetails = true;
							}}
						/>
					</Field.Content>
				</Field.Field>

				<Field.Field>
					<Field.Content>
						<Field.Label for="profile-phone">Phone</Field.Label>
						<Field.Description>Add the number connected to your account.</Field.Description>
						<Input
							id="profile-phone"
							type="tel"
							bind:value={phoneNumber}
							oninput={() => {
								hasEditedDetails = true;
							}}
						/>
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
