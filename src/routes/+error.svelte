<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
	<h1 class="text-4xl font-bold tracking-tight">
		{page.status}
	</h1>

	{#if page.status === 404}
		<p class="text-muted-foreground text-lg">Page not found. The page you're looking for doesn't exist or has been moved.</p>
	{:else}
		<p class="text-muted-foreground text-lg">
			{page.error?.message ?? 'Something went wrong.'}
		</p>
	{/if}

	<a
		href="/"
		class="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
	>
		Go home
	</a>
</div>
