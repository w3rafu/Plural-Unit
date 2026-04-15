import type {
	HubExecutionJobKind,
	HubExecutionState,
	ScheduledDeliveryState
} from '$lib/repositories/hubRepository';

export const HUB_EXECUTION_FAILURE_REASONS = {
	broadcastArchivedBeforeVisibility:
		'Archived before the scheduled visibility window. Restore or edit it if it still needs to go live.',
	broadcastPublishAfterExpiry:
		'The scheduled publish time lands at or after the expiry time. Edit the timing before retrying.',
	eventArchivedBeforeVisibility:
		'Archived before the scheduled visibility window. Restore the event if it still needs to go live.',
	eventCanceledBeforeVisibility:
		'Canceled before the scheduled visibility window. Restore the event if it still needs to go live.',
	eventPublishAfterStart:
		'The scheduled publish time lands at or after the event start. Edit the timing before retrying.',
	reminderBeforeVisibility:
		'Reminder window lands before event visibility. Adjust the publish time or reminder plan.',
	reminderArchivedBeforeProcessing: 'Event was archived before this reminder could be processed.',
	reminderCanceledBeforeProcessing: 'Event was canceled before this reminder could be processed.',
	reminderWindowPassed: 'Reminder window passed before the event started.'
} as const;

export type HubExecutionRecoveryGuidance = {
	family:
		| 'fix_timing'
		| 'fix_reminder_plan'
		| 'restore_content'
		| 'restore_event'
		| 'confirm_skip'
		| 'run_migrations'
		| 'review_issue';
	label: string;
	openLabel: string;
	nextStepCopy: string;
	tone: 'attention' | 'neutral';
	allowsRetry: boolean;
	retryLabel: string;
};

const DEFAULT_RETRY_LABEL = 'Re-check';

const SCHEMA_DRIFT_GUIDANCE = [
	{
		pattern: /\bhub_(broadcasts|events)\.delivery_state\b/i,
		copy: 'Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.'
	},
	{
		pattern: /hub_operator_workflow_state(\.reviewed_against_signature)?/i,
		copy: 'Apply 029_create_hub_operator_workflow_state.sql, then try again.'
	},
	{
		pattern: /\b(public\.)?hub_notification_preferences\b/i,
		copy: 'Apply migration 022_add_hub_notification_preferences.sql, then try again.'
	},
	{
		pattern: /\b(public\.)?hub_execution_ledger\b/i,
		copy: 'Apply migration 023_add_hub_execution_ledger.sql, then try again.'
	},
	{
		pattern: /\bhub_notification_reads\.notification_key\b/i,
		copy: 'Apply migration 024_add_hub_reminder_notification_identity.sql, then try again.'
	},
	{
		pattern: /\b(public\.)?hub_event_attendances\b/i,
		copy: 'Apply migration 025_add_hub_event_attendances.sql, then try again.'
	}
] as const;

function buildGuidance(
	guidance: Omit<HubExecutionRecoveryGuidance, 'retryLabel'>
): HubExecutionRecoveryGuidance {
	return {
		...guidance,
		retryLabel: DEFAULT_RETRY_LABEL
	};
}

export function getHubSchemaDriftRecoveryCopy(message: string) {
	const matchedGuidance = SCHEMA_DRIFT_GUIDANCE.find((entry) => entry.pattern.test(message));
	return matchedGuidance?.copy ?? 'Run the latest Supabase migrations, then try again.';
}

export function getHubExecutionRecoveryGuidance(input: {
	jobKind: HubExecutionJobKind;
	executionState: HubExecutionState;
	reason: string | null;
}): HubExecutionRecoveryGuidance | null {
	if (input.executionState !== 'failed' && input.executionState !== 'skipped') {
		return null;
	}

	switch (input.reason) {
		case HUB_EXECUTION_FAILURE_REASONS.broadcastPublishAfterExpiry:
		case HUB_EXECUTION_FAILURE_REASONS.eventPublishAfterStart:
			return buildGuidance({
				family: 'fix_timing',
				label: 'Fix timing',
				openLabel: 'Edit timing',
				nextStepCopy:
					'Open the content, move its publish timing into a valid window, then re-check the queue or run it now if that still makes sense.',
				tone: 'attention',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.broadcastArchivedBeforeVisibility:
			return buildGuidance({
				family: 'restore_content',
				label: 'Restore content',
				openLabel: 'Restore broadcast',
				nextStepCopy:
					'Open the broadcast, restore or reschedule it if members should still see it, then let the queue refresh from the saved content state.',
				tone: 'attention',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.eventArchivedBeforeVisibility:
			return buildGuidance({
				family: 'restore_event',
				label: 'Restore event',
				openLabel: 'Restore event',
				nextStepCopy:
					'Open the event, restore it if visibility should still happen, then let the queue refresh from the saved event state.',
				tone: 'attention',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.eventCanceledBeforeVisibility:
			return buildGuidance({
				family: 'restore_event',
				label: 'Restore event',
				openLabel: 'Review event',
				nextStepCopy:
					'Open the event, confirm the cancellation is still correct, or restore it before trying to republish.',
				tone: 'attention',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.reminderBeforeVisibility:
			return buildGuidance({
				family: 'fix_reminder_plan',
				label: 'Fix reminder plan',
				openLabel: 'Adjust plan',
				nextStepCopy:
					'Open the event and move visibility earlier or remove the conflicting reminder offset before re-checking reminders.',
				tone: 'attention',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.reminderArchivedBeforeProcessing:
			return buildGuidance({
				family: 'confirm_skip',
				label: 'Archived event',
				openLabel: 'Review event',
				nextStepCopy:
					'Leave this reminder skipped if the event is intentionally archived, or restore the event before re-checking reminder work.',
				tone: 'neutral',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.reminderCanceledBeforeProcessing:
			return buildGuidance({
				family: 'confirm_skip',
				label: 'Canceled event',
				openLabel: 'Review event',
				nextStepCopy:
					'Leave this reminder skipped if the cancellation is correct, or restore the event before re-checking reminder work.',
				tone: 'neutral',
				allowsRetry: false
			});

		case HUB_EXECUTION_FAILURE_REASONS.reminderWindowPassed:
			return buildGuidance({
				family: 'confirm_skip',
				label: 'Window passed',
				openLabel: 'Review event',
				nextStepCopy:
					'No retry is needed unless you are intentionally changing the event timing and reminder plan together.',
				tone: 'neutral',
				allowsRetry: false
			});
	}

	if (input.jobKind === 'event_reminder') {
		return buildGuidance({
			family: 'review_issue',
			label: 'Review reminder',
			openLabel: 'Review event',
			nextStepCopy:
				'Open the event and inspect visibility, timing, and reminder settings before re-checking the queue.',
			tone: input.executionState === 'failed' ? 'attention' : 'neutral',
			allowsRetry: true
		});
	}

	return buildGuidance({
		family: 'review_issue',
		label: 'Review timing',
		openLabel: 'Open content',
		nextStepCopy:
			'Open the related content and inspect its schedule or lifecycle state before re-checking the queue.',
		tone: 'attention',
		allowsRetry: true
	});
}

export function getHubScheduledDeliveryRecoveryGuidance(input: {
	jobKind: Extract<HubExecutionJobKind, 'broadcast_publish' | 'event_publish'>;
	deliveryState: ScheduledDeliveryState;
	reason: string | null;
}) {
	if (input.deliveryState !== 'failed' && input.deliveryState !== 'skipped') {
		return null;
	}

	return getHubExecutionRecoveryGuidance({
		jobKind: input.jobKind,
		executionState: input.deliveryState,
		reason: input.reason
	});
}