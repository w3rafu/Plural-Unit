<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import {
		mapLoginErrorMessage,
		mapPasswordResetErrorMessage,
		mapRegistrationErrorMessage,
		validateNewPassword,
		validateOnboardingName,
		validatePasswordResetEmail,
		validatePhoneNumberInput
	} from '$lib/models/authHelpers';

	let name = $state(currentUser.details.name);
	let phoneNumber = $state(currentUser.details.phone_number);
	let nextEmail = $state(currentUser.details.email);
	let newPassword = $state('');
	let confirmPassword = $state('');

	let detailsFieldError = $state('');
	let detailsFeedback = $state('');
	let detailsFeedbackType = $state<'error' | 'success'>('error');
	let emailFieldError = $state('');
	let emailFeedback = $state('');
	let emailFeedbackType = $state<'error' | 'success'>('error');
	let passwordFieldError = $state('');
	let confirmPasswordFieldError = $state('');
	let passwordFeedback = $state('');
	let passwordFeedbackType = $state<'error' | 'success'>('error');

	async function saveProfileDetails() {
		detailsFieldError = '';
		detailsFeedback = '';

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

		try {
			await currentUser.updateProfileDetails({
				name: nameResult.normalizedName,
				phone_number: normalizedPhoneNumber
			});
			name = currentUser.details.name;
			phoneNumber = currentUser.details.phone_number;
			detailsFeedbackType = 'success';
			detailsFeedback = 'Profile details updated.';
		} catch (error) {
			detailsFeedbackType = 'error';
			detailsFeedback = mapLoginErrorMessage(error);
		}
	}

	async function saveEmailChange() {
		emailFieldError = '';
		emailFeedback = '';

		const result = validatePasswordResetEmail(nextEmail);
		if (!result.ok) {
			emailFieldError = result.feedback;
			return;
		}

		try {
			const changeResult = await currentUser.requestEmailChange(result.normalizedEmail);
			nextEmail = currentUser.details.email || result.normalizedEmail;
			emailFeedbackType = 'success';
			emailFeedback = changeResult.changed
				? changeResult.requiresConfirmation
					? 'Check your inbox to confirm the new email address.'
					: 'Email updated.'
				: 'Email is unchanged.';
		} catch (error) {
			emailFeedbackType = 'error';
			emailFeedback = mapRegistrationErrorMessage(error);
		}
	}

	async function savePasswordChange() {
		passwordFieldError = '';
		confirmPasswordFieldError = '';
		passwordFeedback = '';

		const result = validateNewPassword({
			password: newPassword,
			confirmPassword
		});
		if (!result.ok) {
			if (result.field === 'password') {
				passwordFieldError = result.feedback;
			}
			if (result.field === 'confirmPassword') {
				confirmPasswordFieldError = result.feedback;
			}
			return;
		}

		try {
			await currentUser.setNewPassword(newPassword);
			newPassword = '';
			confirmPassword = '';
			passwordFeedbackType = 'success';
			passwordFeedback = 'Password updated.';
		} catch (error) {
			passwordFeedbackType = 'error';
			passwordFeedback = mapPasswordResetErrorMessage(error);
		}
	}
</script>

<Item.Group>
	<Item.Root variant="outline">
		<Item.Content class="gap-5">
			<Item.Title>Profile details</Item.Title>
			<form
				class="flex flex-col gap-5"
				onsubmit={(event) => {
				event.preventDefault();
				saveProfileDetails();
			}}
			>
				<Field.Group class="gap-5">
					<Field.Field>
						<Field.Content>
							<Field.Label for="profile-name">Name</Field.Label>
							<Input id="profile-name" type="text" bind:value={name} />
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="profile-phone">Phone</Field.Label>
							<Input id="profile-phone" type="tel" bind:value={phoneNumber} />
						</Field.Content>
					</Field.Field>
					{#if detailsFieldError}
						<Field.Error role="alert">{detailsFieldError}</Field.Error>
					{/if}
				</Field.Group>
				<Button class="mt-1 self-start" type="submit" disabled={currentUser.isLoggingIn}>
					Save details
				</Button>
			</form>
			{#if detailsFeedback}
				<p
					class="text-sm leading-6 text-muted-foreground"
					role="alert"
					data-feedback-type={detailsFeedbackType}
				>
					{detailsFeedback}
				</p>
			{/if}
		</Item.Content>
	</Item.Root>

	<Item.Root variant="outline">
		<Item.Content class="gap-5">
			<Item.Title>Security</Item.Title>
			<form
				class="flex flex-col gap-5"
				onsubmit={(event) => {
				event.preventDefault();
				saveEmailChange();
			}}
			>
				<Field.Field class="gap-2.5">
					<Field.Content>
						<Field.Label for="profile-email">Email</Field.Label>
						<Input id="profile-email" type="email" bind:value={nextEmail} />
						{#if emailFieldError}
							<Field.Error role="alert">{emailFieldError}</Field.Error>
						{/if}
					</Field.Content>
				</Field.Field>
				<Button class="mt-1 self-start" type="submit" disabled={currentUser.isLoggingIn}>
					Change email
				</Button>
			</form>
			{#if emailFeedback}
				<p
					class="text-sm leading-6 text-muted-foreground"
					role="alert"
					data-feedback-type={emailFeedbackType}
				>
					{emailFeedback}
				</p>
			{/if}

			<form
				class="flex flex-col gap-5 border-t border-border/70 pt-5"
				onsubmit={(event) => {
				event.preventDefault();
				savePasswordChange();
			}}
			>
				<Field.Group class="gap-5">
					<Field.Field>
						<Field.Content>
							<Field.Label for="new-password">New password</Field.Label>
							<Input id="new-password" type="password" bind:value={newPassword} />
							{#if passwordFieldError}
								<Field.Error role="alert">{passwordFieldError}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="confirm-password">Confirm new password</Field.Label>
							<Input id="confirm-password" type="password" bind:value={confirmPassword} />
							{#if confirmPasswordFieldError}
								<Field.Error role="alert">{confirmPasswordFieldError}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				</Field.Group>
				<Button class="mt-1 self-start" type="submit" disabled={currentUser.isLoggingIn}>
					Change password
				</Button>
			</form>
			{#if passwordFeedback}
				<p
					class="text-sm leading-6 text-muted-foreground"
					role="alert"
					data-feedback-type={passwordFeedbackType}
				>
					{passwordFeedback}
				</p>
			{/if}
		</Item.Content>
	</Item.Root>
</Item.Group>
