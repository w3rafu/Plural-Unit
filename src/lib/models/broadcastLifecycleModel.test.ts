import { describe, expect, it } from 'vitest';
import {
	getBroadcastStateLabel,
	isBroadcastActive,
	isBroadcastArchived,
	isBroadcastDraft,
	isBroadcastExpired,
	isBroadcastLive,
	isBroadcastScheduled,
	parseBroadcastDateTimeLocalValue,
	replaceBroadcastRow,
	sortDraftBroadcasts,
	sortActiveBroadcasts,
	sortInactiveBroadcasts,
	sortScheduledBroadcasts,
	toBroadcastDateTimeLocalValue
} from './broadcastLifecycleModel';

function makeBroadcast(
	overrides: Partial<{
		id: string;
		title: string;
		body: string;
		organization_id: string;
		created_at: string;
		updated_at: string;
		is_pinned: boolean;
		is_draft: boolean;
		publish_at: string | null;
		archived_at: string | null;
		expires_at: string | null;
	}> = {}
) {
	return {
		id: overrides.id ?? 'b1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Broadcast',
		body: overrides.body ?? 'Body',
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z',
		is_pinned: overrides.is_pinned ?? false,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? null,
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null
	};
}

describe('broadcastLifecycleModel', () => {
	it('treats archived and expired broadcasts as inactive', () => {
		expect(isBroadcastArchived(makeBroadcast({ archived_at: '2026-04-12T12:00:00.000Z' }))).toBe(true);
		expect(
			isBroadcastExpired(
				makeBroadcast({ expires_at: '2026-04-12T09:59:00.000Z' }),
				new Date('2026-04-12T10:00:00.000Z').getTime()
			)
		).toBe(true);
		expect(
			isBroadcastActive(
				makeBroadcast({ expires_at: '2026-04-12T11:00:00.000Z' }),
				new Date('2026-04-12T10:00:00.000Z').getTime()
			)
		).toBe(true);
		expect(isBroadcastDraft(makeBroadcast({ is_draft: true }))).toBe(true);
		expect(
			isBroadcastScheduled(
				makeBroadcast({ publish_at: '2026-04-12T11:00:00.000Z' }),
				new Date('2026-04-12T10:00:00.000Z').getTime()
			)
		).toBe(true);
		expect(
			isBroadcastLive(
				makeBroadcast({ publish_at: '2026-04-12T09:00:00.000Z' }),
				new Date('2026-04-12T10:00:00.000Z').getTime()
			)
		).toBe(true);
	});

	it('sorts active broadcasts with pinned items first', () => {
		const sorted = sortActiveBroadcasts(
			[
				makeBroadcast({ id: 'b1', created_at: '2026-04-12T09:00:00.000Z' }),
				makeBroadcast({ id: 'b2', created_at: '2026-04-12T08:00:00.000Z', is_pinned: true }),
				makeBroadcast({ id: 'b3', created_at: '2026-04-12T10:00:00.000Z' }),
				makeBroadcast({ id: 'b4', archived_at: '2026-04-12T11:00:00.000Z' }),
				makeBroadcast({ id: 'b5', is_draft: true }),
				makeBroadcast({ id: 'b6', publish_at: '2026-04-12T12:00:00.000Z' })
			],
			new Date('2026-04-12T10:00:00.000Z').getTime()
		);

		expect(sorted.map((broadcast) => broadcast.id)).toEqual(['b2', 'b3', 'b1']);
	});

	it('sorts drafts by most recently updated first', () => {
		const sorted = sortDraftBroadcasts([
			makeBroadcast({ id: 'b1', is_draft: true, updated_at: '2026-04-12T09:00:00.000Z' }),
			makeBroadcast({ id: 'b2', is_draft: true, updated_at: '2026-04-12T11:00:00.000Z' }),
			makeBroadcast({ id: 'b3', publish_at: '2026-04-12T12:00:00.000Z' })
		]);

		expect(sorted.map((broadcast) => broadcast.id)).toEqual(['b2', 'b1']);
	});

	it('sorts scheduled broadcasts by publish time', () => {
		const sorted = sortScheduledBroadcasts(
			[
				makeBroadcast({ id: 'b1', publish_at: '2026-04-12T12:00:00.000Z' }),
				makeBroadcast({ id: 'b2', publish_at: '2026-04-12T11:00:00.000Z' }),
				makeBroadcast({ id: 'b3', is_draft: true })
			],
			new Date('2026-04-12T10:00:00.000Z').getTime()
		);

		expect(sorted.map((broadcast) => broadcast.id)).toEqual(['b2', 'b1']);
	});

	it('sorts inactive broadcasts by the latest relevant lifecycle time', () => {
		const sorted = sortInactiveBroadcasts([
			makeBroadcast({ id: 'b1', archived_at: '2026-04-12T10:00:00.000Z' }),
			makeBroadcast({ id: 'b2', expires_at: '2026-04-12T12:00:00.000Z' }),
			makeBroadcast({ id: 'b3', archived_at: '2026-04-12T11:00:00.000Z' })
		], new Date('2026-04-12T13:00:00.000Z').getTime());

		expect(sorted.map((broadcast) => broadcast.id)).toEqual(['b2', 'b3', 'b1']);
	});

	it('replaces existing rows when a broadcast is updated', () => {
		const rows = [makeBroadcast({ id: 'b1' }), makeBroadcast({ id: 'b2' })];
		const nextRows = replaceBroadcastRow(rows, makeBroadcast({ id: 'b1', title: 'Updated' }));

		expect(nextRows).toHaveLength(2);
		expect(nextRows.find((broadcast) => broadcast.id === 'b1')?.title).toBe('Updated');
	});

	it('formats and parses datetime-local values for the editor form', () => {
		expect(toBroadcastDateTimeLocalValue('2026-04-12T10:30:00.000Z')).toMatch(/^2026-04-12T/);
		expect(parseBroadcastDateTimeLocalValue('')).toBeNull();
		expect(() => parseBroadcastDateTimeLocalValue('not-a-date')).toThrow(
			'Pick a valid date and time.'
		);
		expect(() => parseBroadcastDateTimeLocalValue('still-not-a-date', 'Bad publish value.')).toThrow(
			'Bad publish value.'
		);
	});

	it('returns clear state labels for member and admin surfaces', () => {
		expect(getBroadcastStateLabel(makeBroadcast({ is_draft: true }))).toBe('Draft');
		expect(
			getBroadcastStateLabel(
				makeBroadcast({ publish_at: '2026-04-12T11:00:00.000Z' }),
				new Date('2026-04-12T10:00:00.000Z').getTime()
			)
		).toBe('Scheduled');
		expect(getBroadcastStateLabel(makeBroadcast({ is_pinned: true }))).toBe('Pinned');
		expect(getBroadcastStateLabel(makeBroadcast({ archived_at: '2026-04-12T11:00:00.000Z' }))).toBe('Archived');
		expect(
			getBroadcastStateLabel(
				makeBroadcast({ expires_at: '2026-04-12T09:00:00.000Z' }),
				new Date('2026-04-12T10:00:00.000Z').getTime()
			)
		).toBe('Expired');
	});
});
