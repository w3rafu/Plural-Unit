<!--
  LoginForm — dual-channel login wireframe.

  Supports phone OTP and email/password login + registration.
  All validation and error mapping lives in authBoundary.
  Uses form onsubmit for proper keyboard submission and accessibility.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
</script>

<section aria-label="Login" class="space-y-4">
	<Field.Set disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
		<Field.Legend>Sign in with</Field.Legend>
		<RadioGroup.Root bind:value={authBoundary.authChannel} name="channel" class="grid gap-2">
			<Field.Field orientation="horizontal">
				<RadioGroup.Item id="channel-email" value="email" />
				<Field.Content>
					<Field.Label for="channel-email" class="font-normal">Email</Field.Label>
					<Field.Description>Use your email address to sign in or register.</Field.Description>
				</Field.Content>
			</Field.Field>
			<Field.Field orientation="horizontal">
				<RadioGroup.Item id="channel-phone" value="phone" />
				<Field.Content>
					<Field.Label for="channel-phone" class="font-normal">Phone</Field.Label>
					<Field.Description>Use a phone number and a verification code.</Field.Description>
				</Field.Content>
			</Field.Field>
		</RadioGroup.Root>
	</Field.Set>

	{#if authBoundary.authChannel === 'email'}
		{#if authBoundary.authMode === 'forgot_password'}
			<form onsubmit={(e) => { e.preventDefault(); authBoundary.onForgotPasswordSubmit(); }}>
				<p>Enter your email and we'll send a password reset link.</p>
				<Field.Group>
					<Field.Field>
						<Field.Content>
							<Field.Label for="forgot-email">Email</Field.Label>
							<Field.Description>We’ll send a reset link to this address.</Field.Description>
							<Input id="forgot-email" type="email" bind:value={authBoundary.email} />
							{#if authBoundary.loginFieldErrors.email}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.email}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				</Field.Group>
				<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn || authBoundary.resetEmailSent}>
					{authBoundary.resetEmailSent ? 'Email sent' : 'Send reset link'}
				</Button>
				<Button type="button" variant="outline" onclick={() => authBoundary.setAuthMode('login')} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					Back to sign in
				</Button>
			</form>
		{:else if authBoundary.authMode === 'reset_password'}
			<form onsubmit={(e) => { e.preventDefault(); authBoundary.onResetPasswordSubmit(); }}>
				<p>Choose a new password.</p>
				<Field.Group>
					<Field.Field>
						<Field.Content>
							<Field.Label for="reset-password">New password</Field.Label>
							<Field.Description>Pick something long and hard to guess.</Field.Description>
							<Input id="reset-password" type="password" bind:value={authBoundary.password} />
							{#if authBoundary.loginFieldErrors.password}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.password}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="reset-confirm-password">Confirm new password</Field.Label>
							<Input id="reset-confirm-password" type="password" bind:value={authBoundary.confirmPassword} />
							{#if authBoundary.loginFieldErrors.confirmPassword}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.confirmPassword}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				</Field.Group>
				<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					Update password
				</Button>
			</form>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); if (authBoundary.authMode === 'register') authBoundary.onEmailRegisterSubmit(); else authBoundary.onEmailLoginSubmit(); }}>
				<Field.Group class="mb-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="email">Email</Field.Label>
							<Input id="email" type="email" bind:value={authBoundary.email} />
							{#if authBoundary.loginFieldErrors.email}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.email}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="password">Password</Field.Label>
							<Field.Description>Use the password for this account.</Field.Description>
							<Input id="password" type="password" bind:value={authBoundary.password} />
							{#if authBoundary.loginFieldErrors.password}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.password}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				</Field.Group>
				{#if authBoundary.authMode === 'register'}
					<Field.Field class="mb-4">
						<Field.Content>
							<Field.Label for="confirm-password">Confirm password</Field.Label>
							<Input id="confirm-password" type="password" bind:value={authBoundary.confirmPassword} />
							{#if authBoundary.loginFieldErrors.confirmPassword}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.confirmPassword}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				{/if}
				<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					{authBoundary.isAuthSubmitting || currentUser.isLoggingIn
						? authBoundary.authMode === 'register'
							? 'Registering...'
							: 'Signing in...'
						: authBoundary.authMode === 'register'
							? 'Register'
							: 'Sign in'}
				</Button>
				<Button type="button" variant="outline" onclick={() => authBoundary.setAuthMode(authBoundary.authMode === 'login' ? 'register' : 'login')} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					{authBoundary.authMode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
				</Button>
				{#if authBoundary.authMode === 'login'}
					<Button type="button" variant="ghost" onclick={() => authBoundary.setAuthMode('forgot_password')} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						Forgot password?
					</Button>
				{/if}
			</form>
		{/if}
	{:else}
		{#if authBoundary.authStep === 'request_code'}
			<form onsubmit={(e) => { e.preventDefault(); authBoundary.onRequestCodeSubmit(); }}>
				<Field.Field>
					<Field.Content>
						<Field.Label for="phone-number">Phone number</Field.Label>
						<Field.Description>We’ll text a 6-digit code to this number.</Field.Description>
						<Input id="phone-number" type="tel" bind:value={authBoundary.phone} />
						{#if authBoundary.loginFieldErrors.phoneNumber}
							<Field.Error role="alert">{authBoundary.loginFieldErrors.phoneNumber}</Field.Error>
						{/if}
					</Field.Content>
				</Field.Field>
				<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					{authBoundary.isAuthSubmitting || currentUser.isLoggingIn ? 'Sending...' : 'Send code'}
				</Button>
			</form>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); authBoundary.onVerifyCodeSubmit(); }}>
				<Field.Field>
					<Field.Content>
						<Field.Label for="otp-code">Verification code</Field.Label>
						<Field.Description>Enter the 6-digit code we just sent.</Field.Description>
						<Input id="otp-code" type="text" bind:value={authBoundary.otpCode} inputmode="numeric" autocomplete="one-time-code" />
						{#if authBoundary.loginFieldErrors.otpCode}
							<Field.Error role="alert">{authBoundary.loginFieldErrors.otpCode}</Field.Error>
						{/if}
					</Field.Content>
				</Field.Field>
				<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					{authBoundary.isAuthSubmitting || currentUser.isLoggingIn ? 'Verifying...' : 'Verify'}
				</Button>
				<Button type="button" variant="outline" onclick={() => authBoundary.resendPhoneCode()} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					Resend code
				</Button>
				<Button type="button" variant="ghost" onclick={() => authBoundary.resetAuthFlow()} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
					Back
				</Button>
			</form>
		{/if}
	{/if}

	{#if authBoundary.loginFeedback}
		<p role="alert" data-feedback-type={authBoundary.loginFeedbackType}>
			{authBoundary.loginFeedback}
		</p>
	{/if}
</section>
