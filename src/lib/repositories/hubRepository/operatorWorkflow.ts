/**
 * Hub operator workflow repository — Supabase operations for shared review state.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

const HUB_OPERATOR_WORKFLOW_STATE_SELECT =
	'organization_id, workflow_key, workflow_kind, status, reviewed_by_profile_id, note, reviewed_against_signature, created_at, updated_at';

export type HubOperatorWorkflowStateKind = 'execution_item' | 'followup_signal';

export type HubOperatorWorkflowStateStatus = 'reviewed' | 'deferred';

export type HubOperatorWorkflowStateRow = {
	organization_id: string;
	workflow_key: string;
	workflow_kind: HubOperatorWorkflowStateKind;
	status: HubOperatorWorkflowStateStatus;
	reviewed_by_profile_id: string;
	note: string;
	reviewed_against_signature: string | null;
	created_at: string;
	updated_at: string;
};

export type HubOperatorWorkflowStateMutationPayload = {
	organization_id: string;
	workflow_key: string;
	workflow_kind: HubOperatorWorkflowStateKind;
	status: HubOperatorWorkflowStateStatus;
	reviewed_by_profile_id: string;
	note: string;
	reviewed_against_signature: string | null;
};

export async function fetchHubOperatorWorkflowState(
	organizationId: string
): Promise<HubOperatorWorkflowStateRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_operator_workflow_state')
		.select(HUB_OPERATOR_WORKFLOW_STATE_SELECT)
		.eq('organization_id', organizationId)
		.order('updated_at', { ascending: false });

	if (error) throwRepositoryError(error, 'Could not load shared operator workflow state.');
	return (data ?? []) as HubOperatorWorkflowStateRow[];
}

export async function upsertHubOperatorWorkflowStateEntries(
	entries: HubOperatorWorkflowStateMutationPayload[]
): Promise<HubOperatorWorkflowStateRow[]> {
	if (entries.length === 0) {
		return [];
	}

	const rows = await Promise.all(
		entries.map(async (entry) => {
			const { data, error } = await getSupabaseClient()
				.from('hub_operator_workflow_state')
				.upsert(entry, { onConflict: 'organization_id,workflow_key' })
				.select(HUB_OPERATOR_WORKFLOW_STATE_SELECT)
				.single();

			if (error) throwRepositoryError(error, 'Could not sync shared operator workflow state.');
			return data as HubOperatorWorkflowStateRow;
		})
	);

	return rows;
}

export async function deleteHubOperatorWorkflowStateEntries(
	organizationId: string,
	workflowKeys: string[]
) {
	if (workflowKeys.length === 0) {
		return;
	}

	await Promise.all(
		workflowKeys.map(async (workflowKey) => {
			const { error } = await getSupabaseClient()
				.from('hub_operator_workflow_state')
				.delete()
				.match({ organization_id: organizationId, workflow_key: workflowKey });

			if (error) throwRepositoryError(error, 'Could not clear shared operator workflow state.');
		})
	);
}