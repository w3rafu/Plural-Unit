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
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	const isSubmitting = $derived(authBoundary.isAuthSubmitting || currentUser.isLoggingIn);

	const feedbackToneClass = $derived.by(() =>
		authBoundary.loginFeedbackType === 'success'
			? 'border-border/70 bg-muted/30 text-foreground'
			: 'border-destructive/20 bg-destructive/10 text-destructive'
	);

	const feedbackLabel = $derived.by(() =>
		authBoundary.loginFeedbackType === 'success' ? 'Success' : 'Could not continue'
	);
</script>

<section aria-label="Login" class="mx-auto flex w-full flex-1 justify-center pt-4 sm:pt-10">
	<div class="w-full max-w-lg space-y-6">
		<Card.Root class="border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
			<Card.Content class="space-y-6 p-6 sm:p-7">
				<div class="space-y-1.5">
					<h1 class="text-2xl font-semibold tracking-tight text-foreground">Sign in to your organization</h1>
					<p class="text-base text-muted-foreground">
						Pick the fastest way to access your organization and finish setup.
					</p>
				</div>

				<div role="tablist" aria-label="Choose a sign-in method" class="segmented-control">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						class="h-11 justify-center"
						aria-current={authBoundary.authChannel === 'phone' ? 'page' : undefined}
						disabled={isSubmitting}
						onclick={() => authBoundary.setAuthChannel('phone')}
					>
						Phone
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						class="h-11 justify-center"
						aria-current={authBoundary.authChannel === 'email' ? 'page' : undefined}
						disabled={isSubmitting}
						onclick={() => authBoundary.setAuthChannel('email')}
					>
						Email
					</Button>
				</div>

	{#if authBoundary.authChannel === 'email'}
		{#if authBoundary.authMode === 'forgot_password'}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onForgotPasswordSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-xl font-semibold tracking-tight text-foreground">Reset password</h2>
					<p class="text-sm text-muted-foreground">
						Enter your email and we’ll send a reset link if this account is available for password sign-in.
					</p>
				</div>
				<Field.Group>
					<Field.Field>
						<Field.Content>
							<Field.Label for="forgot-email">Email</Field.Label>
							<Input id="forgot-email" type="email" class="h-11" bind:value={authBoundary.email} />
							{#if authBoundary.loginFieldErrors.email}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.email}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				</Field.Group>
				<div class="flex flex-wrap gap-3 pt-1">
					<Button type="submit" class="h-11 w-full justify-center sm:w-auto" disabled={isSubmitting || authBoundary.resetEmailSent}>
						{authBoundary.resetEmailSent ? 'Email sent' : 'Send reset link'}
					</Button>
					<Button type="button" variant="outline" onclick={() => authBoundary.setAuthMode('login')} disabled={isSubmitting}>
						Back to sign in
					</Button>
				</div>
			</form>
		{:else if authBoundary.authMode === 'reset_password'}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onResetPasswordSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-xl font-semibold tracking-tight text-foreground">Choose a new password</h2>
					<p class="text-sm text-muted-foreground">
						You’re in recovery mode now. Pick a password you can use the next time you sign in.
					</p>
				</div>
				<Field.Group class="space-y-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="reset-password">New password</Field.Label>
							<Input id="reset-password" type="password" class="h-11" bind:value={authBoundary.password} />
							{#if authBoundary.loginFieldErrors.password}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.password}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="reset-confirm-password">Confirm new password</Field.Label>
							<Input id="reset-confirm-password" type="password" class="h-11" bind:value={authBoundary.confirmPassword} />
							{#if authBoundary.loginFieldErrors.confirmPassword}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.confirmPassword}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				</Field.Group>
				<div class="pt-1">
					<Button type="submit" class="h-11 w-full justify-center" disabled={isSubmitting}>
						Update password
					</Button>
				</div>
			</form>
		{:else}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); if (authBoundary.authMode === 'register') authBoundary.onEmailRegisterSubmit(); else authBoundary.onEmailLoginSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-xl font-semibold tracking-tight text-foreground">
						{authBoundary.authMode === 'register' ? 'Create your account' : 'Sign in with email'}
					</h2>
					<p class="text-sm text-muted-foreground">
						{authBoundary.authMode === 'register'
							? 'Set up an email and password for your account.'
							: 'Use the email and password connected to this account, or reset access if you are stuck.'}
					</p>
				</div>
				<Field.Group class="space-y-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="email">Email</Field.Label>
							<Input id="email" type="email" class="h-11" bind:value={authBoundary.email} />
							{#if authBoundary.loginFieldErrors.email}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.email}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
					<Field.Field>
						<Field.Content>
							<Field.Label for="password">Password</Field.Label>
							<Input id="password" type="password" class="h-11" bind:value={authBoundary.password} />
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
							<Input id="confirm-password" type="password" class="h-11" bind:value={authBoundary.confirmPassword} />
							{#if authBoundary.loginFieldErrors.confirmPassword}
								<Field.Error role="alert">{authBoundary.loginFieldErrors.confirmPassword}</Field.Error>
							{/if}
						</Field.Content>
					</Field.Field>
				{/if}
				<div class="flex flex-wrap gap-3 pt-1">
					<Button type="submit" class="h-11 w-full justify-center sm:w-auto" disabled={isSubmitting}>
						{isSubmitting
							? authBoundary.authMode === 'register'
								? 'Registering...'
								: 'Signing in...'
							: authBoundary.authMode === 'register'
								? 'Register'
								: 'Sign in'}
					</Button>
					<Button type="button" variant="outline" onclick={() => authBoundary.setAuthMode(authBoundary.authMode === 'login' ? 'register' : 'login')} disabled={isSubmitting}>
						{authBoundary.authMode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
					</Button>
					{#if authBoundary.authMode === 'login'}
						<Button type="button" variant="ghost" onclick={() => authBoundary.setAuthMode('forgot_password')} disabled={isSubmitting}>
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
					<h2 class="text-xl font-semibold tracking-tight text-foreground">Phone number</h2>
					<p class="text-sm text-muted-foreground">Get a 6-digit code by text. New numbers can finish setup after verification.</p>
				</div>
				<Field.Field>
					<Field.Content>
						<Field.Label for="phone-number">Phone number</Field.Label>
						<Input id="phone-number" type="tel" class="h-11" bind:value={authBoundary.phone} />
						{#if authBoundary.loginFieldErrors.phoneNumber}
							<Field.Error role="alert">{authBoundary.loginFieldErrors.phoneNumber}</Field.Error>
						{/if}
					</Field.Content>
				</Field.Field>
				<div class="pt-1">
					<Button type="submit" class="h-11 w-full justify-center" disabled={isSubmitting}>
						{isSubmitting ? 'Sending...' : 'Text me a code'}
					</Button>
				</div>
			</form>
		{:else}
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); authBoundary.onVerifyCodeSubmit(); }}>
				<div class="space-y-1">
					<h2 class="text-xl font-semibold tracking-tight text-foreground">Verify your code</h2>
					<p class="text-sm text-muted-foreground">Enter the code from your text message to continue.</p>
				</div>
				<Field.Field>
					<Field.Content>
						<Field.Label for="otp-code">Verification code</Field.Label>
						<Input id="otp-code" type="text" class="h-11" bind:value={authBoundary.otpCode} inputmode="numeric" autocomplete="one-time-code" />
						{#if authBoundary.loginFieldErrors.otpCode}
							<Field.Error role="alert">{authBoundary.loginFieldErrors.otpCode}</Field.Error>
						{/if}
					</Field.Content>
				</Field.Field>
				<div class="flex flex-wrap gap-3 pt-1">
					<Button type="submit" class="h-11 w-full justify-center sm:w-auto" disabled={isSubmitting}>
						{isSubmitting ? 'Verifying...' : 'Verify and continue'}
					</Button>
					<Button type="button" variant="outline" onclick={() => authBoundary.resendPhoneCode()} disabled={isSubmitting}>
						Resend code
					</Button>
					<Button type="button" variant="ghost" onclick={() => authBoundary.resetAuthFlow()} disabled={isSubmitting}>
						Back
					</Button>
				</div>
			</form>
		{/if}
	{/if}

	{#if authBoundary.loginFeedback}
		<div
			role="alert"
			data-feedback-type={authBoundary.loginFeedbackType}
			class={`rounded-xl border px-4 py-3 ${feedbackToneClass}`}
		>
			<p class="text-xs font-medium uppercase tracking-[0.14em] opacity-80">{feedbackLabel}</p>
			<p class="mt-1 text-sm leading-6">{authBoundary.loginFeedback}</p>
		</div>
	{/if}
			</Card.Content>
		</Card.Root>

		<p class="text-center text-sm text-muted-foreground">
			Need an invite? Ask your organization’s admin.
		</p>
	</div>
</section>
