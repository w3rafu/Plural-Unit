/**
 * currentHub/resources — resource-specific mutations and ordering helpers.
 *
 * Resource writes are simple CRUD, but ordering is part of the persisted
 * state, so this file also owns the save-and-reindex flow for reordering.
 */

import {
	isResourceLive,
	moveResourceRows,
	removeResourceRow,
	replaceResourceRow,
	sortLiveResourceRows,
	type ResourceMoveDirection
} from '$lib/models/resourcesModel';
import {
	archiveResource,
	createResource,
	deleteResource,
	recordResourceOpen,
	restoreResource,
	saveResourceOrder,
	updateResource,
	type ResourceRow,
	type ResourceType
} from '$lib/repositories/hubRepository';

export async function addCurrentHubResource(input: {
	orgId: string;
	currentRows: ResourceRow[];
	payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
		is_draft?: boolean;
	};
}) {
	const row = await createResource(input.orgId, {
		...input.payload,
		sort_order: sortLiveResourceRows(input.currentRows).length
	});

	return replaceResourceRow(input.currentRows, row);
}

export async function updateCurrentHubResource(input: {
	resourceId: string;
	currentRows: ResourceRow[];
	payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
		is_draft?: boolean;
	};
}) {
	const existingRow = input.currentRows.find((resource) => resource.id === input.resourceId) ?? null;
	const wasLive = existingRow ? isResourceLive(existingRow) : false;
	const nextSortOrder = input.payload.is_draft
		? existingRow?.sort_order ?? 0
		: wasLive
			? existingRow?.sort_order ?? 0
			: sortLiveResourceRows(input.currentRows).length;
	const row = await updateResource(input.resourceId, {
		...input.payload,
		sort_order: nextSortOrder
	});
	const nextRows = replaceResourceRow(input.currentRows, row);

	if (wasLive && input.payload.is_draft) {
		const liveRows = removeResourceRow(
			nextRows.filter((resource) => isResourceLive(resource)),
			input.resourceId
		).map((resource, index) => ({ ...resource, sort_order: index }));

		await saveResourceOrder(liveRows.map((resource) => ({ id: resource.id, sort_order: resource.sort_order })));
		return [...liveRows, row, ...nextRows.filter((resource) => !isResourceLive(resource) && resource.id !== row.id)];
	}

	return nextRows;
}

export async function moveCurrentHubResource(input: {
	resourceId: string;
	direction: ResourceMoveDirection;
	currentRows: ResourceRow[];
}) {
	const orderedRows = sortLiveResourceRows(input.currentRows);
	const nextRows = moveResourceRows(orderedRows, input.resourceId, input.direction);
	if (orderedRows.map((row) => row.id).join('|') === nextRows.map((row) => row.id).join('|')) {
		return input.currentRows;
	}

	await saveResourceOrder(nextRows.map((row) => ({ id: row.id, sort_order: row.sort_order })));
	return [...nextRows, ...input.currentRows.filter((row) => !isResourceLive(row))];
}

export async function archiveCurrentHubResource(input: {
	resourceId: string;
	currentRows: ResourceRow[];
}) {
	const archivedRow = await archiveResource(input.resourceId);
	const remainingLiveRows = removeResourceRow(
		input.currentRows.filter((row) => isResourceLive(row)),
		input.resourceId
	).map((row, index) => ({
		...row,
		sort_order: index
	}));

	await saveResourceOrder(remainingLiveRows.map((row) => ({ id: row.id, sort_order: row.sort_order })));

	return [
		...remainingLiveRows,
		archivedRow,
		...input.currentRows.filter((row) => !isResourceLive(row) && row.id !== input.resourceId)
	];
}

export async function restoreCurrentHubResource(input: {
	resourceId: string;
	currentRows: ResourceRow[];
}) {
	const nextSortOrder = sortLiveResourceRows(input.currentRows).length;
	const restoredRow = await restoreResource(input.resourceId, { sort_order: nextSortOrder });
	return replaceResourceRow(input.currentRows, restoredRow);
}

export async function removeCurrentHubResource(input: {
	resourceId: string;
	currentRows: ResourceRow[];
}) {
	await deleteResource(input.resourceId);

	const nextLiveRows = removeResourceRow(
		input.currentRows.filter((row) => isResourceLive(row)),
		input.resourceId
	).map((row, index) => ({
		...row,
		sort_order: index
	}));

	await saveResourceOrder(nextLiveRows.map((row) => ({ id: row.id, sort_order: row.sort_order })));

	return [
		...nextLiveRows,
		...input.currentRows.filter((row) => !isResourceLive(row) && row.id !== input.resourceId)
	];
}

export async function recordCurrentHubResourceOpen(input: {
	resourceId: string;
	currentRows: ResourceRow[];
}) {
	const row = await recordResourceOpen(input.resourceId);
	return replaceResourceRow(input.currentRows, row);
}
