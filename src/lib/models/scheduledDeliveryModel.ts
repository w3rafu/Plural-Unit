import type {
	BroadcastRow,
	EventRow,
	ScheduledDeliveryMetadataPatch,
	ScheduledDeliveryState
} from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';

export type ScheduledDeliveryStatus = {
	state: ScheduledDeliveryState;
	label: string;
	copy: string;
	needsAttention: boolean;
	failureReason: string | null;
	deliveredAt: string | null;
	canRecover: boolean;
};

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function hasPatchChanged(
	current: Pick<BroadcastRow, 'delivery_state' | 'delivered_at' | 'delivery_failure_reason'>,
	next: ScheduledDeliveryMetadataPatch
) {
	return (
		(current.delivery_state ?? null) !== next.delivery_state ||
		(current.delivered_at ?? null) !== next.delivered_at ||
		(current.delivery_failure_reason ?? null) !== next.delivery_failure_reason
	);
}

function buildPublishedStatus(kind: 'broadcast' | 'event', deliveredAt: string, now: number): ScheduledDeliveryStatus {
	return {
		state: 'published',
		label: 'Published',
		copy:
			kind === 'broadcast'
				? `Published on schedule ${formatRelativeDateTime(deliveredAt, now)}.`
				: `Visible on schedule ${formatRelativeDateTime(deliveredAt, now)}.`,
		needsAttention: false,
		failureReason: null,
		deliveredAt,
		canRecover: false
	};
	}

function buildScheduledStatus(kind: 'broadcast' | 'event', publishAt: string, now: number): ScheduledDeliveryStatus {
	return {
		state: 'scheduled',
		label: 'Scheduled',
		copy:
			kind === 'broadcast'
				? `Delivery scheduled ${formatRelativeDateTime(publishAt, now)}.`
				: `Visibility scheduled ${formatRelativeDateTime(publishAt, now)}.`,
		needsAttention: false,
		failureReason: null,
		deliveredAt: null,
		canRecover: false
	};
	}

function buildSkippedStatus(reason: string): ScheduledDeliveryStatus {
	return {
		state: 'skipped',
		label: 'Skipped',
		copy: `Skipped before publish. ${reason}`,
		needsAttention: true,
		failureReason: reason,
		deliveredAt: null,
		canRecover: true
	};
	}

function buildFailedStatus(reason: string): ScheduledDeliveryStatus {
	return {
		state: 'failed',
		label: 'Failed',
		copy: `Scheduled publish failed. ${reason}`,
		needsAttention: true,
		failureReason: reason,
		deliveredAt: null,
		canRecover: true
	};
	}

export function getBroadcastDeliveryStatus(
	broadcast: Pick<
		BroadcastRow,
		'publish_at' | 'archived_at' | 'expires_at' | 'delivery_state' | 'delivered_at' | 'delivery_failure_reason'
	>,
	now = Date.now()
): ScheduledDeliveryStatus | null {
	if (!broadcast.publish_at) {
		return null;
	}

	const publishAt = getTime(broadcast.publish_at);
	const archivedAt = getTime(broadcast.archived_at);
	const expiresAt = getTime(broadcast.expires_at);

	if (publishAt === null) {
		return null;
	}

	if (archivedAt !== null && archivedAt <= publishAt) {
		return buildSkippedStatus('Archived before the scheduled visibility window. Restore or edit it if it still needs to go live.');
	}

	if (expiresAt !== null && publishAt >= expiresAt) {
		return buildFailedStatus('The scheduled publish time lands at or after the expiry time. Edit the timing before retrying.');
	}

	if (publishAt > now) {
		return buildScheduledStatus('broadcast', broadcast.publish_at, now);
	}

	return buildPublishedStatus('broadcast', broadcast.delivered_at ?? broadcast.publish_at, now);
}

export function getEventDeliveryStatus(
	event: Pick<
		EventRow,
		'publish_at' | 'starts_at' | 'archived_at' | 'canceled_at' | 'delivery_state' | 'delivered_at' | 'delivery_failure_reason'
	>,
	now = Date.now()
): ScheduledDeliveryStatus | null {
	if (!event.publish_at) {
		return null;
	}

	const publishAt = getTime(event.publish_at);
	const startsAt = getTime(event.starts_at);
	const archivedAt = getTime(event.archived_at);
	const canceledAt = getTime(event.canceled_at);

	if (publishAt === null || startsAt === null) {
		return null;
	}

	if (archivedAt !== null && archivedAt <= publishAt) {
		return buildSkippedStatus('Archived before the scheduled visibility window. Restore the event if it still needs to go live.');
	}

	if (canceledAt !== null && canceledAt <= publishAt) {
		return buildSkippedStatus('Canceled before the scheduled visibility window. Restore the event if it still needs to go live.');
	}

	if (publishAt >= startsAt) {
		return buildFailedStatus('The scheduled publish time lands at or after the event start. Edit the timing before retrying.');
	}

	if (publishAt > now) {
		return buildScheduledStatus('event', event.publish_at, now);
	}

	return buildPublishedStatus('event', event.delivered_at ?? event.publish_at, now);
}

export function getBroadcastDeliveryPatch(
	broadcast: Pick<
		BroadcastRow,
		'publish_at' | 'archived_at' | 'expires_at' | 'delivery_state' | 'delivered_at' | 'delivery_failure_reason'
	>,
	now = Date.now()
): ScheduledDeliveryMetadataPatch | null {
	const status = getBroadcastDeliveryStatus(broadcast, now);
	const nextPatch = {
		delivery_state: status?.state ?? null,
		delivered_at: status?.deliveredAt ?? null,
		delivery_failure_reason: status?.failureReason ?? null
	};

	return hasPatchChanged(broadcast, nextPatch) ? nextPatch : null;
}

export function getEventDeliveryPatch(
	event: Pick<
		EventRow,
		'publish_at' | 'starts_at' | 'archived_at' | 'canceled_at' | 'delivery_state' | 'delivered_at' | 'delivery_failure_reason'
	>,
	now = Date.now()
): ScheduledDeliveryMetadataPatch | null {
	const status = getEventDeliveryStatus(event, now);
	const nextPatch = {
		delivery_state: status?.state ?? null,
		delivered_at: status?.deliveredAt ?? null,
		delivery_failure_reason: status?.failureReason ?? null
	};

	return hasPatchChanged(event, nextPatch) ? nextPatch : null;
}