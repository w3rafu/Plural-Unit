<!--
  Profile page — dedicated route for the signed-in member summary.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ProfileEditor from '$lib/components/profile/ProfileEditor.svelte';
	import ProfileSection from '$lib/components/profile/ProfileSection.svelte';

	function goHome() {
		void goto('/');
	}
</script>

<PageHeader title="Profile" subtitle="Member details and security" backLabel="Home" onBack={goHome} />

<main class="flex flex-col gap-4">
	<ProfileSection />
	<ProfileEditor />
</main>