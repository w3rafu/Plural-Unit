<!--
  MemberRow — presentational row for a single organization member.

  Renders avatar, name, contact, role badge, joined info, and action controls.
  All mutation events are dispatched to the parent via callbacks.
-->
<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import { MessageSquare } from '@lucide/svelte';
	import { isRecentOrganizationMember } from '$lib/models/accessReviewModel';
	import type { OrganizationMember } from '$lib/models/organizationModel';
	import {
		formatJoinedVia,
		formatJoinedAt,
		formatContact,
		getMemberInitials,
		isLastAdmin,
		wouldDemoteLastAdmin
	} from '$lib/models/memberManagementHelpers';

	let {
		member,
		adminCount,
		draftRole,
		isMutating = false,
		canMessage = false,
		onDraftRoleChange,
		onRoleConfirm,
		onRemove,
		onMessage
	}: {
		member: OrganizationMember;
		adminCount: number;
		draftRole: OrganizationMember['role'];
		isMutating?: boolean;
		canMessage?: boolean;
		onDraftRoleChange: (role: OrganizationMember['role']) => void;
		onRoleConfirm: () => void;
		onRemove: () => void;
		onMessage?: () => void;
	} = $props();

	const memberLabel = $derived(member.name || formatContact(member));
	const joinedViaLabel = $derived(formatJoinedVia(member));
	const isRecentJoin = $derived(isRecentOrganizationMember(member));
</script>

<Table.Row class="border-border/70">
	<Table.Cell class="whitespace-normal">
		<div class="flex items-center gap-3">
			<Avatar.Root class="size-10 border border-border/70 bg-muted/50 shadow-sm after:hidden">
				{#if member.avatar_url}
					<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
				{:else}
					<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
						{getMemberInitials(member)}
					</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="space-y-1">
				<p class="font-medium text-foreground">{member.name || 'Unnamed member'}</p>
				<p class="text-xs text-muted-foreground">{formatContact(member)}</p>
			</div>
		</div>
	</Table.Cell>
	<Table.Cell>
		<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
			{member.role === 'admin' ? 'Admin' : 'Member'}
		</Badge>
	</Table.Cell>
	<Table.Cell>
		<div class="flex flex-wrap gap-2">
			<Badge variant="outline">{joinedViaLabel}</Badge>
			{#if isRecentJoin}
				<Badge variant="secondary">Recent</Badge>
			{/if}
		</div>
	</Table.Cell>
	<Table.Cell class="text-right text-sm text-muted-foreground">
		{formatJoinedAt(member.joined_at)}
	</Table.Cell>
	<Table.Cell class="text-right">
		<div class="flex flex-wrap justify-end gap-2">
			{#if canMessage && onMessage}
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-label={`Message ${memberLabel}`}
					onclick={onMessage}
				>
					<MessageSquare class="mr-1.5 h-3.5 w-3.5" />
					Message
				</Button>
			{/if}

			<Select.Root
				type="single"
				value={draftRole}
				onValueChange={(value: string) => onDraftRoleChange(value as OrganizationMember['role'])}
				name={`member-role-${member.profile_id}`}
			>
				<Select.Trigger
					class="w-28"
					aria-label={`Role for ${memberLabel}`}
				>
					{draftRole}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="admin">admin</Select.Item>
					<Select.Item value="member">member</Select.Item>
				</Select.Content>
			</Select.Root>

			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={isMutating || draftRole === member.role || wouldDemoteLastAdmin(member, draftRole, adminCount)}
				title={wouldDemoteLastAdmin(member, draftRole, adminCount) ? 'Keep at least one admin in the organization.' : undefined}
				aria-label={`Update role for ${memberLabel}`}
				onclick={onRoleConfirm}
			>
				Update
			</Button>

			<Button
				type="button"
				variant="destructive"
				size="sm"
				disabled={isMutating || isLastAdmin(member, adminCount)}
				title={isLastAdmin(member, adminCount) ? 'Keep at least one admin in the organization.' : undefined}
				aria-label={`Remove ${memberLabel} from the organization`}
				onclick={onRemove}
			>
				Remove
			</Button>
		</div>
	</Table.Cell>
</Table.Row>
