<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import {
		mapPasswordResetErrorMessage,
		mapRegistrationErrorMessage,
		validateNewPassword,
		validatePasswordResetEmail
	} from '$lib/models/authHelpers';
	import { toast } from '$lib/stores/toast.svelte';

	let nextEmail = $state(currentUser.details.email);
	let newPassword = $state('');
	let confirmPassword = $state('');

	let emailFieldError = $state('');
	let passwordFieldError = $state('');
	let confirmPasswordFieldError = $state('');

	async function saveEmailChange() {
		emailFieldError = '';

		const result = validatePasswordResetEmail(nextEmail);
		if (!result.ok) {
			emailFieldError = result.feedback;
			return;
		}

		try {
			const changeResult = await currentUser.requestEmailChange(result.normalizedEmail);
			nextEmail = currentUser.details.email || result.normalizedEmail;
			toast({
				title: changeResult.changed ? 'Email updated' : 'Email unchanged',
				description: changeResult.changed
					? changeResult.requiresConfirmation
						? 'Check your inbox to confirm the new email address.'
						: 'Your email address was updated.'
					: 'That email is already on this account.',
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not update email',
				description: mapRegistrationErrorMessage(error),
				variant: 'error'
			});
		}
	}

	async function savePasswordChange() {
		passwordFieldError = '';
		confirmPasswordFieldError = '';

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
			toast({
				title: 'Password updated',
				description: 'Your new password is now active.',
				variant: 'success'
			});
		} catch (error) {
			toast({
				title: 'Could not update password',
				description: mapPasswordResetErrorMessage(error),
				variant: 'error'
			});
		}
	}
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Security</Card.Title>
		<Card.Description>Update the email and password used to sign in to this account.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6">
		<form
			class="space-y-5"
			onsubmit={(event) => {
				event.preventDefault();
				saveEmailChange();
			}}
		>
			<Field.Field class="gap-2.5">
				<Field.Content>
					<Field.Label for="profile-email">Email</Field.Label>
					<Field.Description>Use an address you can access for confirmation and recovery.</Field.Description>
					<Input id="profile-email" type="email" bind:value={nextEmail} />
					{#if emailFieldError}
						<Field.Error role="alert">{emailFieldError}</Field.Error>
					{/if}
				</Field.Content>
			</Field.Field>

			<div class="flex justify-start">
				<Button type="submit" disabled={currentUser.isLoggingIn}>Change email</Button>
			</div>
		</form>

		<form
			class="space-y-5 border-t border-border/70 pt-6"
			onsubmit={(event) => {
				event.preventDefault();
				savePasswordChange();
			}}
		>
			<div class="space-y-1">
				<h3 class="text-base font-semibold tracking-tight text-foreground">Password</h3>
				<p class="text-sm text-muted-foreground">Set a new password when you want to refresh your account security.</p>
			</div>

			<Field.Group class="gap-5">
				<Field.Field>
					<Field.Content>
						<Field.Label for="new-password">New password</Field.Label>
						<Field.Description>Use something long and hard to guess.</Field.Description>
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

			<div class="flex justify-start">
				<Button type="submit" disabled={currentUser.isLoggingIn}>Change password</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
