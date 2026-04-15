import type { OrganizationMember } from '$lib/models/organizationModel';
import type {
	EventAttendanceRow,
	EventAttendanceStatus,
	EventResponseRow,
	EventResponseStatus,
	EventRow
} from '$lib/repositories/hubRepository';
import { isEventArchived, isEventCanceled, isEventPublished } from './eventLifecycleModel';

export const EVENT_ATTENDANCE_WINDOW_LEAD_MS = 6 * 60 * 60 * 1000;
export const EVENT_ATTENDANCE_WINDOW_TRAIL_MS = 24 * 60 * 60 * 1000;

export type EventAttendanceOutcomeSummary = {
	attended: number;
	absent: number;
	recorded: number;
	recentProfileIds: string[];
	latestUpdatedAt: string | null;
};

export type EventAttendanceRosterEntry = {
	member: OrganizationMember;
	response: EventResponseStatus | null;
	responseUpdatedAt: string | null;
	attendanceStatus: EventAttendanceStatus | null;
	attendanceUpdatedAt: string | null;
	markedByProfileId: string | null;
	isCurrentUser: boolean;
};

export type EventAttendanceRoster = {
	totalMembers: number;
	expectedCount: number;
	pendingCount: number;
	recordedCount: number;
	attendedCount: number;
	absentCount: number;
	noResponseCount: number;
	cannotAttendCount: number;
	externalAttendanceCount: number;
	pendingEntries: EventAttendanceRosterEntry[];
	recordedEntries: EventAttendanceRosterEntry[];
};

function getTime(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? null : parsed;
}

function sortEventAttendanceRows(rows: EventAttendanceRow[]) {
	return [...rows].sort(
		(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
	);
}

function sortMembersByName(members: OrganizationMember[]) {
	return [...members].sort((left, right) => {
		const leftName = left.name.trim() || left.email.trim() || left.phone_number.trim() || left.profile_id;
		const rightName =
			right.name.trim() || right.email.trim() || right.phone_number.trim() || right.profile_id;

		return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
	});
}

function sortAttendanceRosterEntries(
	entries: EventAttendanceRosterEntry[],
	timestampSelector: (entry: EventAttendanceRosterEntry) => string | null
) {
	return [...entries].sort((left, right) => {
		const leftTime = getTime(timestampSelector(left));
		const rightTime = getTime(timestampSelector(right));

		if (leftTime !== rightTime) {
			return (rightTime ?? 0) - (leftTime ?? 0);
		}

		const leftName =
			left.member.name.trim() ||
			left.member.email.trim() ||
			left.member.phone_number.trim() ||
			left.member.profile_id;
		const rightName =
			right.member.name.trim() ||
			right.member.email.trim() ||
			right.member.phone_number.trim() ||
			right.member.profile_id;

		return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
	});
}

function getLatestResponsesByProfile(rows: EventResponseRow[]) {
	const latestResponses = new Map<string, EventResponseRow>();

	for (const row of [...rows].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())) {
		if (!latestResponses.has(row.profile_id)) {
			latestResponses.set(row.profile_id, row);
		}
	}

	return latestResponses;
}

function getLatestAttendanceByProfile(rows: EventAttendanceRow[]) {
	const latestAttendance = new Map<string, EventAttendanceRow>();

	for (const row of sortEventAttendanceRows(rows)) {
		if (!latestAttendance.has(row.profile_id)) {
			latestAttendance.set(row.profile_id, row);
		}
	}

	return latestAttendance;
}

export function buildEventAttendanceMap(rows: EventAttendanceRow[]) {
	const map: Record<string, EventAttendanceRow[]> = {};

	for (const row of rows) {
		const nextRows = map[row.event_id] ?? [];
		map[row.event_id] = [...nextRows, row];
	}

	for (const eventId of Object.keys(map)) {
		map[eventId] = sortEventAttendanceRows(map[eventId]);
	}

	return map;
}

export function upsertEventAttendanceMap(
	map: Record<string, EventAttendanceRow[]>,
	row: EventAttendanceRow
) {
	const nextRows = [
		...(map[row.event_id] ?? []).filter((existingRow) => existingRow.profile_id !== row.profile_id),
		row
	];

	return {
		...map,
		[row.event_id]: sortEventAttendanceRows(nextRows)
	};
}

export function removeEventAttendanceFromMap(
	map: Record<string, EventAttendanceRow[]>,
	eventId: string,
	profileId: string
) {
	const existingRows = map[eventId] ?? [];
	const nextRows = existingRows.filter((row) => row.profile_id !== profileId);

	if (nextRows.length === existingRows.length) {
		return map;
	}

	const nextMap = { ...map };

	if (nextRows.length === 0) {
		delete nextMap[eventId];
		return nextMap;
	}

	nextMap[eventId] = sortEventAttendanceRows(nextRows);
	return nextMap;
}

export function getEventAttendanceForProfile(
	rows: EventAttendanceRow[],
	profileId: string
): EventAttendanceStatus | null {
	return rows.find((row) => row.profile_id === profileId)?.status ?? null;
}

export function summarizeEventAttendance(rows: EventAttendanceRow[]): EventAttendanceOutcomeSummary {
	const summary: EventAttendanceOutcomeSummary = {
		attended: 0,
		absent: 0,
		recorded: rows.length,
		recentProfileIds: [],
		latestUpdatedAt: rows[0]?.updated_at ?? null
	};

	for (const row of rows) {
		if (row.status === 'attended') {
			summary.attended += 1;
		} else {
			summary.absent += 1;
		}
	}

	summary.recentProfileIds = rows.slice(0, 3).map((row) => row.profile_id);

	return summary;
}

export function buildEventAttendanceRoster(
	members: OrganizationMember[],
	responseRows: EventResponseRow[],
	attendanceRows: EventAttendanceRow[],
	currentUserId = ''
): EventAttendanceRoster {
	const sortedMembers = sortMembersByName(members);
	const latestResponses = getLatestResponsesByProfile(responseRows);
	const latestAttendance = getLatestAttendanceByProfile(attendanceRows);
	const memberIds = new Set(sortedMembers.map((member) => member.profile_id));

	const rosterEntries = sortedMembers.map((member) => {
		const response = latestResponses.get(member.profile_id) ?? null;
		const attendance = latestAttendance.get(member.profile_id) ?? null;

		return {
			member,
			response: response?.response ?? null,
			responseUpdatedAt: response?.updated_at ?? null,
			attendanceStatus: attendance?.status ?? null,
			attendanceUpdatedAt: attendance?.updated_at ?? null,
			markedByProfileId: attendance?.marked_by_profile_id ?? null,
			isCurrentUser: member.profile_id === currentUserId
		};
	});

	const pendingEntries = sortAttendanceRosterEntries(
		rosterEntries.filter(
			(entry) =>
				(entry.response === 'going' || entry.response === 'maybe') && entry.attendanceStatus === null
		),
		(entry) => entry.responseUpdatedAt
	);
	const recordedEntries = sortAttendanceRosterEntries(
		rosterEntries.filter((entry) => entry.attendanceStatus !== null),
		(entry) => entry.attendanceUpdatedAt
	);
	const attendedCount = recordedEntries.filter((entry) => entry.attendanceStatus === 'attended').length;
	const absentCount = recordedEntries.filter((entry) => entry.attendanceStatus === 'absent').length;
	const noResponseCount = rosterEntries.filter((entry) => entry.response === null).length;
	const cannotAttendCount = rosterEntries.filter((entry) => entry.response === 'cannot_attend').length;
	const externalAttendanceCount = [...latestAttendance.values()].filter(
		(row) => !memberIds.has(row.profile_id)
	).length;

	return {
		totalMembers: sortedMembers.length,
		expectedCount: pendingEntries.length + recordedEntries.length,
		pendingCount: pendingEntries.length,
		recordedCount: recordedEntries.length,
		attendedCount,
		absentCount,
		noResponseCount,
		cannotAttendCount,
		externalAttendanceCount,
		pendingEntries,
		recordedEntries
	};
}

export function getEventAttendanceRosterSummaryCopy(roster: EventAttendanceRoster) {
	if (roster.totalMembers === 0) {
		return 'Current member roster unavailable.';
	}

	if (roster.pendingCount === 0 && roster.recordedCount === 0) {
		return 'No RSVP-positive attendees need day-of closeout yet.';
	}

	if (roster.pendingCount > 0) {
		return `Closeout in progress: ${roster.pendingCount} of ${roster.expectedCount} expected attendee${roster.expectedCount === 1 ? '' : 's'} still need${roster.pendingCount === 1 ? 's' : ''} a day-of status.`;
	}

	return `Closeout complete for ${roster.recordedCount} expected attendee${roster.recordedCount === 1 ? '' : 's'}.`;
}

export function isEventAttendanceWindowOpen(
	event: Pick<EventRow, 'starts_at' | 'ends_at' | 'publish_at' | 'archived_at' | 'canceled_at'>,
	now = Date.now()
) {
	if (isEventArchived(event) || isEventCanceled(event) || !isEventPublished(event, now)) {
		return false;
	}

	const startsAt = getTime(event.starts_at);
	if (startsAt === null) {
		return false;
	}

	const reviewEnd = (getTime(event.ends_at) ?? startsAt) + EVENT_ATTENDANCE_WINDOW_TRAIL_MS;
	return now >= startsAt - EVENT_ATTENDANCE_WINDOW_LEAD_MS && now <= reviewEnd;
}

export function formatEventAttendanceOutcomeSummary(summary: EventAttendanceOutcomeSummary) {
	return `${summary.attended} attended · ${summary.absent} absent`;
}
