import type { OrganizationMember } from '$lib/models/organizationModel';
import type { HubOperatorWorkflowStateRow } from '$lib/repositories/hubRepository';
import { formatRelativeDateTime } from '$lib/utils/dateFormat';
import type { HubExecutionTriageStatus } from './hubExecutionQueue';

export const MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH = 160;

export type HubOperatorWorkflowSummary = {
	workflowKey: string;
	status: HubExecutionTriageStatus;
	statusLabel: string;
	actorLabel: string;
	timestampCopy: string;
	summaryCopy: string;
	note: string | null;
};

function compactWorkflowNoteWhitespace(value: string) {
	return value.replace(/\s+/g, ' ').trim();
}

function getHubOperatorWorkflowStatusLabel(status: HubExecutionTriageStatus) {
	return status === 'reviewed' ? 'Reviewed' : 'Deferred';
}

function getHubOperatorWorkflowActorLabel(input: {
	reviewedByProfileId: string | null;
	members?: Array<Pick<OrganizationMember, 'profile_id' | 'name'>>;
	ownProfileId?: string | null;
}) {
	if (input.reviewedByProfileId && input.ownProfileId === input.reviewedByProfileId) {
		return 'You';
	}

	const memberName = input.members
		?.find((member) => member.profile_id === input.reviewedByProfileId)
		?.name?.trim();

	return memberName || 'Another admin';
}

export function normalizeHubOperatorWorkflowNote(note: string | null | undefined) {
	const normalizedNote = compactWorkflowNoteWhitespace(note ?? '');
	if (!normalizedNote) {
		return '';
	}

	return normalizedNote.slice(0, MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH).trim();
}

export function buildHubOperatorWorkflowSummary(input: {
	row: Pick<
		HubOperatorWorkflowStateRow,
		'workflow_key' | 'status' | 'reviewed_by_profile_id' | 'note' | 'updated_at'
	>;
	members?: Array<Pick<OrganizationMember, 'profile_id' | 'name'>>;
	ownProfileId?: string | null;
	now?: number;
}): HubOperatorWorkflowSummary {
	const statusLabel = getHubOperatorWorkflowStatusLabel(input.row.status);
	const actorLabel = getHubOperatorWorkflowActorLabel({
		reviewedByProfileId: input.row.reviewed_by_profile_id,
		members: input.members,
		ownProfileId: input.ownProfileId
	});
	const timestampCopy = formatRelativeDateTime(input.row.updated_at, input.now);
	const note = normalizeHubOperatorWorkflowNote(input.row.note) || null;

	return {
		workflowKey: input.row.workflow_key,
		status: input.row.status,
		statusLabel,
		actorLabel,
		timestampCopy,
		summaryCopy: timestampCopy
			? `${statusLabel} by ${actorLabel} ${timestampCopy}.`
			: `${statusLabel} by ${actorLabel}.`,
		note
	};
}