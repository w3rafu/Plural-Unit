<script lang="ts">
	import { TrendingUp, Users } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import ActivityDotGrid from '$lib/components/ui/ActivityDotGrid.svelte';
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
	const spotlightPeople = $derived.by(() =>
		spotlightThreads.map((thread) => ({
			id: thread.id,
			name: thread.participant.name,
			subtitle: thread.participant.subtitle || 'Direct conversation',
			avatarUrl: thread.participant.avatar_url,
			note:
				thread.unreadCount > 0
					? `${formatCount(thread.unreadCount, 'message')} unread`
					: 'Caught up'
		}))
	);

	function formatCount(count: number, singular: string, plural = `${singular}s`) {
		return `${count} ${count === 1 ? singular : plural}`;
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function buildActivityCells(seedValues: number[], offset: number) {
		return Array.from({ length: 28 }, (_, index) => {
			const base = seedValues[index % seedValues.length] ?? 0;
			const bucket = clamp(Math.round(base / 25), 0, 4);
			const wave = index % 7 >= 4 ? 1 : 0;
			const pulse = (index + offset) % 6 === 0 ? 1 : 0;
			const dip = (index + offset) % 5 === 0 ? 1 : 0;
			return clamp(bucket + wave + pulse - dip, 0, 4);
		});
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
	const activityGridValues = $derived(
		buildActivityCells(
			[
				broadcastReachPercent,
				eventResponsePercent,
				inboxClearPercent,
				unreadActivityItems * 16,
				Math.max(20, 100 - unreadMessages * 14)
			],
			unreadMessages + pendingInvites + unreadActivityItems
		)
	);
	const activityCaption = $derived.by(() => {
		if (unreadActivityItems > 0 || unreadMessages > 0) {
			return 'Recent replies, event follow-up, and broadcast movement across the hub.';
		}

		return 'Recent hub activity is steady even though nothing urgent needs review.';
	});

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

	<section class="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.82fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.8fr)]">
	<Card.Root class="relative overflow-hidden border-border/70 bg-linear-to-br from-card via-background to-primary/[0.035] shadow-sm">
		<div class="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-primary/14 blur-3xl"></div>
		<div class="pointer-events-none absolute left-8 top-10 h-28 w-28 rounded-full bg-primary/6 blur-3xl"></div>
		<div class="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
		<Card.Content class="relative space-y-5 py-5 sm:py-6">
			<div class="space-y-1.5">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hub focus</p>
				<h2 class="max-w-2xl text-[1.78rem] font-semibold tracking-tight text-foreground sm:text-[2.15rem] sm:leading-[1.02]">
					{attentionLabel}
				</h2>
				<p class="max-w-2xl text-sm leading-6 text-muted-foreground">
					{attentionSummary}
				</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each decisionRows as row (row.label)}
					<div class="rounded-[1.2rem] border border-border/70 bg-background/88 px-4 py-3 shadow-sm">
						<div class="flex items-start justify-between gap-3">
							<p class="text-sm font-semibold text-foreground">{row.label}</p>
							<p class="shrink-0 text-[1.65rem] leading-none font-semibold tracking-tight text-foreground">{row.value}</p>
						</div>
						<p class="mt-2 text-[0.84rem] leading-5 text-muted-foreground">{row.summary}</p>
					</div>
				{/each}
			</div>

			<div class="grid gap-3 border-t border-border/60 pt-3.5 2xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:items-start">
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

				{#if spotlightPeople.length > 0}
					<div class="rounded-[1.25rem] border border-border/70 bg-background/82 p-3 shadow-sm">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">People in motion</p>
						<div class="mt-2.5 space-y-2.5">
							{#each spotlightPeople as person (person.id)}
								<div class="flex items-center gap-3">
									<Avatar.Root class="size-10 border border-background bg-background shadow-sm after:hidden">
										{#if person.avatarUrl}
											<Avatar.Image src={person.avatarUrl} alt={person.name} />
										{:else}
											<Avatar.Fallback class="text-xs font-semibold text-foreground">
												{getParticipantInitials(person.name)}
											</Avatar.Fallback>
										{/if}
									</Avatar.Root>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-foreground">{person.name}</p>
										<p class="truncate text-xs text-muted-foreground">{person.subtitle}</p>
									</div>
									<p class="text-[0.65rem] font-medium text-muted-foreground">{person.note}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-border/70 bg-card shadow-sm">
		<Card.Content class="space-y-3.5 py-4.5">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Signal check</p>
					<p class="mt-1 text-base font-semibold tracking-tight text-foreground">How things are moving</p>
				</div>
				<TrendingUp class="size-4 text-primary" />
			</div>

			<div class="space-y-3">
				{#each signalRows as row (row.label)}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-sm font-medium text-foreground">{row.label}</p>
								<p class="text-[0.78rem] leading-5 text-muted-foreground">{row.note}</p>
							</div>
							<span class="text-sm font-semibold text-foreground">{row.value}%</span>
						</div>
						<div class="h-2 rounded-full bg-primary/10">
							<div class={`h-2 rounded-full ${getMetricTone(row.value)}`} style:width={`${row.value}%`}></div>
						</div>
					</div>
				{/each}
			</div>

			<ActivityDotGrid title="Activity cadence" caption={activityCaption} values={activityGridValues} />

			<div class="rounded-[1.2rem] bg-muted/20 px-3.5 py-3">
				<p class="text-sm font-medium text-foreground">
					{unreadMessages > 0
						? `${formatCount(unreadMessages, 'conversation')} still need a reply.`
						: 'Messages are caught up for now.'}
				</p>
				<p class="mt-1 text-[0.78rem] leading-5 text-muted-foreground">
					{liveBroadcasts > 0 || upcomingEvents > 0
						? `${formatCount(liveBroadcasts, 'broadcast')} live and ${formatCount(upcomingEvents, 'upcoming event')} are still in motion.`
						: 'Nothing outside the normal schedule needs a second look right now.'}
				</p>
			</div>
		</Card.Content>
	</Card.Root>
</section>