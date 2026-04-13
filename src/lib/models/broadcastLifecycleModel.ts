import type { BroadcastRow } from '$lib/repositories/hubRepository';

export function isBroadcastArchived(broadcast: BroadcastRow) {
	return !!broadcast.archived_at;
}

export function isBroadcastDraft(broadcast: Pick<BroadcastRow, 'is_draft' | 'archived_at'>) {
	return !broadcast.archived_at && broadcast.is_draft;
}

export function isBroadcastExpired(broadcast: BroadcastRow, now = Date.now()) {
	if (!broadcast.expires_at) {
		return false;
	}

	const expiresAt = new Date(broadcast.expires_at).getTime();
	return !Number.isNaN(expiresAt) && expiresAt <= now;
}

export function isBroadcastPublished(
	broadcast: Pick<BroadcastRow, 'publish_at'>,
	now = Date.now()
) {
	const publishAt = getTime(broadcast.publish_at);
	return publishAt === 0 || publishAt <= now;
}

export function isBroadcastScheduled(broadcast: BroadcastRow, now = Date.now()) {
	return (
		!isBroadcastDraft(broadcast) &&
		!isBroadcastArchived(broadcast) &&
		!isBroadcastExpired(broadcast, now) &&
		!isBroadcastPublished(broadcast, now)
	);
}

export function isBroadcastLive(broadcast: BroadcastRow, now = Date.now()) {
	return (
		!isBroadcastDraft(broadcast) &&
		!isBroadcastArchived(broadcast) &&
		!isBroadcastExpired(broadcast, now) &&
		isBroadcastPublished(broadcast, now)
	);
}

export function isBroadcastActive(broadcast: BroadcastRow, now = Date.now()) {
	return isBroadcastLive(broadcast, now);
}

function getTime(value: string | null | undefined) {
	if (!value) {
		return 0;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortActiveBroadcasts(rows: BroadcastRow[], now = Date.now()) {
	return rows
		.filter((broadcast) => isBroadcastLive(broadcast, now))
		.sort((left, right) => {
			if (left.is_pinned !== right.is_pinned) {
				return left.is_pinned ? -1 : 1;
			}

			const leftTime = getTime(left.publish_at) || getTime(left.created_at);
			const rightTime = getTime(right.publish_at) || getTime(right.created_at);

			return rightTime - leftTime;
		});
}

export function sortDraftBroadcasts(rows: BroadcastRow[]) {
	return rows
		.filter((broadcast) => isBroadcastDraft(broadcast))
		.sort((left, right) => {
			const leftTime = getTime(left.updated_at) || getTime(left.created_at);
			const rightTime = getTime(right.updated_at) || getTime(right.created_at);

			return rightTime - leftTime;
		});
}

export function sortScheduledBroadcasts(rows: BroadcastRow[], now = Date.now()) {
	return rows
		.filter((broadcast) => isBroadcastScheduled(broadcast, now))
		.sort((left, right) => {
			const leftTime = getTime(left.publish_at) || getTime(left.updated_at) || getTime(left.created_at);
			const rightTime = getTime(right.publish_at) || getTime(right.updated_at) || getTime(right.created_at);

			return leftTime - rightTime;
		});
}

export function sortInactiveBroadcasts(rows: BroadcastRow[], now = Date.now()) {
	return rows
		.filter(
			(broadcast) =>
				!isBroadcastDraft(broadcast) &&
				!isBroadcastScheduled(broadcast, now) &&
				!isBroadcastLive(broadcast, now)
		)
		.sort((left, right) => {
			const leftTime = getTime(left.archived_at) || getTime(left.expires_at) || getTime(left.updated_at);
			const rightTime = getTime(right.archived_at) || getTime(right.expires_at) || getTime(right.updated_at);

			return rightTime - leftTime;
		});
}

export function replaceBroadcastRow(rows: BroadcastRow[], row: BroadcastRow) {
	return [...rows.filter((existingRow) => existingRow.id !== row.id), row];
}

export function removeBroadcastRow(rows: BroadcastRow[], broadcastId: string) {
	return rows.filter((row) => row.id !== broadcastId);
}

export function toBroadcastDateTimeLocalValue(value: string | null) {
	if (!value) {
		return '';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return offsetDate.toISOString().slice(0, 16);
}

export function parseBroadcastDateTimeLocalValue(
	value: string,
	invalidMessage = 'Pick a valid date and time.'
) {
	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	const date = new Date(trimmedValue);
	if (Number.isNaN(date.getTime())) {
		throw new Error(invalidMessage);
	}

	return date.toISOString();
}

export function getBroadcastStateLabel(broadcast: BroadcastRow, now = Date.now()) {
	if (isBroadcastArchived(broadcast)) {
		return 'Archived';
	}

	if (isBroadcastExpired(broadcast, now)) {
		return 'Expired';
	}

	if (isBroadcastDraft(broadcast)) {
		return 'Draft';
	}

	if (isBroadcastScheduled(broadcast, now)) {
		return 'Scheduled';
	}

	if (broadcast.is_pinned) {
		return 'Pinned';
	}

	if (broadcast.expires_at) {
		return 'Scheduled expiry';
	}

	return 'Live';
}
