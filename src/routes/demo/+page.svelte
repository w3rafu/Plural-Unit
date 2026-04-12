<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import {
		uiPreviewAdminCount,
		uiPreviewFixtures,
		uiPreviewMemberCount,
		uiPreviewNotifications,
		uiPreviewUnreadMessageCount
	} from '$lib/demo/uiPreviewFixtures';
</script>

<PageHeader
	preset="section"
	title="Demo routes"
	subtitle="Fixture-backed entry points for hub, directory, and messages reviews."
/>

<main class="page-stack pb-6">
	<div class="metric-grid">
		<div class="metric-card">
			<div>
				<p class="metric-label">Members</p>
				<p class="metric-value">{uiPreviewFixtures.members.length}</p>
			</div>
			<p class="metric-copy">{uiPreviewAdminCount} admins and {uiPreviewMemberCount} members.</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Unread messages</p>
				<p class="metric-value">{uiPreviewUnreadMessageCount}</p>
			</div>
			<p class="metric-copy">Thread data mirrors the message workspace demo.</p>
		</div>

		<div class="metric-card">
			<div>
				<p class="metric-label">Hub updates</p>
				<p class="metric-value">{uiPreviewNotifications.length}</p>
			</div>
			<p class="metric-copy">Broadcasts and events merged into one activity timeline.</p>
		</div>
	</div>

	<div class="grid gap-4 lg:grid-cols-3">
		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Header class="gap-1 border-b border-border/70">
				<Card.Title class="text-base font-semibold tracking-tight">Messages demo</Card.Title>
				<Card.Description>Inspect unread states, replies, attachments, and mobile thread flow.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<p class="text-sm text-muted-foreground">
					Open the full split-pane workspace backed by the fixture thread set.
				</p>
				<Button href="/demo/messages" variant="outline" size="sm" class="w-full justify-center">
					Open messages demo
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Header class="gap-1 border-b border-border/70">
				<Card.Title class="text-base font-semibold tracking-tight">Directory demo</Card.Title>
				<Card.Description>Review sample members and jump into the refined member detail surface.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<p class="text-sm text-muted-foreground">
					Browse the fixture roster without touching live organization data.
				</p>
				<Button href="/demo/directory" variant="outline" size="sm" class="w-full justify-center">
					Open directory demo
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Header class="gap-1 border-b border-border/70">
				<Card.Title class="text-base font-semibold tracking-tight">Hub demo</Card.Title>
				<Card.Description>See the updated activity feed and section lists with realistic sample content.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<p class="text-sm text-muted-foreground">
					The hub demo uses the same feed builder as the live page, driven by fixture broadcasts and events.
				</p>
				<Button href="/demo/hub" variant="outline" size="sm" class="w-full justify-center">
					Open hub demo
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
</main>