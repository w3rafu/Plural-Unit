<script lang="ts">
	import { Search, ChevronRight } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import {
		uiPreviewAdminCount,
		uiPreviewFixtures,
		uiPreviewMemberCount
	} from '$lib/demo/uiPreviewFixtures';
	import {
		buildMemberDirectorySummary,
		filterMemberDirectory,
		getMemberDirectoryMeta,
		getMemberDirectoryRoleLabel
	} from '$lib/models/memberDirectoryModel';
	import { formatContact, formatJoinedAt, getMemberInitials } from '$lib/models/memberManagementHelpers';

	let searchQuery = $state('');

	const visibleMembers = $derived(
		filterMemberDirectory(uiPreviewFixtures.members, {
			query: searchQuery,
			currentUserId: uiPreviewFixtures.currentUserProfileId
		})
	);
	const summary = $derived(
		buildMemberDirectorySummary(searchQuery, visibleMembers.length, uiPreviewFixtures.members.length)
	);
</script>

<PageHeader
	preset="section"
	title="Directory demo"
	subtitle={`Fixture roster for ${uiPreviewFixtures.organizationName}.`}
/>

<main class="page-stack pb-6">
	<Card.Root size="sm" class="border-border/70 bg-card">
		<Card.Header class="gap-3 border-b border-border/70">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div class="flex-1 space-y-3">
					<div class="space-y-1">
						<Card.Title class="text-lg font-semibold tracking-tight">Fixture directory</Card.Title>
						<Card.Description>
							{summary}. Search by name, role, email, or phone number.
						</Card.Description>
					</div>

					<div class="grid gap-2 sm:grid-cols-3">
						<div class="rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visible</p>
							<p class="mt-1 text-lg font-semibold tracking-tight text-foreground">{visibleMembers.length}</p>
						</div>

						<div class="rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Admins</p>
							<p class="mt-1 text-lg font-semibold tracking-tight text-foreground">{uiPreviewAdminCount}</p>
						</div>

						<div class="rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Members</p>
							<p class="mt-1 text-lg font-semibold tracking-tight text-foreground">{uiPreviewMemberCount}</p>
						</div>
					</div>
				</div>

				<label class="relative block w-full lg:max-w-xs">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search the directory"
						class="h-10 rounded-xl border-border/70 bg-background pl-9 shadow-sm"
						bind:value={searchQuery}
					/>
				</label>
			</div>
		</Card.Header>

		<Card.Content class="space-y-3 p-3">
			{#each visibleMembers as member (member.profile_id)}
				<div class="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm">
					<div class="flex items-start gap-3">
						<Avatar.Root class="size-11 border border-border/70 bg-muted/50 shadow-sm after:hidden">
							<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
								{getMemberInitials(member)}
							</Avatar.Fallback>
						</Avatar.Root>

						<div class="min-w-0 flex-1 space-y-3">
							<div class="space-y-1">
								<p class="truncate text-sm font-semibold text-foreground">{member.name}</p>
								<p class="text-xs text-muted-foreground">
									{getMemberDirectoryMeta(member, uiPreviewFixtures.currentUserProfileId)}
								</p>
							</div>

							<div class="flex flex-wrap gap-2">
								<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
									{getMemberDirectoryRoleLabel(member.role)}
								</Badge>
								<Badge variant="outline">Joined {formatJoinedAt(member.joined_at)}</Badge>
							</div>

							<p class="text-sm text-muted-foreground wrap-break-word">{formatContact(member)}</p>

							<div class="flex flex-wrap gap-2">
								<Button href={`/demo/directory/${member.profile_id}`} variant="outline" size="sm" class="flex-1 sm:flex-none">
									Open detail
									<ChevronRight class="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</main>