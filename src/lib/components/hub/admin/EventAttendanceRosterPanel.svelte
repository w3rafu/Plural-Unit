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
	const pendingProfileIds = $derived(
		attendanceRoster ? attendanceRoster.pendingEntries.map((entry) => entry.member.profile_id) : []
	);
	const canBulkUpdateAttendance = $derived(pendingProfileIds.length > 1);
	const isAttendanceWindowVisible = $derived.by(() => isEventAttendanceWindowOpen(event));
	const isUpdatingAttendance = $derived(currentHub.eventAttendanceTargetId !== '');
	const attendanceMutationStatus = $derived.by(() => {
		if (!attendanceActionTargetId || !attendanceRoster) {
			return '';
		}

		if (attendanceActionTargetId.startsWith('bulk:')) {
			return attendanceActionLabel;
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

	function getBulkTargetId(status: EventAttendanceStatus) {
		return `bulk:${status}`;
	}

	function getExpectedAttendeeCopy(count: number) {
		return `${count} expected attendee${count === 1 ? '' : 's'}`;
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

	async function setBulkAttendance(status: EventAttendanceStatus) {
		if (pendingProfileIds.length < 2) {
			return;
		}

		const targetId = getBulkTargetId(status);
		const expectedAttendeeCopy = getExpectedAttendeeCopy(pendingProfileIds.length);
		attendanceActionTargetId = targetId;
		attendanceActionLabel =
			status === 'attended'
				? `Recording attendance for ${expectedAttendeeCopy}...`
				: `Marking ${expectedAttendeeCopy} absent...`;

		try {
			await currentHub.setEventAttendanceForProfiles(event.id, pendingProfileIds, status);
		} catch (error) {
			const isPartialSave =
				error instanceof Error &&
				/^Saved \d+ of \d+ attendance updates before the bulk action stopped\./.test(
					error.message
				);

			toast({
				title: isPartialSave ? 'Bulk attendance partially saved' : 'Could not save bulk attendance',
				description:
					error instanceof Error ? error.message : 'Failed to record attendance for this group.',
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
			<p class="text-[0.88rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Day-of attendance
			</p>
			<p class="text-[0.82rem] text-muted-foreground">
				{getEventAttendanceRosterSummaryCopy(attendanceRoster)}
			</p>
			{#if attendanceOutcomeSummary.recorded > 0}
				<p class="text-[0.82rem] text-muted-foreground">
					{formatEventAttendanceOutcomeSummary(attendanceOutcomeSummary)} · {attendanceOutcomeSummary.recorded}
					recorded.
				</p>
			{/if}
			{#if attendanceRoster.externalAttendanceCount > 0}
				<p class="text-[0.82rem] text-muted-foreground">
					{attendanceRoster.externalAttendanceCount} saved attendance outcome{attendanceRoster.externalAttendanceCount === 1 ? '' : 's'} belong{attendanceRoster.externalAttendanceCount === 1 ? 's' : ''} to people no longer on the current roster.
				</p>
			{/if}
			{#if isUpdatingAttendance && attendanceMutationStatus}
				<p
					role="status"
					aria-live="polite"
					class="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-[0.82rem] text-muted-foreground"
				>
					{attendanceMutationStatus}
				</p>
			{/if}
		</div>

		<div class="space-y-2">
			<p class="text-[0.82rem] font-medium text-foreground">Needs attendance update</p>
			{#if canBulkUpdateAttendance}
				<div class="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="secondary"
						size="xs"
						disabled={isUpdatingAttendance}
						onclick={() => setBulkAttendance('attended')}
					>
						{attendanceActionTargetId === getBulkTargetId('attended')
							? `Recording ${getExpectedAttendeeCopy(pendingProfileIds.length)}...`
							: `Mark all ${pendingProfileIds.length} attended`}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="xs"
						disabled={isUpdatingAttendance}
						onclick={() => setBulkAttendance('absent')}
					>
						{attendanceActionTargetId === getBulkTargetId('absent')
							? `Marking ${getExpectedAttendeeCopy(pendingProfileIds.length)} absent...`
							: `Mark all ${pendingProfileIds.length} absent`}
					</Button>
				</div>
			{/if}
			{#if attendanceRoster.pendingEntries.length === 0}
				<p class="text-[0.82rem] text-muted-foreground">
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
								<p class="text-[0.82rem] text-muted-foreground">
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
									disabled={isUpdatingAttendance}
									onclick={() => setAttendance(entry.member.profile_id, 'attended')}
								>
									{attendanceActionTargetId === targetId ? 'Recording...' : 'Attended'}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="xs"
									disabled={isUpdatingAttendance}
									onclick={() => setAttendance(entry.member.profile_id, 'absent')}
								>
									{attendanceActionTargetId === targetId ? 'Recording...' : 'Absent'}
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
					<p class="text-[0.82rem] text-muted-foreground">
						+{attendanceRoster.pendingEntries.length - 4} more expected attendee{attendanceRoster.pendingEntries.length - 4 === 1 ? '' : 's'} still need a day-of decision.
					</p>
				{/if}
			{/if}
		</div>

		{#if attendanceRoster.recordedEntries.length > 0}
			<div class="space-y-2">
				<p class="text-[0.82rem] font-medium text-foreground">Recorded</p>
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
								<p class="text-[0.82rem] text-muted-foreground">
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
										disabled={isUpdatingAttendance}
										onclick={() => setAttendance(entry.member.profile_id, 'attended')}
									>
										{attendanceActionTargetId === targetId ? 'Saving...' : 'Mark attended'}
									</Button>
								{/if}
								{#if entry.attendanceStatus !== 'absent'}
									<Button
										type="button"
										variant="outline"
										size="xs"
										disabled={isUpdatingAttendance}
										onclick={() => setAttendance(entry.member.profile_id, 'absent')}
									>
										{attendanceActionTargetId === targetId ? 'Saving...' : 'Mark absent'}
									</Button>
								{/if}
								<Button
									type="button"
									variant="ghost"
									size="xs"
									disabled={isUpdatingAttendance}
									onclick={() => clearAttendance(entry.member.profile_id)}
								>
									{attendanceActionTargetId === targetId ? 'Clearing...' : 'Clear'}
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
					<p class="text-[0.82rem] text-muted-foreground">
						+{attendanceRoster.recordedEntries.length - 4} more recorded attendance outcome{attendanceRoster.recordedEntries.length - 4 === 1 ? '' : 's'}.
					</p>
				{/if}
			</div>
		{/if}

		{#if attendanceRoster.noResponseCount > 0}
			<p class="text-[0.82rem] text-muted-foreground">
				{attendanceRoster.noResponseCount} member{attendanceRoster.noResponseCount === 1 ? '' : 's'} still have no RSVP. Use the response roster above if you need outreach before recording attendance.
			</p>
		{/if}
	</div>
{/if}
