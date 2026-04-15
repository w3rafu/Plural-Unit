import { describe, expect, it } from 'vitest';
import {
	getBroadcastDeliveryPatch,
	getBroadcastDeliveryStatus,
	getEventDeliveryPatch,
	getEventDeliveryStatus
} from './scheduledDeliveryModel';

function makeBroadcast(
	overrides: Partial<{
		publish_at: string | null;
		archived_at: string | null;
		expires_at: string | null;
		delivery_state: 'scheduled' | 'published' | 'failed' | 'skipped' | null;
		delivered_at: string | null;
		delivery_failure_reason: string | null;
	}> = {}
) {
	return {
		publish_at: overrides.publish_at ?? null,
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeEvent(
	overrides: Partial<{
		publish_at: string | null;
		starts_at: string;
		archived_at: string | null;
		canceled_at: string | null;
		delivery_state: 'scheduled' | 'published' | 'failed' | 'skipped' | null;
		delivered_at: string | null;
		delivery_failure_reason: string | null;
	}> = {}
) {
	return {
		publish_at: overrides.publish_at ?? null,
		starts_at: overrides.starts_at ?? '2026-04-20T16:00:00.000Z',
		archived_at: overrides.archived_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

describe('scheduledDeliveryModel', () => {
	it('derives scheduled and published broadcast delivery states', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(
			getBroadcastDeliveryStatus(makeBroadcast({ publish_at: '2026-04-13T18:00:00.000Z' }), now)
		).toMatchObject({
			state: 'scheduled',
			needsAttention: false
		});

		expect(
			getBroadcastDeliveryStatus(makeBroadcast({ publish_at: '2026-04-13T10:00:00.000Z' }), now)
		).toMatchObject({
			state: 'published',
			deliveredAt: '2026-04-13T10:00:00.000Z'
		});
	});

	it('derives skipped and failed broadcast delivery states', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(
			getBroadcastDeliveryStatus(
				makeBroadcast({
					publish_at: '2026-04-13T18:00:00.000Z',
					archived_at: '2026-04-13T13:00:00.000Z'
				}),
				now
			)
		).toMatchObject({
			state: 'skipped',
			needsAttention: true
		});

		expect(
			getBroadcastDeliveryStatus(
				makeBroadcast({
					publish_at: '2026-04-13T18:00:00.000Z',
					expires_at: '2026-04-13T17:00:00.000Z'
				}),
				now
			)
		).toMatchObject({
			state: 'failed',
			needsAttention: true
		});
	});

	it('derives scheduled, skipped, failed, and published event delivery states', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(
			getEventDeliveryStatus(
				makeEvent({
					publish_at: '2026-04-13T18:00:00.000Z',
					starts_at: '2026-04-14T18:00:00.000Z'
				}),
				now
			)
		).toMatchObject({ state: 'scheduled' });

		expect(
			getEventDeliveryStatus(
				makeEvent({
					publish_at: '2026-04-13T18:00:00.000Z',
					starts_at: '2026-04-13T19:00:00.000Z',
					canceled_at: '2026-04-13T13:00:00.000Z'
				}),
				now
			)
		).toMatchObject({ state: 'skipped' });

		expect(
			getEventDeliveryStatus(
				makeEvent({
					publish_at: '2026-04-13T18:00:00.000Z',
					starts_at: '2026-04-13T18:00:00.000Z'
				}),
				now
			)
		).toMatchObject({ state: 'failed' });

		expect(
			getEventDeliveryStatus(
				makeEvent({
					publish_at: '2026-04-13T10:00:00.000Z',
					starts_at: '2026-04-14T18:00:00.000Z'
				}),
				now
			)
		).toMatchObject({
			state: 'published',
			deliveredAt: '2026-04-13T10:00:00.000Z'
		});
	});

	it('returns patches only when stored metadata is stale', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(
			getBroadcastDeliveryPatch(
				makeBroadcast({
					publish_at: '2026-04-13T18:00:00.000Z',
					delivery_state: 'scheduled'
				}),
				now
			)
		).toBeNull();

		expect(
			getBroadcastDeliveryPatch(makeBroadcast({ publish_at: '2026-04-13T10:00:00.000Z' }), now)
		).toEqual({
			delivery_state: 'published',
			delivered_at: '2026-04-13T10:00:00.000Z',
			delivery_failure_reason: null
		});

		expect(
			getEventDeliveryPatch(
				makeEvent({
					publish_at: '2026-04-13T18:00:00.000Z',
					starts_at: '2026-04-13T18:00:00.000Z'
				}),
				now
			)
		).toMatchObject({
			delivery_state: 'failed'
		});
	});

	it('persists failure reasons in stale patches for unrecoverable scheduling conflicts', () => {
		const now = new Date('2026-04-13T12:00:00.000Z').getTime();

		expect(
			getBroadcastDeliveryPatch(
				makeBroadcast({
					publish_at: '2026-04-13T18:00:00.000Z',
					expires_at: '2026-04-13T17:00:00.000Z'
				}),
				now
			)
		).toEqual({
			delivery_state: 'failed',
			delivered_at: null,
			delivery_failure_reason:
				'The scheduled publish time lands at or after the expiry time. Edit the timing before retrying.'
		});

		expect(
			getEventDeliveryPatch(
				makeEvent({
					publish_at: '2026-04-13T18:00:00.000Z',
					starts_at: '2026-04-14T18:00:00.000Z',
					canceled_at: '2026-04-13T17:00:00.000Z'
				}),
				now
			)
		).toEqual({
			delivery_state: 'skipped',
			delivered_at: null,
			delivery_failure_reason:
				'Canceled before the scheduled visibility window. Restore the event if it still needs to go live.'
		});
	});
});
