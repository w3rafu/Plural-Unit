/**
 * Hub resources repository — Supabase operations for member resource links and documents.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

const HUB_RESOURCE_SELECT =
	'id, organization_id, title, description, href, resource_type, sort_order, is_draft, archived_at, open_count, last_opened_at, created_at, updated_at';

export type ResourceType = 'link' | 'form' | 'document' | 'contact';

export type ResourceRow = {
	id: string;
	organization_id: string;
	title: string;
	description: string;
	href: string;
	resource_type: ResourceType;
	sort_order: number;
	is_draft?: boolean;
	archived_at?: string | null;
	open_count?: number;
	last_opened_at?: string | null;
	created_at: string;
	updated_at: string;
};

/** Fetch all resources for an organization, ordered for member display. */
export async function fetchResources(organizationId: string): Promise<ResourceRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.select(HUB_RESOURCE_SELECT)
		.eq('organization_id', organizationId)
		.order('sort_order', { ascending: true });

	if (error) throwRepositoryError(error, 'Could not load resources.');
	return (data ?? []) as ResourceRow[];
}

/** Insert a new resource and return the created row. */
export async function createResource(
	organizationId: string,
	payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
		sort_order: number;
		is_draft?: boolean;
	}
): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.insert({ organization_id: organizationId, ...payload })
		.select(HUB_RESOURCE_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not create the resource.');
	return data as ResourceRow;
}

/** Update a resource and return the latest row. */
export async function updateResource(
	resourceId: string,
	payload: {
		title: string;
		description: string;
		href: string;
		resource_type: ResourceType;
		sort_order?: number;
		is_draft?: boolean;
	}
): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.update(payload)
		.eq('id', resourceId)
		.select(HUB_RESOURCE_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not update the resource.');
	return data as ResourceRow;
}

/** Persist a new resource order. */
export async function saveResourceOrder(updates: Array<{ id: string; sort_order: number }>) {
	await Promise.all(
		updates.map(async (update) => {
			const { error } = await getSupabaseClient()
				.from('hub_resources')
				.update({ sort_order: update.sort_order })
				.eq('id', update.id);

			if (error) {
				throwRepositoryError(error, 'Could not save the resource order.');
			}
		})
	);
}

/** Permanently delete a resource by id. */
export async function deleteResource(id: string) {
	const { error } = await getSupabaseClient().from('hub_resources').delete().eq('id', id);
	if (error) throwRepositoryError(error, 'Could not delete the resource.');
}

/** Move a resource into archive history without permanently removing it. */
export async function archiveResource(resourceId: string): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.update({ is_draft: false, archived_at: new Date().toISOString() })
		.eq('id', resourceId)
		.select(HUB_RESOURCE_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not archive the resource.');
	return data as ResourceRow;
}

/** Restore an inactive resource back into the live list. */
export async function restoreResource(
	resourceId: string,
	payload: { sort_order: number }
): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient()
		.from('hub_resources')
		.update({ is_draft: false, archived_at: null, sort_order: payload.sort_order })
		.eq('id', resourceId)
		.select(HUB_RESOURCE_SELECT)
		.single();

	if (error) throwRepositoryError(error, 'Could not restore the resource.');
	return data as ResourceRow;
}

/** Record that a member opened a live resource. */
export async function recordResourceOpen(resourceId: string): Promise<ResourceRow> {
	const { data, error } = await getSupabaseClient().rpc('record_hub_resource_open', {
		target_resource_id: resourceId
	});

	if (error) throwRepositoryError(error, 'Could not record the resource open.');

	const row = Array.isArray(data) ? data[0] : data;
	return row as ResourceRow;
}
