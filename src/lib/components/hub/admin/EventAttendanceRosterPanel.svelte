<script lang="ts">
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		formatEventAttendanceOutcomeSummary,
		getEventAttendanceRosterSummaryCopy,
		isEventAttendanceWindowOpen
	} from '$lib/models/eventAttendanceModel';
	import { getEventResponseLabel } from '$lib/models/eventResponseModel';
	import type { EventAttendanceStatus, EventRow } from '$lib/repositories/hubRepository';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { formatShortDateTime } from '$lib/utils/dateFormat';

	let { event }: { event: EventRow } = $props();

	let openingConversationForProfileId = $state('');
	let attendanceActionTargetId = $state('');
	let attendanceActionLabel = $state('');
	const attendanceRoster = $derived(currentHub.getEventAttendanceRoster(event.id));
	const attendanceOutcomeSummary = $derived(currentHub.getEventAttendanceOutcomeSummary(event.id));
	const isAttendanceWindowVisible = $derived.by(() => isEventAttendanceWindowOpen(event));
	const isUpdatingAttendance = $derived(currentHub.eventAttendanceTargetId !== '');
	const attendanceMutationStatus = $derived.by(() => {
		if (!attendanceActionTargetId || !attendanceRoster) {
			return '';
		}

		const profileId = attendanceActionTargetId.split(':')[1] ?? '';
		const entry = [...attendanceRoster.pendingEntries, ...attendanceRoster.recordedEntries].find(
			(item) => item.member.profile_id === profileId
		);
		const memberName = entry?.member.name?.trim() || 'member';
		return `${attendanceActionLabel} ${memberName}...`;
	});

	function getTargetId(profileId: string) {
		return `${event.id}:${profileId}`;
	}

	function getResponseBadgeVariant(response: string | null) {
		return response === 'going' ? 'secondary' : 'outline';
	}

	function getAttendanceBadgeVariant(status: EventAttendanceStatus) {
		return status === 'attended' ? 'secondary' : 'destructive';
	}

	async function messageProfile(profileId: string) {
		openingConversationForProfileId = profileId;

		try {
			await currentMessages.openConversationForProfile(profileId, currentUser.details.id);
			void goto('/messages');
		} catch (error) {
			toast({
				title: 'Could not open conversation',
				description:
					error instanceof Error ? error.message : 'Failed to start the message thread.',
				variant: 'error'
			});
		} finally {
			openingConversationForProfileId = '';
		}
	}

	async function setAttendance(profileId: string, status: EventAttendanceStatus) {
		const targetId = getTargetId(profileId);
		attendanceActionTargetId = targetId;
		attendanceActionLabel = status === 'attended' ? 'Recording attendance for' : 'Marking absent';

		try {
			await currentHub.setEventAttendance(event.id, profileId, status);
		} catch (error) {
			toast({
				title: 'Could not save attendance',
				description:
					error instanceof Error ? error.message : 'Failed to record attendance for this member.',
				variant: 'error'
			});
		} finally {
			if (attendanceActionTargetId === targetId) {
				attendanceActionTargetId = '';
				attendanceActionLabel = '';
			}
		}
	}

	async function clearAttendance(profileId: string) {
		const targetId = getTargetId(profileId);
		attendanceActionTargetId = targetId;
		attendanceActionLabel = 'Clearing attendance for';

		try {
			await currentHub.clearEventAttendance(event.id, profileId);
		} catch (error) {
			toast({
				title: 'Could not clear attendance',
				description:
					error instanceof Error ? error.message : 'Failed to clear the saved attendance status.',
				variant: 'error'
			});
		} finally {
			if (attendanceActionTargetId === targetId) {
				attendanceActionTargetId = '';
				attendanceActionLabel = '';
			}
		}
	}
</script>

{#if isAttendanceWindowVisible && attendanceRoster}
	<div class="mt-1 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm" aria-busy={isUpdatingAttendance}>
		<div class="space-y-1">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Day-of attendance
			</p>
			<p class="text-xs text-muted-foreground">
				{getEventAttendanceRosterSummaryCopy(attendanceRoster)}
			</p>
			{#if attendanceOutcomeSummary.recorded > 0}
				<p class="text-xs text-muted-foreground">
					{formatEventAttendanceOutcomeSummary(attendanceOutcomeSummary)} · {attendanceOutcomeSummary.recorded}
					recorded.
				</p>
			{/if}
			{#if isUpdatingAttendance && attendanceMutationStatus}
				<p
					role="status"
					aria-live="polite"
					class="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
				>
					{attendanceMutationStatus}
				</p>
			{/if}
		</div>

		<div class="space-y-2">
			<p class="text-xs font-medium text-foreground">Needs attendance update</p>
			{#if attendanceRoster.pendingEntries.length === 0}
				<p class="text-xs text-muted-foreground">
					No expected attendees still need a day-of decision.
				</p>
			{:else}
				<div class="space-y-2">
					{#each attendanceRoster.pendingEntries.slice(0, 4) as entry (entry.member.profile_id)}
						{@const targetId = getTargetId(entry.member.profile_id)}
						<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
							<div class="min-w-0 flex-1 space-y-0.5">
								<div class="flex flex-wrap items-center gap-2">
									<p class="truncate text-sm font-medium text-foreground">
										{entry.member.name || 'Unnamed member'}
									</p>
									{#if entry.response}
										<Badge variant={getResponseBadgeVariant(entry.response)}>
											{getEventResponseLabel(entry.response)}
										</Badge>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">
									{entry.responseUpdatedAt
										? `Latest RSVP ${formatShortDateTime(entry.responseUpdatedAt)}.`
										: 'Expected attendee from saved RSVP state.'}
								</p>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									variant="secondary"
									size="xs"
									disabled={currentHub.eventAttendanceTargetId === targetId}
									onclick={() => setAttendance(entry.member.profile_id, 'attended')}
								>
									{currentHub.eventAttendanceTargetId === targetId ? 'Recording...' : 'Attended'}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="xs"
									disabled={currentHub.eventAttendanceTargetId === targetId}
									onclick={() => setAttendance(entry.member.profile_id, 'absent')}
								>
									{currentHub.eventAttendanceTargetId === targetId ? 'Recording...' : 'Absent'}
								</Button>
								{#if !entry.isCurrentUser}
									<Button
										type="button"
										variant="ghost"
										size="xs"
										disabled={openingConversationForProfileId === entry.member.profile_id}
										onclick={() => messageProfile(entry.member.profile_id)}
									>
										{openingConversationForProfileId === entry.member.profile_id ? 'Opening...' : 'Message'}
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				{#if attendanceRoster.pendingEntries.length > 4}
					<p class="text-xs text-muted-foreground">
						+{attendanceRoster.pendingEntries.length - 4} more expected attendee{attendanceRoster.pendingEntries.length - 4 === 1 ? '' : 's'} still need a day-of decision.
					</p>
				{/if}
			{/if}
		</div>

		{#if attendanceRoster.recordedEntries.length > 0}
			<div class="space-y-2">
				<p class="text-xs font-medium text-foreground">Recorded</p>
				<div class="space-y-2">
					{#each attendanceRoster.recordedEntries.slice(0, 4) as entry (entry.member.profile_id)}
						{@const targetId = getTargetId(entry.member.profile_id)}
						<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
							<div class="min-w-0 flex-1 space-y-0.5">
								<div class="flex flex-wrap items-center gap-2">
									<p class="truncate text-sm font-medium text-foreground">
										{entry.member.name || 'Unnamed member'}
									</p>
									{#if entry.response}
										<Badge variant={getResponseBadgeVariant(entry.response)}>
											{getEventResponseLabel(entry.response)}
										</Badge>
									{/if}
									{#if entry.attendanceStatus}
										<Badge variant={getAttendanceBadgeVariant(entry.attendanceStatus)}>
											{entry.attendanceStatus === 'attended' ? 'Attended' : 'Absent'}
										</Badge>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">
									{entry.attendanceUpdatedAt
										? `Recorded ${formatShortDateTime(entry.attendanceUpdatedAt)}.`
										: 'Attendance recorded.'}
								</p>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								{#if entry.attendanceStatus !== 'attended'}
									<Button
										type="button"
										variant="secondary"
										size="xs"
										disabled={currentHub.eventAttendanceTargetId === targetId}
										onclick={() => setAttendance(entry.member.profile_id, 'attended')}
									>
										{currentHub.eventAttendanceTargetId === targetId ? 'Saving...' : 'Mark attended'}
									</Button>
								{/if}
								{#if entry.attendanceStatus !== 'absent'}
									<Button
										type="button"
										variant="outline"
										size="xs"
										disabled={currentHub.eventAttendanceTargetId === targetId}
										onclick={() => setAttendance(entry.member.profile_id, 'absent')}
									>
										{currentHub.eventAttendanceTargetId === targetId ? 'Saving...' : 'Mark absent'}
									</Button>
								{/if}
								<Button
									type="button"
									variant="ghost"
									size="xs"
									disabled={currentHub.eventAttendanceTargetId === targetId}
									onclick={() => clearAttendance(entry.member.profile_id)}
								>
									{currentHub.eventAttendanceTargetId === targetId ? 'Clearing...' : 'Clear'}
								</Button>
								{#if !entry.isCurrentUser}
									<Button
										type="button"
										variant="ghost"
										size="xs"
										disabled={openingConversationForProfileId === entry.member.profile_id}
										onclick={() => messageProfile(entry.member.profile_id)}
									>
										{openingConversationForProfileId === entry.member.profile_id ? 'Opening...' : 'Message'}
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				{#if attendanceRoster.recordedEntries.length > 4}
					<p class="text-xs text-muted-foreground">
						+{attendanceRoster.recordedEntries.length - 4} more recorded attendance outcome{attendanceRoster.recordedEntries.length - 4 === 1 ? '' : 's'}.
					</p>
				{/if}
			</div>
		{/if}

		{#if attendanceRoster.noResponseCount > 0}
			<p class="text-xs text-muted-foreground">
				{attendanceRoster.noResponseCount} member{attendanceRoster.noResponseCount === 1 ? '' : 's'} still have no RSVP. Use the response roster above if you need outreach before recording attendance.
			</p>
		{/if}
	</div>
{/if}
