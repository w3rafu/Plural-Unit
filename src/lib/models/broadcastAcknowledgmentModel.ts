/**
 * Broadcast acknowledgment model — derives per-broadcast acknowledgment state
 * from flat acknowledgment rows.
 */

import type { BroadcastAcknowledgmentRow } from '$lib/repositories/hubRepository';

export type BroadcastAcknowledgmentMap = Record<string, BroadcastAcknowledgmentRow[]>;

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
