<script lang="ts">
	import { CalendarDays, Megaphone, MessageCircleMore, TrendingUp, Users } from '@lucide/svelte';
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
	const updateSummary = $derived.by(() => {
		if (unreadActivityItems <= 0) {
			return 'Everything looks calm right now.';
		}

		if (unreadActivityItems === 1) {
			return '1 fresh update is waiting across the hub.';
		}

		return `${unreadActivityItems} fresh updates are waiting across the hub.`;
	});
	const attentionSummary = $derived.by(() => {
		const parts = [
			`${liveBroadcasts} live broadcast${liveBroadcasts === 1 ? '' : 's'}`,
			`${upcomingEvents} upcoming event${upcomingEvents === 1 ? '' : 's'}`,
			`${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`
		];

		return parts.join(' · ');
	});
	const signalBars = $derived.by(() => {
		const values = [
			broadcastReachPercent * 0.72,
			eventResponsePercent * 0.55,
			inboxClearPercent * 0.8,
			(broadcastReachPercent + eventResponsePercent) / 2,
			(eventResponsePercent + inboxClearPercent) / 2,
			(broadcastReachPercent + inboxClearPercent) / 2
		];

		return values.map((value) => Math.max(18, Math.min(100, Math.round(value || 22))));
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

	<section class="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.95fr)] xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.9fr)]">
	<Card.Root class="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/12 via-card via-55% to-background shadow-sm">
		<div class="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl"></div>
		<div class="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
		<Card.Content class="relative space-y-6 py-6">
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<p class="rounded-full border border-primary/20 bg-background/80 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
						Weekly pulse
						</p>
						<p class="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							{memberCountLabel}
						</p>
					</div>
					<h2 class="max-w-2xl text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.02]">
						One place to see what needs attention
					</h2>
					<p class="max-w-xl text-sm text-muted-foreground">
						{updateSummary}
					</p>
				</div>

				<div class="hidden rounded-[1.35rem] border border-primary/20 bg-background/85 px-3 py-2 text-primary shadow-sm sm:flex sm:flex-col sm:items-start sm:gap-1.5">
					<TrendingUp class="size-5" />
					<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-primary/80">Signals live</p>
				</div>
			</div>

			<div class="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
				<div class="rounded-[1.8rem] border border-primary/20 bg-background/90 px-4 py-4 shadow-sm">
					<div class="flex items-start justify-between gap-4">
						<div class="space-y-2">
							<p class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/90">Fresh updates</p>
							<p class="text-5xl font-semibold tracking-[-0.06em] text-foreground sm:text-[3.4rem]">{unreadActivityItems}</p>
							<p class="max-w-sm text-sm text-muted-foreground">
								{attentionSummary}
							</p>
						</div>
						<div class="rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-right shadow-sm">
							<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-primary/90">Inbox clear</p>
							<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{inboxClearPercent}%</p>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap gap-2 text-[0.72rem] font-medium text-muted-foreground">
						<span class="rounded-full border border-border/70 bg-background/80 px-2.5 py-1">Broadcast reach {broadcastReachPercent}%</span>
						<span class="rounded-full border border-border/70 bg-background/80 px-2.5 py-1">RSVP pace {eventResponsePercent}%</span>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
					<div class="rounded-2xl border border-primary/15 bg-background/80 p-3 shadow-sm">
					<div class="flex items-center gap-2 text-primary">
						<Megaphone class="size-4" />
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">Broadcasts</p>
					</div>
					<p class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{liveBroadcasts}</p>
					<p class="mt-1 text-xs text-muted-foreground">Live now</p>
				</div>

				<div class="rounded-2xl border border-primary/15 bg-background/80 p-3 shadow-sm">
					<div class="flex items-center gap-2 text-primary">
						<CalendarDays class="size-4" />
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">Events</p>
					</div>
					<p class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{upcomingEvents}</p>
					<p class="mt-1 text-xs text-muted-foreground">Upcoming</p>
				</div>

				<div class="rounded-2xl border border-primary/15 bg-background/80 p-3 shadow-sm">
					<div class="flex items-center gap-2 text-primary">
						<MessageCircleMore class="size-4" />
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">Inbox</p>
					</div>
					<p class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{unreadMessages}</p>
					<p class="mt-1 text-xs text-muted-foreground">Unread messages</p>
				</div>
			</div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-primary/12 bg-linear-to-r from-background/85 to-muted/22 px-4 py-3.5 shadow-sm">
				<div class="space-y-1">
					<div class="flex items-center gap-2 text-primary">
						<Users class="size-4" />
						<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">Conversation spotlight</p>
					</div>
					<p class="text-sm font-medium text-foreground">{memberCountLabel}</p>
					<p class="text-xs text-muted-foreground">
						{pendingInvites > 0 ? `${pendingInvites} pending invites to follow up.` : 'No pending invites right now.'}
					</p>
				</div>

				{#if spotlightThreads.length > 0}
					<div class="flex items-center gap-2">
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
						<p class="text-xs text-muted-foreground">Recent threads</p>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-primary/12 bg-linear-to-br from-card via-card to-muted/18 shadow-sm">
		<Card.Content class="space-y-4 py-5">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary/85">Progress</p>
					<p class="mt-1 text-base font-semibold tracking-tight text-foreground">Signals across the app</p>
				</div>
				<TrendingUp class="size-4 text-primary" />
			</div>

			<div class="space-y-3">
				<div class="space-y-1.5">
					<div class="flex items-center justify-between gap-3 text-xs">
						<span class="font-medium text-foreground">Broadcast reach</span>
						<span class="font-semibold text-primary">{broadcastReachPercent}%</span>
					</div>
					<div class="h-2 rounded-full bg-primary/10">
						<div class={`h-2 rounded-full ${getMetricTone(broadcastReachPercent)}`} style:width={`${broadcastReachPercent}%`}></div>
					</div>
				</div>

				<div class="space-y-1.5">
					<div class="flex items-center justify-between gap-3 text-xs">
						<span class="font-medium text-foreground">RSVP pace</span>
						<span class="font-semibold text-primary">{eventResponsePercent}%</span>
					</div>
					<div class="h-2 rounded-full bg-primary/10">
						<div class={`h-2 rounded-full ${getMetricTone(eventResponsePercent)}`} style:width={`${eventResponsePercent}%`}></div>
					</div>
				</div>

				<div class="space-y-1.5">
					<div class="flex items-center justify-between gap-3 text-xs">
						<span class="font-medium text-foreground">Inbox clear</span>
						<span class="font-semibold text-primary">{inboxClearPercent}%</span>
					</div>
					<div class="h-2 rounded-full bg-primary/10">
						<div class={`h-2 rounded-full ${getMetricTone(inboxClearPercent)}`} style:width={`${inboxClearPercent}%`}></div>
					</div>
				</div>
			</div>

			<div class="rounded-[1.55rem] border border-primary/10 bg-linear-to-br from-background/90 to-muted/25 px-4 py-4 shadow-sm">
				<div class="flex items-end gap-1.5">
					{#each signalBars as height, index (`signal-${index}`)}
						<div class="flex h-16 flex-1 items-end">
							<span
								class={`w-full rounded-full ${index > 3 ? 'bg-primary/35' : index % 2 === 0 ? 'bg-primary' : 'bg-primary/65'}`}
								style:height={`${height}%`}
							></span>
						</div>
					{/each}
				</div>
				<p class="mt-3 text-xs text-muted-foreground">
					A quick read on member attention, response momentum, and conversation flow.
				</p>
			</div>
		</Card.Content>
	</Card.Root>
</section>