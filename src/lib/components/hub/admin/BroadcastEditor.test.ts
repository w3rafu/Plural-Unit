// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BroadcastRow } from '$lib/repositories/hubRepository';

const { mockPage } = vi.hoisted(() => ({
	mockPage: {
		url: new URL('https://example.com/hub/manage/content')
	}
}));

vi.mock('$app/state', () => ({
	page: mockPage
}));

vi.mock('$lib/actions/unsavedChanges', () => ({
	syncUnsavedChanges: () => ({ destroy() {} })
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: () => false,
	shouldHydrateSmokeHubState: () => false,
	getSmokeModeHubLoadError: () => null
}));

import BroadcastEditor from './BroadcastEditor.svelte';
import { currentHub } from '$lib/stores/currentHub.svelte';

function makeBroadcast(overrides: Partial<BroadcastRow> = {}): BroadcastRow {
	return {
		id: overrides.id ?? 'b1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Weekly notes',
		body: overrides.body ?? 'A short update.',
		created_at: overrides.created_at ?? '2026-04-15T08:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-15T08:00:00.000Z',
		is_pinned: overrides.is_pinned ?? false,
		is_draft: overrides.is_draft ?? false,
		publish_at: overrides.publish_at ?? '2026-04-16T10:00:00.000Z',
		archived_at: overrides.archived_at ?? null,
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? 'scheduled',
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

describe('BroadcastEditor', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.stubGlobal(
			'ResizeObserver',
			class ResizeObserver {
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
		currentHub.reset();
		currentHub.broadcasts = [makeBroadcast()];
		vi.spyOn(currentHub, 'getBroadcastExecutionDiagnostics').mockReturnValue([
			{
				id: 'exec-1',
				jobKind: 'broadcast_publish',
				label: 'Publish execution',
				statusLabel: 'Processed',
				statusVariant: 'secondary',
				detailCopy: 'Weekly notes was published to members.',
				dueCopy: 'Due Apr 16, 10:00 AM (tomorrow).',
				lastAttemptCopy: null,
				processedCopy: 'Processed Apr 16, 10:00 AM.',
				attemptCountCopy: '1 attempt recorded.',
				nextStepCopy: null,
				guidanceLabel: null,
				guidanceVariant: null
			}
		]);
		vi.spyOn(currentHub, 'getWorkflowSummary').mockImplementation((workflowKey) => {
			if (workflowKey === 'execution:exec-1') {
				return {
					workflowKey,
					status: 'reviewed',
					statusLabel: 'Reviewed',
					actorLabel: 'Bea',
					timestampCopy: '2 hours ago',
					summaryCopy: 'Reviewed by Bea 2 hours ago.',
					note: 'Delivery looked healthy after the retry.'
				};
			}

			return null;
		});
		vi.spyOn(currentHub, 'getBroadcastDeliveryStatus').mockReturnValue(null);
		vi.spyOn(currentHub, 'getBroadcastEngagementSignal').mockReturnValue(null);
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		currentHub.reset();
	});

	it('renders workflow handoff summaries beside execution diagnostics', () => {
		render(BroadcastEditor);

		expect(screen.getByText('Workflow handoff')).toBeTruthy();
		expect(screen.getByText('Reviewed by Bea 2 hours ago.')).toBeTruthy();
		expect(screen.getByText('Delivery looked healthy after the retry.')).toBeTruthy();
	});
});