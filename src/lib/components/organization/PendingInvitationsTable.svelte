<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import {
		getInvitationChannel,
		getOrganizationInvitationExpiresAt,
		getInvitationRecipient,
		isExpiredOrganizationInvitation,
		isExpiringSoonOrganizationInvitation,
		isStaleOrganizationInvitation
	} from '$lib/models/accessReviewModel';
	import type { OrganizationInvitation } from '$lib/models/organizationModel';
	import { formatShortDateTime } from '$lib/utils/dateFormat';

	type Props = {
		invitations: OrganizationInvitation[];
		isBusy?: boolean;
		emptyTitle?: string;
		emptyDescription?: string;
		onResend?: (invitation: OrganizationInvitation) => void | Promise<void>;
		onRevoke?: (invitation: OrganizationInvitation) => void | Promise<void>;
	};

	let {
		invitations,
		isBusy = false,
		emptyTitle = 'No pending invitations',
		emptyDescription = 'Send an invite above when you are ready to bring in another member.',
		onResend,
		onRevoke
	}: Props = $props();

	function formatChannelLabel(invitation: OrganizationInvitation) {
		return getInvitationChannel(invitation) === 'email' ? 'Email' : 'Phone';
	}

	function formatSentAt(value: string | null | undefined) {
		if (!value) return '—';
		return formatShortDateTime(value) || '—';
	}
</script>

<div class="overflow-hidden rounded-xl border border-border/70 bg-muted/10">
	<Table.Root class="min-w-160">
		<Table.Caption class="sr-only">Pending invitations for the current organization.</Table.Caption>
		<Table.Header class="bg-muted/25">
			<Table.Row>
				<Table.Head class="h-12 text-[0.82rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Recipient</Table.Head>
				<Table.Head class="h-12 text-[0.82rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Channel</Table.Head>
				<Table.Head class="h-12 text-[0.82rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Signals</Table.Head>
				<Table.Head class="h-12 text-right text-[0.82rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Sent</Table.Head>
				<Table.Head class="h-12 text-right text-[0.82rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Expires</Table.Head>
				<Table.Head class="h-12 text-right text-[0.82rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if invitations.length > 0}
				{#each invitations as invitation (invitation.id)}
					<Table.Row class="border-border/70">
						<Table.Cell class="whitespace-normal">
							<div class="space-y-1">
								<p class="font-medium text-foreground">{getInvitationRecipient(invitation)}</p>
								<p class="text-[0.82rem] text-muted-foreground">
									Delivered by {formatChannelLabel(invitation).toLowerCase()}
								</p>
							</div>
						</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">{formatChannelLabel(invitation)}</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap gap-2">
								<Badge variant={isExpiredOrganizationInvitation(invitation) ? 'destructive' : 'secondary'}>
									{isExpiredOrganizationInvitation(invitation) ? 'Expired' : 'Pending'}
								</Badge>
								{#if isStaleOrganizationInvitation(invitation)}
									<Badge variant="outline">Stale</Badge>
								{/if}
								{#if isExpiringSoonOrganizationInvitation(invitation)}
									<Badge variant="outline">Expiring soon</Badge>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right text-sm text-muted-foreground">
							{formatSentAt(invitation.created_at)}
						</Table.Cell>
						<Table.Cell class="text-right text-sm text-muted-foreground">
							{formatSentAt(getOrganizationInvitationExpiresAt(invitation))}
						</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isBusy || !onResend}
									aria-label={`Resend invitation to ${getInvitationRecipient(invitation)}`}
									onclick={() => onResend?.(invitation)}
								>
									Resend
								</Button>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									disabled={isBusy || !onRevoke}
									aria-label={`Revoke invitation for ${getInvitationRecipient(invitation)}`}
									onclick={() => onRevoke?.(invitation)}
								>
									Revoke
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				<Table.Row class="border-0 hover:bg-transparent">
					<Table.Cell colspan={6} class="py-10 text-center">
						<div class="space-y-1">
							<p class="font-medium text-foreground">{emptyTitle}</p>
							<p class="text-sm text-muted-foreground">{emptyDescription}</p>
						</div>
					</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>
