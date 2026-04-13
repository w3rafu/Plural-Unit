import type { BroadcastRow, EventRow } from '$lib/repositories/hubRepository';
import { isBroadcastDraft, isBroadcastLive, isBroadcastScheduled } from './broadcastLifecycleModel';
import { isEventLive, isEventScheduled } from './eventLifecycleModel';
import type { EventReminderSummary } from './eventReminderModel';
import { getBroadcastDeliveryStatus, getEventDeliveryStatus } from './scheduledDeliveryModel';
import type { EventAttendanceSummary } from './eventResponseModel';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';

export const HUB_ENGAGEMENT_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;
export const HUB_ENGAGEMENT_STALE_RESPONSE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export type HubEngagementSignal = {
	copy: string;
	tone: 'neutral' | 'attention' | 'positive';
	needsAttention: boolean;
};

export type HubAdminEngagementSummary = {
	liveEventCount: number;
	respondedLiveEventCount: number;
	noResponseLiveEventCount: number;
	staleLiveEventCount: number;
	latestResponseAt: string | null;
	scheduledEventCount: number;
	scheduledBroadcastCount: number;
	scheduledItemCount: number;
	approachingPublishCount: number;
	deliveryIssueCount: number;
	failedDeliveryCount: number;
	skippedDeliveryCount: number;
	followUpCount: number;
};

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function isSoon(value: string | null | undefined, now = Date.now()) {
	const timestamp = getTime(value);
	if (timestamp === null || timestamp < now) {
		return false;
	}

	return timestamp - now <= HUB_ENGAGEMENT_SOON_WINDOW_MS;
}

function isResponseStale(value: string | null | undefined, now = Date.now()) {
	const timestamp = getTime(value);
	if (timestamp === null) {
		return false;
	}

	return now - timestamp >= HUB_ENGAGEMENT_STALE_RESPONSE_WINDOW_MS;
}

function getEventReminderSuffix(
	reminderSummary: EventReminderSummary | null | undefined,
	now = Date.now()
) {
	if (!reminderSummary || reminderSummary.count === 0) {
		return '';
	}

	if (reminderSummary.nextReminderAt) {
		return ` Next reminder ${formatRelativeDateTime(reminderSummary.nextReminderAt, now)}.`;
	}

	return ' All reminder windows are already behind this event.';
}

export function buildHubAdminEngagementSummary(
	input: {
		events: EventRow[];
		broadcasts: BroadcastRow[];
		eventAttendances: Record<string, EventAttendanceSummary>;
	},
	now = Date.now()
): HubAdminEngagementSummary {
	const liveEvents = input.events.filter((event) => isEventLive(event, now));
	const scheduledEvents = input.events.filter((event) => isEventScheduled(event, now));
	const scheduledBroadcasts = input.broadcasts.filter((broadcast) => isBroadcastScheduled(broadcast, now));

	let respondedLiveEventCount = 0;
	let noResponseLiveEventCount = 0;
	let staleLiveEventCount = 0;
	let latestResponseAt: string | null = null;
	let failedDeliveryCount = 0;
	let skippedDeliveryCount = 0;

	for (const event of liveEvents) {
		const attendance = input.eventAttendances[event.id];
		if (!attendance || attendance.total === 0) {
			noResponseLiveEventCount += 1;
			continue;
		}

		respondedLiveEventCount += 1;

		if (attendance.latestUpdatedAt && isResponseStale(attendance.latestUpdatedAt, now)) {
			staleLiveEventCount += 1;
		}

		if (
			attendance.latestUpdatedAt &&
			(latestResponseAt === null ||
				(getTime(attendance.latestUpdatedAt) ?? 0) > (getTime(latestResponseAt) ?? 0))
		) {
			latestResponseAt = attendance.latestUpdatedAt;
		}
	}

	const approachingPublishCount = [
		...scheduledEvents.filter((event) => getEventDeliveryStatus(event, now)?.state !== 'failed').map((event) => event.publish_at),
		...scheduledBroadcasts.filter((broadcast) => getBroadcastDeliveryStatus(broadcast, now)?.state !== 'failed').map((broadcast) => broadcast.publish_at)
	].filter((value) => isSoon(value, now)).length;

	for (const event of input.events) {
		const deliveryStatus = getEventDeliveryStatus(event, now);
		if (deliveryStatus?.state === 'failed') {
			failedDeliveryCount += 1;
		}

		if (deliveryStatus?.state === 'skipped') {
			skippedDeliveryCount += 1;
		}
	}

	for (const broadcast of input.broadcasts) {
		const deliveryStatus = getBroadcastDeliveryStatus(broadcast, now);
		if (deliveryStatus?.state === 'failed') {
			failedDeliveryCount += 1;
		}

		if (deliveryStatus?.state === 'skipped') {
			skippedDeliveryCount += 1;
		}
	}

	const deliveryIssueCount = failedDeliveryCount + skippedDeliveryCount;

	return {
		liveEventCount: liveEvents.length,
		respondedLiveEventCount,
		noResponseLiveEventCount,
		staleLiveEventCount,
		latestResponseAt,
		scheduledEventCount: scheduledEvents.length,
		scheduledBroadcastCount: scheduledBroadcasts.length,
		scheduledItemCount: scheduledEvents.length + scheduledBroadcasts.length,
		approachingPublishCount,
		deliveryIssueCount,
		failedDeliveryCount,
		skippedDeliveryCount,
		followUpCount: noResponseLiveEventCount + approachingPublishCount + deliveryIssueCount
	};
}

export function getHubEngagementCoverageCopy(
	summary: HubAdminEngagementSummary,
	now = Date.now()
) {
	if (summary.liveEventCount === 0) {
		return 'No live events are collecting replies right now.';
	}

	if (summary.respondedLiveEventCount === 0) {
		return 'No live events have responses yet.';
	}

	const parts = [
		`${summary.respondedLiveEventCount} of ${summary.liveEventCount} live event${summary.liveEventCount === 1 ? '' : 's'} have replies.`
	];

	if (summary.latestResponseAt) {
		parts.push(`Latest reply ${formatRelativeDateTime(summary.latestResponseAt, now)}.`);
	}

	if (summary.staleLiveEventCount > 0) {
		parts.push(
			`${summary.staleLiveEventCount} event${summary.staleLiveEventCount === 1 ? '' : 's'} need fresher reply activity.`
		);
	}

	return parts.join(' ');
}

export function getHubEngagementFollowUpCopy(summary: HubAdminEngagementSummary) {
	if (summary.followUpCount === 0) {
		return 'No follow-up signals need attention right now.';
	}

	const parts = [];

	if (summary.noResponseLiveEventCount > 0) {
		parts.push(
			`${summary.noResponseLiveEventCount} live event${summary.noResponseLiveEventCount === 1 ? '' : 's'} still need${summary.noResponseLiveEventCount === 1 ? 's' : ''} a first RSVP.`
		);
	}

	if (summary.approachingPublishCount > 0) {
		parts.push(
			`${summary.approachingPublishCount} scheduled item${summary.approachingPublishCount === 1 ? '' : 's'} publish within a day.`
		);
	}

	if (summary.deliveryIssueCount > 0) {
		parts.push(
			`${summary.deliveryIssueCount} scheduled item${summary.deliveryIssueCount === 1 ? '' : 's'} need${summary.deliveryIssueCount === 1 ? 's' : ''} delivery recovery.`
		);
	}

	return parts.join(' ');
}

export function getEventEngagementSignal(
	event: EventRow,
	attendance: EventAttendanceSummary,
	reminderSummary: EventReminderSummary | null = null,
	now = Date.now()
): HubEngagementSignal {
	const reminderSuffix = getEventReminderSuffix(reminderSummary, now);

	if (isEventScheduled(event, now)) {
		const relativePublish = event.publish_at ? formatRelativeDateTime(event.publish_at, now) : '';
		const needsAttention = isSoon(event.publish_at, now);

		return {
			copy: relativePublish
				? needsAttention
					? `Publishes ${relativePublish}. Review before it goes live.${reminderSuffix}`
					: `Publishes ${relativePublish}.${reminderSuffix}`
				: `Waiting for scheduled visibility.${reminderSuffix}`,
			tone: needsAttention ? 'attention' : 'neutral',
			needsAttention
		};
	}

	if (isEventLive(event, now)) {
		if (attendance.total === 0) {
			return {
				copy: `This event still needs a first RSVP.${reminderSuffix}`,
				tone: 'attention',
				needsAttention: true
			};
		}

		if (attendance.latestUpdatedAt && isResponseStale(attendance.latestUpdatedAt, now)) {
			return {
				copy: `Latest reply ${formatRelativeDateTime(attendance.latestUpdatedAt, now)}. Follow up if you need fresher numbers.${reminderSuffix}`,
				tone: 'attention',
				needsAttention: true
			};
		}

		return {
			copy: attendance.latestUpdatedAt
				? `Latest reply ${formatRelativeDateTime(attendance.latestUpdatedAt, now)}.${reminderSuffix}`
				: `Replies are coming in.${reminderSuffix}`,
			tone: 'positive',
			needsAttention: false
		};
	}

	if (attendance.total > 0 && attendance.latestUpdatedAt) {
		return {
			copy: `Last reply ${formatRelativeDateTime(attendance.latestUpdatedAt, now)} before this moved to history.`,
			tone: 'neutral',
			needsAttention: false
		};
	}

	return {
		copy: 'No reply activity was recorded before this moved to history.',
		tone: 'neutral',
		needsAttention: false
	};
}

export function getBroadcastEngagementSignal(
	broadcast: BroadcastRow,
	now = Date.now()
): HubEngagementSignal {
	if (isBroadcastDraft(broadcast)) {
		return {
			copy: `Last edited ${formatRelativeDateTime(broadcast.updated_at, now)}.`,
			tone: 'neutral',
			needsAttention: false
		};
	}

	if (isBroadcastScheduled(broadcast, now)) {
		const relativePublish = broadcast.publish_at
			? formatRelativeDateTime(broadcast.publish_at, now)
			: '';
		const needsAttention = isSoon(broadcast.publish_at, now);

		return {
			copy: relativePublish
				? needsAttention
					? `Publishes ${relativePublish}. Review before it goes live.`
					: `Publishes ${relativePublish}.`
				: 'Scheduled for later publication.',
			tone: needsAttention ? 'attention' : 'neutral',
			needsAttention
		};
	}

	if (isBroadcastLive(broadcast, now)) {
		if (broadcast.expires_at && isSoon(broadcast.expires_at, now)) {
			return {
				copy: `Expires ${formatRelativeDateTime(broadcast.expires_at, now)}.`,
				tone: 'attention',
				needsAttention: true
			};
		}

		if (broadcast.is_pinned) {
			return {
				copy: 'Pinned at the top of the live member view.',
				tone: 'positive',
				needsAttention: false
			};
		}

		return {
			copy: `Published ${formatRelativeDateTime(broadcast.publish_at ?? broadcast.created_at, now)}.`,
			tone: 'neutral',
			needsAttention: false
		};
	}

	return {
		copy: `Moved to history ${formatRelativeDateTime(
			broadcast.archived_at ?? broadcast.expires_at ?? broadcast.updated_at,
			now
		)}.`,
		tone: 'neutral',
		needsAttention: false
	};
}