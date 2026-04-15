import { describe, expect, it } from 'vitest';
import {
	MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH,
	buildHubOperatorWorkflowSummary,
	normalizeHubOperatorWorkflowNote
} from './hubOperatorWorkflowModel';

describe('hubOperatorWorkflowModel', () => {
	it('normalizes workflow notes into one compact snippet', () => {
		const longNote = 'x'.repeat(MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH + 24);

		expect(normalizeHubOperatorWorkflowNote('  Hold   for\nnext   admin  ')).toBe(
			'Hold for next admin'
		);
		expect(normalizeHubOperatorWorkflowNote('   ')).toBe('');
		expect(normalizeHubOperatorWorkflowNote(longNote)).toHaveLength(
			MAX_HUB_OPERATOR_WORKFLOW_NOTE_LENGTH
		);
	});

	it('builds reviewer-aware workflow summaries with roster fallback', () => {
		expect(
			buildHubOperatorWorkflowSummary({
				row: {
					workflow_key: 'execution:publish-1',
					status: 'reviewed',
					reviewed_by_profile_id: 'profile-2',
					note: '  Bring printed roster.  ',
					updated_at: '2026-04-15T10:00:00.000Z'
				},
				members: [{ profile_id: 'profile-2', name: 'Bea' }],
				now: new Date('2026-04-15T12:00:00.000Z').getTime()
			})
		).toMatchObject({
			actorLabel: 'Bea',
			summaryCopy: 'Reviewed by Bea 2 hours ago.',
			note: 'Bring printed roster.'
		});

		expect(
			buildHubOperatorWorkflowSummary({
				row: {
					workflow_key: 'followup:event-1:no_show',
					status: 'deferred',
					reviewed_by_profile_id: 'profile-1',
					note: '',
					updated_at: '2026-04-15T11:30:00.000Z'
				},
				members: [],
				ownProfileId: 'profile-1',
				now: new Date('2026-04-15T12:00:00.000Z').getTime()
			})
		).toMatchObject({
			actorLabel: 'You',
			summaryCopy: 'Deferred by You 30 minutes ago.',
			note: null
		});

		expect(
			buildHubOperatorWorkflowSummary({
				row: {
					workflow_key: 'execution:publish-2',
					status: 'reviewed',
					reviewed_by_profile_id: 'profile-9',
					note: '',
					updated_at: '2026-04-15T09:00:00.000Z'
				},
				members: [],
				now: new Date('2026-04-15T12:00:00.000Z').getTime()
			})
		).toMatchObject({
			actorLabel: 'Another admin',
			summaryCopy: 'Reviewed by Another admin 3 hours ago.'
		});
	});
});