/**
 * currentHub/resources — resource-specific mutations and ordering helpers.
 *
 * Resource writes are simple CRUD, but ordering is part of the persisted
 * state, so this file also owns the save-and-reindex flow for reordering.
 */

import {
	moveResourceRows,
	removeResourceRow,
	replaceResourceRow,
	sortResourceRows,
	type ResourceMoveDirection
} from '$lib/models/resourcesModel';
import {
	createResource,
	deleteResource,
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
	};
}) {
	const row = await createResource(input.orgId, {
		...input.payload,
		sort_order: sortResourceRows(input.currentRows).length
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
	};
}) {
	const sortOrder =
		input.currentRows.find((resource) => resource.id === input.resourceId)?.sort_order ?? 0;
	const row = await updateResource(input.resourceId, { ...input.payload, sort_order: sortOrder });
	return replaceResourceRow(input.currentRows, row);
}

export async function moveCurrentHubResource(input: {
	resourceId: string;
	direction: ResourceMoveDirection;
	currentRows: ResourceRow[];
}) {
	const orderedRows = sortResourceRows(input.currentRows);
	const nextRows = moveResourceRows(orderedRows, input.resourceId, input.direction);
	if (orderedRows.map((row) => row.id).join('|') === nextRows.map((row) => row.id).join('|')) {
		return input.currentRows;
	}

	await saveResourceOrder(nextRows.map((row) => ({ id: row.id, sort_order: row.sort_order })));
	return nextRows;
}

export async function removeCurrentHubResource(input: {
	resourceId: string;
	currentRows: ResourceRow[];
}) {
	await deleteResource(input.resourceId);
	const nextRows = removeResourceRow(input.currentRows, input.resourceId).map((row, index) => ({
		...row,
		sort_order: index
	}));

	await saveResourceOrder(nextRows.map((row) => ({ id: row.id, sort_order: row.sort_order })));
	return nextRows;
}
