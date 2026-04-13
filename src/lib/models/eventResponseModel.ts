import type { OrganizationMember } from '$lib/models/organizationModel';
import type { EventResponseRow, EventResponseStatus } from '$lib/repositories/hubRepository';

export const EVENT_RESPONSE_OPTIONS = [
	{ value: 'going', label: 'Going' },
	{ value: 'maybe', label: 'Maybe' },
	{ value: 'cannot_attend', label: "Can't make it" }
] as const satisfies Array<{ value: EventResponseStatus; label: string }>;

export type EventAttendanceSummary = {
	going: number;
	maybe: number;
	cannotAttend: number;
	total: number;
	recentProfileIds: string[];
	latestUpdatedAt: string | null;
};

export type EventResponseRosterEntry = {
	member: OrganizationMember;
	response: EventResponseStatus | null;
	updatedAt: string | null;
	isCurrentUser: boolean;
};

export type EventResponseRoster = {
	totalMembers: number;
	respondedCount: number;
	nonResponderCount: number;
	externalResponseCount: number;
	responders: EventResponseRosterEntry[];
	nonResponders: EventResponseRosterEntry[];
};

function sortEventResponses(rows: EventResponseRow[]) {
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

function getLatestResponsesByProfile(rows: EventResponseRow[]) {
	const latestResponses = new Map<string, EventResponseRow>();

	for (const row of sortEventResponses(rows)) {
		if (!latestResponses.has(row.profile_id)) {
			latestResponses.set(row.profile_id, row);
		}
	}

	return latestResponses;
}

export function buildEventResponseMap(rows: EventResponseRow[]) {
	const map: Record<string, EventResponseRow[]> = {};

	for (const row of rows) {
		const nextRows = map[row.event_id] ?? [];
		map[row.event_id] = [...nextRows, row];
	}

	for (const eventId of Object.keys(map)) {
		map[eventId] = sortEventResponses(map[eventId]);
	}

	return map;
}

export function upsertEventResponseMap(
	map: Record<string, EventResponseRow[]>,
	row: EventResponseRow
) {
	const nextRows = [
		...(map[row.event_id] ?? []).filter((existingRow) => existingRow.profile_id !== row.profile_id),
		row
	];

	return {
		...map,
		[row.event_id]: sortEventResponses(nextRows)
	};
}

export function getOwnEventResponseForProfile(
	rows: EventResponseRow[],
	profileId: string
): EventResponseStatus | null {
	return rows.find((row) => row.profile_id === profileId)?.response ?? null;
}

export function getEventResponseLabel(response: EventResponseStatus) {
	return (
		EVENT_RESPONSE_OPTIONS.find((option) => option.value === response)?.label ?? 'Responded'
	);
}

export function summarizeEventResponses(rows: EventResponseRow[]): EventAttendanceSummary {
	const summary: EventAttendanceSummary = {
		going: 0,
		maybe: 0,
		cannotAttend: 0,
		total: rows.length,
		recentProfileIds: [],
		latestUpdatedAt: rows[0]?.updated_at ?? null
	};

	for (const row of rows) {
		if (row.response === 'going') {
			summary.going += 1;
		} else if (row.response === 'maybe') {
			summary.maybe += 1;
		} else {
			summary.cannotAttend += 1;
		}
	}

	summary.recentProfileIds = rows.slice(0, 3).map((row) => row.profile_id);

	return summary;
}

export function buildEventResponseRoster(
	members: OrganizationMember[],
	rows: EventResponseRow[],
	currentUserId = ''
): EventResponseRoster {
	const sortedMembers = sortMembersByName(members);
	const latestResponses = getLatestResponsesByProfile(rows);
	const memberIds = new Set(sortedMembers.map((member) => member.profile_id));

	const responders = sortedMembers
		.filter((member) => latestResponses.has(member.profile_id))
		.map((member) => {
			const response = latestResponses.get(member.profile_id)!;

			return {
				member,
				response: response.response,
				updatedAt: response.updated_at,
				isCurrentUser: member.profile_id === currentUserId
			};
		})
		.sort(
			(left, right) =>
				new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime()
		);

	const nonResponders = sortedMembers
		.filter((member) => !latestResponses.has(member.profile_id))
		.map((member) => ({
			member,
			response: null,
			updatedAt: null,
			isCurrentUser: member.profile_id === currentUserId
		}));

	const externalResponseCount = [...latestResponses.values()].filter(
		(row) => !memberIds.has(row.profile_id)
	).length;

	return {
		totalMembers: sortedMembers.length,
		respondedCount: responders.length,
		nonResponderCount: nonResponders.length,
		externalResponseCount,
		responders,
		nonResponders
	};
}

export function getEventResponseRosterSummaryCopy(roster: EventResponseRoster) {
	if (roster.totalMembers === 0) {
		return 'Current member roster unavailable.';
	}

	const parts = [];

	if (roster.respondedCount === 0) {
		parts.push('No current members have replied yet.');
	} else if (roster.nonResponderCount === 0) {
		parts.push(`All ${roster.totalMembers} current member${roster.totalMembers === 1 ? '' : 's'} have replied.`);
	} else {
		parts.push(
			`${roster.respondedCount} of ${roster.totalMembers} current member${roster.totalMembers === 1 ? '' : 's'} replied. ${roster.nonResponderCount} still need${roster.nonResponderCount === 1 ? 's' : ''} follow-up.`
		);
	}

	if (roster.externalResponseCount > 0) {
		parts.push(
			`${roster.externalResponseCount} saved response${roster.externalResponseCount === 1 ? '' : 's'} belong${roster.externalResponseCount === 1 ? 's' : ''} to people no longer on the current roster.`
		);
	}

	return parts.join(' ');
}

export function formatEventAttendanceSummary(summary: EventAttendanceSummary) {
	return `${summary.going} going · ${summary.maybe} maybe · ${summary.cannotAttend} can't make it`;
}

export function formatEventResponseTotal(total: number) {
	return total === 1 ? '1 response so far' : `${total} responses so far`;
}
