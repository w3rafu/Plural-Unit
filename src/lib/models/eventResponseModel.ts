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

function sortEventResponses(rows: EventResponseRow[]) {
	return [...rows].sort(
		(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
	);
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

export function formatEventAttendanceSummary(summary: EventAttendanceSummary) {
	return `${summary.going} going · ${summary.maybe} maybe · ${summary.cannotAttend} can't make it`;
}

export function formatEventResponseTotal(total: number) {
	return total === 1 ? '1 response so far' : `${total} responses so far`;
}
