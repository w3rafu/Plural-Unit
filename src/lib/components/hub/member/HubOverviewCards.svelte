<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { MessageThread } from '$lib/models/messageModel';

	let {
		memberCount = null as number | null,
		pendingInvites = 0,
		liveBroadcasts = 0,
		upcomingEvents = 0,
		unreadMessages = 0,
		unreadActivityItems = 0,
		broadcastReachPercent = 0,
		eventResponsePercent = 0,
		inboxClearPercent = 0,
		threads = [] as MessageThread[]
	} = $props();

	const memberCountLabel = $derived(
		memberCount === null ? 'Loading members' : `${memberCount} members`
	);

	function formatCount(count: number, singular: string, plural = `${singular}s`) {
		return `${count} ${count === 1 ? singular : plural}`;
	}

	const attentionLabel = $derived.by(() => {
		if (unreadActivityItems <= 0) {
			return 'Nothing urgent needs attention right now';
		}

		return `${formatCount(unreadActivityItems, 'item')} need attention today`;
	});

	const attentionSummary = $derived.by(() => {
		if (unreadMessages > 0) {
			return pendingInvites > 0
				? `${formatCount(unreadMessages, 'conversation')} still need a reply and ${formatCount(pendingInvites, 'invite')} still need follow-up.`
				: `${formatCount(unreadMessages, 'conversation')} still need a reply before the hub is fully caught up.`;
		}

		if (pendingInvites > 0) {
			return `${formatCount(pendingInvites, 'invite')} still need follow-up before everyone is fully in the loop.`;
		}

		if (liveBroadcasts > 0 || upcomingEvents > 0) {
			return `${formatCount(liveBroadcasts, 'live broadcast')} and ${formatCount(upcomingEvents, 'upcoming event')} are the main things to watch next.`;
		}

		return 'Messages, invites, and upcoming work are all moving normally.';
	});

	const decisionRows = $derived.by(() => [
		{
			label: 'Inbox',
			value: unreadMessages,
			summary:
				unreadMessages > 0
					? `${formatCount(unreadMessages, 'conversation')} still need a reply.`
					: `Inbox is ${inboxClearPercent}% clear right now.`
		},
		{
			label: 'People',
			value: pendingInvites,
			summary:
				pendingInvites > 0
					? `${formatCount(pendingInvites, 'invite')} still need a follow-up.`
					: memberCount === null
						? 'Member roster is still loading.'
						: `${memberCountLabel} already have the latest context.`
		},
		{
			label: 'Programs',
			value: liveBroadcasts + upcomingEvents,
			summary:
				liveBroadcasts > 0 || upcomingEvents > 0
					? `${formatCount(liveBroadcasts, 'live broadcast')} and ${formatCount(upcomingEvents, 'upcoming event')} are currently in motion.`
					: 'No broadcasts or events need active monitoring right now.'
		}
	]);

</script>

	<section>
	<Card.Root class="relative overflow-hidden border-border/70 bg-linear-to-br from-card via-background to-primary/5.5 shadow-sm">
		<div class="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-primary/14 blur-3xl"></div>
		<div class="pointer-events-none absolute left-8 top-10 h-28 w-28 rounded-full bg-primary/6 blur-3xl"></div>
		<div class="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
		<Card.Content class="relative space-y-2 py-2.75 sm:py-3">
			<div class="space-y-1">
				<p class="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hub focus</p>
				<h2 class="max-w-2xl text-[1.54rem] font-semibold tracking-tight text-foreground sm:text-[1.78rem] sm:leading-[1.02]">
					{attentionLabel}
				</h2>
				<p class="max-w-2xl text-[0.82rem] leading-5.25 text-muted-foreground">
					{attentionSummary}
				</p>
			</div>

			<div class="grid gap-1.5 md:grid-cols-3">
				{#each decisionRows as row (row.label)}
					<div class="rounded-2xl border border-border/70 bg-background/88 px-2.75 py-2 shadow-sm">
						<div class="flex items-start justify-between gap-3">
							<p class="text-[0.82rem] font-semibold text-foreground">{row.label}</p>
							<p class="shrink-0 text-[1.22rem] leading-none font-semibold tracking-tight text-foreground">{row.value}</p>
						</div>
						<p class="mt-0.75 text-[0.84rem] leading-4.5 text-muted-foreground">{row.summary}</p>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</section>