<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { computeAvatarInitials } from '$lib/components/profile/avatarUploadModel';
	import type { OrganizationMember } from '$lib/models/organizationModel';

	const organizationMembers = $derived(currentOrganization.members);

	const adminCount = $derived.by(
		() => organizationMembers.filter((member) => member.role === 'admin').length
	);

	function formatJoinedVia(member: OrganizationMember) {
		switch (member.joined_via) {
			case 'created':
				return 'Created organization';
			case 'invitation':
				return 'Invited';
			case 'code':
				return 'Joined by code';
			default:
				return member.joined_via;
		}
	}

	function formatJoinedAt(value: string) {
		return new Date(value).toLocaleDateString([], {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatContact(member: OrganizationMember) {
		return member.email || member.phone_number || 'No contact added';
	}

	function getMemberInitials(member: OrganizationMember) {
		return computeAvatarInitials(member.name, member.email, member.phone_number, 'Member');
	}
</script>

<Card.Root class="border-border/70 bg-card/80">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Members</Card.Title>
		<Card.Description>
			Review who belongs to this organization and which accounts can manage it.
		</Card.Description>
	</Card.Header>

	{#if !currentOrganization.isAdmin}
		<Card.Content>
			<div class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
				<p class="font-medium text-foreground">Members are visible to organization admins.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Ask an admin if you need help reviewing who has access.
				</p>
			</div>
		</Card.Content>
	{:else}
		<Card.Content class="space-y-5">
			<div class="grid gap-3 sm:grid-cols-3">
				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Total members
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">{organizationMembers.length}</p>
				</div>

				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Admins
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">{adminCount}</p>
				</div>

				<div class="rounded-xl border border-border/70 bg-muted/35 px-4 py-3">
					<p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Members
					</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{Math.max(organizationMembers.length - adminCount, 0)}
					</p>
				</div>
			</div>

			<div class="overflow-x-auto overflow-y-hidden rounded-xl border border-border/70 bg-muted/10">
				<Table.Root class="min-w-[44rem]">
					<Table.Caption class="sr-only">Organization members and roles.</Table.Caption>
					<Table.Header class="bg-muted/25">
						<Table.Row>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Member</Table.Head>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Role</Table.Head>
							<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Joined</Table.Head>
							<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Added</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if currentOrganization.isLoadingMembers}
							<Table.Row class="border-0 hover:bg-transparent">
								<Table.Cell colspan={4} class="py-10 text-center">
									<div class="space-y-1">
										<p class="font-medium text-foreground">Loading members</p>
										<p class="text-sm text-muted-foreground">
											Pulling the latest organization access list now.
										</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else if organizationMembers.length > 0}
							{#each organizationMembers as member (member.profile_id)}
								<Table.Row class="border-border/70">
									<Table.Cell class="whitespace-normal">
										<div class="flex items-center gap-3">
											{#if member.avatar_url}
												<img
													src={member.avatar_url}
													alt={`${member.name || 'Member'} profile`}
													class="size-10 rounded-full border border-border/70 object-cover shadow-sm"
												/>
											{:else}
												<div
													class="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold tracking-tight text-foreground"
													aria-hidden="true"
												>
													{getMemberInitials(member)}
												</div>
											{/if}

											<div class="space-y-1">
												<p class="font-medium text-foreground">{member.name || 'Unnamed member'}</p>
												<p class="text-xs text-muted-foreground">{formatContact(member)}</p>
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
											{member.role}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">{formatJoinedVia(member)}</Table.Cell>
									<Table.Cell class="text-right text-sm text-muted-foreground">
										{formatJoinedAt(member.joined_at)}
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row class="border-0 hover:bg-transparent">
								<Table.Cell colspan={4} class="py-10 text-center">
									<div class="space-y-1">
										<p class="font-medium text-foreground">No members found</p>
										<p class="text-sm text-muted-foreground">
											New members will appear here after they join or accept an invitation.
										</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	{/if}
</Card.Root>
