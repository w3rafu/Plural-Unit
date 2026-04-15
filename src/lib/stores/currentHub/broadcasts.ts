/**
 * currentHub/broadcasts — broadcast-specific mutations for the hub store.
 *
 * These helpers wrap repository writes and immediately normalize the returned
 * rows back into the store's in-memory collections.
 */

import {
	removeBroadcastRow,
	replaceBroadcastRow
} from '$lib/models/broadcastLifecycleModel';
import {
	archiveBroadcast,
	createBroadcast,
	deleteBroadcast,
	publishBroadcastNow,
	restoreBroadcast,
	saveBroadcastDraft,
	scheduleBroadcast,
	setBroadcastPinned,
	updateBroadcast,
	type BroadcastMutationPayload,
	type BroadcastRow
} from '$lib/repositories/hubRepository';

async function syncAndReplaceBroadcastRow(input: {
	currentRows: BroadcastRow[];
	row: BroadcastRow;
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const syncedRow = await input.syncBroadcastDeliveryRow(input.row);
	return replaceBroadcastRow(input.currentRows, syncedRow);
}

export async function addCurrentHubBroadcast(input: {
	orgId: string;
	payload: BroadcastMutationPayload;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await createBroadcast(input.orgId, input.payload);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function updateCurrentHubBroadcast(input: {
	broadcastId: string;
	payload: BroadcastMutationPayload;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await updateBroadcast(input.broadcastId, input.payload);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function saveCurrentHubBroadcastDraft(input: {
	broadcastId: string;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await saveBroadcastDraft(input.broadcastId);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function scheduleCurrentHubBroadcast(input: {
	broadcastId: string;
	publishAt: string;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await scheduleBroadcast(input.broadcastId, input.publishAt);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function publishCurrentHubBroadcastNow(input: {
	broadcastId: string;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await publishBroadcastNow(input.broadcastId);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function setCurrentHubBroadcastPinned(input: {
	orgId: string;
	broadcastId: string;
	isPinned: boolean;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await setBroadcastPinned(input.orgId, input.broadcastId, input.isPinned);
	const syncedRow = await input.syncBroadcastDeliveryRow(row);
	const nextRows = input.currentRows.map((broadcast) =>
		broadcast.organization_id === input.orgId ? { ...broadcast, is_pinned: false } : broadcast
	);

	return replaceBroadcastRow(nextRows, syncedRow);
}

export async function archiveCurrentHubBroadcast(input: {
	broadcastId: string;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await archiveBroadcast(input.broadcastId);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function restoreCurrentHubBroadcast(input: {
	broadcastId: string;
	currentRows: BroadcastRow[];
	syncBroadcastDeliveryRow: (row: BroadcastRow) => Promise<BroadcastRow>;
}) {
	const row = await restoreBroadcast(input.broadcastId);
	return syncAndReplaceBroadcastRow({
		currentRows: input.currentRows,
		row,
		syncBroadcastDeliveryRow: input.syncBroadcastDeliveryRow
	});
}

export async function removeCurrentHubBroadcast(input: {
	broadcastId: string;
	currentRows: BroadcastRow[];
}) {
	await deleteBroadcast(input.broadcastId);
	return removeBroadcastRow(input.currentRows, input.broadcastId);
}
