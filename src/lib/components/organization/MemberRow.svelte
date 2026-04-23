<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
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
	const bioPreview = $derived((member.bio ?? '').trim());
	const joinedViaLabel = $derived(formatJoinedVia(member));
	const isRecentJoin = $derived(isRecentOrganizationMember(member));
</script>

<div class="rounded-2xl border border-border/70 bg-background/88 p-3 shadow-sm">
	<div class="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
		<div class="flex min-w-0 items-start gap-3">
			<Avatar.Root class="size-10 shrink-0 border border-border/70 bg-muted/50 shadow-sm after:hidden">
				{#if member.avatar_url}
					<Avatar.Image src={member.avatar_url} alt={`${member.name || 'Member'} profile`} />
				{:else}
					<Avatar.Fallback class="text-sm font-semibold tracking-tight text-foreground">
						{getMemberInitials(member)}
					</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="min-w-0 space-y-1.5">
				<div class="space-y-0.5">
					<p class="font-medium text-foreground">{member.name || 'Unnamed member'}</p>
					<p class="text-xs text-muted-foreground">{formatContact(member)}</p>
				</div>
				{#if bioPreview}
					<p class="max-w-2xl text-[0.82rem] leading-5 text-muted-foreground">{bioPreview}</p>
				{/if}
				<div class="flex flex-wrap items-center gap-1.5">
					<Badge variant={member.role === 'admin' ? 'secondary' : 'muted'} class="rounded-full px-2.25 py-0.75 text-[0.68rem] font-medium">
						{member.role === 'admin' ? 'Admin' : 'Member'}
					</Badge>
					<Badge variant="muted" class="rounded-full px-2.25 py-0.75 text-[0.68rem] font-medium">
						{joinedViaLabel}
					</Badge>
					{#if isRecentJoin}
						<Badge variant="warning" class="rounded-full px-2.25 py-0.75 text-[0.68rem] font-medium">
							Recent
						</Badge>
					{/if}
					<span class="text-[0.76rem] text-muted-foreground">Joined {formatJoinedAt(member.joined_at)}</span>
				</div>
			</div>
		</div>

		<div class={`grid w-full gap-2 ${canMessage ? 'sm:grid-cols-[auto_minmax(0,14rem)_auto]' : 'sm:grid-cols-[minmax(0,14rem)_auto]'} xl:w-auto xl:min-w-88 xl:max-w-124 xl:items-center`}>
			{#if canMessage && onMessage}
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="h-8.5 justify-center rounded-xl px-3"
					aria-label={`Message ${memberLabel}`}
					onclick={onMessage}
				>
					<MessageSquare class="mr-1.5 h-3.5 w-3.5" />
					Message
				</Button>
			{/if}

			<div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
				<Select.Root
					type="single"
					value={draftRole}
					onValueChange={(value: string) => onDraftRoleChange(value as OrganizationMember['role'])}
					name={`member-role-${member.profile_id}`}
				>
					<Select.Trigger
						class="h-8.5 w-full rounded-xl"
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
					variant="default"
					size="sm"
					class="h-8.5 rounded-xl px-3"
					disabled={isMutating || draftRole === member.role || wouldDemoteLastAdmin(member, draftRole, adminCount)}
					title={wouldDemoteLastAdmin(member, draftRole, adminCount) ? 'Keep at least one admin in the organization.' : undefined}
					aria-label={`Update role for ${memberLabel}`}
					onclick={onRoleConfirm}
				>
					Save role
				</Button>
			</div>

			<Button
				type="button"
				variant="outline"
				size="sm"
				class="h-8.5 justify-center rounded-xl border-destructive/25 px-3 text-destructive hover:bg-destructive/8 hover:text-destructive"
				disabled={isMutating || isLastAdmin(member, adminCount)}
				title={isLastAdmin(member, adminCount) ? 'Keep at least one admin in the organization.' : undefined}
				aria-label={`Remove ${memberLabel} from the organization`}
				onclick={onRemove}
			>
				Remove member
			</Button>
		</div>
	</div>
</div>
