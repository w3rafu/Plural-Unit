import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock hub repository ──

const mockFetchActivePlugins = vi.fn();
const mockTogglePlugin = vi.fn();
const mockFetchBroadcasts = vi.fn();
const mockFetchEvents = vi.fn();
const mockFetchEventResponses = vi.fn();
const mockFetchResources = vi.fn();
const mockCreateBroadcast = vi.fn();
const mockSaveBroadcastDraft = vi.fn();
const mockScheduleBroadcast = vi.fn();
const mockPublishBroadcastNow = vi.fn();
const mockUpdateBroadcast = vi.fn();
const mockSetBroadcastPinned = vi.fn();
const mockArchiveBroadcast = vi.fn();
const mockRestoreBroadcast = vi.fn();
const mockDeleteBroadcast = vi.fn();
const mockCreateEvent = vi.fn();
const mockUpdateEvent = vi.fn();
const mockCancelEvent = vi.fn();
const mockArchiveEvent = vi.fn();
const mockRestoreEvent = vi.fn();
const mockDeleteEvent = vi.fn();
const mockUpsertOwnEventResponse = vi.fn();
const mockCreateResource = vi.fn();
const mockUpdateResource = vi.fn();
const mockSaveResourceOrder = vi.fn();
const mockDeleteResource = vi.fn();

vi.mock('$lib/repositories/hubRepository', () => ({
	fetchActivePlugins: (...args: any[]) => mockFetchActivePlugins(...args),
	togglePlugin: (...args: any[]) => mockTogglePlugin(...args),
	fetchBroadcasts: (...args: any[]) => mockFetchBroadcasts(...args),
	fetchEvents: (...args: any[]) => mockFetchEvents(...args),
	fetchEventResponses: (...args: any[]) => mockFetchEventResponses(...args),
	fetchResources: (...args: any[]) => mockFetchResources(...args),
	createBroadcast: (...args: any[]) => mockCreateBroadcast(...args),
	saveBroadcastDraft: (...args: any[]) => mockSaveBroadcastDraft(...args),
	scheduleBroadcast: (...args: any[]) => mockScheduleBroadcast(...args),
	publishBroadcastNow: (...args: any[]) => mockPublishBroadcastNow(...args),
	updateBroadcast: (...args: any[]) => mockUpdateBroadcast(...args),
	setBroadcastPinned: (...args: any[]) => mockSetBroadcastPinned(...args),
	archiveBroadcast: (...args: any[]) => mockArchiveBroadcast(...args),
	restoreBroadcast: (...args: any[]) => mockRestoreBroadcast(...args),
	deleteBroadcast: (...args: any[]) => mockDeleteBroadcast(...args),
	createEvent: (...args: any[]) => mockCreateEvent(...args),
	updateEvent: (...args: any[]) => mockUpdateEvent(...args),
	cancelEvent: (...args: any[]) => mockCancelEvent(...args),
	archiveEvent: (...args: any[]) => mockArchiveEvent(...args),
	restoreEvent: (...args: any[]) => mockRestoreEvent(...args),
	deleteEvent: (...args: any[]) => mockDeleteEvent(...args),
	upsertOwnEventResponse: (...args: any[]) => mockUpsertOwnEventResponse(...args),
	createResource: (...args: any[]) => mockCreateResource(...args),
	updateResource: (...args: any[]) => mockUpdateResource(...args),
	saveResourceOrder: (...args: any[]) => mockSaveResourceOrder(...args),
	deleteResource: (...args: any[]) => mockDeleteResource(...args)
}));

// Mock currentOrganization so orgId resolves
vi.mock('./currentOrganization.svelte', () => ({
	currentOrganization: {
		organization: { id: 'org-1' },
		membership: { profile_id: 'profile-1' }
	}
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
vi.mock('$lib/models/hubNotifications', () => ({
	buildHubNotifications: () => []
}));

vi.mock('$lib/models/eventResponseModel', async () => {
	const actual = await vi.importActual<typeof import('$lib/models/eventResponseModel')>(
		'$lib/models/eventResponseModel'
	);
	return actual;
});

import { currentHub } from './currentHub.svelte';

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
		archived_at: overrides.archived_at ?? null
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

beforeEach(() => {
	vi.clearAllMocks();
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
		expect(currentHub.resources).toEqual([makeResource({ id: 'r1', title: 'Prayer guide' })]);
		expect(currentHub.getOwnEventResponse('e1')).toBe('going');
		expect(currentHub.isLoading).toBe(false);
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
		expect(mockFetchEventResponses).not.toHaveBeenCalled();
		expect(mockFetchResources).not.toHaveBeenCalled();
		expect(currentHub.broadcasts).toEqual([]);
		expect(currentHub.events).toEqual([]);
		expect(currentHub.resources).toEqual([]);
		expect(currentHub.eventResponseMap).toEqual({});
	});

	it('captures error and re-throws on failure', async () => {
		mockFetchActivePlugins.mockRejectedValueOnce(new Error('network'));

		await expect(currentHub.load()).rejects.toThrow('network');
		expect(currentHub.lastError?.message).toBe('network');
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

		await currentHub.scheduleBroadcast('b1', '2099-04-15T16:30:00.000Z');

		expect(currentHub.scheduledBroadcasts[0]?.id).toBe('b1');
		expect(currentHub.draftBroadcasts).toEqual([]);
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
	it('creates an event and inserts it sorted by starts_at', async () => {
		currentHub.events = [makeEvent({ id: 'e1', title: 'Earlier', starts_at: '2026-04-01' })];
		const row = makeEvent({ id: 'e2', title: 'Later', starts_at: '2026-05-01' });
		mockCreateEvent.mockResolvedValueOnce(row);

		await currentHub.addEvent({
			title: 'Later',
			description: '',
			starts_at: '2026-05-01',
			ends_at: null,
			location: '',
			publish_at: null
		});

		expect(currentHub.events).toHaveLength(2);
		expect(currentHub.events[0].id).toBe('e1');
		expect(currentHub.events[1].id).toBe('e2');
		expect(currentHub.eventTargetId).toBe('');
	});
});

describe('currentHub.updateEvent', () => {
	it('updates an event in place', async () => {
		currentHub.events = [makeEvent({ id: 'e1', title: 'Old' })];
		mockUpdateEvent.mockResolvedValueOnce(makeEvent({ id: 'e1', title: 'New' }));

		await currentHub.updateEvent('e1', {
			title: 'New',
			description: '',
			starts_at: '2026-04-20T16:30:00.000Z',
			ends_at: null,
			location: '',
			publish_at: null
		});

		expect(currentHub.events[0]?.title).toBe('New');
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
		expect(currentHub.eventResponseMap).toEqual({});
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
		currentHub.broadcastTargetId = 'b1';
		currentHub.eventTargetId = 'e1';
		currentHub.resourceTargetId = 'r1';
		currentHub.eventResponseTargetId = 'e1';
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
		expect(currentHub.eventResponseTargetId).toBe('');
		expect(currentHub.plugins).toEqual({ broadcasts: false, events: false, resources: false });
		expect(currentHub.lastError).toBeNull();
		expect(currentHub.isLoading).toBe(false);
	});
});
