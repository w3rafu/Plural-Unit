<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import type { OrganizationInvitation } from '$lib/models/organizationModel';

	type Props = {
		invitations: OrganizationInvitation[];
	};

	let { invitations }: Props = $props();

	function formatRecipient(invitation: OrganizationInvitation) {
		return invitation.email ?? invitation.phone ?? 'Unknown';
	}

	function formatChannel(invitation: OrganizationInvitation) {
		return invitation.email ? 'Email' : 'Phone';
	}

	function formatStatusLabel(invitation: OrganizationInvitation) {
		switch (invitation.status) {
			case 'pending':
				return 'Pending';
			case 'accepted':
				return 'Accepted';
			case 'revoked':
				return 'Revoked';
			case 'expired':
				return 'Expired';
			default:
				return invitation.status;
		}
	}

	function formatSentAt(value: string | null | undefined) {
		if (!value) return '—';
		return new Date(value).toLocaleString([], {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="overflow-hidden rounded-xl border border-border/70 bg-muted/10">
	<Table.Root class="min-w-[38rem]">
		<Table.Caption class="sr-only">Pending invitations for the current organization.</Table.Caption>
		<Table.Header class="bg-muted/25">
			<Table.Row>
				<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Recipient</Table.Head>
				<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Channel</Table.Head>
				<Table.Head class="h-12 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</Table.Head>
				<Table.Head class="h-12 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Sent</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if invitations.length > 0}
				{#each invitations as invitation (invitation.id)}
					<Table.Row class="border-border/70">
						<Table.Cell class="whitespace-normal">
							<div class="space-y-1">
								<p class="font-medium text-foreground">{formatRecipient(invitation)}</p>
								<p class="text-xs text-muted-foreground">
									Delivered by {formatChannel(invitation).toLowerCase()}
								</p>
							</div>
						</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">{formatChannel(invitation)}</Table.Cell>
						<Table.Cell>
							<Badge variant={invitation.status === 'pending' ? 'secondary' : 'outline'}>
								{formatStatusLabel(invitation)}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-right text-sm text-muted-foreground">
							{formatSentAt(invitation.created_at)}
						</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				<Table.Row class="border-0 hover:bg-transparent">
					<Table.Cell colspan={4} class="py-10 text-center">
						<div class="space-y-1">
							<p class="font-medium text-foreground">No pending invitations</p>
							<p class="text-sm text-muted-foreground">
								Send an invite above when you are ready to bring in another member.
							</p>
						</div>
					</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>
