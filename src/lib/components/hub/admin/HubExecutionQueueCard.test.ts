// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BroadcastRow, HubExecutionLedgerRow } from '$lib/repositories/hubRepository';

const { mockGoto, mockPage } = vi.hoisted(() => ({
	mockGoto: vi.fn(),
	mockPage: {
		url: new URL('https://example.com/hub/manage/content')
	}
}));

vi.mock('$app/navigation', () => ({
	goto: (...args: any[]) => mockGoto(...args)
}));

vi.mock('$app/state', () => ({
	page: mockPage
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: () => false,
	shouldHydrateSmokeHubState: () => false,
	getSmokeModeHubLoadError: () => null
}));

import HubExecutionQueueCard from './HubExecutionQueueCard.svelte';
import { currentHub } from '$lib/stores/currentHub.svelte';

function makeBroadcast(overrides: Partial<BroadcastRow> = {}): BroadcastRow {
	return {
		id: overrides.id ?? 'b1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Weekly notes',
		body: overrides.body ?? 'A short update.',
		created_at: overrides.created_at ?? '2026-04-14T08:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-14T08:00:00.000Z',
		is_pinned: overrides.is_pinned ?? false,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? '2026-04-14T10:00:00.000Z',
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? 'published',
		delivered_at: overrides.delivered_at ?? '2026-04-14T10:05:00.000Z',
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeExecutionLedgerRow(overrides: Partial<HubExecutionLedgerRow> = {}): HubExecutionLedgerRow {
	return {
		id: overrides.id ?? 'processed-broadcast',
		organization_id: overrides.organization_id ?? 'org-1',
		job_kind: overrides.job_kind ?? 'broadcast_publish',
		source_id: overrides.source_id ?? 'b1',
		execution_key: overrides.execution_key ?? 'publish',
		due_at: overrides.due_at ?? '2026-04-14T10:00:00.000Z',
		execution_state: overrides.execution_state ?? 'processed',
		processed_at: overrides.processed_at ?? '2026-04-14T10:05:00.000Z',
		last_attempted_at: overrides.last_attempted_at ?? '2026-04-14T10:05:00.000Z',
		attempt_count: overrides.attempt_count ?? 1,
		last_failure_reason: overrides.last_failure_reason ?? null,
		created_at: overrides.created_at ?? '2026-04-14T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-14T10:05:00.000Z'
	};
}

describe('HubExecutionQueueCard', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));
		currentHub.reset();
		currentHub.broadcasts = [makeBroadcast()];
		currentHub.executionLedger = [makeExecutionLedgerRow()];
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		vi.restoreAllMocks();
		currentHub.reset();
	});

	it('submits inline handoff notes through the existing review action', async () => {
		const reviewSpy = vi
			.spyOn(currentHub, 'markExecutionQueueItemReviewed')
			.mockResolvedValue(undefined);

		render(HubExecutionQueueCard);

		await fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
		await fireEvent.input(
			screen.getByPlaceholderText('Add a short handoff note for the next admin.'),
			{
				target: { value: '  Bring   roster   list  ' }
			}
		);
		await fireEvent.click(screen.getByRole('button', { name: 'Save as reviewed' }));

		await waitFor(() => {
			expect(reviewSpy).toHaveBeenCalledWith('processed-broadcast', {
				note: '  Bring   roster   list  '
			});
		});
	});
});