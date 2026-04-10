<!--
  LoginForm — dual-channel login wireframe.

  Supports phone OTP and email/password login + registration.
  All validation and error mapping lives in authBoundary.
  Uses form onsubmit for proper keyboard submission and accessibility.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
</script>

<section aria-label="Login" class="mx-auto flex w-full max-w-3xl flex-col gap-5">
	<Card.Root class="border-border/70 bg-card/80">
		<Card.Header class="gap-3 border-b border-border/70">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Choose a sign-in method</Card.Title>
				<Card.Description>Pick the fastest way to access your organization and finish setup.</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="space-y-6">
			<Field.Set disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
				<Field.Legend class="sr-only">Choose a sign-in method</Field.Legend>
				<RadioGroup.Root
					value={authBoundary.authChannel}
					onValueChange={(value) => authBoundary.setAuthChannel(value as 'phone' | 'email')}
					name="channel"
					class="grid gap-3"
				>
					<Field.Field orientation="horizontal" class="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
						<RadioGroup.Item id="channel-phone" value="phone" />
						<Field.Content>
							<Field.Label for="channel-phone" class="font-normal">Phone</Field.Label>
							<Field.Description>Get a 6-digit code by text. New numbers can finish setup after verification.</Field.Description>
						</Field.Content>
					</Field.Field>
					<Field.Field orientation="horizontal" class="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
						<RadioGroup.Item id="channel-email" value="email" />
						<Field.Content>
							<Field.Label for="channel-email" class="font-normal">Email</Field.Label>
							<Field.Description>Use email and password, or reset access by email.</Field.Description>
						</Field.Content>
					</Field.Field>
				</RadioGroup.Root>
			</Field.Set>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-border/70 bg-card/80">
		<Card.Content class="space-y-5 pt-6">
	{#if authBoundary.authChannel === 'email'}
		{#if authBoundary.authMode === 'forgot_password'}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onForgotPasswordSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-lg font-semibold tracking-tight text-foreground">Reset password</h2>
					<p class="text-sm text-muted-foreground">Enter your email and we’ll send a reset link.</p>
				</div>
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
				<div class="flex flex-wrap gap-3 pt-1">
					<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn || authBoundary.resetEmailSent}>
						{authBoundary.resetEmailSent ? 'Email sent' : 'Send reset link'}
					</Button>
					<Button type="button" variant="outline" onclick={() => authBoundary.setAuthMode('login')} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						Back to sign in
					</Button>
				</div>
			</form>
		{:else if authBoundary.authMode === 'reset_password'}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onResetPasswordSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-lg font-semibold tracking-tight text-foreground">Choose a new password</h2>
					<p class="text-sm text-muted-foreground">Pick something long and hard to guess.</p>
				</div>
				<Field.Group class="space-y-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="reset-password">New password</Field.Label>
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
				<div class="pt-1">
					<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						Update password
					</Button>
				</div>
			</form>
		{:else}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); if (authBoundary.authMode === 'register') authBoundary.onEmailRegisterSubmit(); else authBoundary.onEmailLoginSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-lg font-semibold tracking-tight text-foreground">
						{authBoundary.authMode === 'register' ? 'Create your account' : 'Sign in with email'}
					</h2>
					<p class="text-sm text-muted-foreground">
						{authBoundary.authMode === 'register'
							? 'Set up an email and password for your account.'
							: 'Use the email and password connected to this account.'}
					</p>
				</div>
				<Field.Group class="space-y-4">
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
					<Field.Field>
						<Field.Content>
							<Field.Label for="confirm-password">Confirm password</Field.Label>
							<Input id="confirm-password" type="password" bind:value={authBoundary.confirmPassword} />
							{#if authBoundary.loginFieldErrors.confirmPassword}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.confirmPassword}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				{/if}
				<div class="flex flex-wrap gap-3 pt-1">
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
				</div>
			</form>
		{/if}
	{:else}
		{#if authBoundary.authStep === 'request_code'}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onRequestCodeSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-lg font-semibold tracking-tight text-foreground">Sign in with phone</h2>
					<p class="text-sm text-muted-foreground">Enter your phone number and we’ll text you a verification code. If it’s your first time here, we’ll set up your account after you confirm it.</p>
				</div>
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
				<div class="pt-1">
					<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						{authBoundary.isAuthSubmitting || currentUser.isLoggingIn ? 'Sending...' : 'Text me a code'}
					</Button>
				</div>
			</form>
		{:else}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onVerifyCodeSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-lg font-semibold tracking-tight text-foreground">Verify your code</h2>
					<p class="text-sm text-muted-foreground">Enter the code from your text message to continue.</p>
				</div>
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
				<div class="flex flex-wrap gap-3 pt-1">
					<Button type="submit" disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						{authBoundary.isAuthSubmitting || currentUser.isLoggingIn ? 'Verifying...' : 'Verify and continue'}
					</Button>
					<Button type="button" variant="outline" onclick={() => authBoundary.resendPhoneCode()} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						Resend code
					</Button>
					<Button type="button" variant="ghost" onclick={() => authBoundary.resetAuthFlow()} disabled={authBoundary.isAuthSubmitting || currentUser.isLoggingIn}>
						Back
					</Button>
				</div>
			</form>
		{/if}
	{/if}

	{#if authBoundary.loginFeedback}
		<p
			role="alert"
			data-feedback-type={authBoundary.loginFeedbackType}
			class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
		>
			{authBoundary.loginFeedback}
		</p>
	{/if}
		</Card.Content>
	</Card.Root>
</section>
