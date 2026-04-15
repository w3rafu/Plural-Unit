/**
 * Hub execution ledger repository — Supabase operations for scheduled hub work.
 */

import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';

const HUB_EXECUTION_LEDGER_SELECT =
	'id, organization_id, job_kind, source_id, execution_key, due_at, execution_state, processed_at, last_attempted_at, attempt_count, last_failure_reason, created_at, updated_at';

export type HubExecutionJobKind = 'broadcast_publish' | 'event_publish' | 'event_reminder';

export type HubExecutionState = 'pending' | 'processed' | 'failed' | 'skipped';

export type HubExecutionLedgerRow = {
	id: string;
	organization_id: string;
	job_kind: HubExecutionJobKind;
	source_id: string;
	execution_key: string;
	due_at: string;
	execution_state: HubExecutionState;
	processed_at: string | null;
	last_attempted_at: string | null;
	attempt_count: number;
	last_failure_reason: string | null;
	created_at: string;
	updated_at: string;
};

export type HubExecutionLedgerMutationPayload = {
	organization_id: string;
	job_kind: HubExecutionJobKind;
	source_id: string;
	execution_key: string;
	due_at: string;
	execution_state: HubExecutionState;
	processed_at: string | null;
	last_attempted_at: string | null;
	attempt_count: number;
	last_failure_reason: string | null;
};

export async function fetchHubExecutionLedger(
	organizationId: string
): Promise<HubExecutionLedgerRow[]> {
	const { data, error } = await getSupabaseClient()
		.from('hub_execution_ledger')
		.select(HUB_EXECUTION_LEDGER_SELECT)
		.eq('organization_id', organizationId)
		.order('due_at', { ascending: true });

	if (error) throwRepositoryError(error, 'Could not load the execution ledger.');
	return (data ?? []) as HubExecutionLedgerRow[];
}

export async function upsertHubExecutionLedgerEntries(
	entries: HubExecutionLedgerMutationPayload[]
): Promise<HubExecutionLedgerRow[]> {
	if (entries.length === 0) {
		return [];
	}

	const rows = await Promise.all(
		entries.map(async (entry) => {
			const { data, error } = await getSupabaseClient()
				.from('hub_execution_ledger')
				.upsert(entry, { onConflict: 'job_kind,source_id,execution_key' })
				.select(HUB_EXECUTION_LEDGER_SELECT)
				.single();

			if (error) throwRepositoryError(error, 'Could not sync the execution ledger.');
			return data as HubExecutionLedgerRow;
		})
	);

	return rows;
}

export async function deleteHubExecutionLedgerEntries(entryIds: string[]) {
	if (entryIds.length === 0) {
		return;
	}

	await Promise.all(
		entryIds.map(async (entryId) => {
			const { error } = await getSupabaseClient()
				.from('hub_execution_ledger')
				.delete()
				.eq('id', entryId);

			if (error) throwRepositoryError(error, 'Could not prune stale execution ledger entries.');
		})
	);
}

export async function processDueHubReminderExecutions(
	organizationId: string
): Promise<HubExecutionLedgerRow[]> {
	const { data, error } = await getSupabaseClient().rpc('process_hub_due_reminder_executions', {
		target_organization_id: organizationId
	});

	if (error) throwRepositoryError(error, 'Could not process due reminder alerts.');
	return (data ?? []) as HubExecutionLedgerRow[];
}
