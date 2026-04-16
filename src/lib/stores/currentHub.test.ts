import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock hub repository ──

const mockFetchActivePlugins = vi.fn();
const mockTogglePlugin = vi.fn();
const mockFetchBroadcasts = vi.fn();
const mockFetchEvents = vi.fn();
const mockFetchEventReminderSettings = vi.fn();
const mockFetchEventResponses = vi.fn();
const mockFetchEventAttendanceRecords = vi.fn();
const mockFetchHubExecutionLedger = vi.fn();
const mockFetchHubOperatorWorkflowState = vi.fn();
const mockProcessDueHubReminderExecutions = vi.fn();
const mockFetchHubNotificationPreferences = vi.fn();
const mockFetchHubNotificationReads = vi.fn();
const mockFetchResources = vi.fn();
const mockFetchBroadcastAcknowledgments = vi.fn();
const mockCreateBroadcast = vi.fn();
const mockSaveBroadcastDraft = vi.fn();
const mockScheduleBroadcast = vi.fn();
const mockPublishBroadcastNow = vi.fn();
const mockUpdateBroadcastDeliveryState = vi.fn();
const mockUpdateBroadcast = vi.fn();
const mockSetBroadcastPinned = vi.fn();
const mockArchiveBroadcast = vi.fn();
const mockRestoreBroadcast = vi.fn();
const mockDeleteBroadcast = vi.fn();
const mockCreateEvent = vi.fn();
const mockSaveEventReminderSettings = vi.fn();
const mockUpdateEventDeliveryState = vi.fn();
const mockUpdateEvent = vi.fn();
const mockCancelEvent = vi.fn();
const mockArchiveEvent = vi.fn();
const mockRestoreEvent = vi.fn();
const mockDeleteEvent = vi.fn();
const mockUpsertEventAttendanceRecord = vi.fn();
const mockDeleteEventAttendanceRecord = vi.fn();
const mockUpsertOwnEventResponse = vi.fn();
const mockUpsertHubExecutionLedgerEntries = vi.fn();
const mockDeleteHubExecutionLedgerEntries = vi.fn();
const mockUpsertHubOperatorWorkflowStateEntries = vi.fn();
const mockDeleteHubOperatorWorkflowStateEntries = vi.fn();
const mockSaveHubNotificationPreferences = vi.fn();
const mockMarkHubNotificationRead = vi.fn();
const mockCreateResource = vi.fn();
const mockUpdateResource = vi.fn();
const mockSaveResourceOrder = vi.fn();
const mockDeleteResource = vi.fn();
const { mockCurrentOrganization, smokeModeState } = vi.hoisted(() => ({
	mockCurrentOrganization: {
		organization: { id: 'org-1' as string },
		membership: { profile_id: 'profile-1', role: 'admin' as 'admin' | 'member' },
		members: [] as any[],
		isLoadingMembers: false,
		isAdmin: true
	},
	smokeModeState: {
		enabled: false,
		hydrate: false,
		loadError: null as Error | null
	}
}));

vi.mock('$lib/repositories/hubRepository', () => ({
	fetchActivePlugins: (...args: any[]) => mockFetchActivePlugins(...args),
	togglePlugin: (...args: any[]) => mockTogglePlugin(...args),
	fetchBroadcasts: (...args: any[]) => mockFetchBroadcasts(...args),
	fetchEvents: (...args: any[]) => mockFetchEvents(...args),
	fetchEventReminderSettings: (...args: any[]) => mockFetchEventReminderSettings(...args),
	fetchEventResponses: (...args: any[]) => mockFetchEventResponses(...args),
	fetchEventAttendanceRecords: (...args: any[]) => mockFetchEventAttendanceRecords(...args),
	fetchHubExecutionLedger: (...args: any[]) => mockFetchHubExecutionLedger(...args),
	fetchHubOperatorWorkflowState: (...args: any[]) => mockFetchHubOperatorWorkflowState(...args),
	processDueHubReminderExecutions: (...args: any[]) => mockProcessDueHubReminderExecutions(...args),
	fetchHubNotificationPreferences: (...args: any[]) => mockFetchHubNotificationPreferences(...args),
	fetchHubNotificationReads: (...args: any[]) => mockFetchHubNotificationReads(...args),
	fetchResources: (...args: any[]) => mockFetchResources(...args),
	fetchBroadcastAcknowledgments: (...args: any[]) => mockFetchBroadcastAcknowledgments(...args),
	acknowledgeBroadcast: vi.fn(),
	unacknowledgeBroadcast: vi.fn(),
	createBroadcast: (...args: any[]) => mockCreateBroadcast(...args),
	saveBroadcastDraft: (...args: any[]) => mockSaveBroadcastDraft(...args),
	scheduleBroadcast: (...args: any[]) => mockScheduleBroadcast(...args),
	publishBroadcastNow: (...args: any[]) => mockPublishBroadcastNow(...args),
	updateBroadcastDeliveryState: (...args: any[]) => mockUpdateBroadcastDeliveryState(...args),
	updateBroadcast: (...args: any[]) => mockUpdateBroadcast(...args),
	setBroadcastPinned: (...args: any[]) => mockSetBroadcastPinned(...args),
	archiveBroadcast: (...args: any[]) => mockArchiveBroadcast(...args),
	restoreBroadcast: (...args: any[]) => mockRestoreBroadcast(...args),
	deleteBroadcast: (...args: any[]) => mockDeleteBroadcast(...args),
	createEvent: (...args: any[]) => mockCreateEvent(...args),
	saveEventReminderSettings: (...args: any[]) => mockSaveEventReminderSettings(...args),
	updateEventDeliveryState: (...args: any[]) => mockUpdateEventDeliveryState(...args),
	updateEvent: (...args: any[]) => mockUpdateEvent(...args),
	cancelEvent: (...args: any[]) => mockCancelEvent(...args),
	archiveEvent: (...args: any[]) => mockArchiveEvent(...args),
	restoreEvent: (...args: any[]) => mockRestoreEvent(...args),
	deleteEvent: (...args: any[]) => mockDeleteEvent(...args),
	upsertEventAttendanceRecord: (...args: any[]) => mockUpsertEventAttendanceRecord(...args),
	deleteEventAttendanceRecord: (...args: any[]) => mockDeleteEventAttendanceRecord(...args),
	upsertOwnEventResponse: (...args: any[]) => mockUpsertOwnEventResponse(...args),
	upsertHubExecutionLedgerEntries: (...args: any[]) => mockUpsertHubExecutionLedgerEntries(...args),
	deleteHubExecutionLedgerEntries: (...args: any[]) => mockDeleteHubExecutionLedgerEntries(...args),
	upsertHubOperatorWorkflowStateEntries: (...args: any[]) =>
		mockUpsertHubOperatorWorkflowStateEntries(...args),
	deleteHubOperatorWorkflowStateEntries: (...args: any[]) =>
		mockDeleteHubOperatorWorkflowStateEntries(...args),
	saveHubNotificationPreferences: (...args: any[]) => mockSaveHubNotificationPreferences(...args),
	markHubNotificationRead: (...args: any[]) => mockMarkHubNotificationRead(...args),
	createResource: (...args: any[]) => mockCreateResource(...args),
	updateResource: (...args: any[]) => mockUpdateResource(...args),
	saveResourceOrder: (...args: any[]) => mockSaveResourceOrder(...args),
	deleteResource: (...args: any[]) => mockDeleteResource(...args)
}));

vi.mock('./currentOrganization.svelte', () => ({
	currentOrganization: mockCurrentOrganization
}));

vi.mock('$lib/demo/smokeMode', () => ({
	isSmokeModeEnabled: () => smokeModeState.enabled,
	shouldHydrateSmokeHubState: () => smokeModeState.hydrate,
	getSmokeModeHubLoadError: () => smokeModeState.loadError
}));

// Mock pluginRegistry
vi.mock('./pluginRegistry', () => ({
	buildPluginStateMap: (rows: any[]) => {
		const map: Record<string, boolean> = { broadcasts: false, events: false, resources: false };
		for (const row of rows) {
			if (row.plugin_key in map) map[row.plugin_key] = row.is_enabled;
		}
		return map;
	}
}));

// Mock hubNotifications
vi.mock('$lib/models/hubNotifications', async () => {
	const actual = await vi.importActual<typeof import('$lib/models/hubNotifications')>(
		'$lib/models/hubNotifications'
	);
	return actual;
});

vi.mock('$lib/models/eventResponseModel', async () => {
	const actual = await vi.importActual<typeof import('$lib/models/eventResponseModel')>(
		'$lib/models/eventResponseModel'
	);
	return actual;
});

import { currentHub } from './currentHub.svelte';
import {
	buildHubExecutionFollowUpReviewSignature,
	buildHubExecutionQueueItemTriageKey
} from '$lib/models/hubExecutionQueue';

function makeBroadcast(
	overrides: Partial<{
		id: string;
		organization_id: string;
		title: string;
		body: string;
		created_at: string;
		updated_at: string;
		is_pinned: boolean;
		is_draft: boolean;
		publish_at: string | null;
		archived_at: string | null;
		expires_at: string | null;
		delivery_state: 'scheduled' | 'published' | 'failed' | 'skipped' | null;
		delivered_at: string | null;
		delivery_failure_reason: string | null;
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
		expires_at: overrides.expires_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeEvent(
	overrides: Partial<{
		id: string;
		organization_id: string;
		title: string;
		description: string;
		starts_at: string;
		ends_at: string | null;
		location: string;
		created_at: string;
		updated_at: string;
		publish_at: string | null;
		canceled_at: string | null;
		archived_at: string | null;
			delivery_state: 'scheduled' | 'published' | 'failed' | 'skipped' | null;
			delivered_at: string | null;
			delivery_failure_reason: string | null;
	}> = {}
) {
	return {
		id: overrides.id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Meeting',
		description: overrides.description ?? '',
		starts_at: overrides.starts_at ?? '2026-04-20T16:30:00.000Z',
		ends_at: overrides.ends_at ?? null,
		location: overrides.location ?? '',
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z',
		publish_at: overrides.publish_at ?? null,
		canceled_at: overrides.canceled_at ?? null,
		archived_at: overrides.archived_at ?? null,
		delivery_state: overrides.delivery_state ?? null,
		delivered_at: overrides.delivered_at ?? null,
		delivery_failure_reason: overrides.delivery_failure_reason ?? null
	};
}

function makeReminderSettings(
	overrides: Partial<{
		id: string;
		event_id: string;
		organization_id: string;
		delivery_channel: 'in_app';
		reminder_offsets: number[];
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'rem-1',
		event_id: overrides.event_id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		delivery_channel: overrides.delivery_channel ?? 'in_app',
		reminder_offsets: overrides.reminder_offsets ?? [1440, 120],
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z'
	};
}

function makeAttendanceRecord(
	overrides: Partial<{
		id: string;
		event_id: string;
		organization_id: string;
		profile_id: string;
		status: 'attended' | 'absent';
		marked_by_profile_id: string | null;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'att-1',
		event_id: overrides.event_id ?? 'e1',
		organization_id: overrides.organization_id ?? 'org-1',
		profile_id: overrides.profile_id ?? 'profile-1',
		status: overrides.status ?? 'attended',
		marked_by_profile_id: overrides.marked_by_profile_id ?? 'profile-admin',
		created_at: overrides.created_at ?? '2026-04-14T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-14T10:00:00.000Z'
	};
}

function makeMember(
	overrides: Partial<{
		profile_id: string;
		name: string;
		email: string;
		phone_number: string;
		avatar_url: string;
		bio: string | null;
		role: 'admin' | 'member';
		joined_via: 'created' | 'invitation' | 'code';
		joined_at: string;
	}> = {}
) {
	return {
		profile_id: overrides.profile_id ?? 'profile-1',
		name: overrides.name ?? 'Alex',
		email: overrides.email ?? 'alex@example.com',
		phone_number: overrides.phone_number ?? '',
		avatar_url: overrides.avatar_url ?? '',
		bio: overrides.bio ?? null,
		role: overrides.role ?? 'member',
		joined_via: overrides.joined_via ?? 'invitation',
		joined_at: overrides.joined_at ?? '2026-04-12T10:00:00.000Z'
	};
}

function makeResource(
	overrides: Partial<{
		id: string;
		organization_id: string;
		title: string;
		description: string;
		href: string;
		resource_type: 'link' | 'form' | 'document' | 'contact';
		sort_order: number;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'r1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Guide',
		description: overrides.description ?? 'Setup steps',
		href: overrides.href ?? 'https://example.com/guide',
		resource_type: overrides.resource_type ?? 'document',
		sort_order: overrides.sort_order ?? 0,
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z'
	};
}

function makeNotificationPreferenceRow(
	overrides: Partial<{
		id: string;
		organization_id: string;
		profile_id: string;
		broadcast_enabled: boolean;
		event_enabled: boolean;
		message_enabled: boolean;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'pref-1',
		organization_id: overrides.organization_id ?? 'org-1',
		profile_id: overrides.profile_id ?? 'profile-1',
		broadcast_enabled: overrides.broadcast_enabled ?? true,
		event_enabled: overrides.event_enabled ?? true,
		message_enabled: overrides.message_enabled ?? true,
		created_at: overrides.created_at ?? '2026-04-13T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-13T10:00:00.000Z'
	};
}

function makeNotificationReadRow(
	overrides: Partial<{
		id: string;
		organization_id: string;
		profile_id: string;
		notification_kind: 'broadcast' | 'event' | 'event_reminder';
		source_id: string;
		notification_key: string;
		read_at: string;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'read-1',
		organization_id: overrides.organization_id ?? 'org-1',
		profile_id: overrides.profile_id ?? 'profile-1',
		notification_kind: overrides.notification_kind ?? 'broadcast',
		source_id: overrides.source_id ?? 'b1',
		notification_key: overrides.notification_key ?? 'default',
		read_at: overrides.read_at ?? '2026-04-13T10:00:00.000Z',
		created_at: overrides.created_at ?? '2026-04-13T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-13T10:00:00.000Z'
	};
}

function makeExecutionLedgerRow(
	overrides: Partial<{
		id: string;
		organization_id: string;
		job_kind: 'broadcast_publish' | 'event_publish' | 'event_reminder';
		source_id: string;
		execution_key: string;
		due_at: string;
		execution_state: 'pending' | 'processed' | 'failed' | 'skipped';
		processed_at: string | null;
		last_attempted_at: string | null;
		attempt_count: number;
		last_failure_reason: string | null;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'exec-1',
		organization_id: overrides.organization_id ?? 'org-1',
		job_kind: overrides.job_kind ?? 'event_reminder',
		source_id: overrides.source_id ?? 'e1',
		execution_key: overrides.execution_key ?? '120',
		due_at: overrides.due_at ?? '2026-04-20T14:00:00.000Z',
		execution_state: overrides.execution_state ?? 'pending',
		processed_at: overrides.processed_at ?? null,
		last_attempted_at: overrides.last_attempted_at ?? null,
		attempt_count: overrides.attempt_count ?? 0,
		last_failure_reason: overrides.last_failure_reason ?? null,
		created_at: overrides.created_at ?? '2026-04-14T08:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-14T08:00:00.000Z'
	};
}

function makeWorkflowStateRow(
	overrides: Partial<{
		organization_id: string;
		workflow_key: string;
		workflow_kind: 'execution_item' | 'followup_signal';
		status: 'reviewed' | 'deferred';
		reviewed_by_profile_id: string;
		note: string;
		reviewed_against_signature: string | null;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		organization_id: overrides.organization_id ?? 'org-1',
		workflow_key: overrides.workflow_key ?? 'execution:exec-1',
		workflow_kind: overrides.workflow_kind ?? 'execution_item',
		status: overrides.status ?? 'reviewed',
		reviewed_by_profile_id: overrides.reviewed_by_profile_id ?? 'profile-1',
		note: overrides.note ?? '',
		reviewed_against_signature: overrides.reviewed_against_signature ?? null,
		created_at: overrides.created_at ?? '2026-04-14T12:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-14T12:00:00.000Z'
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.unstubAllGlobals();
	mockCurrentOrganization.organization = { id: 'org-1' };
	mockCurrentOrganization.membership = { profile_id: 'profile-1', role: 'admin' };
	mockCurrentOrganization.members = [];
	mockCurrentOrganization.isLoadingMembers = false;
	mockCurrentOrganization.isAdmin = true;
	smokeModeState.enabled = false;
	smokeModeState.hydrate = false;
	smokeModeState.loadError = null;
	const localStorageState = new Map<string, string>();
	const sessionStorageState = new Map<string, string>();
	const sessionStorageMock = {
		getItem: vi.fn((key: string) => sessionStorageState.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			sessionStorageState.set(key, value);
		}),
		removeItem: vi.fn((key: string) => {
			sessionStorageState.delete(key);
		})
	};
	vi.stubGlobal('window', {
		location: {
			search: ''
		},
		sessionStorage: sessionStorageMock,
		localStorage: {
			getItem: vi.fn((key: string) => localStorageState.get(key) ?? null),
			setItem: vi.fn((key: string, value: string) => {
				localStorageState.set(key, value);
			}),
			removeItem: vi.fn((key: string) => {
				localStorageState.delete(key);
			})
		}
	});
	vi.stubGlobal('sessionStorage', sessionStorageMock);
	mockFetchEventAttendanceRecords.mockResolvedValue([]);
	mockFetchBroadcastAcknowledgments.mockResolvedValue([]);
	mockFetchHubExecutionLedger.mockResolvedValue([]);
	mockFetchHubOperatorWorkflowState.mockResolvedValue([]);
	mockProcessDueHubReminderExecutions.mockResolvedValue([]);
	mockUpsertHubExecutionLedgerEntries.mockImplementation(async (entries: any[]) =>
		entries.map((entry, index) =>
			makeExecutionLedgerRow({
				id: `exec-${index + 1}`,
				...entry
			})
		)
	);
	mockDeleteHubExecutionLedgerEntries.mockResolvedValue(undefined);
	mockUpsertHubOperatorWorkflowStateEntries.mockImplementation(async (entries: any[]) =>
		entries.map((entry) => makeWorkflowStateRow(entry))
	);
	mockDeleteHubOperatorWorkflowStateEntries.mockResolvedValue(undefined);
	mockDeleteEventAttendanceRecord.mockResolvedValue(undefined);
	mockFetchHubNotificationPreferences.mockResolvedValue(null);
	mockFetchHubNotificationReads.mockResolvedValue([]);
	currentHub.reset();
});

describe('currentHub.load', () => {
	it('fetches plugins and active data', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: true },
			{ plugin_key: 'events', is_enabled: true },
			{ plugin_key: 'resources', is_enabled: true }
		]);
		mockFetchBroadcasts.mockResolvedValueOnce([makeBroadcast({ id: 'b1', title: 'Hello' })]);
		mockFetchEvents.mockResolvedValueOnce([makeEvent({ id: 'e1', title: 'Meeting' })]);
		mockFetchEventReminderSettings.mockResolvedValueOnce([
			makeReminderSettings({ event_id: 'e1', reminder_offsets: [1440, 120] })
		]);
		mockFetchEventAttendanceRecords.mockResolvedValueOnce([
			makeAttendanceRecord({ event_id: 'e1', profile_id: 'profile-1', status: 'attended' })
		]);
		mockFetchEventResponses.mockResolvedValueOnce([
			{
				id: 'r1',
				event_id: 'e1',
				organization_id: 'org-1',
				profile_id: 'profile-1',
				response: 'going',
				created_at: '2026-04-12T10:00:00.000Z',
				updated_at: '2026-04-12T10:00:00.000Z'
			}
		]);
		mockFetchResources.mockResolvedValueOnce([makeResource({ id: 'r1', title: 'Prayer guide' })]);

		await currentHub.load();

		expect(currentHub.hasLoadedForCurrentOrg).toBe(true);
		expect(currentHub.plugins.broadcasts).toBe(true);
		expect(currentHub.plugins.events).toBe(true);
		expect(currentHub.plugins.resources).toBe(true);
		expect(currentHub.broadcasts).toEqual([makeBroadcast({ id: 'b1', title: 'Hello' })]);
		expect(currentHub.events).toEqual([makeEvent({ id: 'e1', title: 'Meeting' })]);
		expect(currentHub.getEventReminderOffsets('e1')).toEqual([1440, 120]);
		expect(currentHub.resources).toEqual([makeResource({ id: 'r1', title: 'Prayer guide' })]);
		expect(currentHub.getOwnEventResponse('e1')).toBe('going');
		expect(currentHub.getOwnEventAttendance('e1')).toBe('attended');
		expect(currentHub.isLoading).toBe(false);
	});

	it('hydrates shared workflow rows into the queue triage map for admins', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([]);
		mockFetchHubOperatorWorkflowState.mockResolvedValueOnce([
			makeWorkflowStateRow({
				workflow_key: 'execution:failed-publish',
				workflow_kind: 'execution_item',
				status: 'reviewed',
				updated_at: '2026-04-14T12:00:00.000Z'
			})
		]);

		await currentHub.load();

		expect(mockFetchHubOperatorWorkflowState).toHaveBeenCalledWith('org-1');
		expect(currentHub.workflowStateRows).toHaveLength(1);
		expect(currentHub.queueTriageMap).toEqual({
			'execution:failed-publish': {
				status: 'reviewed',
				updatedAt: '2026-04-14T12:00:00.000Z',
				reviewedAgainstSignature: null
			}
		});
	});

	it('hydrates seeded workflow fixtures during smoke loads when no local smoke state exists', async () => {
		smokeModeState.enabled = true;

		await currentHub.load();

		const queueSections = currentHub.getExecutionQueueSections(undefined, {
			includeTriaged: true
		});
		const reviewedProcessedItem = queueSections.processed.find(
			(item) => item.triageStatus === 'reviewed' && !item.isStaleReview
		);
		const staleRecoveryItem = queueSections.recovery.find((item) => item.isStaleReview);

		if (!reviewedProcessedItem || !staleRecoveryItem) {
			throw new Error('Expected seeded smoke workflow rows to surface both a hidden reviewed item and a stale recovery item.');
		}

		expect(mockFetchActivePlugins).not.toHaveBeenCalled();
		expect(currentHub.workflowStateRows).toHaveLength(2);
		expect(currentHub.triagedQueueItemCount).toBe(1);
		expect(currentHub.staleExecutionItemCount).toBe(1);
		expect(
			currentHub.queueTriageMap[buildHubExecutionQueueItemTriageKey(reviewedProcessedItem)]
				?.reviewedAgainstSignature
		).toBe(reviewedProcessedItem.reviewSignature);
		expect(
			currentHub.queueTriageMap[buildHubExecutionQueueItemTriageKey(staleRecoveryItem)]
				?.reviewedAgainstSignature
		).not.toBe(staleRecoveryItem.reviewSignature);
	});

	it('keeps smoke workflow review overwrites local across reloads', async () => {
		smokeModeState.enabled = true;

		await currentHub.load();

		const recoveryItem = currentHub
			.getExecutionQueueSections(undefined, { includeTriaged: true })
			.recovery.find((item) => item.isStaleReview);

		if (!recoveryItem) {
			throw new Error('Expected a stale recovery item in smoke mode.');
		}

		const workflowKey = buildHubExecutionQueueItemTriageKey(recoveryItem);

		await currentHub.markExecutionQueueItemReviewed(recoveryItem.id, {
			note: '  Rechecked   after retry  '
		});

		let updatedRecoveryItem = currentHub
			.getExecutionQueueSections(undefined, { includeTriaged: true })
			.recovery.find((item) => item.id === recoveryItem.id);

		if (!updatedRecoveryItem) {
			throw new Error('Expected the updated recovery item to remain visible when triaged rows are included.');
		}

		expect(updatedRecoveryItem).toMatchObject({
			triageStatus: 'reviewed',
			isStaleReview: false
		});
		expect(currentHub.getWorkflowSummary(workflowKey)?.note).toBe('Rechecked after retry');

		await currentHub.load();

		updatedRecoveryItem = currentHub
			.getExecutionQueueSections(undefined, { includeTriaged: true })
			.recovery.find((item) => item.id === recoveryItem.id);

		expect(updatedRecoveryItem).toMatchObject({
			triageStatus: 'reviewed',
			isStaleReview: false
		});
		expect(currentHub.getWorkflowSummary(workflowKey)?.note).toBe('Rechecked after retry');
	});

	it('keeps smoke workflow clears local across reloads', async () => {
		smokeModeState.enabled = true;

		await currentHub.load();

		const processedItem = currentHub
			.getExecutionQueueSections(undefined, { includeTriaged: true })
			.processed.find((item) => item.triageStatus === 'reviewed' && !item.isStaleReview);

		if (!processedItem) {
			throw new Error('Expected a reviewed processed item in smoke mode.');
		}

		const workflowKey = buildHubExecutionQueueItemTriageKey(processedItem);

		await currentHub.surfaceExecutionQueueItem(processedItem.id);

		expect(currentHub.getWorkflowSummary(workflowKey)).toBeNull();
		expect(currentHub.queueTriageMap[workflowKey]).toBeUndefined();

		await currentHub.load();

		expect(currentHub.getWorkflowSummary(workflowKey)).toBeNull();
		expect(currentHub.queueTriageMap[workflowKey]).toBeUndefined();
		expect(currentHub.triagedQueueItemCount).toBe(0);
	});

	it('removes orphaned follow-up workflow rows during load without touching execution triage', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([]);
		mockFetchHubOperatorWorkflowState.mockResolvedValueOnce([
			makeWorkflowStateRow({
				workflow_key: 'execution:failed-publish',
				workflow_kind: 'execution_item',
				status: 'reviewed',
				updated_at: '2026-04-14T12:00:00.000Z'
			}),
			makeWorkflowStateRow({
				workflow_key: 'followup:needs-review:attendance_review',
				workflow_kind: 'followup_signal',
				status: 'deferred',
				updated_at: '2026-04-14T12:05:00.000Z'
			})
		]);

		await currentHub.load();

		expect(currentHub.workflowStateRows).toEqual([
			makeWorkflowStateRow({
				workflow_key: 'execution:failed-publish',
				workflow_kind: 'execution_item',
				status: 'reviewed',
				updated_at: '2026-04-14T12:00:00.000Z'
			})
		]);
		expect(currentHub.queueTriageMap).toEqual({
			'execution:failed-publish': {
				status: 'reviewed',
				updatedAt: '2026-04-14T12:00:00.000Z',
				reviewedAgainstSignature: null
			}
		});
		expect(mockDeleteHubOperatorWorkflowStateEntries).toHaveBeenCalledWith('org-1', [
			'followup:needs-review:attendance_review'
		]);
	});

	it('reconciles persisted delivery metadata for scheduled content when admin load detects a state change', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: true },
			{ plugin_key: 'events', is_enabled: true }
		]);
		mockFetchBroadcasts.mockResolvedValueOnce([
			makeBroadcast({ id: 'b1', publish_at: '2026-04-13T10:00:00.000Z' })
		]);
		mockFetchEvents.mockResolvedValueOnce([
			makeEvent({ id: 'e1', publish_at: '2026-04-13T09:00:00.000Z', starts_at: '2026-04-14T09:00:00.000Z' })
		]);
		mockFetchEventReminderSettings.mockResolvedValueOnce([]);
		mockFetchEventResponses.mockResolvedValueOnce([]);
		mockFetchResources.mockResolvedValueOnce([]);
		mockUpdateBroadcastDeliveryState.mockResolvedValueOnce(
			makeBroadcast({
				id: 'b1',
				publish_at: '2026-04-13T10:00:00.000Z',
				delivery_state: 'published',
				delivered_at: '2026-04-13T10:00:00.000Z'
			})
		);
		mockUpdateEventDeliveryState.mockResolvedValueOnce(
			makeEvent({
				id: 'e1',
				publish_at: '2026-04-13T09:00:00.000Z',
				starts_at: '2026-04-14T09:00:00.000Z',
				delivery_state: 'published',
				delivered_at: '2026-04-13T09:00:00.000Z'
			})
		);

		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-13T12:00:00.000Z'));

		await currentHub.load();

		expect(mockUpdateBroadcastDeliveryState).toHaveBeenCalledWith('b1', {
			delivery_state: 'published',
			delivered_at: '2026-04-13T10:00:00.000Z',
			delivery_failure_reason: null
		});
		expect(mockUpdateEventDeliveryState).toHaveBeenCalledWith('e1', {
			delivery_state: 'published',
			delivered_at: '2026-04-13T09:00:00.000Z',
			delivery_failure_reason: null
		});
		expect(currentHub.getBroadcastDeliveryStatus('b1')).toMatchObject({ state: 'published' });
		expect(currentHub.getEventDeliveryStatus('e1')).toMatchObject({ state: 'published' });

		vi.useRealTimers();
	});

	it('builds execution diagnostics for broadcasts and events from the current ledger state', () => {
		currentHub.broadcasts = [
			makeBroadcast({
				id: 'b1',
				title: 'Weekly notes',
				publish_at: '2026-04-18T12:00:00.000Z',
				expires_at: '2026-04-18T11:00:00.000Z'
			})
		];
		currentHub.events = [
			makeEvent({
				id: 'e1',
				title: 'Volunteer night',
				publish_at: '2026-04-18T10:00:00.000Z',
				starts_at: '2026-04-20T16:00:00.000Z'
			})
		];
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'broadcast-publish',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-18T12:00:00.000Z',
				execution_state: 'failed',
				last_attempted_at: '2026-04-18T12:05:00.000Z',
				attempt_count: 2,
				last_failure_reason:
					'The scheduled publish time lands at or after the expiry time. Edit the timing before retrying.'
			}),
			makeExecutionLedgerRow({
				id: 'event-publish',
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish',
				due_at: '2026-04-18T10:00:00.000Z',
				execution_state: 'processed',
				processed_at: '2026-04-18T10:00:00.000Z',
				attempt_count: 1
			}),
			makeExecutionLedgerRow({
				id: 'event-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2026-04-20T14:00:00.000Z',
				execution_state: 'processed',
				processed_at: '2026-04-20T14:01:00.000Z',
				attempt_count: 1
			})
		];

		expect(currentHub.getBroadcastExecutionDiagnostics('b1')[0]).toMatchObject({
			label: 'Publish execution',
			statusLabel: 'Failed',
			guidanceLabel: 'Fix timing'
		});
		expect(currentHub.getEventExecutionDiagnostics('e1').map((entry) => entry.id)).toEqual([
			'event-publish',
			'event-reminder'
		]);
		expect(currentHub.getEventExecutionDiagnostics('e1')[1]).toMatchObject({
			label: 'Reminder · 2 hours before',
			statusLabel: 'Processed'
		});
	});

	it('skips fetching data for disabled plugins', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: false },
			{ plugin_key: 'events', is_enabled: false },
			{ plugin_key: 'resources', is_enabled: false }
		]);

		await currentHub.load();

		expect(mockFetchBroadcasts).not.toHaveBeenCalled();
		expect(mockFetchEvents).not.toHaveBeenCalled();
		expect(mockFetchEventReminderSettings).not.toHaveBeenCalled();
		expect(mockFetchEventResponses).not.toHaveBeenCalled();
		expect(mockFetchEventAttendanceRecords).not.toHaveBeenCalled();
		expect(mockFetchResources).not.toHaveBeenCalled();
		expect(currentHub.broadcasts).toEqual([]);
		expect(currentHub.events).toEqual([]);
		expect(currentHub.resources).toEqual([]);
		expect(currentHub.eventReminderSettingsMap).toEqual({});
		expect(currentHub.eventResponseMap).toEqual({});
		expect(currentHub.eventAttendanceMap).toEqual({});
	});

	it('skips loading event reminder settings for non-admin members', async () => {
		mockCurrentOrganization.membership = { profile_id: 'profile-1', role: 'member' };
		mockCurrentOrganization.isAdmin = false;
		mockFetchActivePlugins.mockResolvedValueOnce([{ plugin_key: 'events', is_enabled: true }]);
		mockFetchEvents.mockResolvedValueOnce([makeEvent({ id: 'e1', title: 'Meeting' })]);
		mockFetchEventResponses.mockResolvedValueOnce([]);

		await currentHub.load();

		expect(mockFetchEventReminderSettings).not.toHaveBeenCalled();
		expect(mockProcessDueHubReminderExecutions).toHaveBeenCalledWith('org-1');
		expect(currentHub.getEventReminderOffsets('e1')).toEqual([]);
	});

	it('hydrates processed reminder alerts for non-admin members', async () => {
		mockCurrentOrganization.membership = { profile_id: 'profile-1', role: 'member' };
		mockCurrentOrganization.isAdmin = false;
		mockFetchActivePlugins.mockResolvedValueOnce([{ plugin_key: 'events', is_enabled: true }]);
		mockFetchEvents.mockResolvedValueOnce([makeEvent({ id: 'e1', title: 'Meeting' })]);
		mockFetchEventResponses.mockResolvedValueOnce([]);
		mockFetchHubNotificationReads.mockResolvedValueOnce([
			makeNotificationReadRow({ notification_kind: 'event', source_id: 'e1' })
		]);
		mockFetchHubExecutionLedger.mockResolvedValueOnce([
			makeExecutionLedgerRow({
				id: 'exec-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				execution_state: 'processed',
				processed_at: '2026-04-20T14:00:00.000Z',
				due_at: '2026-04-20T14:00:00.000Z'
			})
		]);

		await currentHub.load();

		expect(mockFetchEventReminderSettings).not.toHaveBeenCalled();
		expect(mockProcessDueHubReminderExecutions).toHaveBeenCalledWith('org-1');
		expect(mockFetchHubExecutionLedger).toHaveBeenCalledWith('org-1');
		expect(currentHub.executionLedger.map((row) => row.id)).toEqual(['exec-reminder']);
		expect(currentHub.activityFeed.map((item) => item.id)).toEqual([
			'event_reminder:e1:120',
			'event:e1'
		]);
		expect(currentHub.activityFeed[0]).toMatchObject({
			kind: 'event_reminder',
			sourceId: 'e1',
			notificationKey: '120',
			isRead: false
		});
		expect(currentHub.unreadActivityCount).toBe(1);
	});

	it('keeps recent event alerts visible for post-event follow-up', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

		try {
			currentHub.events = [
				makeEvent({
					id: 'e1',
					starts_at: '2026-04-14T08:00:00.000Z',
					ends_at: '2026-04-14T10:00:00.000Z',
					description: '  '
				})
			];
			currentHub.executionLedger = [
				makeExecutionLedgerRow({
					id: 'exec-reminder',
					job_kind: 'event_reminder',
					source_id: 'e1',
					execution_key: '120',
					execution_state: 'processed',
					processed_at: '2026-04-14T06:00:00.000Z',
					due_at: '2026-04-14T06:00:00.000Z'
				})
			];

			expect(currentHub.activityFeed.map((item) => item.id)).toEqual([
				'event:e1',
				'event_reminder:e1:120'
			]);
			expect(currentHub.activityFeed[0]).toMatchObject({
				eventTimingState: 'recently_completed',
				label: 'Recent'
			});
			expect(currentHub.activityFeed[1]).toMatchObject({
				kind: 'event_reminder',
				eventTimingState: 'recently_completed'
			});
		} finally {
			vi.useRealTimers();
		}
	});

	it('captures error and re-throws on failure', async () => {
		mockFetchActivePlugins.mockRejectedValueOnce(new Error('network'));

		await expect(currentHub.load()).rejects.toThrow('network');
		expect(currentHub.lastError?.message).toBe('network');
		expect(currentHub.isLoading).toBe(false);
		expect(currentHub.hasLoadedForCurrentOrg).toBe(false);
	});

	it('surfaces schema drift guidance when alerts load against an older hub_events schema', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([{ plugin_key: 'events', is_enabled: true }]);
		mockFetchEvents.mockRejectedValueOnce(
			new Error(
				'column hub_events.delivery_state does not exist Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.'
			)
		);
		mockFetchEventResponses.mockResolvedValueOnce([]);

		await expect(currentHub.load()).rejects.toThrow(
			'column hub_events.delivery_state does not exist Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.'
		);
		expect(currentHub.lastError?.message).toBe(
			'column hub_events.delivery_state does not exist Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.'
		);
		expect(currentHub.isLoading).toBe(false);
		expect(currentHub.hasLoadedForCurrentOrg).toBe(false);
	});

	it('reuses an in-flight load for the same organization', async () => {
		let resolvePlugins: ((rows: Array<{ plugin_key: string; is_enabled: boolean }>) => void) | undefined;
		mockFetchActivePlugins.mockImplementationOnce(
			() =>
				new Promise<Array<{ plugin_key: string; is_enabled: boolean }>>((resolve) => {
					resolvePlugins = resolve;
				})
		);

		const firstLoad = currentHub.load();
		const secondLoad = currentHub.load();

		expect(mockFetchActivePlugins).toHaveBeenCalledTimes(1);
		expect(currentHub.isLoading).toBe(true);

		resolvePlugins?.([{ plugin_key: 'broadcasts', is_enabled: false }]);

		await Promise.all([firstLoad, secondLoad]);

		expect(mockFetchActivePlugins).toHaveBeenCalledTimes(1);
		expect(mockFetchBroadcasts).not.toHaveBeenCalled();
		expect(currentHub.hasLoadedForCurrentOrg).toBe(true);
	});

	it('hydrates member notification preferences and read state during load', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: true },
			{ plugin_key: 'events', is_enabled: true }
		]);
		mockFetchBroadcasts.mockResolvedValueOnce([makeBroadcast({ id: 'b1', title: 'Broadcast' })]);
		mockFetchEvents.mockResolvedValueOnce([makeEvent({ id: 'e1', title: 'Event' })]);
		mockFetchEventReminderSettings.mockResolvedValueOnce([]);
		mockFetchEventResponses.mockResolvedValueOnce([]);
		mockFetchResources.mockResolvedValueOnce([]);
		mockFetchHubNotificationPreferences.mockResolvedValueOnce(
			makeNotificationPreferenceRow({ broadcast_enabled: false, event_enabled: true })
		);
		mockFetchHubNotificationReads.mockResolvedValueOnce([
			makeNotificationReadRow({ notification_kind: 'event', source_id: 'e1' })
		]);

		await currentHub.load();

		expect(currentHub.notificationPreferences).toEqual({ broadcast: false, event: true, message: true });
		expect(currentHub.notificationReadMap).toEqual({
			'event:e1': '2026-04-13T10:00:00.000Z'
		});
		expect(currentHub.activityFeed.map((item) => item.id)).toEqual(['event:e1']);
		expect(currentHub.unreadActivityCount).toBe(0);
	});

	it('hydrates and syncs execution ledger rows for admin loads', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([
			{ plugin_key: 'broadcasts', is_enabled: true },
			{ plugin_key: 'events', is_enabled: true }
		]);
		mockFetchBroadcasts.mockResolvedValueOnce([
			makeBroadcast({
				id: 'b1',
				publish_at: '2099-04-18T12:00:00.000Z',
				delivery_state: 'scheduled'
			})
		]);
		mockFetchEvents.mockResolvedValueOnce([
			makeEvent({
				id: 'e1',
				publish_at: '2099-04-18T10:00:00.000Z',
				starts_at: '2099-04-20T16:00:00.000Z',
				delivery_state: 'scheduled'
			})
		]);
		mockFetchEventReminderSettings.mockResolvedValueOnce([
			makeReminderSettings({ event_id: 'e1', reminder_offsets: [120] })
		]);
		mockFetchEventResponses.mockResolvedValueOnce([]);
		mockFetchResources.mockResolvedValueOnce([]);
		mockFetchHubExecutionLedger.mockResolvedValueOnce([
			makeExecutionLedgerRow({
				id: 'existing-broadcast',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2099-04-18T12:00:00.000Z'
			})
		]);
		mockUpsertHubExecutionLedgerEntries.mockResolvedValueOnce([
			makeExecutionLedgerRow({
				id: 'event-publish',
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish',
				due_at: '2099-04-18T10:00:00.000Z'
			}),
			makeExecutionLedgerRow({
				id: 'event-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2099-04-20T14:00:00.000Z'
			})
		]);

		await currentHub.load();

		expect(mockProcessDueHubReminderExecutions).toHaveBeenCalledWith('org-1');
		expect(mockFetchHubExecutionLedger).toHaveBeenCalledWith('org-1');
		expect(mockUpsertHubExecutionLedgerEntries).toHaveBeenCalledWith([
			expect.objectContaining({
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish'
			}),
			expect.objectContaining({
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120'
			})
		]);
		expect(currentHub.executionLedger.map((row) => row.id)).toEqual([
			'event-publish',
			'existing-broadcast',
			'event-reminder'
		]);
		expect(currentHub.upcomingExecutionItems).toHaveLength(3);
		expect(currentHub.dueExecutionCount).toBe(0);
	});
});

describe('currentHub execution queue actions', () => {
	it('retries a failed reminder row by re-running ledger reconciliation', async () => {
		currentHub.events = [
			makeEvent({
				id: 'e1',
				publish_at: '2026-04-18T10:00:00.000Z',
				starts_at: '2026-04-20T16:00:00.000Z'
			})
		];
		currentHub.eventReminderSettingsMap = {
			e1: makeReminderSettings({ event_id: 'e1', reminder_offsets: [120] })
		};
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'exec-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2026-04-20T14:00:00.000Z',
				execution_state: 'failed',
				last_failure_reason:
					'Reminder window lands before event visibility. Adjust the publish time or reminder plan.'
			})
		];
		mockUpsertHubExecutionLedgerEntries.mockResolvedValueOnce([
			makeExecutionLedgerRow({
				id: 'exec-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2026-04-20T14:00:00.000Z',
				execution_state: 'pending',
				last_failure_reason: null
			})
		]);

		await currentHub.retryExecutionEntry('exec-reminder');

		expect(mockUpsertHubExecutionLedgerEntries).toHaveBeenCalledWith([
			expect.objectContaining({
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				execution_state: 'pending',
				last_failure_reason: null
			})
		]);
		expect(currentHub.executionLedger).toEqual([
			makeExecutionLedgerRow({
				id: 'exec-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2026-04-20T14:00:00.000Z',
				execution_state: 'pending',
				last_failure_reason: null
			})
		]);
		expect(currentHub.executionTargetId).toBe('');
	});

	it('runs a scheduled broadcast immediately from the queue', async () => {
		currentHub.broadcasts = [
			makeBroadcast({
				id: 'b1',
				publish_at: '2099-04-15T16:30:00.000Z',
				delivery_state: 'scheduled'
			})
		];
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'exec-broadcast',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2099-04-15T16:30:00.000Z'
			})
		];
		mockPublishBroadcastNow.mockResolvedValueOnce(
			makeBroadcast({ id: 'b1', publish_at: null, delivery_state: null })
		);

		await currentHub.runExecutionEntryNow('exec-broadcast');

		expect(mockPublishBroadcastNow).toHaveBeenCalledWith('b1');
		expect(mockDeleteHubExecutionLedgerEntries).toHaveBeenCalledWith(['exec-broadcast']);
		expect(currentHub.executionLedger).toHaveLength(1);
		expect(currentHub.executionLedger[0]).toMatchObject({
			job_kind: 'broadcast_publish',
			source_id: 'b1',
			execution_key: 'publish',
			execution_state: 'processed',
			last_failure_reason: null
		});
		expect(currentHub.executionLedger[0]?.processed_at).toBeTruthy();
		expect(currentHub.executionTargetId).toBe('');
	});

	it('restores a skipped event before forcing it live from the queue', async () => {
		currentHub.events = [
			makeEvent({
				id: 'e1',
				publish_at: '2099-04-18T10:00:00.000Z',
				starts_at: '2099-04-20T16:00:00.000Z',
				canceled_at: '2026-04-14T09:00:00.000Z',
				delivery_state: 'skipped'
			})
		];
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'exec-event',
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish',
				due_at: '2099-04-18T10:00:00.000Z',
				execution_state: 'skipped',
				last_failure_reason:
					'Canceled before the scheduled visibility window. Restore the event if it still needs to go live.'
			})
		];
		mockRestoreEvent.mockResolvedValueOnce(
			makeEvent({
				id: 'e1',
				publish_at: '2099-04-18T10:00:00.000Z',
				starts_at: '2099-04-20T16:00:00.000Z',
				canceled_at: null,
				delivery_state: 'scheduled'
			})
		);
		mockUpdateEvent.mockResolvedValueOnce(
			makeEvent({
				id: 'e1',
				publish_at: null,
				starts_at: '2099-04-20T16:00:00.000Z',
				canceled_at: null,
				delivery_state: null
			})
		);

		await currentHub.runExecutionEntryNow('exec-event');

		expect(mockRestoreEvent).toHaveBeenCalledWith('e1');
		expect(mockUpdateEvent).toHaveBeenCalledWith('e1', {
			title: 'Meeting',
			description: '',
			starts_at: '2099-04-20T16:00:00.000Z',
			ends_at: null,
			location: '',
			publish_at: null
		});
		expect(currentHub.executionLedger).toHaveLength(1);
		expect(currentHub.executionLedger[0]).toMatchObject({
			job_kind: 'event_publish',
			source_id: 'e1',
			execution_key: 'publish',
			execution_state: 'processed',
			last_failure_reason: null
		});
		expect(currentHub.executionLedger[0]?.processed_at).toBeTruthy();
		expect(currentHub.executionTargetId).toBe('');
	});
});

describe('currentHub queue triage', () => {
	it('hides reviewed and deferred queue items by default until they are surfaced again', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

		currentHub.broadcasts = [makeBroadcast({ id: 'b1', title: 'Weekly notes' })];
		currentHub.events = [
			makeEvent({
				id: 'needs-review',
				title: 'Volunteer night',
				starts_at: '2026-04-14T08:00:00.000Z',
				ends_at: '2026-04-14T09:00:00.000Z'
			})
		];
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'failed-publish',
				job_kind: 'event_publish',
				source_id: 'needs-review',
				execution_key: 'publish',
				due_at: '2026-04-14T08:00:00.000Z',
				execution_state: 'failed',
				last_failure_reason:
					'The scheduled publish time lands at or after the event start. Edit the timing before retrying.'
			}),
			makeExecutionLedgerRow({
				id: 'processed-broadcast',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-14T10:00:00.000Z',
				execution_state: 'processed',
				processed_at: '2026-04-14T10:05:00.000Z'
			})
		];
		currentHub.eventResponseMap = {
			'needs-review': [
				{
					id: 'r1',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'going',
					created_at: '2026-04-14T07:00:00.000Z',
					updated_at: '2026-04-14T07:00:00.000Z'
				},
				{
					id: 'r2',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-3',
					response: 'going',
					created_at: '2026-04-14T07:05:00.000Z',
					updated_at: '2026-04-14T07:05:00.000Z'
				}
			]
		};
		currentHub.eventAttendanceMap = {
			'needs-review': [
				makeAttendanceRecord({
					id: 'a1',
					event_id: 'needs-review',
					profile_id: 'profile-2',
					status: 'attended'
				})
			]
		};

		expect(currentHub.visibleRecoverableExecutionCount).toBe(1);
		expect(currentHub.getExecutionQueueSections().processed.map((item) => item.id)).toEqual([
			'processed-broadcast'
		]);
		expect(currentHub.hubEventFollowUpSignals.map((signal) => signal.kind)).toEqual([
			'attendance_review'
		]);
		const failedSignature =
			currentHub.getExecutionQueueSections(undefined, { includeTriaged: true }).recovery[0]
				?.reviewSignature ?? null;
		const processedSignature =
			currentHub.getExecutionQueueSections(undefined, { includeTriaged: true }).processed[0]
				?.reviewSignature ?? null;
		const followUpSignal = currentHub.getHubEventFollowUpSignals({ includeTriaged: true })[0] ?? null;
		const followUpSignature = followUpSignal
			? buildHubExecutionFollowUpReviewSignature(followUpSignal)
			: null;

		await currentHub.markExecutionQueueItemReviewed('failed-publish');
		await currentHub.deferExecutionQueueItem('processed-broadcast');
		await currentHub.markFollowUpSignalReviewed('needs-review', 'attendance_review');

		expect(currentHub.visibleRecoverableExecutionCount).toBe(0);
		expect(currentHub.getExecutionQueueSections().processed).toEqual([]);
		expect(currentHub.hubEventFollowUpSignals).toEqual([]);
		expect(currentHub.hubEngagementSummary).toMatchObject({
			postEventFollowUpCount: 0,
			followUpCount: 0
		});
		expect(currentHub.triagedQueueItemCount).toBe(3);
		expect(
			currentHub.getExecutionQueueSections(undefined, { includeTriaged: true }).recovery[0]
		).toMatchObject({
			id: 'failed-publish',
			triageStatus: 'reviewed'
		});
		expect(
			currentHub.getExecutionQueueSections(undefined, { includeTriaged: true }).processed[0]
		).toMatchObject({
			id: 'processed-broadcast',
			triageStatus: 'deferred'
		});
		expect(
			currentHub.getHubEventFollowUpSignals({ includeTriaged: true })[0]
		).toMatchObject({
			eventId: 'needs-review',
			triageStatus: 'reviewed'
		});
		expect(mockUpsertHubOperatorWorkflowStateEntries).toHaveBeenNthCalledWith(1, [
			{
				organization_id: 'org-1',
				workflow_key: 'execution:failed-publish',
				workflow_kind: 'execution_item',
				status: 'reviewed',
				reviewed_by_profile_id: 'profile-1',
				note: '',
				reviewed_against_signature: failedSignature
			}
		]);
		expect(mockUpsertHubOperatorWorkflowStateEntries).toHaveBeenNthCalledWith(2, [
			{
				organization_id: 'org-1',
				workflow_key: 'execution:processed-broadcast',
				workflow_kind: 'execution_item',
				status: 'deferred',
				reviewed_by_profile_id: 'profile-1',
				note: '',
				reviewed_against_signature: processedSignature
			}
		]);
		expect(mockUpsertHubOperatorWorkflowStateEntries).toHaveBeenNthCalledWith(3, [
			{
				organization_id: 'org-1',
				workflow_key: 'followup:needs-review:attendance_review',
				workflow_kind: 'followup_signal',
				status: 'reviewed',
				reviewed_by_profile_id: 'profile-1',
				note: '',
				reviewed_against_signature: followUpSignature
			}
		]);

		await currentHub.surfaceExecutionQueueItem('failed-publish');
		await currentHub.surfaceExecutionQueueItem('processed-broadcast');
		await currentHub.surfaceFollowUpSignal('needs-review', 'attendance_review');

		expect(currentHub.visibleRecoverableExecutionCount).toBe(1);
		expect(currentHub.getExecutionQueueSections().processed.map((item) => item.id)).toEqual([
			'processed-broadcast'
		]);
		expect(currentHub.hubEventFollowUpSignals.map((signal) => signal.kind)).toEqual([
			'attendance_review'
		]);
		expect(currentHub.triagedQueueItemCount).toBe(0);
		expect(mockDeleteHubOperatorWorkflowStateEntries).toHaveBeenNthCalledWith(1, 'org-1', [
			'execution:failed-publish'
		]);
		expect(mockDeleteHubOperatorWorkflowStateEntries).toHaveBeenNthCalledWith(2, 'org-1', [
			'execution:processed-broadcast'
		]);
		expect(mockDeleteHubOperatorWorkflowStateEntries).toHaveBeenNthCalledWith(3, 'org-1', [
			'followup:needs-review:attendance_review'
		]);

		vi.useRealTimers();
	});

	it('normalizes optional workflow notes before persisting review state', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

		currentHub.broadcasts = [makeBroadcast({ id: 'b1', title: 'Weekly notes' })];
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'processed-broadcast',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-14T10:00:00.000Z',
				execution_state: 'processed',
				processed_at: '2026-04-14T10:05:00.000Z'
			})
		];

		const reviewSignature =
			currentHub.getExecutionQueueSections(undefined, { includeTriaged: true }).processed[0]
				?.reviewSignature ?? null;

		await currentHub.markExecutionQueueItemReviewed('processed-broadcast', {
			note: '  Bring   printed\nroster   '
		});

		expect(mockUpsertHubOperatorWorkflowStateEntries).toHaveBeenCalledWith([
			{
				organization_id: 'org-1',
				workflow_key: 'execution:processed-broadcast',
				workflow_kind: 'execution_item',
				status: 'reviewed',
				reviewed_by_profile_id: 'profile-1',
				note: 'Bring printed roster',
				reviewed_against_signature: reviewSignature
			}
		]);
		expect(currentHub.workflowStateRows[0]).toMatchObject({
			workflow_key: 'execution:processed-broadcast',
			note: 'Bring printed roster'
		});

		vi.useRealTimers();
	});

	it('cleans up a reviewed follow-up row when attendance changes switch the active signal kind', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

		currentHub.events = [
			makeEvent({
				id: 'needs-review',
				title: 'Volunteer night',
				starts_at: '2026-04-14T08:00:00.000Z',
				ends_at: '2026-04-14T09:00:00.000Z'
			})
		];
		currentHub.eventResponseMap = {
			'needs-review': [
				{
					id: 'r1',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'going',
					created_at: '2026-04-14T07:00:00.000Z',
					updated_at: '2026-04-14T07:00:00.000Z'
				},
				{
					id: 'r2',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-3',
					response: 'going',
					created_at: '2026-04-14T07:05:00.000Z',
					updated_at: '2026-04-14T07:05:00.000Z'
				}
			]
		};
		currentHub.eventAttendanceMap = {
			'needs-review': [
				makeAttendanceRecord({
					id: 'a1',
					event_id: 'needs-review',
					profile_id: 'profile-2',
					status: 'attended'
				})
			]
		};
		mockUpsertEventAttendanceRecord.mockResolvedValueOnce(
			makeAttendanceRecord({
				id: 'a2',
				event_id: 'needs-review',
				profile_id: 'profile-3',
				status: 'absent',
				marked_by_profile_id: 'profile-1',
				updated_at: '2026-04-14T12:10:00.000Z'
			})
		);

		expect(currentHub.hubEventFollowUpSignals).toMatchObject([
			{
				eventId: 'needs-review',
				kind: 'attendance_review'
			}
		]);

		await currentHub.markFollowUpSignalReviewed('needs-review', 'attendance_review');
		await currentHub.setEventAttendance('needs-review', 'profile-3', 'absent');

		expect(mockDeleteHubOperatorWorkflowStateEntries).toHaveBeenCalledWith('org-1', [
			'followup:needs-review:attendance_review'
		]);
		expect(currentHub.workflowStateRows).toEqual([]);
		expect(currentHub.queueTriageMap).toEqual({});
		expect(currentHub.hubEventFollowUpSignals).toMatchObject([
			{
				eventId: 'needs-review',
				kind: 'low_turnout',
				triageStatus: null
			}
		]);

		vi.useRealTimers();
	});

	it('imports legacy browser triage into shared workflow state during first load', async () => {
		mockFetchActivePlugins.mockResolvedValueOnce([]);
		(window as any).localStorage.setItem(
			'plural-unit:hub-queue-triage:org-1',
			JSON.stringify({
				'execution:failed-publish': {
					status: 'reviewed',
					updatedAt: '2026-04-14T12:00:00.000Z'
				}
			})
		);

		await currentHub.load();

		expect(mockUpsertHubOperatorWorkflowStateEntries).toHaveBeenCalledWith([
			{
				organization_id: 'org-1',
				workflow_key: 'execution:failed-publish',
				workflow_kind: 'execution_item',
				status: 'reviewed',
				reviewed_by_profile_id: 'profile-1',
				note: '',
				reviewed_against_signature: null
			}
		]);
		expect(currentHub.queueTriageMap).toEqual({
			'execution:failed-publish': {
				status: 'reviewed',
				updatedAt: '2026-04-14T12:00:00.000Z',
				reviewedAgainstSignature: null
			}
		});
		expect((window as any).localStorage.removeItem).toHaveBeenCalledWith(
			'plural-unit:hub-queue-triage:org-1'
		);
		expect((window as any).localStorage.setItem).toHaveBeenCalledWith(
			'plural-unit:hub-queue-triage-imported:org-1',
			'1'
		);

		currentHub.reset();
		mockFetchActivePlugins.mockResolvedValueOnce([]);
		await currentHub.load();

		expect(mockUpsertHubOperatorWorkflowStateEntries).toHaveBeenCalledTimes(1);
	});
});

describe('currentHub notification preferences', () => {
	it('persists updated member alert preferences', async () => {
		mockSaveHubNotificationPreferences.mockResolvedValueOnce(
			makeNotificationPreferenceRow({ broadcast_enabled: true, event_enabled: false })
		);

		await currentHub.updateNotificationPreferences({ broadcast: true, event: false, message: true });

		expect(mockSaveHubNotificationPreferences).toHaveBeenCalledWith('org-1', 'profile-1', {
			broadcast_enabled: true,
			event_enabled: false,
			message_enabled: true
		});
		expect(currentHub.notificationPreferences).toEqual({ broadcast: true, event: false, message: true });
		expect(currentHub.isSavingNotificationPreferences).toBe(false);
	});

	it('marks a single visible alert as read and updates the unread count', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', title: 'Broadcast' })];
		currentHub.loadedOrgId = 'org-1';
		mockMarkHubNotificationRead.mockResolvedValueOnce(
			makeNotificationReadRow({ notification_kind: 'broadcast', source_id: 'b1' })
		);

		await currentHub.markActivityRead(currentHub.activityFeed[0]);

		expect(mockMarkHubNotificationRead).toHaveBeenCalledWith({
			organizationId: 'org-1',
			profileId: 'profile-1',
			notificationKind: 'broadcast',
			sourceId: 'b1',
			notificationKey: 'default'
		});
		expect(currentHub.notificationReadMap).toEqual({
			'broadcast:b1': '2026-04-13T10:00:00.000Z'
		});
		expect(currentHub.unreadActivityCount).toBe(0);
		expect(currentHub.notificationReadTargetId).toBe('');
	});

	it('marks a reminder alert as read without collapsing the base event notification', async () => {
		currentHub.events = [makeEvent({ id: 'e1', title: 'Event' })];
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'exec-reminder',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				execution_state: 'processed',
				processed_at: '2026-04-20T14:00:00.000Z',
				due_at: '2026-04-20T14:00:00.000Z'
			})
		];
		currentHub.notificationReadMap = {
			'event:e1': '2026-04-13T10:00:00.000Z'
		};
		currentHub.loadedOrgId = 'org-1';
		mockMarkHubNotificationRead.mockResolvedValueOnce(
			makeNotificationReadRow({
				notification_kind: 'event_reminder',
				source_id: 'e1',
				notification_key: '120'
			})
		);

		const reminderNotification = currentHub.activityFeed.find(
			(item) => item.id === 'event_reminder:e1:120'
		);

		expect(reminderNotification).toBeTruthy();

		await currentHub.markActivityRead(reminderNotification!);

		expect(mockMarkHubNotificationRead).toHaveBeenCalledWith({
			organizationId: 'org-1',
			profileId: 'profile-1',
			notificationKind: 'event_reminder',
			sourceId: 'e1',
			notificationKey: '120'
		});
		expect(currentHub.notificationReadMap).toEqual({
			'event:e1': '2026-04-13T10:00:00.000Z',
			'event_reminder:e1:120': '2026-04-13T10:00:00.000Z'
		});
		expect(currentHub.unreadActivityCount).toBe(0);
		expect(currentHub.notificationReadTargetId).toBe('');
	});

	it('marks all visible alerts read in a single pass', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1' })];
		currentHub.events = [makeEvent({ id: 'e1' })];
		currentHub.loadedOrgId = 'org-1';
		mockMarkHubNotificationRead
			.mockResolvedValueOnce(makeNotificationReadRow({ notification_kind: 'broadcast', source_id: 'b1' }))
			.mockResolvedValueOnce(makeNotificationReadRow({ notification_kind: 'event', source_id: 'e1' }));

		await currentHub.markAllActivityRead();

		expect(mockMarkHubNotificationRead).toHaveBeenCalledTimes(2);
		expect(currentHub.unreadActivityCount).toBe(0);
		expect(currentHub.isMarkingAllActivityRead).toBe(false);
	});
});

describe('currentHub.toggle', () => {
	it('toggles a plugin and updates local state', async () => {
		mockTogglePlugin.mockResolvedValueOnce(undefined);

		await currentHub.toggle('broadcasts', true);

		expect(mockTogglePlugin).toHaveBeenCalledWith('org-1', 'broadcasts', true);
		expect(currentHub.plugins.broadcasts).toBe(true);
	});
});

describe('currentHub.addBroadcast', () => {
	it('creates a broadcast and prepends to the list', async () => {
		const row = makeBroadcast({ id: 'b2', title: 'New', body: 'Body', created_at: '2026-01-01' });
		mockCreateBroadcast.mockResolvedValueOnce(row);

		await currentHub.addBroadcast({
			title: 'New',
			body: 'Body',
			expires_at: null,
			is_draft: false,
			publish_at: null
		});

		expect(mockCreateBroadcast).toHaveBeenCalledWith('org-1', {
			title: 'New',
			body: 'Body',
			expires_at: null,
			is_draft: false,
			publish_at: null
		});
		expect(currentHub.broadcasts[0]).toEqual(row);
	});
});

describe('currentHub.updateBroadcast', () => {
	it('updates a broadcast in place', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', title: 'Old' })];
		mockUpdateBroadcast.mockResolvedValueOnce(makeBroadcast({ id: 'b1', title: 'New' }));

		await currentHub.updateBroadcast('b1', {
			title: 'New',
			body: 'Body',
			expires_at: null,
			is_draft: false,
			publish_at: null
		});

		expect(currentHub.broadcasts[0]?.title).toBe('New');
		expect(currentHub.broadcastTargetId).toBe('');
	});
});

describe('currentHub broadcast lifecycle buckets', () => {
	it('separates draft, scheduled, live, and inactive broadcasts', () => {
		currentHub.broadcasts = [
			makeBroadcast({ id: 'draft', is_draft: true }),
			makeBroadcast({ id: 'scheduled', publish_at: '2099-04-15T16:30:00.000Z' }),
			makeBroadcast({ id: 'live' }),
			makeBroadcast({ id: 'inactive', archived_at: '2026-04-12T12:00:00.000Z' })
		];

		expect(currentHub.draftBroadcasts.map((broadcast) => broadcast.id)).toEqual(['draft']);
		expect(currentHub.scheduledBroadcasts.map((broadcast) => broadcast.id)).toEqual(['scheduled']);
		expect(currentHub.activeBroadcasts.map((broadcast) => broadcast.id)).toEqual(['live']);
		expect(currentHub.inactiveBroadcasts.map((broadcast) => broadcast.id)).toEqual(['inactive']);
	});
});

describe('currentHub.saveBroadcastDraft', () => {
	it('moves a scheduled broadcast back into the draft bucket', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', publish_at: '2099-04-15T16:30:00.000Z' })];
		mockSaveBroadcastDraft.mockResolvedValueOnce(makeBroadcast({ id: 'b1', is_draft: true }));

		await currentHub.saveBroadcastDraft('b1');

		expect(currentHub.draftBroadcasts[0]?.id).toBe('b1');
		expect(currentHub.scheduledBroadcasts).toEqual([]);
		expect(currentHub.broadcastTargetId).toBe('');
	});
});

describe('currentHub.scheduleBroadcast', () => {
	it('moves a draft into the scheduled bucket', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', is_draft: true })];
		mockScheduleBroadcast.mockResolvedValueOnce(
			makeBroadcast({ id: 'b1', is_draft: false, publish_at: '2099-04-15T16:30:00.000Z' })
		);
		mockUpdateBroadcastDeliveryState.mockResolvedValueOnce(
			makeBroadcast({
				id: 'b1',
				is_draft: false,
				publish_at: '2099-04-15T16:30:00.000Z',
				delivery_state: 'scheduled'
			})
		);
		mockUpsertHubExecutionLedgerEntries.mockResolvedValueOnce([
			makeExecutionLedgerRow({
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2099-04-15T16:30:00.000Z'
			})
		]);

		await currentHub.scheduleBroadcast('b1', '2099-04-15T16:30:00.000Z');

		expect(currentHub.scheduledBroadcasts[0]?.id).toBe('b1');
		expect(currentHub.draftBroadcasts).toEqual([]);
		expect(currentHub.executionLedger).toEqual([
			makeExecutionLedgerRow({
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2099-04-15T16:30:00.000Z'
			})
		]);
		expect(currentHub.broadcastTargetId).toBe('');
	});
});

describe('currentHub.publishBroadcastNow', () => {
	it('moves draft or scheduled broadcasts into the live bucket', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', is_draft: true })];
		mockPublishBroadcastNow.mockResolvedValueOnce(makeBroadcast({ id: 'b1', is_draft: false }));

		await currentHub.publishBroadcastNow('b1');

		expect(currentHub.activeBroadcasts[0]?.id).toBe('b1');
		expect(currentHub.draftBroadcasts).toEqual([]);
		expect(currentHub.broadcastTargetId).toBe('');
	});
});

describe('currentHub.setBroadcastPinned', () => {
	it('keeps only the latest pinned broadcast', async () => {
		currentHub.broadcasts = [
			makeBroadcast({ id: 'b1', is_pinned: true }),
			makeBroadcast({ id: 'b2', is_pinned: false, created_at: '2026-04-12T11:00:00.000Z' })
		];
		mockSetBroadcastPinned.mockResolvedValueOnce(makeBroadcast({ id: 'b2', is_pinned: true }));

		await currentHub.setBroadcastPinned('b2', true);

		expect(currentHub.broadcasts.find((broadcast) => broadcast.id === 'b1')?.is_pinned).toBe(false);
		expect(currentHub.broadcasts.find((broadcast) => broadcast.id === 'b2')?.is_pinned).toBe(true);
	});
});

describe('currentHub.archiveBroadcast', () => {
	it('moves archived broadcasts into the inactive bucket', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1' })];
		mockArchiveBroadcast.mockResolvedValueOnce(
			makeBroadcast({ id: 'b1', archived_at: '2026-04-12T12:00:00.000Z' })
		);

		await currentHub.archiveBroadcast('b1');

		expect(currentHub.activeBroadcasts).toEqual([]);
		expect(currentHub.inactiveBroadcasts[0]?.id).toBe('b1');
	});
});

describe('currentHub.restoreBroadcast', () => {
	it('restores inactive broadcasts to the active list', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', archived_at: '2026-04-12T12:00:00.000Z' })];
		mockRestoreBroadcast.mockResolvedValueOnce(makeBroadcast({ id: 'b1', archived_at: null }));

		await currentHub.restoreBroadcast('b1');

		expect(currentHub.activeBroadcasts[0]?.id).toBe('b1');
		expect(currentHub.inactiveBroadcasts).toEqual([]);
	});
});

describe('currentHub.removeBroadcast', () => {
	it('removes a broadcast from the list', async () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', title: 'A' }), makeBroadcast({ id: 'b2', title: 'B' })];
		mockDeleteBroadcast.mockResolvedValueOnce(undefined);

		await currentHub.removeBroadcast('b1');

		expect(currentHub.broadcasts).toHaveLength(1);
		expect(currentHub.broadcasts[0].id).toBe('b2');
	});
});

describe('currentHub.addEvent', () => {
	it('creates an event, inserts it sorted by starts_at, and saves reminder settings when provided', async () => {
		currentHub.events = [makeEvent({ id: 'e1', title: 'Earlier', starts_at: '2026-04-01' })];
		const row = makeEvent({ id: 'e2', title: 'Later', starts_at: '2026-05-01' });
		mockCreateEvent.mockResolvedValueOnce(row);
		mockSaveEventReminderSettings.mockResolvedValueOnce(
			makeReminderSettings({ event_id: 'e2', reminder_offsets: [1440, 120] })
		);

		await currentHub.addEvent(
			{
			title: 'Later',
			description: '',
			starts_at: '2026-05-01',
			ends_at: null,
			location: '',
			publish_at: null
			},
			[120, 1440]
		);

		expect(currentHub.events).toHaveLength(2);
		expect(currentHub.events[0].id).toBe('e1');
		expect(currentHub.events[1].id).toBe('e2');
		expect(mockSaveEventReminderSettings).toHaveBeenCalledWith('e2', 'org-1', {
			delivery_channel: 'in_app',
			reminder_offsets: [1440, 120]
		});
		expect(currentHub.getEventReminderOffsets('e2')).toEqual([1440, 120]);
		expect(currentHub.eventTargetId).toBe('');
	});
});

describe('currentHub.updateEvent', () => {
	it('updates an event in place', async () => {
		currentHub.events = [makeEvent({ id: 'e1', title: 'Old' })];
		mockUpdateEvent.mockResolvedValueOnce(makeEvent({ id: 'e1', title: 'New' }));
		mockSaveEventReminderSettings.mockResolvedValueOnce(
			makeReminderSettings({ event_id: 'e1', reminder_offsets: [120] })
		);

		await currentHub.updateEvent(
			'e1',
			{
				title: 'New',
				description: '',
				starts_at: '2026-04-20T16:30:00.000Z',
				ends_at: null,
				location: '',
				publish_at: null
			},
			[120]
		);

		expect(currentHub.events[0]?.title).toBe('New');
		expect(currentHub.getEventReminderOffsets('e1')).toEqual([120]);
		expect(currentHub.eventTargetId).toBe('');
	});
});

describe('currentHub event lifecycle buckets', () => {
	it('separates live, scheduled, and inactive events', () => {
		currentHub.events = [
			makeEvent({ id: 'live', starts_at: '2099-04-20T16:30:00.000Z' }),
			makeEvent({ id: 'scheduled', starts_at: '2099-04-22T16:30:00.000Z', publish_at: '2099-04-15T16:30:00.000Z' }),
			makeEvent({ id: 'past', starts_at: '2000-04-01T16:30:00.000Z' })
		];

		expect(currentHub.liveEvents.map((event) => event.id)).toEqual(['live']);
		expect(currentHub.scheduledEvents.map((event) => event.id)).toEqual(['scheduled']);
		expect(currentHub.inactiveEvents.map((event) => event.id)).toEqual(['past']);
	});
});

describe('currentHub hubEngagementSummary', () => {
	it('summarizes live reply coverage and publish follow-up counts', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-13T12:00:00.000Z'));

		currentHub.events = [
			makeEvent({ id: 'live-replied' }),
			makeEvent({ id: 'live-silent', starts_at: '2026-04-19T16:30:00.000Z' }),
			makeEvent({ id: 'scheduled-event', publish_at: '2026-04-13T18:00:00.000Z' })
		];
		currentHub.broadcasts = [
			makeBroadcast({ id: 'scheduled-broadcast', publish_at: '2026-04-13T20:00:00.000Z' })
		];
		currentHub.eventResponseMap = {
			'live-replied': [
				{
					id: 'r1',
					event_id: 'live-replied',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'going',
					created_at: '2026-04-13T10:00:00.000Z',
					updated_at: '2026-04-13T10:00:00.000Z'
				}
			]
		};

		expect(currentHub.hubEngagementSummary).toMatchObject({
			liveEventCount: 2,
			respondedLiveEventCount: 1,
			noResponseLiveEventCount: 1,
			scheduledEventCount: 1,
			scheduledBroadcastCount: 1,
			approachingPublishCount: 2,
			followUpCount: 3
		});
		expect(currentHub.getEventEngagementSignal('live-silent')).toMatchObject({
			needsAttention: true,
			copy: 'This event still needs a first RSVP.'
		});
		expect(currentHub.getBroadcastEngagementSignal('scheduled-broadcast')).toMatchObject({
			needsAttention: true
		});

		vi.useRealTimers();
	});

	it('derives post-event follow-up signals for recent events', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

		currentHub.events = [
			makeEvent({ id: 'needs-review', starts_at: '2026-04-14T08:00:00.000Z', ends_at: '2026-04-14T09:00:00.000Z' }),
			makeEvent({ id: 'no-show', starts_at: '2026-04-14T07:00:00.000Z', ends_at: '2026-04-14T08:00:00.000Z' }),
			makeEvent({ id: 'low-turnout', starts_at: '2026-04-14T06:00:00.000Z', ends_at: '2026-04-14T07:00:00.000Z' })
		];
		currentHub.eventResponseMap = {
			'needs-review': [
				{
					id: 'r1',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'going',
					created_at: '2026-04-14T07:00:00.000Z',
					updated_at: '2026-04-14T07:00:00.000Z'
				},
				{
					id: 'r2',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-3',
					response: 'going',
					created_at: '2026-04-14T07:05:00.000Z',
					updated_at: '2026-04-14T07:05:00.000Z'
				},
				{
					id: 'r3',
					event_id: 'needs-review',
					organization_id: 'org-1',
					profile_id: 'profile-4',
					response: 'maybe',
					created_at: '2026-04-14T07:10:00.000Z',
					updated_at: '2026-04-14T07:10:00.000Z'
				}
			],
			'no-show': [
				{
					id: 'r4',
					event_id: 'no-show',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'going',
					created_at: '2026-04-14T06:00:00.000Z',
					updated_at: '2026-04-14T06:00:00.000Z'
				},
				{
					id: 'r5',
					event_id: 'no-show',
					organization_id: 'org-1',
					profile_id: 'profile-3',
					response: 'going',
					created_at: '2026-04-14T06:05:00.000Z',
					updated_at: '2026-04-14T06:05:00.000Z'
				}
			],
			'low-turnout': [
				{
					id: 'r6',
					event_id: 'low-turnout',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'going',
					created_at: '2026-04-14T05:00:00.000Z',
					updated_at: '2026-04-14T05:00:00.000Z'
				},
				{
					id: 'r7',
					event_id: 'low-turnout',
					organization_id: 'org-1',
					profile_id: 'profile-3',
					response: 'going',
					created_at: '2026-04-14T05:05:00.000Z',
					updated_at: '2026-04-14T05:05:00.000Z'
				},
				{
					id: 'r8',
					event_id: 'low-turnout',
					organization_id: 'org-1',
					profile_id: 'profile-4',
					response: 'going',
					created_at: '2026-04-14T05:10:00.000Z',
					updated_at: '2026-04-14T05:10:00.000Z'
				}
			]
		};
		currentHub.eventAttendanceMap = {
			'needs-review': [
				makeAttendanceRecord({ id: 'a1', event_id: 'needs-review', profile_id: 'profile-2', status: 'attended' })
			],
			'no-show': [
				makeAttendanceRecord({ id: 'a2', event_id: 'no-show', profile_id: 'profile-2', status: 'absent' }),
				makeAttendanceRecord({ id: 'a3', event_id: 'no-show', profile_id: 'profile-3', status: 'absent' })
			],
			'low-turnout': [
				makeAttendanceRecord({ id: 'a4', event_id: 'low-turnout', profile_id: 'profile-2', status: 'attended' }),
				makeAttendanceRecord({ id: 'a5', event_id: 'low-turnout', profile_id: 'profile-3', status: 'attended' }),
				makeAttendanceRecord({ id: 'a6', event_id: 'low-turnout', profile_id: 'profile-4', status: 'absent' })
			]
		};

		expect(currentHub.hubEventFollowUpSignals.map((signal) => signal.kind)).toEqual([
			'attendance_review',
			'no_show',
			'low_turnout'
		]);
		expect(currentHub.hubEngagementSummary).toMatchObject({
			recentAttendanceReviewCount: 1,
			noShowEventCount: 1,
			lowTurnoutEventCount: 1,
			postEventFollowUpCount: 3,
			followUpCount: 3
		});

		vi.useRealTimers();
	});
});

describe('currentHub.getEventResponseRoster', () => {
	it('derives responders and non-responders from the current organization roster', () => {
		currentHub.events = [makeEvent({ id: 'live-roster' })];
		currentHub.eventResponseMap = {
			'live-roster': [
				{
					id: 'r1',
					event_id: 'live-roster',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'maybe',
					created_at: '2026-04-13T10:00:00.000Z',
					updated_at: '2026-04-13T10:00:00.000Z'
				},
				{
					id: 'r2',
					event_id: 'live-roster',
					organization_id: 'org-1',
					profile_id: 'profile-9',
					response: 'going',
					created_at: '2026-04-13T11:00:00.000Z',
					updated_at: '2026-04-13T11:00:00.000Z'
				}
			]
		};
		mockCurrentOrganization.members = [
			makeMember({ profile_id: 'profile-1', name: 'Alex', role: 'admin' }),
			makeMember({ profile_id: 'profile-2', name: 'Bea' }),
			makeMember({ profile_id: 'profile-3', name: 'Chris' })
		];

		const roster = currentHub.getEventResponseRoster('live-roster');

		expect(roster).toMatchObject({
			totalMembers: 3,
			respondedCount: 1,
			nonResponderCount: 2,
			externalResponseCount: 1
		});
		expect(roster?.responders[0]).toMatchObject({
			member: { profile_id: 'profile-2' },
			response: 'maybe'
		});
		expect(roster?.nonResponders.map((entry) => entry.member.profile_id)).toEqual([
			'profile-1',
			'profile-3'
		]);
	});
});

describe('currentHub.cancelEvent', () => {
	it('moves a canceled event into the inactive bucket', async () => {
		currentHub.events = [makeEvent({ id: 'e1' })];
		mockCancelEvent.mockResolvedValueOnce(makeEvent({ id: 'e1', canceled_at: '2026-04-12T12:00:00.000Z' }));

		await currentHub.cancelEvent('e1');

		expect(currentHub.liveEvents).toEqual([]);
		expect(currentHub.inactiveEvents[0]?.id).toBe('e1');
		expect(currentHub.eventTargetId).toBe('');
	});
});

describe('currentHub.archiveEvent', () => {
	it('moves an archived event into the inactive bucket', async () => {
		currentHub.events = [makeEvent({ id: 'e1' })];
		mockArchiveEvent.mockResolvedValueOnce(makeEvent({ id: 'e1', archived_at: '2026-04-12T12:00:00.000Z' }));

		await currentHub.archiveEvent('e1');

		expect(currentHub.liveEvents).toEqual([]);
		expect(currentHub.inactiveEvents[0]?.id).toBe('e1');
		expect(currentHub.eventTargetId).toBe('');
	});
});

describe('currentHub.restoreEvent', () => {
	it('restores inactive events to the live bucket', async () => {
		currentHub.events = [makeEvent({ id: 'e1', archived_at: '2026-04-12T12:00:00.000Z' })];
		mockRestoreEvent.mockResolvedValueOnce(makeEvent({ id: 'e1', archived_at: null }));

		await currentHub.restoreEvent('e1');

		expect(currentHub.liveEvents[0]?.id).toBe('e1');
		expect(currentHub.inactiveEvents).toEqual([]);
		expect(currentHub.eventTargetId).toBe('');
	});
});

describe('currentHub.removeEvent', () => {
	it('removes an event from the list', async () => {
		currentHub.events = [makeEvent({ id: 'e1', title: 'A', starts_at: '' })];
		currentHub.eventAttendanceMap = {
			e1: [makeAttendanceRecord({ event_id: 'e1', profile_id: 'profile-2', status: 'attended' })]
		};
		currentHub.executionLedger = [
			makeExecutionLedgerRow({
				id: 'event-publish',
				job_kind: 'event_publish',
				source_id: 'e1',
				execution_key: 'publish',
				due_at: '2099-04-18T10:00:00.000Z'
			})
		];
		currentHub.eventResponseMap = {
			e1: [
				{
					id: 'r1',
					event_id: 'e1',
					organization_id: 'org-1',
					profile_id: 'profile-1',
					response: 'going',
					created_at: '2026-04-12T10:00:00.000Z',
					updated_at: '2026-04-12T10:00:00.000Z'
				}
			]
		};
		mockDeleteEvent.mockResolvedValueOnce(undefined);

		await currentHub.removeEvent('e1');

		expect(currentHub.events).toHaveLength(0);
		expect(currentHub.eventAttendanceMap).toEqual({});
		expect(currentHub.getEventReminderOffsets('e1')).toEqual([]);
		expect(currentHub.eventResponseMap).toEqual({});
		expect(mockDeleteHubExecutionLedgerEntries).toHaveBeenCalledWith(['event-publish']);
		expect(currentHub.executionLedger).toEqual([]);
	});
});

describe('currentHub.setEventAttendance', () => {
	it('upserts a recorded attendance outcome and updates local summaries', async () => {
		mockUpsertEventAttendanceRecord.mockResolvedValueOnce(
			makeAttendanceRecord({
				id: 'att-2',
				event_id: 'e1',
				profile_id: 'profile-2',
				status: 'attended',
				marked_by_profile_id: 'profile-1',
				updated_at: '2026-04-14T12:00:00.000Z'
			})
		);

		await currentHub.setEventAttendance('e1', 'profile-2', 'attended');

		expect(mockUpsertEventAttendanceRecord).toHaveBeenCalledWith({
			eventId: 'e1',
			organizationId: 'org-1',
			profileId: 'profile-2',
			status: 'attended',
			markedByProfileId: 'profile-1'
		});
		expect(currentHub.getEventAttendanceStatus('e1', 'profile-2')).toBe('attended');
		expect(currentHub.getEventAttendanceOutcomeSummary('e1')).toMatchObject({
			attended: 1,
			absent: 0,
			recorded: 1
		});
		expect(currentHub.eventAttendanceTargetId).toBe('');
	});
});

describe('currentHub.setEventAttendanceForProfiles', () => {
	it('upserts bulk attendance outcomes for unresolved attendees only', async () => {
		currentHub.eventAttendanceMap = {
			e1: [makeAttendanceRecord({ event_id: 'e1', profile_id: 'profile-2', status: 'attended' })]
		};
		mockUpsertEventAttendanceRecord
			.mockResolvedValueOnce(
				makeAttendanceRecord({
					id: 'att-3',
					event_id: 'e1',
					profile_id: 'profile-3',
					status: 'attended',
					marked_by_profile_id: 'profile-1',
					updated_at: '2026-04-14T12:00:00.000Z'
				})
			)
			.mockResolvedValueOnce(
				makeAttendanceRecord({
					id: 'att-4',
					event_id: 'e1',
					profile_id: 'profile-4',
					status: 'attended',
					marked_by_profile_id: 'profile-1',
					updated_at: '2026-04-14T12:05:00.000Z'
				})
			);

		await currentHub.setEventAttendanceForProfiles(
			'e1',
			['profile-2', 'profile-3', 'profile-4', 'profile-4'],
			'attended'
		);

		expect(mockUpsertEventAttendanceRecord).toHaveBeenCalledTimes(2);
		expect(mockUpsertEventAttendanceRecord).toHaveBeenNthCalledWith(1, {
			eventId: 'e1',
			organizationId: 'org-1',
			profileId: 'profile-3',
			status: 'attended',
			markedByProfileId: 'profile-1'
		});
		expect(mockUpsertEventAttendanceRecord).toHaveBeenNthCalledWith(2, {
			eventId: 'e1',
			organizationId: 'org-1',
			profileId: 'profile-4',
			status: 'attended',
			markedByProfileId: 'profile-1'
		});
		expect(currentHub.getEventAttendanceOutcomeSummary('e1')).toMatchObject({
			attended: 3,
			absent: 0,
			recorded: 3
		});
		expect(currentHub.eventAttendanceTargetId).toBe('');
	});

	it('surfaces partial bulk attendance saves accurately when a later mutation fails', async () => {
		currentHub.eventAttendanceMap = { e1: [] };
		mockUpsertEventAttendanceRecord
			.mockResolvedValueOnce(
				makeAttendanceRecord({
					id: 'att-2',
					event_id: 'e1',
					profile_id: 'profile-2',
					status: 'attended',
					marked_by_profile_id: 'profile-1',
					updated_at: '2026-04-14T12:00:00.000Z'
				})
			)
			.mockRejectedValueOnce(new Error('Network request failed.'));

		await expect(
			currentHub.setEventAttendanceForProfiles(
				'e1',
				['profile-2', 'profile-3'],
				'attended'
			)
		).rejects.toThrow(
			'Saved 1 of 2 attendance updates before the bulk action stopped. Network request failed.'
		);

		expect(currentHub.getEventAttendanceStatus('e1', 'profile-2')).toBe('attended');
		expect(currentHub.getEventAttendanceStatus('e1', 'profile-3')).toBeNull();
		expect(currentHub.lastError?.message).toBe(
			'Saved 1 of 2 attendance updates before the bulk action stopped. Network request failed.'
		);
		expect(currentHub.eventAttendanceTargetId).toBe('');
	});
});

describe('currentHub.getEventAttendanceRoster', () => {
	it('builds a compact day-of roster for events inside the attendance window', () => {
		mockCurrentOrganization.members = [
			makeMember({ profile_id: 'profile-1', name: 'Alex' }),
			makeMember({ profile_id: 'profile-2', name: 'Bea' })
		];
		currentHub.events = [makeEvent({ id: 'e1', starts_at: '2099-04-20T16:30:00.000Z' })];
		currentHub.eventResponseMap = {
			e1: [
				{
					id: 'r1',
					event_id: 'e1',
					organization_id: 'org-1',
					profile_id: 'profile-1',
					response: 'going',
					created_at: '2099-04-20T10:00:00.000Z',
					updated_at: '2099-04-20T10:00:00.000Z'
				}
			]
		};
		currentHub.eventAttendanceMap = {
			e1: [makeAttendanceRecord({ event_id: 'e1', profile_id: 'profile-2', status: 'attended' })]
		};

		vi.useFakeTimers();
		vi.setSystemTime(new Date('2099-04-20T12:00:00.000Z'));

		const roster = currentHub.getEventAttendanceRoster('e1');

		expect(roster).toMatchObject({
			expectedCount: 2,
			pendingCount: 1,
			recordedCount: 1
		});

		vi.useRealTimers();
	});
});

describe('currentHub.setEventResponse', () => {
	it('upserts the current member response and updates local summaries', async () => {
		currentHub.eventResponseMap = {
			e1: [
				{
					id: 'r1',
					event_id: 'e1',
					organization_id: 'org-1',
					profile_id: 'profile-2',
					response: 'maybe',
					created_at: '2026-04-12T10:00:00.000Z',
					updated_at: '2026-04-12T10:00:00.000Z'
				}
			]
		};
		mockUpsertOwnEventResponse.mockResolvedValueOnce({
			id: 'r2',
			event_id: 'e1',
			organization_id: 'org-1',
			profile_id: 'profile-1',
			response: 'going',
			created_at: '2026-04-12T11:00:00.000Z',
			updated_at: '2026-04-12T11:00:00.000Z'
		});

		await currentHub.setEventResponse('e1', 'going');

		expect(mockUpsertOwnEventResponse).toHaveBeenCalledWith({
			eventId: 'e1',
			organizationId: 'org-1',
			profileId: 'profile-1',
			response: 'going'
		});
		expect(currentHub.getOwnEventResponse('e1')).toBe('going');
		expect(currentHub.getEventAttendanceSummary('e1')).toMatchObject({
			going: 1,
			maybe: 1,
			cannotAttend: 0,
			total: 2
		});
		expect(currentHub.eventResponseTargetId).toBe('');
	});
});

describe('currentHub.clearEventAttendance', () => {
	it('clears a recorded attendance outcome and returns the member to an unrecorded state', async () => {
		currentHub.eventAttendanceMap = {
			e1: [makeAttendanceRecord({ event_id: 'e1', profile_id: 'profile-2', status: 'absent' })]
		};

		await currentHub.clearEventAttendance('e1', 'profile-2');

		expect(mockDeleteEventAttendanceRecord).toHaveBeenCalledWith('e1', 'profile-2');
		expect(currentHub.getEventAttendanceStatus('e1', 'profile-2')).toBeNull();
		expect(currentHub.getEventAttendanceOutcomeSummary('e1')).toMatchObject({
			attended: 0,
			absent: 0,
			recorded: 0
		});
		expect(currentHub.eventAttendanceTargetId).toBe('');
	});
});

describe('currentHub.addResource', () => {
	it('creates a resource at the next sort position', async () => {
		currentHub.resources = [makeResource({ id: 'r1', sort_order: 0 })];
		mockCreateResource.mockResolvedValueOnce(makeResource({ id: 'r2', sort_order: 1, title: 'Directory form' }));

		await currentHub.addResource({
			title: 'Directory form',
			description: 'Update your information',
			href: 'https://example.com/form',
			resource_type: 'form'
		});

		expect(mockCreateResource).toHaveBeenCalledWith('org-1', {
			title: 'Directory form',
			description: 'Update your information',
			href: 'https://example.com/form',
			resource_type: 'form',
			sort_order: 1
		});
		expect(currentHub.orderedResources.map((resource) => resource.id)).toEqual(['r1', 'r2']);
		expect(currentHub.resourceTargetId).toBe('');
	});
});

describe('currentHub.updateResource', () => {
	it('updates a resource in place and preserves its order', async () => {
		currentHub.resources = [makeResource({ id: 'r1', title: 'Old', sort_order: 2 })];
		mockUpdateResource.mockResolvedValueOnce(makeResource({ id: 'r1', title: 'New', sort_order: 2 }));

		await currentHub.updateResource('r1', {
			title: 'New',
			description: 'Setup steps',
			href: 'https://example.com/guide',
			resource_type: 'document'
		});

		expect(mockUpdateResource).toHaveBeenCalledWith('r1', {
			title: 'New',
			description: 'Setup steps',
			href: 'https://example.com/guide',
			resource_type: 'document',
			sort_order: 2
		});
		expect(currentHub.resources[0]?.title).toBe('New');
		expect(currentHub.resourceTargetId).toBe('');
	});
});

describe('currentHub.moveResource', () => {
	it('reorders resources and persists the new positions', async () => {
		currentHub.resources = [
			makeResource({ id: 'r1', sort_order: 0, title: 'First' }),
			makeResource({ id: 'r2', sort_order: 1, title: 'Second' }),
			makeResource({ id: 'r3', sort_order: 2, title: 'Third' })
		];
		mockSaveResourceOrder.mockResolvedValueOnce(undefined);

		await currentHub.moveResource('r2', 'up');

		expect(mockSaveResourceOrder).toHaveBeenCalledWith([
			{ id: 'r2', sort_order: 0 },
			{ id: 'r1', sort_order: 1 },
			{ id: 'r3', sort_order: 2 }
		]);
		expect(currentHub.orderedResources.map((resource) => resource.id)).toEqual(['r2', 'r1', 'r3']);
		expect(currentHub.resourceTargetId).toBe('');
	});

	it('does not persist when the move would not change order', async () => {
		currentHub.resources = [
			makeResource({ id: 'r1', sort_order: 0, title: 'First' }),
			makeResource({ id: 'r2', sort_order: 1, title: 'Second' })
		];

		await currentHub.moveResource('r1', 'up');

		expect(mockSaveResourceOrder).not.toHaveBeenCalled();
		expect(currentHub.orderedResources.map((resource) => resource.id)).toEqual(['r1', 'r2']);
		expect(currentHub.resourceTargetId).toBe('');
	});
});

describe('currentHub.removeResource', () => {
	it('deletes a resource and renumbers the remaining rows', async () => {
		currentHub.resources = [
			makeResource({ id: 'r1', sort_order: 0, title: 'First' }),
			makeResource({ id: 'r2', sort_order: 1, title: 'Second' })
		];
		mockDeleteResource.mockResolvedValueOnce(undefined);
		mockSaveResourceOrder.mockResolvedValueOnce(undefined);

		await currentHub.removeResource('r1');

		expect(mockDeleteResource).toHaveBeenCalledWith('r1');
		expect(mockSaveResourceOrder).toHaveBeenCalledWith([{ id: 'r2', sort_order: 0 }]);
		expect(currentHub.orderedResources).toEqual([makeResource({ id: 'r2', sort_order: 0, title: 'Second' })]);
		expect(currentHub.resourceTargetId).toBe('');
	});
});

describe('currentHub.reset', () => {
	it('clears all state', () => {
		currentHub.broadcasts = [makeBroadcast({ id: 'b1', title: 'X' })];
		currentHub.resources = [makeResource({ id: 'r1', title: 'Guide' })];
		currentHub.eventResponseMap = { e1: [] };
		currentHub.eventReminderSettingsMap = { e1: makeReminderSettings({ event_id: 'e1' }) };
		currentHub.executionLedger = [makeExecutionLedgerRow()];
		currentHub.notificationPreferences = { broadcast: false, event: true, message: true };
		currentHub.notificationReadMap = { 'broadcast:b1': '2026-04-13T10:00:00.000Z' };
		currentHub.broadcastTargetId = 'b1';
		currentHub.eventTargetId = 'e1';
		currentHub.resourceTargetId = 'r1';
		currentHub.eventResponseTargetId = 'e1';
		currentHub.isSavingNotificationPreferences = true;
		currentHub.notificationReadTargetId = 'broadcast:b1';
		currentHub.isMarkingAllActivityRead = true;
		currentHub.lastError = new Error('old');

		currentHub.reset();

		expect(currentHub.broadcasts).toEqual([]);
		expect(currentHub.events).toEqual([]);
		expect(currentHub.resources).toEqual([]);
		expect(currentHub.loadedOrgId).toBe('');
		expect(currentHub.hasLoadedForCurrentOrg).toBe(false);
		expect(currentHub.broadcastTargetId).toBe('');
		expect(currentHub.eventTargetId).toBe('');
		expect(currentHub.resourceTargetId).toBe('');
		expect(currentHub.eventResponseMap).toEqual({});
		expect(currentHub.eventReminderSettingsMap).toEqual({});
		expect(currentHub.executionLedger).toEqual([]);
		expect(currentHub.eventResponseTargetId).toBe('');
		expect(currentHub.notificationPreferences).toEqual({ broadcast: true, event: true, message: true });
		expect(currentHub.notificationReadMap).toEqual({});
		expect(currentHub.isSavingNotificationPreferences).toBe(false);
		expect(currentHub.notificationReadTargetId).toBe('');
		expect(currentHub.isMarkingAllActivityRead).toBe(false);
		expect(currentHub.plugins).toEqual({ broadcasts: false, events: false, resources: false });
		expect(currentHub.lastError).toBeNull();
		expect(currentHub.isLoading).toBe(false);
	});
});
