<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MessageSquare } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import {
		getMemberDirectoryContactFields,
		getMemberDirectoryMeta,
		getMemberDirectoryRoleLabel
	} from '$lib/models/memberDirectoryModel';
	import {
		formatContact,
		formatJoinedAt,
		formatJoinedVia,
		getMemberInitials
	} from '$lib/models/memberManagementHelpers';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	const memberId = $derived(page.params.memberId ?? '');
	const member = $derived(
		currentOrganization.members.find((entry) => entry.profile_id === memberId) ?? null
	);
	const contactFields = $derived(member ? getMemberDirectoryContactFields(member) : []);
	const existingThreadId = $derived(
		member ? currentMessages.getThreadIdForProfile(member.profile_id) : null
	);
	const isOwnProfile = $derived(member?.profile_id === currentUser.details.id);
	let isOpeningConversation = $state(false);

	function goBackToDirectory() {
		void goto('/directory', { noScroll: true, keepFocus: true });
	}

	async function messageMember() {
		if (!member) {
			return;
		}

		isOpeningConversation = true;

		try {
			await currentMessages.openConversationForProfile(member.profile_id, currentUser.details.id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description:
					error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		} finally {
			isOpeningConversation = false;
		}
	}
</script>

<PageHeader
	preset="detail"
	title={member?.name || 'Member profile'}
	avatarText={member ? getMemberInitials(member) : ''}
	avatarImageUrl={member?.avatar_url || ''}
	backLabel="Directory"
	onBack={goBackToDirectory}
/>

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	<Card.Root size="sm" class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
		<Card.Content class="min-h-0 flex-1 overflow-auto p-4">
			{#if currentOrganization.isLoadingMembers && !member}
				<div class="flex min-h-full items-center justify-center text-center">
					<div class="space-y-1">
						<p class="font-medium text-foreground">Loading member profile</p>
						<p class="text-sm text-muted-foreground">
							Pulling the latest directory details for this member.
						</p>
					</div>
				</div>
			{:else if member}
				<div class="space-y-5">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div class="flex min-w-0 items-start gap-4">
							<Avatar.Root class="size-16 border border-border/70 bg-muted/50 shadow-sm after:hidden">
								{#if member.avatar_url}
									<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
								{:else}
									<Avatar.Fallback class="text-lg font-semibold tracking-tight text-foreground">
										{getMemberInitials(member)}
									</Avatar.Fallback>
								{/if}
							</Avatar.Root>

							<div class="min-w-0 space-y-3">
								<div class="space-y-1">
									<p class="truncate text-xl font-semibold text-foreground">
										{member.name || 'Unnamed member'}
									</p>
									<p class="text-sm text-muted-foreground">
										{getMemberDirectoryMeta(member, currentUser.details.id)}
									</p>
								</div>

								<div class="flex flex-wrap gap-2">
									<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
										{getMemberDirectoryRoleLabel(member.role)}
									</Badge>
									<Badge variant="outline">{formatJoinedVia(member)}</Badge>
									<Badge variant="outline">Joined {formatJoinedAt(member.joined_at)}</Badge>
								</div>

								<p class="text-sm text-foreground">{formatContact(member)}</p>
							</div>
						</div>

						{#if !isOwnProfile}
							<div class="flex w-full flex-col gap-2 lg:w-auto">
								<Button type="button" size="sm" onclick={messageMember} disabled={isOpeningConversation}>
									<MessageSquare class="size-4" />
									{#if isOpeningConversation}
										Opening...
									{:else if existingThreadId}
										View conversation
									{:else}
										Message member
									{/if}
								</Button>
								<p class="text-xs text-muted-foreground lg:max-w-52">
									Open a direct conversation from this profile.
								</p>
							</div>
						{/if}
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

					{#if contactFields.length > 0}
						<div class="metric-grid">
							{#each contactFields as field (`${field.label}-${field.value}`)}
								<div class="metric-card min-h-0 bg-background">
									<div>
										<p class="metric-label">{field.label}</p>
										<p class="metric-value metric-value--compact wrap-break-word">{field.value}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex min-h-full items-center justify-center text-center">
					<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
						<p class="font-medium text-foreground">Member not found</p>
						<p class="mt-1 text-sm text-muted-foreground">
							That profile is no longer available in this directory.
						</p>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</main>