<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		buildMemberCommitments,
		type MemberCommitmentAttendanceLookup,
		type MemberCommitmentResponseLookup
	} from '$lib/models/memberCommitmentModel';
	import { EVENT_RESPONSE_OPTIONS } from '$lib/models/eventResponseModel';
	import type { HubNotificationItem } from '$lib/models/hubNotifications';
	import type { EventResponseStatus, EventRow } from '$lib/repositories/hubRepository';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let {
		events = undefined as EventRow[] | undefined,
		ownResponses = undefined as MemberCommitmentResponseLookup | undefined,
		ownAttendance = undefined as MemberCommitmentAttendanceLookup | undefined,
		notifications = undefined as HubNotificationItem[] | undefined,
		responseTargetId = undefined as string | undefined,
		onRespond = undefined as
			| ((eventId: string, response: EventResponseStatus) => Promise<void> | void)
			| undefined,
		eventHref = '#hub-events'
	} = $props();

	const resolvedEvents = $derived(events ?? currentHub.events);
	const resolvedOwnResponses = $derived.by(() => {
		if (ownResponses) {
			return ownResponses;
		}

		if (events !== undefined) {
			return {};
		}

		return Object.fromEntries(
			resolvedEvents.map((event) => [event.id, currentHub.getOwnEventResponse(event.id)])
		) satisfies MemberCommitmentResponseLookup;
	});
	const resolvedOwnAttendance = $derived.by(() => {
		if (ownAttendance) {
			return ownAttendance;
		}

		if (events !== undefined) {
			return {};
		}

		return Object.fromEntries(
			resolvedEvents.map((event) => [event.id, currentHub.getOwnEventAttendance(event.id)])
		) satisfies MemberCommitmentAttendanceLookup;
	});
	const resolvedNotifications = $derived.by(() => {
		if (notifications) {
			return notifications;
		}

		return events === undefined ? currentHub.allActivityFeed : [];
	});
	const resolvedResponseTargetId = $derived(responseTargetId ?? currentHub.eventResponseTargetId);
	const commitments = $derived(
		buildMemberCommitments({
			events: resolvedEvents,
			ownResponses: resolvedOwnResponses,
			ownAttendance: resolvedOwnAttendance,
			notifications: resolvedNotifications
		})
	);
	const replyPreview = $derived(commitments.replyNeeded.slice(0, 2));
	const todayPreview = $derived(commitments.today.slice(0, 2));
	const recentPreview = $derived(commitments.recent.slice(0, 2));
	const upcomingPreview = $derived(commitments.upcoming.slice(0, 3));

	function getStatusVariant(
		status: 'reply_needed' | 'going' | 'maybe' | 'cannot_attend' | 'attended' | 'absent'
	) {
		if (status === 'reply_needed' || status === 'absent') {
			return 'destructive';
		}

		return status === 'going' || status === 'attended' ? 'secondary' : 'outline';
	}

	function getTimingVariant(timingState: 'upcoming' | 'today' | 'in_progress' | 'recently_completed') {
		if (timingState === 'in_progress') {
			return 'secondary';
		}

		return 'outline';
	}

	async function handleRespond(eventId: string, response: EventResponseStatus) {
		try {
			if (onRespond) {
				await onRespond(eventId, response);
				return;
			}

			await currentHub.setEventResponse(eventId, response);
		} catch (error) {
			toast({
				title: 'Could not save response',
				description:
					error instanceof Error
						? error.message
						: 'The event response could not be updated.',
				variant: 'error'
			});
		}
	}
</script>

<Card.Root size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-3 border-b border-border/70">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<Card.Title class="text-lg font-semibold tracking-tight">Your commitments</Card.Title>
				<Card.Description>
					See what still needs a reply, what is happening today, and what just wrapped.
				</Card.Description>
			</div>

			<div class="flex flex-wrap gap-2">
				<Badge variant={commitments.replyNeededCount > 0 ? 'destructive' : 'outline'}>
					{commitments.replyNeededCount} reply needed
				</Badge>
				<Badge variant={commitments.todayCount > 0 ? 'secondary' : 'outline'}>
					{commitments.todayCount} today
				</Badge>
				<Badge variant={commitments.recentCount > 0 ? 'outline' : 'ghost'}>
					{commitments.recentCount} recent
				</Badge>
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if commitments.all.length === 0}
			<div class="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5">
				<p class="font-medium text-foreground">No commitments yet</p>
				<p class="mt-1 text-sm text-muted-foreground">
					When new events go live, this card will track replies, day-of items, and recent outcomes.
				</p>
			</div>
		{:else}
			{#if replyPreview.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Reply needed</h3>
						<p class="text-sm text-muted-foreground">
							Lock in the events that still need your answer before the roster hardens.
						</p>
					</div>

					<div class="space-y-3">
						{#each replyPreview as item (item.eventId)}
							<div class="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0 space-y-1">
										<p class="truncate text-sm font-semibold text-foreground">{item.title}</p>
										<p class="text-[0.82rem] text-muted-foreground">
											{item.startsAtLabel}
											{#if item.locationLabel}
												· {item.locationLabel}
											{/if}
										</p>
									</div>

									<div class="flex flex-wrap gap-2">
										<Badge variant={getStatusVariant(item.status)}>{item.statusLabel}</Badge>
										{#if item.isToday || item.isInProgress}
											<Badge variant={getTimingVariant(item.timingState)}>{item.timingLabel}</Badge>
										{:else if item.isStartingSoon}
											<Badge variant="outline">Starts soon</Badge>
										{/if}
										{#if item.hasUnreadReminder}
											<Badge variant="outline">Unread reminder</Badge>
										{/if}
									</div>
								</div>

								<p class="mt-3 text-sm text-muted-foreground">{item.statusCopy}</p>
								<p class="mt-1 text-[0.84rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
									{item.timingCopy}
								</p>
								{#if item.reminderCopy}
									<p class="mt-1 text-[0.82rem] text-muted-foreground">{item.reminderCopy}</p>
								{/if}

								<div class="mt-3 flex flex-wrap gap-1.5 border-t border-border/70 pt-3">
									{#each EVENT_RESPONSE_OPTIONS as option (option.value)}
										<Button
											type="button"
											size="xs"
											variant="outline"
											disabled={resolvedResponseTargetId === item.eventId}
											onclick={() => handleRespond(item.eventId, option.value)}
										>
											{option.label}
										</Button>
									{/each}
								</div>
							</div>
						{/each}
					</div>

					{#if commitments.replyNeededCount > replyPreview.length}
						<p class="text-[0.82rem] text-muted-foreground">
							+{commitments.replyNeededCount - replyPreview.length} more event{commitments.replyNeededCount - replyPreview.length === 1 ? '' : 's'} still need a reply below.
						</p>
					{/if}
				</div>
			{/if}

			{#if todayPreview.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Today and in progress</h3>
						<p class="text-sm text-muted-foreground">
							Keep an eye on what is happening now and what still lands later today.
						</p>
					</div>

					<div class="space-y-3">
						{#each todayPreview as item (item.eventId)}
							<div class="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0 space-y-1">
										<p class="truncate text-sm font-semibold text-foreground">{item.title}</p>
										<p class="text-[0.82rem] text-muted-foreground">
											{item.startsAtLabel}
											{#if item.locationLabel}
												· {item.locationLabel}
											{/if}
										</p>
									</div>

									<div class="flex flex-wrap gap-2">
										<Badge variant={getStatusVariant(item.status)}>{item.statusLabel}</Badge>
										<Badge variant={getTimingVariant(item.timingState)}>{item.timingLabel}</Badge>
										{#if item.hasUnreadReminder}
											<Badge variant="outline">Unread reminder</Badge>
										{:else if item.hasReminder}
											<Badge variant="ghost">Reminder sent</Badge>
										{/if}
									</div>
								</div>

								<p class="mt-3 text-sm text-muted-foreground">{item.statusCopy}</p>
								{#if item.reminderCopy}
									<p class="mt-1 text-[0.82rem] text-muted-foreground">{item.reminderCopy}</p>
								{/if}
								<p class="mt-3 text-[0.84rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
									{item.timingCopy}
								</p>
							</div>
						{/each}
					</div>

					{#if commitments.todayCount > todayPreview.length}
						<p class="text-[0.82rem] text-muted-foreground">
							+{commitments.todayCount - todayPreview.length} more day-of item{commitments.todayCount - todayPreview.length === 1 ? '' : 's'} appear in the events list below.
						</p>
					{/if}
				</div>
			{/if}

			{#if recentPreview.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Recently completed</h3>
						<p class="text-sm text-muted-foreground">
							Keep a short record of the events you answered and what happened next.
						</p>
					</div>

					<div class="space-y-3">
						{#each recentPreview as item (item.eventId)}
							<div class="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0 space-y-1">
										<p class="truncate text-sm font-semibold text-foreground">{item.title}</p>
										<p class="text-[0.82rem] text-muted-foreground">
											{item.startsAtLabel}
											{#if item.locationLabel}
												· {item.locationLabel}
											{/if}
										</p>
									</div>

									<div class="flex flex-wrap gap-2">
										<Badge variant={getStatusVariant(item.status)}>{item.statusLabel}</Badge>
										<Badge variant={getTimingVariant(item.timingState)}>{item.timingLabel}</Badge>
									</div>
								</div>

								<p class="mt-3 text-sm text-muted-foreground">{item.statusCopy}</p>
								<p class="mt-3 text-[0.84rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
									{item.timingCopy}
								</p>
							</div>
						{/each}
					</div>

					{#if commitments.recentCount > recentPreview.length}
						<p class="text-[0.82rem] text-muted-foreground">
							+{commitments.recentCount - recentPreview.length} more recent event{commitments.recentCount - recentPreview.length === 1 ? '' : 's'} appear below.
						</p>
					{/if}
				</div>
			{/if}

			{#if upcomingPreview.length > 0}
				<div class="space-y-3">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold tracking-tight text-foreground">Next up</h3>
						<p class="text-sm text-muted-foreground">
							Keep an eye on the later events you already plan to attend.
						</p>
					</div>

					<div class="space-y-3">
						{#each upcomingPreview as item (item.eventId)}
							<div class="rounded-2xl border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0 space-y-1">
										<p class="truncate text-sm font-semibold text-foreground">{item.title}</p>
										<p class="text-[0.82rem] text-muted-foreground">
											{item.startsAtLabel}
											{#if item.locationLabel}
												· {item.locationLabel}
											{/if}
										</p>
									</div>

									<div class="flex flex-wrap gap-2">
										<Badge variant={getStatusVariant(item.status)}>{item.statusLabel}</Badge>
										{#if item.isStartingSoon}
											<Badge variant="outline">Starts soon</Badge>
										{/if}
										{#if item.hasUnreadReminder}
											<Badge variant="outline">Unread reminder</Badge>
										{:else if item.hasReminder}
											<Badge variant="ghost">Reminder sent</Badge>
										{/if}
									</div>
								</div>

								<p class="mt-3 text-sm text-muted-foreground">{item.statusCopy}</p>
								{#if item.reminderCopy}
									<p class="mt-1 text-[0.82rem] text-muted-foreground">{item.reminderCopy}</p>
								{/if}
								<p class="mt-3 text-[0.84rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
									{item.timingCopy}
								</p>
							</div>
						{/each}
					</div>

					{#if commitments.upcomingCount > upcomingPreview.length}
						<p class="text-[0.82rem] text-muted-foreground">
							+{commitments.upcomingCount - upcomingPreview.length} more commitment{commitments.upcomingCount - upcomingPreview.length === 1 ? '' : 's'} appear in the events list below.
						</p>
					{/if}
				</div>
			{/if}

			<div class="flex justify-end border-t border-border/70 pt-4">
				<Button href={eventHref} variant="outline" size="sm">Review all events</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>