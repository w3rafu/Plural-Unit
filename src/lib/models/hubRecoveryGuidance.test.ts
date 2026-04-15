import { describe, expect, it } from 'vitest';
import {
	HUB_EXECUTION_FAILURE_REASONS,
	getHubExecutionRecoveryGuidance,
	getHubScheduledDeliveryRecoveryGuidance,
	getHubSchemaDriftRecoveryCopy
} from './hubRecoveryGuidance';

describe('hubRecoveryGuidance', () => {
	it('classifies publish timing conflicts into operator guidance', () => {
		expect(
			getHubExecutionRecoveryGuidance({
				jobKind: 'event_publish',
				executionState: 'failed',
				reason: HUB_EXECUTION_FAILURE_REASONS.eventPublishAfterStart
			})
		).toEqual({
			family: 'fix_timing',
			label: 'Fix timing',
			openLabel: 'Edit timing',
			nextStepCopy:
				'Open the content, move its publish timing into a valid window, then re-check the queue or run it now if that still makes sense.',
			tone: 'attention',
			allowsRetry: false,
			retryLabel: 'Re-check'
		});
	});

	it('classifies reminder windows that are already behind the event as confirm-skip guidance', () => {
		expect(
			getHubExecutionRecoveryGuidance({
				jobKind: 'event_reminder',
				executionState: 'skipped',
				reason: HUB_EXECUTION_FAILURE_REASONS.reminderWindowPassed
			})
		).toEqual({
			family: 'confirm_skip',
			label: 'Window passed',
			openLabel: 'Review event',
			nextStepCopy:
				'No retry is needed unless you are intentionally changing the event timing and reminder plan together.',
			tone: 'neutral',
			allowsRetry: false,
			retryLabel: 'Re-check'
		});
	});

	it('maps schema drift errors to specific migration guidance when possible', () => {
		expect(getHubSchemaDriftRecoveryCopy('column hub_events.delivery_state does not exist')).toBe(
			'Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.'
		);
		expect(
			getHubSchemaDriftRecoveryCopy('relation "public"."hub_notification_preferences" does not exist')
		).toBe('Apply migration 022_add_hub_notification_preferences.sql, then try again.');
		expect(getHubSchemaDriftRecoveryCopy('relation some_other_table does not exist')).toBe(
			'Run the latest Supabase migrations, then try again.'
		);
	});

	it('maps delivery-state failures into the same recovery guidance used by queue rows', () => {
		expect(
			getHubScheduledDeliveryRecoveryGuidance({
				jobKind: 'broadcast_publish',
				deliveryState: 'skipped',
				reason: HUB_EXECUTION_FAILURE_REASONS.broadcastArchivedBeforeVisibility
			})
		).toMatchObject({
			family: 'restore_content',
			label: 'Restore content',
			openLabel: 'Restore broadcast',
			allowsRetry: false
		});

		expect(
			getHubScheduledDeliveryRecoveryGuidance({
				jobKind: 'event_publish',
				deliveryState: 'scheduled',
				reason: null
			})
		).toBeNull();
	});
});