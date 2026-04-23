<script lang="ts">
	import { TrendingUp, Users } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { getParticipantInitials, type MessageThread } from '$lib/models/messageModel';

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

	const spotlightThreads = $derived(threads.slice(0, 3));
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

	const signalRows = $derived.by(() => [
		{
			label: 'Broadcast reach',
			value: broadcastReachPercent,
			note:
				broadcastReachPercent >= 70
					? 'Broadcasts are landing well with the group.'
					: 'Broadcasts could use a second pass or a clearer send.'
		},
		{
			label: 'RSVP pace',
			value: eventResponsePercent,
			note:
				eventResponsePercent >= 70
					? 'Event responses are keeping pace with what is scheduled.'
					: 'Event follow-up may still be needed before the next run.'
		},
		{
			label: 'Inbox clear',
			value: inboxClearPercent,
			note:
				inboxClearPercent >= 70
					? 'Most direct conversations are already handled.'
					: 'The inbox still needs another reply round.'
		}
	]);

	function getMetricTone(value: number) {
		if (value >= 75) {
			return 'bg-primary';
		}

		if (value >= 45) {
			return 'bg-primary/70';
		}

		return 'bg-primary/40';
	}
</script>

	<section class="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)] xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)]">
	<Card.Root class="relative overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-muted/24 shadow-sm">
		<div class="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl"></div>
		<div class="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
		<Card.Content class="relative space-y-5 py-5 sm:py-6">
			<div class="space-y-1.5">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hub focus</p>
				<h2 class="max-w-2xl text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.04]">
					{attentionLabel}
				</h2>
				<p class="max-w-2xl text-sm leading-6 text-muted-foreground">
					{attentionSummary}
				</p>
			</div>

			<div class="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/88 shadow-sm">
				{#each decisionRows as row, index (row.label)}
					<div class={`flex items-start justify-between gap-4 px-4 py-3.5 ${index > 0 ? 'border-t border-border/50' : ''}`}>
						<div class="min-w-0">
							<p class="text-sm font-semibold text-foreground">{row.label}</p>
							<p class="mt-1 text-sm leading-5 text-muted-foreground">{row.summary}</p>
						</div>
						<p class="shrink-0 text-[1.75rem] font-semibold tracking-tight text-foreground">{row.value}</p>
					</div>
				{/each}
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
				<div class="space-y-1">
					<div class="flex items-center gap-2 text-foreground">
						<Users class="size-4 text-primary" />
						<p class="text-sm font-medium">{memberCountLabel}</p>
					</div>
					<p class="text-xs text-muted-foreground">
						{pendingInvites > 0
							? `${formatCount(pendingInvites, 'invite')} still need a follow-up.`
							: 'No pending invites are waiting right now.'}
					</p>
				</div>

				{#if spotlightThreads.length > 0}
					<div class="flex items-center gap-2.5">
						<div class="flex -space-x-2">
							{#each spotlightThreads as thread (thread.id)}
								<Avatar.Root class="size-9 border border-background bg-background shadow-sm after:hidden">
									{#if thread.participant.avatar_url}
										<Avatar.Image src={thread.participant.avatar_url} alt={thread.participant.name} />
									{:else}
										<Avatar.Fallback class="text-xs font-semibold text-foreground">
											{getParticipantInitials(thread.participant.name)}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>
							{/each}
						</div>
						<p class="text-xs text-muted-foreground">Recent inbox context</p>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-border/70 bg-card shadow-sm">
		<Card.Content class="space-y-4 py-5">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Signal check</p>
					<p class="mt-1 text-base font-semibold tracking-tight text-foreground">How things are moving</p>
				</div>
				<TrendingUp class="size-4 text-primary" />
			</div>

			<div class="space-y-4">
				{#each signalRows as row (row.label)}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-sm font-medium text-foreground">{row.label}</p>
								<p class="text-xs text-muted-foreground">{row.note}</p>
							</div>
							<span class="text-sm font-semibold text-foreground">{row.value}%</span>
						</div>
						<div class="h-2 rounded-full bg-primary/10">
							<div class={`h-2 rounded-full ${getMetricTone(row.value)}`} style:width={`${row.value}%`}></div>
						</div>
					</div>
				{/each}
			</div>

			<div class="rounded-[1.35rem] bg-muted/20 px-4 py-3.5">
				<p class="text-sm font-medium text-foreground">
					{unreadMessages > 0
						? `${formatCount(unreadMessages, 'conversation')} still need a reply.`
						: 'Messages are caught up for now.'}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{liveBroadcasts > 0 || upcomingEvents > 0
						? `${formatCount(liveBroadcasts, 'broadcast')} live and ${formatCount(upcomingEvents, 'upcoming event')} are still in motion.`
						: 'Nothing outside the normal schedule needs a second look right now.'}
				</p>
			</div>
		</Card.Content>
	</Card.Root>
</section>