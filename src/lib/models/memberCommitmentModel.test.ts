import { describe, expect, it } from 'vitest';
import { buildMemberCommitments, buildMemberCommitmentLookup } from './memberCommitmentModel';

function makeEvent(
	overrides: Partial<{
		id: string;
		title: string;
		starts_at: string;
		location: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'event-1',
		organization_id: 'org-1',
		title: overrides.title ?? 'Neighborhood dinner',
		description: 'Shared meal',
		starts_at: overrides.starts_at ?? '2026-04-17T01:30:00.000Z',
		ends_at: null,
		location: overrides.location ?? 'North Hall',
		created_at: '2026-04-10T19:15:00.000Z',
		updated_at: '2026-04-10T19:15:00.000Z',
		publish_at: null,
		canceled_at: null,
		archived_at: null,
		delivery_state: null,
		delivered_at: null,
		delivery_failure_reason: null
	};
}

function makeReminderNotification(
	overrides: Partial<{
		id: string;
		sourceId: string;
		notificationKey: string;
		occurredAt: string;
		isRead: boolean;
	}> = {}
) {
	return {
		id:
			overrides.id ??
			`event_reminder:${overrides.sourceId ?? 'event-1'}:${overrides.notificationKey ?? '120'}`,
		kind: 'event_reminder' as const,
		sourceId: overrides.sourceId ?? 'event-1',
		notificationKey: overrides.notificationKey ?? '120',
		title: 'Reminder',
		summary: 'Reminder sent.',
		meta: 'Meta',
		occurredAt: overrides.occurredAt ?? '2026-04-15T23:30:00.000Z',
		label: 'Reminder',
		isRead: overrides.isRead ?? false,
		readAt: overrides.isRead ? '2026-04-15T23:35:00.000Z' : null
	};
}

describe('memberCommitmentModel', () => {
	it('groups live events into reply-needed and upcoming commitment buckets', () => {
		const sections = buildMemberCommitments({
			events: [
				makeEvent({ id: 'event-1', title: 'Dinner', starts_at: '2026-04-17T01:30:00.000Z' }),
				makeEvent({ id: 'event-2', title: 'Captain sync', starts_at: '2026-04-15T18:00:00.000Z' }),
				makeEvent({ id: 'event-3', title: 'Prayer breakfast', starts_at: '2026-04-20T14:00:00.000Z' }),
				makeEvent({ id: 'event-4', title: 'Supply reset', starts_at: '2026-04-18T14:00:00.000Z' })
			],
			ownResponses: {
				'event-1': 'going',
				'event-2': null,
				'event-3': 'maybe',
				'event-4': 'cannot_attend'
			},
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(sections.replyNeeded.map((item) => item.eventId)).toEqual(['event-2']);
		expect(sections.upcoming.map((item) => item.eventId)).toEqual(['event-1', 'event-3']);
		expect(sections.replyNeededCount).toBe(1);
		expect(sections.upcomingCount).toBe(2);
		expect(sections.startsSoonCount).toBe(1);
	});

	it('marks starts-soon states and reuses reminder notifications for commitment copy', () => {
		const sections = buildMemberCommitments({
			events: [makeEvent({ id: 'event-2', title: 'Captain sync', starts_at: '2026-04-15T18:00:00.000Z' })],
			ownResponses: {
				'event-2': 'maybe'
			},
			notifications: [
				makeReminderNotification({
					sourceId: 'event-2',
					notificationKey: '120',
					occurredAt: '2026-04-15T16:00:00.000Z',
					isRead: false
				})
			],
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(sections.upcoming[0]).toMatchObject({
			eventId: 'event-2',
			status: 'maybe',
			statusLabel: 'Maybe',
			isStartingSoon: true,
			hasUnreadReminder: true,
			reminderCopy: 'Reminder sent 2 hours before.'
		});
		expect(sections.upcoming[0]?.statusCopy).toBe('Starts soon. Confirm if you can still make it.');
	});

	it('builds a lookup keyed by event id for member-facing sections', () => {
		const sections = buildMemberCommitments({
			events: [
				makeEvent({ id: 'event-1' }),
				makeEvent({ id: 'event-2', starts_at: '2026-04-15T18:00:00.000Z' })
			],
			ownResponses: {
				'event-1': 'going',
				'event-2': null
			},
			now: new Date('2026-04-14T12:00:00.000Z').getTime()
		});

		expect(buildMemberCommitmentLookup(sections.all)).toMatchObject({
			'event-1': {
				status: 'going'
			},
			'event-2': {
				status: 'reply_needed'
			}
		});
	});
});