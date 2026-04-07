<!--
  Home page — profile summary + navigation links.
-->
<script lang="ts">
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
</script>

<main>
	<h1>Home</h1>

	<section aria-label="Profile">
		<p>Name: {currentUser.details.name || '(not set)'}</p>
		<p>Email: {currentUser.details.email || '—'}</p>
		<p>Organization: {currentOrganization.organization?.name ?? '—'}</p>
		<p>Role: {currentOrganization.membership?.role ?? '—'}</p>
	</section>

	<nav aria-label="Main">
		<ul>
			<li><a href="/hub">Hub</a></li>
			<li><a href="/organization">Organization</a></li>
			{#if currentOrganization.isAdmin}
				<li><a href="/hub/manage">Manage hub</a></li>
			{/if}
		</ul>
	</nav>

	<button onclick={() => currentUser.logout()}>Sign out</button>
</main>
