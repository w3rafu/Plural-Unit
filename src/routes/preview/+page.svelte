<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import DemoMessagesWorkspace from '$lib/components/messages/DemoMessagesWorkspace.svelte';
	import { uiPreviewFixtures, uiPreviewNotifications, cloneUiPreviewThreads } from '$lib/demo/uiPreviewFixtures';
	import { getMemberDirectoryRoleLabel } from '$lib/models/memberDirectoryModel';
	import { formatContact, formatJoinedAt, getMemberInitials } from '$lib/models/memberManagementHelpers';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { formatEventDateTime } from '$lib/utils/dateFormat';

	const previewMembers = uiPreviewFixtures.members.slice(0, 6);
</script>

<PageHeader
	preset="section"
	title="Preview Lab"
	subtitle="Fixture-backed members, conversations, and hub activity for UI reviews."
/>

<main class="page-stack pb-6">
	<div class="metric-grid">
		<div class="metric-card min-h-0">
			<div>
				<p class="metric-label">Members</p>
				<p class="metric-value metric-value--compact">{uiPreviewFixtures.members.length}</p>
				<p class="metric-copy">Fixture roster for directory and profile checks.</p>
			</div>
		</div>

		<div class="metric-card min-h-0">
			<div>
				<p class="metric-label">Threads</p>
				<p class="metric-value metric-value--compact">{uiPreviewFixtures.threads.length}</p>
				<p class="metric-copy">Unread, recent, and older conversations.</p>
			</div>
		</div>

		<div class="metric-card min-h-0">
			<div>
				<p class="metric-label">Hub activity</p>
				<p class="metric-value metric-value--compact">
					{uiPreviewFixtures.broadcasts.length + uiPreviewFixtures.events.length}
				</p>
				<p class="metric-copy">Broadcast and event samples for the member feed.</p>
			</div>
		</div>
	</div>

	<div class="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.95fr)]">
		<Card.Root size="sm" class="overflow-hidden border-border/70 bg-card">
			<Card.Header class="gap-1 border-b border-border/70">
				<Card.Title class="text-base font-semibold tracking-tight">Messages preview</Card.Title>
				<Card.Description>
					Static sample threads you can use to judge hierarchy, spacing, and empty-state coverage.
				</Card.Description>
			</Card.Header>

			<Card.Content class="min-h-152 p-0">
				<div class="min-h-152">
					<DemoMessagesWorkspace getInitialThreads={cloneUiPreviewThreads} />
				</div>
			</Card.Content>
		</Card.Root>

		<div class="space-y-4">
			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Header class="gap-1 border-b border-border/70">
					<Card.Title class="text-base font-semibold tracking-tight">Directory sample</Card.Title>
					<Card.Description>
						A compact roster slice for checking density, contact formatting, and role badges.
					</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-3">
					{#each previewMembers as member (member.profile_id)}
						<div class="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm">
							<div class="flex items-start gap-3">
								<Avatar.Root class="size-11 border border-border/70 bg-muted/50 shadow-sm after:hidden">
									<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
										{getMemberInitials(member)}
									</Avatar.Fallback>
								</Avatar.Root>

								<div class="min-w-0 flex-1 space-y-2">
									<div class="flex items-start justify-between gap-2">
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold text-foreground">{member.name}</p>
											<p class="truncate text-[0.82rem] text-muted-foreground">{formatContact(member)}</p>
										</div>
										<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
											{getMemberDirectoryRoleLabel(member.role)}
										</Badge>
									</div>

									<div class="flex flex-wrap gap-2 text-[0.84rem] text-muted-foreground">
										<span class="rounded-full border border-border/70 bg-muted/30 px-2.5 py-1">
											Joined {formatJoinedAt(member.joined_at)}
										</span>
										<span class="rounded-full border border-border/70 bg-muted/30 px-2.5 py-1">
											{member.joined_via}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/each}

					<Button href="/directory" variant="outline" size="sm" class="w-full justify-center">
						Open live directory
					</Button>
					<Button href="/demo" variant="ghost" size="sm" class="w-full justify-center">
						Open demo routes
					</Button>
				</Card.Content>
			</Card.Root>

			<Card.Root size="sm" class="border-border/70 bg-card">
				<Card.Header class="gap-1 border-b border-border/70">
					<Card.Title class="text-base font-semibold tracking-tight">Hub activity sample</Card.Title>
					<Card.Description>
						Broadcasts and events merged through the same notification builder used by the hub.
					</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-3">
					{#each uiPreviewNotifications as item (item.id)}
						<div class="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm">
							<div class="flex items-center justify-between gap-3">
								<Badge variant={item.kind === 'broadcast' ? 'default' : 'outline'}>{item.label}</Badge>
								<p class="text-[0.84rem] uppercase tracking-[0.16em] text-muted-foreground">
									{item.kind === 'event'
										? formatEventDateTime(
												uiPreviewFixtures.events.find((event) => `event:${event.id}` === item.id)?.starts_at ?? ''
											)
										: item.meta}
								</p>
							</div>

							<div class="mt-3 space-y-1.5">
								<p class="text-sm font-semibold text-foreground">{item.title}</p>
								<p class="text-sm text-muted-foreground">{item.summary}</p>
								<p class="text-[0.82rem] text-muted-foreground">{item.meta}</p>
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</main>