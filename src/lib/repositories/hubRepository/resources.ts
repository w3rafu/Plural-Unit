/**
 * Hub resources repository — Supabase operations for member resource links and documents.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

const HUB_RESOURCE_SELECT =
	'id, organization_id, title, description, href, resource_type, sort_order, created_at, updated_at';

export type ResourceType = 'link' | 'form' | 'document' | 'contact';

export type ResourceRow = {
	id: string;
	organization_id: string;
	title: string;
	description: string;
	href: string;
	resource_type: ResourceType;
	sort_order: number;
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
