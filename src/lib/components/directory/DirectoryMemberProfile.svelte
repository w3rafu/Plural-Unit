<script lang="ts">
	import { MessageSquare } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		getMemberDirectoryContactFields,
		getMemberDirectoryMeta,
		getMemberDirectoryRoleLabel
	} from '$lib/models/memberDirectoryModel';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import {
		formatContact,
		formatJoinedAt,
		formatJoinedVia,
		getMemberInitials
	} from '$lib/models/memberManagementHelpers';

	let {
		member,
		currentUserId,
		isLoading = false,
		hasConversation = false,
		isOpeningConversation = false,
		onMessage = null as (() => void) | null,
		emptyTitle = 'Member not found',
		emptyDescription = 'That profile is no longer available in this directory.'
	}: {
		member: OrganizationMember | null;
		currentUserId: string;
		isLoading?: boolean;
		hasConversation?: boolean;
		isOpeningConversation?: boolean;
		onMessage?: (() => void) | null;
		emptyTitle?: string;
		emptyDescription?: string;
	} = $props();

	const contactFields = $derived(member ? getMemberDirectoryContactFields(member) : []);
	const bio = $derived((member?.bio ?? '').trim());
	const isOwnProfile = $derived(member?.profile_id === currentUserId);
	const messageLabel = $derived(hasConversation ? 'View conversation' : 'Message member');
</script>

{#if isLoading && !member}
	<div class="flex min-h-full items-center justify-center text-center">
		<div class="space-y-1">
			<p class="font-medium text-foreground">Loading member profile</p>
			<p class="text-sm text-muted-foreground">
				Pulling the latest directory details for this member.
			</p>
		</div>
	</div>
{:else if member}
	<div class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
		<div class="space-y-4">
			<div class="rounded-3xl border border-border/70 bg-background px-5 py-5 shadow-sm">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div class="flex min-w-0 items-start gap-4">
						<Avatar.Root class="size-18 border border-border/70 bg-muted/50 shadow-sm after:hidden">
							{#if member.avatar_url}
								<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
							{:else}
								<Avatar.Fallback class="text-xl font-semibold tracking-tight text-foreground">
									{getMemberInitials(member)}
								</Avatar.Fallback>
							{/if}
						</Avatar.Root>

						<div class="min-w-0 space-y-3">
							<div class="space-y-1">
								<p class="truncate text-2xl font-semibold tracking-tight text-foreground">
									{member.name || 'Unnamed member'}
								</p>
								<p class="text-sm text-muted-foreground">
									{getMemberDirectoryMeta(member, currentUserId)}
								</p>
							</div>

							<div class="flex flex-wrap gap-2">
								<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
									{getMemberDirectoryRoleLabel(member.role)}
								</Badge>
								<Badge variant="outline">{formatJoinedVia(member)}</Badge>
								<Badge variant="outline">Joined {formatJoinedAt(member.joined_at)}</Badge>
							</div>

							<p class="text-sm leading-6 text-foreground wrap-break-word">
								{formatContact(member)}
							</p>
						</div>
					</div>

					{#if !isOwnProfile && onMessage}
						<div class="flex w-full flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 lg:w-64">
							<Button type="button" size="sm" onclick={onMessage} disabled={isOpeningConversation}>
								<MessageSquare class="size-4" />
								{isOpeningConversation ? 'Opening...' : messageLabel}
							</Button>
							<p class="text-xs text-muted-foreground">
								Jump into a direct thread without leaving the directory context.
							</p>
						</div>
					{/if}
				</div>
			</div>

			<div class="metric-grid">
				<div class="metric-card min-h-0">
					<div>
						<p class="metric-label">Role</p>
						<p class="metric-value metric-value--compact">
							{getMemberDirectoryRoleLabel(member.role)}
						</p>
					</div>
				</div>

				<div class="metric-card min-h-0">
					<div>
						<p class="metric-label">Joined via</p>
						<p class="metric-value metric-value--compact">{formatJoinedVia(member)}</p>
					</div>
				</div>

				<div class="metric-card min-h-0">
					<div>
						<p class="metric-label">Joined</p>
						<p class="metric-value metric-value--compact">{formatJoinedAt(member.joined_at)}</p>
					</div>
				</div>

				<div class="metric-card min-h-0">
					<div>
						<p class="metric-label">Contact</p>
						<p class="metric-value metric-value--compact wrap-break-word">
							{formatContact(member)}
						</p>
					</div>
				</div>
			</div>

			<div class="rounded-3xl border border-border/70 bg-background px-4 py-4 shadow-sm">
				<p class="text-sm font-semibold text-foreground">Bio</p>
				{#if bio}
					<p class="mt-2 text-sm leading-6 text-foreground wrap-break-word">{bio}</p>
				{:else}
					<p class="mt-2 text-sm text-muted-foreground">
						This member has not added a bio yet.
					</p>
				{/if}
			</div>

			{#if contactFields.length > 0}
				<div class="grid gap-3 md:grid-cols-2">
					{#each contactFields as field (`${field.label}-${field.value}`)}
						<div class="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm">
							<p class="metric-label">{field.label}</p>
							<p class="mt-2 text-sm font-medium text-foreground wrap-break-word">{field.value}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="space-y-4">
			<div class="rounded-3xl border border-border/70 bg-background px-4 py-4 shadow-sm">
				<p class="text-sm font-semibold text-foreground">Membership snapshot</p>
				<div class="mt-3 space-y-3">
					<div class="rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Status
						</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{member.role === 'admin' ? 'Administrative access' : 'Member access'}
						</p>
					</div>

					<div class="rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Relationship
						</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{isOwnProfile ? 'This is your profile in the directory.' : 'Visible inside your organization directory.'}
						</p>
					</div>

					<div class="rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Reachability
						</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{contactFields.length > 0 ? `${contactFields.length} contact field${contactFields.length === 1 ? '' : 's'} available.` : 'No direct contact fields published.'}
						</p>
					</div>
				</div>
			</div>

			{#if !isOwnProfile && onMessage}
				<div class="rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 shadow-sm">
					<p class="text-sm font-semibold text-foreground">Direct conversation</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Use the message action to continue coordination without leaving the member context.
					</p>
					<p class="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
						{hasConversation ? 'Existing thread available' : 'New thread will open'}
					</p>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex min-h-full items-center justify-center text-center">
		<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
			<p class="font-medium text-foreground">{emptyTitle}</p>
			<p class="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
		</div>
	</div>
{/if}