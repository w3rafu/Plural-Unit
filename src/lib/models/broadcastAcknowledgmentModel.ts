/**
 * Broadcast acknowledgment model — derives per-broadcast acknowledgment state
 * from flat acknowledgment rows.
 */

import type { OrganizationMember } from '$lib/models/organizationModel';
import type { BroadcastAcknowledgmentRow } from '$lib/repositories/hubRepository';

export type BroadcastAcknowledgmentMap = Record<string, BroadcastAcknowledgmentRow[]>;

export type BroadcastAcknowledgmentRosterEntry = {
	member: OrganizationMember;
	acknowledgedAt: string | null;
	isCurrentUser: boolean;
};

export type BroadcastAcknowledgmentRoster = {
	totalMembers: number;
	acknowledgedCount: number;
	pendingCount: number;
	externalAcknowledgmentCount: number;
	acknowledgedEntries: BroadcastAcknowledgmentRosterEntry[];
	pendingEntries: BroadcastAcknowledgmentRosterEntry[];
};

function sortAcknowledgments(rows: BroadcastAcknowledgmentRow[]) {
	return [...rows].sort(
		(a, b) => new Date(b.acknowledged_at).getTime() - new Date(a.acknowledged_at).getTime()
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

function getLatestAcknowledgmentsByProfile(rows: BroadcastAcknowledgmentRow[]) {
	const latestAcknowledgments = new Map<string, BroadcastAcknowledgmentRow>();

	for (const row of sortAcknowledgments(rows)) {
		if (!latestAcknowledgments.has(row.profile_id)) {
			latestAcknowledgments.set(row.profile_id, row);
		}
	}

	return latestAcknowledgments;
}

export function buildBroadcastAcknowledgmentMap(
	rows: BroadcastAcknowledgmentRow[]
): BroadcastAcknowledgmentMap {
	const map: BroadcastAcknowledgmentMap = {};
	for (const row of rows) {
		const key = row.broadcast_id;
		if (!map[key]) map[key] = [];
		map[key].push(row);
	}
	return map;
}

export function getBroadcastAcknowledgmentCount(
	map: BroadcastAcknowledgmentMap,
	broadcastId: string
): number {
	return map[broadcastId]?.length ?? 0;
}

export function hasMemberAcknowledgedBroadcast(
	map: BroadcastAcknowledgmentMap,
	broadcastId: string,
	profileId: string
): boolean {
	return map[broadcastId]?.some((row) => row.profile_id === profileId) ?? false;
}

export function addAcknowledgmentToMap(
	map: BroadcastAcknowledgmentMap,
	row: BroadcastAcknowledgmentRow
): BroadcastAcknowledgmentMap {
	const existing = map[row.broadcast_id] ?? [];
	if (existing.some((r) => r.profile_id === row.profile_id)) return map;
	return { ...map, [row.broadcast_id]: [...existing, row] };
}

export function removeAcknowledgmentFromMap(
	map: BroadcastAcknowledgmentMap,
	broadcastId: string,
	profileId: string
): BroadcastAcknowledgmentMap {
	const existing = map[broadcastId];
	if (!existing) return map;
	const filtered = existing.filter((r) => r.profile_id !== profileId);
	if (filtered.length === 0) {
		const next = { ...map };
		delete next[broadcastId];
		return next;
	}
	return { ...map, [broadcastId]: filtered };
}

export function buildBroadcastAcknowledgmentRoster(
	members: OrganizationMember[],
	rows: BroadcastAcknowledgmentRow[],
	currentUserId = ''
): BroadcastAcknowledgmentRoster {
	const sortedMembers = sortMembersByName(members);
	const latestAcknowledgments = getLatestAcknowledgmentsByProfile(rows);
	const memberIds = new Set(sortedMembers.map((member) => member.profile_id));

	const acknowledgedEntries = sortedMembers
		.filter((member) => latestAcknowledgments.has(member.profile_id))
		.map((member) => {
			const acknowledgment = latestAcknowledgments.get(member.profile_id)!;

			return {
				member,
				acknowledgedAt: acknowledgment.acknowledged_at,
				isCurrentUser: member.profile_id === currentUserId
			};
		})
		.sort(
			(left, right) =>
				new Date(right.acknowledgedAt ?? 0).getTime() - new Date(left.acknowledgedAt ?? 0).getTime()
		);

	const pendingEntries = sortedMembers
		.filter((member) => !latestAcknowledgments.has(member.profile_id))
		.map((member) => ({
			member,
			acknowledgedAt: null,
			isCurrentUser: member.profile_id === currentUserId
		}));

	const externalAcknowledgmentCount = [...latestAcknowledgments.values()].filter(
		(row) => !memberIds.has(row.profile_id)
	).length;

	return {
		totalMembers: sortedMembers.length,
		acknowledgedCount: acknowledgedEntries.length,
		pendingCount: pendingEntries.length,
		externalAcknowledgmentCount,
		acknowledgedEntries,
		pendingEntries
	};
}

export function getBroadcastAcknowledgmentRosterSummaryCopy(roster: BroadcastAcknowledgmentRoster) {
	if (roster.totalMembers === 0) {
		return 'Current member roster unavailable.';
	}

	const parts = [];

	if (roster.acknowledgedCount === 0) {
		parts.push('No current members have acknowledged this broadcast yet.');
	} else if (roster.pendingCount === 0) {
		parts.push(
			`All ${roster.totalMembers} current member${roster.totalMembers === 1 ? '' : 's'} acknowledged this broadcast.`
		);
	} else {
		parts.push(
			`${roster.acknowledgedCount} of ${roster.totalMembers} current member${roster.totalMembers === 1 ? '' : 's'} acknowledged this broadcast. ${roster.pendingCount} still need${roster.pendingCount === 1 ? 's' : ''} follow-up.`
		);
	}

	if (roster.externalAcknowledgmentCount > 0) {
		parts.push(
			`${roster.externalAcknowledgmentCount} saved acknowledgment${roster.externalAcknowledgmentCount === 1 ? '' : 's'} belong${roster.externalAcknowledgmentCount === 1 ? 's' : ''} to people no longer on the current roster.`
		);
	}

	return parts.join(' ');
}
