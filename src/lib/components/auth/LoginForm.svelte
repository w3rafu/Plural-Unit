<!--
  LoginForm — dual-channel login wireframe.

  Supports phone OTP and email/password login + registration.
  All validation and error mapping lives in authBoundary.
-->
<script lang="ts">
	import { authBoundary } from '$lib/stores/authBoundary.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
</script>

<section aria-label="Login">
	<h1>Plural Unit</h1>

	<fieldset>
		<legend>Sign in with</legend>
		<label>
			<input type="radio" name="channel" value="email"
				checked={authBoundary.authChannel === 'email'}
				onchange={() => authBoundary.setAuthChannel('email')} />
			Email
		</label>
		<label>
			<input type="radio" name="channel" value="phone"
				checked={authBoundary.authChannel === 'phone'}
				onchange={() => authBoundary.setAuthChannel('phone')} />
			Phone
		</label>
	</fieldset>

	{#if authBoundary.authChannel === 'email'}
		<div>
			<label>
				Email
				<input type="email" bind:value={authBoundary.email} />
			</label>
			<label>
				Password
				<input type="password" bind:value={authBoundary.password} />
			</label>
			{#if authBoundary.authMode === 'register'}
				<label>
					Confirm password
					<input type="password" bind:value={authBoundary.confirmPassword} />
				</label>
			{/if}
			<button onclick={() => authBoundary.submitLogin()} disabled={currentUser.isLoading}>
				{authBoundary.authMode === 'register' ? 'Register' : 'Sign in'}
			</button>
			<button onclick={() => authBoundary.authMode = authBoundary.authMode === 'login' ? 'register' : 'login'}>
				{authBoundary.authMode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
			</button>
		</div>
	{:else}
		<div>
			{#if authBoundary.authStep === 'request_code'}
				<label>
					Phone number
					<input type="tel" bind:value={authBoundary.phone} />
				</label>
				<button onclick={() => authBoundary.submitLogin()} disabled={currentUser.isLoading}>
					Send code
				</button>
			{:else}
				<label>
					Verification code
					<input type="text" bind:value={authBoundary.otpCode} inputmode="numeric" />
				</label>
				<button onclick={() => authBoundary.submitLogin()} disabled={currentUser.isLoading}>
					Verify
				</button>
			{/if}
		</div>
	{/if}

	{#if authBoundary.loginFeedback}
		<p role="alert">{authBoundary.loginFeedback}</p>
	{/if}
</section>
