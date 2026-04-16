import { buildEventResponseMap } from '$lib/models/eventResponseModel';
import {
	buildExpectedHubExecutionLedgerRows,
	groupHubExecutionLedger
} from '$lib/models/hubExecutionLedger';
import {
	buildHubExecutionQueueItem,
	buildHubExecutionQueueItemTriageKey,
	buildHubExecutionQueueTriageMapFromWorkflowStateRows
} from '$lib/models/hubExecutionQueue';
import { createDefaultHubNotificationPreferences } from '$lib/models/hubNotifications';
import type {
	OrganizationMembership,
	OrganizationPayload
} from '$lib/models/organizationModel';
import type { UserDetails } from '$lib/models/userModel';
import type { MessageThread } from '$lib/models/messageModel';
import type {
	BroadcastRow,
	EventReminderSettingsRow,
	EventRow,
	HubExecutionLedgerRow,
	HubOperatorWorkflowStateRow
} from '$lib/repositories/hubRepository';
import type { CurrentHubHydratedState } from '$lib/stores/currentHub/state';
import {
	cloneUiPreviewThreads,
	uiPreviewEventResponses,
	uiPreviewFixtures
} from './uiPreviewFixtures';

function toIsoFromNow(minutesFromNow: number, now: number) {
	return new Date(now + minutesFromNow * 60_000).toISOString();
}

function shiftIsoByMinutes(value: string, minutes: number) {
	return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

function cloneMembers() {
	return uiPreviewFixtures.members.map((member) => ({ ...member }));
}

function buildSmokeBroadcasts(now: number): BroadcastRow[] {
	const [liveBroadcast, scheduledBroadcast, failedBroadcast] = uiPreviewFixtures.broadcasts;

	return [
		{
			...liveBroadcast,
			created_at: toIsoFromNow(-240, now),
			updated_at: toIsoFromNow(-180, now),
			is_pinned: true,
			is_draft: false,
			publish_at: null,
			archived_at: null,
			expires_at: null,
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		},
		{
			...scheduledBroadcast,
			created_at: toIsoFromNow(-90, now),
			updated_at: toIsoFromNow(-30, now),
			is_pinned: false,
			is_draft: false,
			publish_at: toIsoFromNow(90, now),
			archived_at: null,
			expires_at: null,
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		},
		{
			...failedBroadcast,
			created_at: toIsoFromNow(-300, now),
			updated_at: toIsoFromNow(-75, now),
			is_pinned: false,
			is_draft: false,
			publish_at: toIsoFromNow(180, now),
			archived_at: null,
			expires_at: toIsoFromNow(120, now),
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		}
	];
}

function buildSmokeEvents(now: number): EventRow[] {
	const [liveEvent, processedPublishEvent, dueReminderEvent, scheduledPublishEvent] =
		uiPreviewFixtures.events;

	return [
		{
			...liveEvent,
			created_at: toIsoFromNow(-180, now),
			updated_at: toIsoFromNow(-120, now),
			starts_at: toIsoFromNow(1_440, now),
			ends_at: toIsoFromNow(1_530, now),
			publish_at: null,
			archived_at: null,
			canceled_at: null,
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		},
		{
			...processedPublishEvent,
			created_at: toIsoFromNow(-150, now),
			updated_at: toIsoFromNow(-40, now),
			starts_at: toIsoFromNow(600, now),
			ends_at: toIsoFromNow(630, now),
			publish_at: toIsoFromNow(-30, now),
			archived_at: null,
			canceled_at: null,
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		},
		{
			...dueReminderEvent,
			created_at: toIsoFromNow(-210, now),
			updated_at: toIsoFromNow(-60, now),
			starts_at: toIsoFromNow(60, now),
			ends_at: toIsoFromNow(135, now),
			publish_at: null,
			archived_at: null,
			canceled_at: null,
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		},
		{
			...scheduledPublishEvent,
			created_at: toIsoFromNow(-90, now),
			updated_at: toIsoFromNow(-15, now),
			starts_at: toIsoFromNow(150, now),
			ends_at: toIsoFromNow(210, now),
			publish_at: toIsoFromNow(120, now),
			archived_at: null,
			canceled_at: null,
			delivery_state: null,
			delivered_at: null,
			delivery_failure_reason: null
		}
	];
}

function buildSmokeReminderSettings(now: number): Record<string, EventReminderSettingsRow> {
	const events = buildSmokeEvents(now);

	return {
		[events[2].id]: {
			id: 'smoke-reminder-event-3',
			event_id: events[2].id,
			organization_id: uiPreviewFixtures.organizationId,
			delivery_channel: 'in_app',
			reminder_offsets: [120],
			created_at: toIsoFromNow(-120, now),
			updated_at: toIsoFromNow(-45, now)
		},
		[events[3].id]: {
			id: 'smoke-reminder-event-4',
			event_id: events[3].id,
			organization_id: uiPreviewFixtures.organizationId,
			delivery_channel: 'in_app',
			reminder_offsets: [60],
			created_at: toIsoFromNow(-90, now),
			updated_at: toIsoFromNow(-10, now)
		}
	};
}

function cloneSmokeMessages() {
	return cloneUiPreviewThreads();
}

function getSmokeWorkflowReviewerId() {
	return (
		uiPreviewFixtures.members.find(
			(member) =>
				member.role === 'admin' && member.profile_id !== uiPreviewFixtures.currentUserProfileId
		)?.profile_id ?? uiPreviewFixtures.currentUserProfileId
	);
}

function buildSmokeWorkflowStateRows(input: {
	executionLedger: HubExecutionLedgerRow[];
	broadcasts: BroadcastRow[];
	events: EventRow[];
	now: number;
}) {
	const queueItems = input.executionLedger.map((row) =>
		buildHubExecutionQueueItem({
			row,
			broadcasts: input.broadcasts,
			events: input.events,
			now: input.now
		})
	);
	const reviewedProcessedItem = queueItems.find((item) => item.bucket === 'processed');
	const staleRecoveryItem = queueItems.find(
		(item) => item.bucket === 'failed' || item.bucket === 'skipped'
	);

	if (!reviewedProcessedItem || !staleRecoveryItem) {
		throw new Error(
			'Smoke fixtures require at least one processed row and one recovery row for workflow coverage.'
		);
	}

	const staleSignaturePayload = JSON.parse(staleRecoveryItem.reviewSignature) as {
		dueAt: string;
	};
	const reviewerId = getSmokeWorkflowReviewerId();

	return [
		{
			organization_id: uiPreviewFixtures.organizationId,
			workflow_key: buildHubExecutionQueueItemTriageKey(reviewedProcessedItem),
			workflow_kind: 'execution_item',
			status: 'reviewed',
			reviewed_by_profile_id: reviewerId,
			note: 'Confirmed after the publish run completed.',
			reviewed_against_signature: reviewedProcessedItem.reviewSignature,
			created_at: toIsoFromNow(-100, input.now),
			updated_at: toIsoFromNow(-20, input.now)
		},
		{
			organization_id: uiPreviewFixtures.organizationId,
			workflow_key: buildHubExecutionQueueItemTriageKey(staleRecoveryItem),
			workflow_kind: 'execution_item',
			status: 'deferred',
			reviewed_by_profile_id: reviewerId,
			note: 'Re-open this if the schedule shifts again.',
			reviewed_against_signature: JSON.stringify({
				...staleSignaturePayload,
				dueAt: shiftIsoByMinutes(staleSignaturePayload.dueAt, -30)
			}),
			created_at: toIsoFromNow(-120, input.now),
			updated_at: toIsoFromNow(-45, input.now)
		}
	] satisfies HubOperatorWorkflowStateRow[];
}

export function buildSmokeUserDetails(): UserDetails {
	const currentMember = uiPreviewFixtures.members.find(
		(member) => member.profile_id === uiPreviewFixtures.currentUserProfileId
	);

	if (!currentMember) {
		throw new Error('Smoke fixtures require the preview current user to exist in the member roster.');
	}

	return {
		id: currentMember.profile_id,
		name: currentMember.name,
		email: currentMember.email,
		phone_number: currentMember.phone_number,
		avatar_url: currentMember.avatar_url
	};
}

export function buildSmokeOrganization(): OrganizationPayload {
	return {
		id: uiPreviewFixtures.organizationId,
		name: uiPreviewFixtures.organizationName,
		join_code: 'HARBOR24',
		created_at: '2026-01-06T15:20:00.000Z'
	};
}

export function buildSmokeMembership(): OrganizationMembership {
	return {
		organization_id: uiPreviewFixtures.organizationId,
		profile_id: uiPreviewFixtures.currentUserProfileId,
		role: 'admin',
		joined_via: 'created'
	};
}

export function buildSmokeMembers() {
	return cloneMembers();
}

export function buildSmokeMessages(): MessageThread[] {
	return cloneSmokeMessages();
}

export function buildSmokeHubState(now = Date.now()): CurrentHubHydratedState {
	const broadcasts = buildSmokeBroadcasts(now);
	const events = buildSmokeEvents(now);
	const eventReminderSettingsMap = buildSmokeReminderSettings(now);
	const eventResponseMap = buildEventResponseMap(uiPreviewEventResponses);
	const executionLedger = buildExpectedHubExecutionLedgerRows({
		broadcasts,
		events,
		eventReminderSettings: eventReminderSettingsMap,
		now
	}).map((row, index) => {
		const processedAt = row.processed_at ?? null;
		const lastAttemptedAt =
			row.execution_state === 'processed'
				? processedAt
				: row.execution_state === 'pending'
					? null
					: toIsoFromNow(-15 - index, now);

		return {
			id: `smoke-ledger-${row.job_kind}-${row.source_id}-${row.execution_key}`,
			organization_id: row.organization_id,
			job_kind: row.job_kind,
			source_id: row.source_id,
			execution_key: row.execution_key,
			due_at: row.due_at,
			execution_state: row.execution_state,
			processed_at: processedAt,
			last_attempted_at: lastAttemptedAt,
			attempt_count: row.execution_state === 'pending' ? 0 : 1,
			last_failure_reason: row.last_failure_reason ?? null,
			created_at: toIsoFromNow(-180 - index, now),
			updated_at: lastAttemptedAt ?? processedAt ?? toIsoFromNow(-30 - index, now)
		} satisfies HubExecutionLedgerRow;
	});
	const workflowStateRows = buildSmokeWorkflowStateRows({
		executionLedger,
		broadcasts,
		events,
		now
	});

	return {
		loadedOrgId: uiPreviewFixtures.organizationId,
		plugins: {
			broadcasts: true,
			events: true,
			resources: false
		},
		broadcasts,
		events,
		resources: [],
		eventResponseMap,
		eventAttendanceMap: {},
		eventReminderSettingsMap,
		executionLedger,
		workflowStateRows,
		queueTriageMap: buildHubExecutionQueueTriageMapFromWorkflowStateRows(workflowStateRows),
		broadcastAcknowledgmentMap: {},
		notificationPreferences: createDefaultHubNotificationPreferences(),
		notificationReadMap: {}
	};
}

export function summarizeSmokeHubState(now = Date.now()) {
	return groupHubExecutionLedger(buildSmokeHubState(now).executionLedger, now);
}
