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

	function formatSentAt(value: string | null | undefined) {
		if (!value) return '—';
		return new Date(value).toLocaleString();
	}
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Caption class="sr-only">Pending invitations for the current organization.</Table.Caption>
		<Table.Header>
			<Table.Row>
				<Table.Head>Recipient</Table.Head>
				<Table.Head>Channel</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head class="text-right">Sent</Table.Head>
			</Table.Row>
		</Table.Header>
	<Table.Body>
		{#if invitations.length > 0}
			{#each invitations as invitation (invitation.id)}
				<Table.Row>
					<Table.Cell class="font-medium">{formatRecipient(invitation)}</Table.Cell>
					<Table.Cell>{formatChannel(invitation)}</Table.Cell>
					<Table.Cell>
						<Badge variant={invitation.status === 'pending' ? 'secondary' : 'outline'}>
							{invitation.status}
						</Badge>
					</Table.Cell>
					<Table.Cell class="text-right text-muted-foreground">{formatSentAt(invitation.created_at)}</Table.Cell>
				</Table.Row>
			{/each}
		{:else}
			<Table.Row>
				<Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
					No pending invitations right now.
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
</div>
