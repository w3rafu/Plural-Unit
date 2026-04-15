// @ts-nocheck — Supabase mock chain returns are loosely typed by design.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the Supabase client ──

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, order: mockOrder }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({ select: mockSelect, error: null }));
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle, select: mockSelect, order: mockOrder, eq: mockEq }));
const mockOrder = vi.fn(() => ({ data: [], error: null }));
const mockRpc = vi.fn();

const mockFrom = vi.fn(() => ({
	select: mockSelect,
	insert: mockInsert,
	update: mockUpdate,
	delete: mockDelete,
	upsert: mockUpsert,
	eq: mockEq
}));

const mockClient = {
	from: mockFrom,
	rpc: mockRpc
};

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: () => mockClient
}));

import {
	fetchBroadcasts,
	createBroadcast,
	saveBroadcastDraft,
	scheduleBroadcast,
	publishBroadcastNow,
	updateBroadcastDeliveryState,
	updateBroadcast,
	setBroadcastPinned,
	archiveBroadcast,
	restoreBroadcast,
	deleteBroadcast,
	fetchEvents,
	fetchEventAttendanceRecords,
	fetchEventReminderSettings,
	createEvent,
	deleteEventAttendanceRecord,
	saveEventReminderSettings,
	upsertEventAttendanceRecord,
	updateEventDeliveryState,
	updateEvent,
	cancelEvent,
	archiveEvent,
	restoreEvent,
	deleteEvent,
	fetchHubExecutionLedger,
	processDueHubReminderExecutions,
	upsertHubExecutionLedgerEntries,
	deleteHubExecutionLedgerEntries,
	fetchHubNotificationPreferences,
	saveHubNotificationPreferences,
	fetchHubNotificationReads,
	markHubNotificationRead,
	fetchResources,
	createResource,
	updateResource,
	saveResourceOrder,
	deleteResource,
	fetchActivePlugins,
	togglePlugin
} from './hubRepository';

beforeEach(() => {
	vi.clearAllMocks();
});

// ── Broadcasts ──

describe('fetchBroadcasts', () => {
	it('queries hub_broadcasts filtered by organization_id', async () => {
		mockOrder.mockResolvedValueOnce({ data: [{ id: 'b1', title: 'Hello' }], error: null });

		const result = await fetchBroadcasts('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_broadcasts');
		expect(mockSelect).toHaveBeenCalledWith(
			expect.stringContaining('delivery_state, delivered_at, delivery_failure_reason')
		);
		expect(result).toEqual([{ id: 'b1', title: 'Hello' }]);
	});

	it('throws on Supabase error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'db fail' } });

		await expect(fetchBroadcasts('org-1')).rejects.toThrow('db fail');
	});

	it('returns empty array when data is null', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: null });

		const result = await fetchBroadcasts('org-1');
		expect(result).toEqual([]);
	});
});

describe('createBroadcast', () => {
	it('inserts into hub_broadcasts and returns the row', async () => {
		const row = {
			id: 'b2',
			organization_id: 'org-1',
			title: 'New',
			body: 'Body',
			created_at: '2026-01-01',
			updated_at: '2026-01-01',
			is_pinned: false,
			is_draft: false,
			publish_at: null,
			archived_at: null,
			expires_at: null
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await createBroadcast('org-1', {
			title: 'New',
			body: 'Body',
			expires_at: null,
			is_draft: false,
			publish_at: null
		});

		expect(mockFrom).toHaveBeenCalledWith('hub_broadcasts');
		expect(mockInsert).toHaveBeenCalledWith({
			organization_id: 'org-1',
			title: 'New',
			body: 'Body',
			expires_at: null,
			is_draft: false,
			publish_at: null
		});
		expect(result).toEqual(row);
	});

	it('throws on insert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'insert fail' } });

		await expect(
			createBroadcast('org-1', {
				title: 'X',
				body: 'Y',
				expires_at: null,
				is_draft: true,
				publish_at: null
			})
		).rejects.toThrow('insert fail');
	});
});

	describe('updateBroadcast', () => {
		it('updates a broadcast and returns the latest row', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Updated',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: false,
				publish_at: null,
				archived_at: null,
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await updateBroadcast('b1', {
				title: 'Updated',
				body: 'Body',
				expires_at: null,
				is_draft: false,
				publish_at: null
			});

			expect(mockUpdate).toHaveBeenCalledWith({
				title: 'Updated',
				body: 'Body',
				expires_at: null,
				is_draft: false,
				publish_at: null
			});
			expect(result).toEqual(row);
		});

		it('throws on update error', async () => {
			mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'update fail' } });

			await expect(
				updateBroadcast('b1', {
					title: 'X',
					body: 'Y',
					expires_at: null,
					is_draft: true,
					publish_at: null
				})
			).rejects.toThrow('update fail');
		});
	});

	describe('setBroadcastPinned', () => {
		it('unpins the rest of the organization before pinning the target row', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Pinned',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: true,
				is_draft: false,
				publish_at: null,
				archived_at: null,
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await setBroadcastPinned('org-1', 'b1', true);

			expect(mockUpdate).toHaveBeenNthCalledWith(1, { is_pinned: false });
			expect(mockUpdate).toHaveBeenNthCalledWith(2, {
				is_pinned: true,
				is_draft: false,
				publish_at: null,
				archived_at: null
			});
			expect(result).toEqual(row);
		});

		it('throws on pinning error', async () => {
			mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'pin fail' } });

			await expect(setBroadcastPinned('org-1', 'b1', false)).rejects.toThrow('pin fail');
		});
	});

	describe('archiveBroadcast', () => {
		it('marks a broadcast archived', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Archived',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: false,
				publish_at: null,
				archived_at: '2026-01-02',
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await archiveBroadcast('b1');

			expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_pinned: false }));
			expect(result).toEqual(row);
		});
	});

	describe('restoreBroadcast', () => {
		it('clears lifecycle fields when restoring a broadcast', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Restored',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: false,
				publish_at: null,
				archived_at: null,
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await restoreBroadcast('b1');

			expect(mockUpdate).toHaveBeenCalledWith({
				archived_at: null,
				expires_at: null,
				is_pinned: false,
				is_draft: false,
				publish_at: null
			});
			expect(result).toEqual(row);
		});
	});

	describe('saveBroadcastDraft', () => {
		it('moves a broadcast back into draft state', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Drafted',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: true,
				publish_at: null,
				archived_at: null,
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await saveBroadcastDraft('b1');

			expect(mockUpdate).toHaveBeenCalledWith({
				is_draft: true,
				publish_at: null,
				archived_at: null,
				is_pinned: false
			});
			expect(result).toEqual(row);
		});
	});

	describe('scheduleBroadcast', () => {
		it('saves a future publish time', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Scheduled',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: false,
				publish_at: '2026-02-01T12:00:00.000Z',
				archived_at: null,
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await scheduleBroadcast('b1', '2026-02-01T12:00:00.000Z');

			expect(mockUpdate).toHaveBeenCalledWith({
				is_draft: false,
				publish_at: '2026-02-01T12:00:00.000Z',
				archived_at: null,
				is_pinned: false
			});
			expect(result).toEqual(row);
		});
	});

	describe('publishBroadcastNow', () => {
		it('publishes a broadcast immediately', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Live',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: false,
				publish_at: null,
				archived_at: null,
				expires_at: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await publishBroadcastNow('b1');

			expect(mockUpdate).toHaveBeenCalledWith({ is_draft: false, publish_at: null, archived_at: null });
			expect(result).toEqual(row);
		});
	});

	describe('updateBroadcastDeliveryState', () => {
		it('updates persisted delivery metadata for a broadcast', async () => {
			const row = {
				id: 'b1',
				organization_id: 'org-1',
				title: 'Scheduled',
				body: 'Body',
				created_at: '2026-01-01',
				updated_at: '2026-01-02',
				is_pinned: false,
				is_draft: false,
				publish_at: '2026-02-01T12:00:00.000Z',
				archived_at: null,
				expires_at: null,
				delivery_state: 'published',
				delivered_at: '2026-02-01T12:00:00.000Z',
				delivery_failure_reason: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await updateBroadcastDeliveryState('b1', {
				delivery_state: 'published',
				delivered_at: '2026-02-01T12:00:00.000Z',
				delivery_failure_reason: null
			});

			expect(mockUpdate).toHaveBeenCalledWith({
				delivery_state: 'published',
				delivered_at: '2026-02-01T12:00:00.000Z',
				delivery_failure_reason: null
			});
			expect(result).toEqual(row);
		});
	});

describe('deleteBroadcast', () => {
	it('deletes from hub_broadcasts by id', async () => {
		mockEq.mockResolvedValueOnce({ error: null });

		await deleteBroadcast('b1');

		expect(mockFrom).toHaveBeenCalledWith('hub_broadcasts');
	});

	it('throws on delete error', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'delete fail' } });

		await expect(deleteBroadcast('b1')).rejects.toThrow('delete fail');
	});
});

// ── Events ──

describe('fetchEvents', () => {
	it('queries hub_events filtered by organization_id', async () => {
		mockOrder.mockResolvedValueOnce({ data: [{ id: 'e1', title: 'Meeting' }], error: null });

		const result = await fetchEvents('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_events');
		expect(mockSelect).toHaveBeenCalledWith(
			expect.stringContaining('delivery_state, delivered_at, delivery_failure_reason')
		);
		expect(result).toEqual([{ id: 'e1', title: 'Meeting' }]);
	});

	it('throws on error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'events fail' } });

		await expect(fetchEvents('org-1')).rejects.toThrow('events fail');
	});

	it('adds migration guidance when the schema is missing delivery metadata columns', async () => {
		mockOrder.mockResolvedValueOnce({
			data: null,
			error: { message: 'column hub_events.delivery_state does not exist', code: '42703' }
		});

		await expect(fetchEvents('org-1')).rejects.toThrow(
			'column hub_events.delivery_state does not exist Run the latest Supabase migrations, then try again.'
		);
	});
});

describe('fetchEventAttendanceRecords', () => {
	it('queries hub_event_attendances filtered by organization_id', async () => {
		const rows = [
			{
				id: 'att-1',
				event_id: 'e1',
				organization_id: 'org-1',
				profile_id: 'profile-1',
				status: 'attended',
				marked_by_profile_id: 'admin-1',
				created_at: '2026-04-14T10:00:00.000Z',
				updated_at: '2026-04-14T10:00:00.000Z'
			}
		];
		mockOrder.mockResolvedValueOnce({ data: rows, error: null });

		const result = await fetchEventAttendanceRecords('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_event_attendances');
		expect(result).toEqual(rows);
	});

	it('throws on attendance query error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'attendance fetch fail' } });

		await expect(fetchEventAttendanceRecords('org-1')).rejects.toThrow('attendance fetch fail');
	});
});

describe('createEvent', () => {
	it('inserts into hub_events and returns the row', async () => {
		const payload = {
			title: 'Meeting',
			description: 'Desc',
			starts_at: '2026-04-11',
			ends_at: null,
			location: 'Room A',
			publish_at: null
		};
		const row = {
			id: 'e2',
			organization_id: 'org-1',
			...payload,
			created_at: '2026-01-01',
			updated_at: '2026-01-01',
			canceled_at: null,
			archived_at: null
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await createEvent('org-1', payload);

		expect(mockFrom).toHaveBeenCalledWith('hub_events');
		expect(mockInsert).toHaveBeenCalledWith({ organization_id: 'org-1', ...payload });
		expect(result).toEqual(row);
	});

	it('throws on insert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'event insert fail' } });

		await expect(
			createEvent('org-1', {
				title: 'X',
				description: 'Y',
				starts_at: '2026-01-01',
				ends_at: null,
				location: 'Z',
				publish_at: null
			})
		).rejects.toThrow('event insert fail');
	});
});

describe('upsertEventAttendanceRecord', () => {
	it('upserts a recorded attendance outcome and returns the row', async () => {
		const row = {
			id: 'att-1',
			event_id: 'e1',
			organization_id: 'org-1',
			profile_id: 'profile-2',
			status: 'attended',
			marked_by_profile_id: 'profile-1',
			created_at: '2026-04-14T10:00:00.000Z',
			updated_at: '2026-04-14T10:05:00.000Z'
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await upsertEventAttendanceRecord({
			eventId: 'e1',
			organizationId: 'org-1',
			profileId: 'profile-2',
			status: 'attended',
			markedByProfileId: 'profile-1'
		});

		expect(mockFrom).toHaveBeenCalledWith('hub_event_attendances');
		expect(mockUpsert).toHaveBeenCalledWith(
			{
				event_id: 'e1',
				organization_id: 'org-1',
				profile_id: 'profile-2',
				status: 'attended',
				marked_by_profile_id: 'profile-1'
			},
			{ onConflict: 'event_id,profile_id' }
		);
		expect(result).toEqual(row);
	});

	it('throws on attendance upsert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'attendance save fail' } });

		await expect(
			upsertEventAttendanceRecord({
				eventId: 'e1',
				organizationId: 'org-1',
				profileId: 'profile-2',
				status: 'absent',
				markedByProfileId: 'profile-1'
			})
		).rejects.toThrow('attendance save fail');
	});
});

describe('deleteEventAttendanceRecord', () => {
	it('deletes a recorded attendance outcome for one member and event', async () => {
		await deleteEventAttendanceRecord('e1', 'profile-2');

		expect(mockFrom).toHaveBeenCalledWith('hub_event_attendances');
		expect(mockDelete).toHaveBeenCalledTimes(1);
		expect(mockEq).toHaveBeenNthCalledWith(1, 'event_id', 'e1');
		expect(mockEq).toHaveBeenNthCalledWith(2, 'profile_id', 'profile-2');
	});
});

describe('fetchEventReminderSettings', () => {
	it('queries hub_event_reminders filtered by organization_id', async () => {
		const rows = [
			{
				id: 'rem-1',
				event_id: 'e1',
				organization_id: 'org-1',
				delivery_channel: 'in_app',
				reminder_offsets: [1440, 120],
				created_at: '2026-04-13T10:00:00.000Z',
				updated_at: '2026-04-13T10:00:00.000Z'
			}
		];
		mockOrder.mockResolvedValueOnce({ data: rows, error: null });

		const result = await fetchEventReminderSettings('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_event_reminders');
		expect(result).toEqual(rows);
	});

	it('throws on reminder query error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'reminder fetch fail' } });

		await expect(fetchEventReminderSettings('org-1')).rejects.toThrow('reminder fetch fail');
	});
});

describe('saveEventReminderSettings', () => {
	it('upserts reminder settings for an event and returns the row', async () => {
		const row = {
			id: 'rem-1',
			event_id: 'e1',
			organization_id: 'org-1',
			delivery_channel: 'in_app',
			reminder_offsets: [1440, 120],
			created_at: '2026-04-13T10:00:00.000Z',
			updated_at: '2026-04-13T10:05:00.000Z'
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await saveEventReminderSettings('e1', 'org-1', {
			delivery_channel: 'in_app',
			reminder_offsets: [1440, 120]
		});

		expect(mockFrom).toHaveBeenCalledWith('hub_event_reminders');
		expect(mockUpsert).toHaveBeenCalledWith(
			{
				event_id: 'e1',
				organization_id: 'org-1',
				delivery_channel: 'in_app',
				reminder_offsets: [1440, 120]
			},
			{ onConflict: 'event_id' }
		);
		expect(result).toEqual(row);
	});

	it('throws on reminder upsert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'reminder save fail' } });

		await expect(
			saveEventReminderSettings('e1', 'org-1', {
				delivery_channel: 'in_app',
				reminder_offsets: [120]
			})
		).rejects.toThrow('reminder save fail');
	});
});

describe('updateEvent', () => {
	it('updates an event and returns the latest row', async () => {
		const row = {
			id: 'e1',
			organization_id: 'org-1',
			title: 'Updated meeting',
			description: 'Desc',
			starts_at: '2026-04-11',
			ends_at: '2026-04-11T01:00:00.000Z',
			location: 'Room A',
			created_at: '2026-01-01',
			updated_at: '2026-01-02',
			publish_at: '2026-04-10',
			canceled_at: null,
			archived_at: null
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await updateEvent('e1', {
			title: 'Updated meeting',
			description: 'Desc',
			starts_at: '2026-04-11',
			ends_at: '2026-04-11T01:00:00.000Z',
			location: 'Room A',
			publish_at: '2026-04-10'
		});

		expect(mockUpdate).toHaveBeenCalledWith({
			title: 'Updated meeting',
			description: 'Desc',
			starts_at: '2026-04-11',
			ends_at: '2026-04-11T01:00:00.000Z',
			location: 'Room A',
			publish_at: '2026-04-10'
		});
		expect(result).toEqual(row);
	});

	describe('updateEventDeliveryState', () => {
		it('updates persisted delivery metadata for an event', async () => {
			const row = {
				id: 'e1',
				organization_id: 'org-1',
				title: 'Meeting',
				description: 'Desc',
				starts_at: '2026-04-11',
				ends_at: null,
				location: 'Room A',
				created_at: '2026-01-01',
				updated_at: '2026-01-01',
				publish_at: '2026-04-10',
				canceled_at: null,
				archived_at: null,
				delivery_state: 'published',
				delivered_at: '2026-04-10',
				delivery_failure_reason: null
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			const result = await updateEventDeliveryState('e1', {
				delivery_state: 'published',
				delivered_at: '2026-04-10',
				delivery_failure_reason: null
			});

			expect(mockUpdate).toHaveBeenCalledWith({
				delivery_state: 'published',
				delivered_at: '2026-04-10',
				delivery_failure_reason: null
			});
			expect(result).toEqual(row);
		});
	});
});

describe('cancelEvent', () => {
	it('marks an event canceled', async () => {
		const row = { id: 'e1', canceled_at: '2026-01-02T00:00:00.000Z' };
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await cancelEvent('e1');

		expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ canceled_at: expect.any(String) }));
		expect(result).toEqual(row);
	});
});

describe('archiveEvent', () => {
	it('marks an event archived', async () => {
		const row = { id: 'e1', archived_at: '2026-01-02T00:00:00.000Z' };
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await archiveEvent('e1');

		expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ archived_at: expect.any(String) }));
		expect(result).toEqual(row);
	});
});

describe('restoreEvent', () => {
	it('clears lifecycle fields when restoring an event', async () => {
		const row = { id: 'e1', canceled_at: null, archived_at: null };
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await restoreEvent('e1');

		expect(mockUpdate).toHaveBeenCalledWith({ canceled_at: null, archived_at: null });
		expect(result).toEqual(row);
	});
});

describe('deleteEvent', () => {
	it('deletes from hub_events by id', async () => {
		mockEq.mockResolvedValueOnce({ error: null });

		await deleteEvent('e1');

		expect(mockFrom).toHaveBeenCalledWith('hub_events');
	});

	it('throws on delete error', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'event delete fail' } });

		await expect(deleteEvent('e1')).rejects.toThrow('event delete fail');
	});
});

// ── Execution ledger ──

describe('fetchHubExecutionLedger', () => {
	it('queries execution ledger rows for an organization', async () => {
		const rows = [
			{
				id: 'exec-1',
				organization_id: 'org-1',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-18T12:00:00.000Z',
				execution_state: 'pending',
				processed_at: null,
				last_attempted_at: null,
				attempt_count: 0,
				last_failure_reason: null,
				created_at: '2026-04-14T08:00:00.000Z',
				updated_at: '2026-04-14T08:00:00.000Z'
			}
		];
		mockOrder.mockResolvedValueOnce({ data: rows, error: null });

		const result = await fetchHubExecutionLedger('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_execution_ledger');
		expect(result).toEqual(rows);
	});

	it('throws on execution ledger query error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'ledger fail' } });

		await expect(fetchHubExecutionLedger('org-1')).rejects.toThrow('ledger fail');
	});
});

describe('upsertHubExecutionLedgerEntries', () => {
	it('upserts ledger rows and returns the saved results', async () => {
		const firstRow = {
			id: 'exec-1',
			organization_id: 'org-1',
			job_kind: 'broadcast_publish',
			source_id: 'b1',
			execution_key: 'publish',
			due_at: '2026-04-18T12:00:00.000Z',
			execution_state: 'pending',
			processed_at: null,
			last_attempted_at: null,
			attempt_count: 0,
			last_failure_reason: null,
			created_at: '2026-04-14T08:00:00.000Z',
			updated_at: '2026-04-14T08:00:00.000Z'
		};
		const secondRow = {
			id: 'exec-2',
			organization_id: 'org-1',
			job_kind: 'event_reminder',
			source_id: 'e1',
			execution_key: '120',
			due_at: '2026-04-20T14:00:00.000Z',
			execution_state: 'pending',
			processed_at: null,
			last_attempted_at: null,
			attempt_count: 0,
			last_failure_reason: null,
			created_at: '2026-04-14T08:00:00.000Z',
			updated_at: '2026-04-14T08:00:00.000Z'
		};
		mockSingle
			.mockResolvedValueOnce({ data: firstRow, error: null })
			.mockResolvedValueOnce({ data: secondRow, error: null });

		const result = await upsertHubExecutionLedgerEntries([
			{
				organization_id: 'org-1',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-18T12:00:00.000Z',
				execution_state: 'pending',
				processed_at: null,
				last_attempted_at: null,
				attempt_count: 0,
				last_failure_reason: null
			},
			{
				organization_id: 'org-1',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2026-04-20T14:00:00.000Z',
				execution_state: 'pending',
				processed_at: null,
				last_attempted_at: null,
				attempt_count: 0,
				last_failure_reason: null
			}
		]);

		expect(mockFrom).toHaveBeenCalledWith('hub_execution_ledger');
		expect(mockUpsert).toHaveBeenNthCalledWith(
			1,
			{
				organization_id: 'org-1',
				job_kind: 'broadcast_publish',
				source_id: 'b1',
				execution_key: 'publish',
				due_at: '2026-04-18T12:00:00.000Z',
				execution_state: 'pending',
				processed_at: null,
				last_attempted_at: null,
				attempt_count: 0,
				last_failure_reason: null
			},
			{ onConflict: 'job_kind,source_id,execution_key' }
		);
		expect(result).toEqual([firstRow, secondRow]);
	});

	it('returns empty output for an empty upsert batch', async () => {
		await expect(upsertHubExecutionLedgerEntries([])).resolves.toEqual([]);
		expect(mockFrom).not.toHaveBeenCalledWith('hub_execution_ledger');
	});

	it('throws on execution ledger upsert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'ledger upsert fail' } });

		await expect(
			upsertHubExecutionLedgerEntries([
				{
					organization_id: 'org-1',
					job_kind: 'broadcast_publish',
					source_id: 'b1',
					execution_key: 'publish',
					due_at: '2026-04-18T12:00:00.000Z',
					execution_state: 'pending',
					processed_at: null,
					last_attempted_at: null,
					attempt_count: 0,
					last_failure_reason: null
				}
			])
		).rejects.toThrow('ledger upsert fail');
	});
});

describe('deleteHubExecutionLedgerEntries', () => {
	it('deletes stale ledger rows by id', async () => {
		mockEq.mockResolvedValueOnce({ error: null });
		mockEq.mockResolvedValueOnce({ error: null });

		await deleteHubExecutionLedgerEntries(['exec-1', 'exec-2']);

		expect(mockFrom).toHaveBeenCalledWith('hub_execution_ledger');
		expect(mockEq).toHaveBeenNthCalledWith(1, 'id', 'exec-1');
		expect(mockEq).toHaveBeenNthCalledWith(2, 'id', 'exec-2');
	});

	it('does nothing for an empty delete batch', async () => {
		await expect(deleteHubExecutionLedgerEntries([])).resolves.toBeUndefined();
		expect(mockFrom).not.toHaveBeenCalledWith('hub_execution_ledger');
	});

	it('throws on stale ledger delete error', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'ledger delete fail' } });

		await expect(deleteHubExecutionLedgerEntries(['exec-1'])).rejects.toThrow(
			'ledger delete fail'
		);
	});
});

describe('processDueHubReminderExecutions', () => {
	it('processes due reminder rows through the rpc helper', async () => {
		const rows = [
			{
				id: 'exec-1',
				organization_id: 'org-1',
				job_kind: 'event_reminder',
				source_id: 'e1',
				execution_key: '120',
				due_at: '2026-04-20T14:00:00.000Z',
				execution_state: 'processed',
				processed_at: '2026-04-20T14:00:00.000Z',
				last_attempted_at: '2026-04-20T14:00:00.000Z',
				attempt_count: 1,
				last_failure_reason: null,
				created_at: '2026-04-14T08:00:00.000Z',
				updated_at: '2026-04-20T14:00:00.000Z'
			}
		];
		mockRpc.mockResolvedValueOnce({ data: rows, error: null });

		const result = await processDueHubReminderExecutions('org-1');

		expect(mockRpc).toHaveBeenCalledWith('process_hub_due_reminder_executions', {
			target_organization_id: 'org-1'
		});
		expect(result).toEqual(rows);
	});

	it('throws on reminder processing rpc errors', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'reminder rpc fail' } });

		await expect(processDueHubReminderExecutions('org-1')).rejects.toThrow('reminder rpc fail');
	});
});

// ── Notifications ──

describe('fetchHubNotificationPreferences', () => {
	it('queries member notification preferences for an organization profile pair', async () => {
		const row = {
			id: 'pref-1',
			organization_id: 'org-1',
			profile_id: 'profile-1',
			broadcast_enabled: true,
			event_enabled: false,
			created_at: '2026-04-13T10:00:00.000Z',
			updated_at: '2026-04-13T10:00:00.000Z'
		};
		mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await fetchHubNotificationPreferences('org-1', 'profile-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_notification_preferences');
		expect(result).toEqual(row);
	});

	it('returns null when a member has not saved preferences yet', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

		const result = await fetchHubNotificationPreferences('org-1', 'profile-1');

		expect(result).toBeNull();
	});

	it('throws on preference fetch error', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'prefs fail' } });

		await expect(fetchHubNotificationPreferences('org-1', 'profile-1')).rejects.toThrow('prefs fail');
	});
});

describe('saveHubNotificationPreferences', () => {
	it('upserts member notification preferences and returns the row', async () => {
		const row = {
			id: 'pref-1',
			organization_id: 'org-1',
			profile_id: 'profile-1',
			broadcast_enabled: false,
			event_enabled: true,
			created_at: '2026-04-13T10:00:00.000Z',
			updated_at: '2026-04-13T10:05:00.000Z'
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await saveHubNotificationPreferences('org-1', 'profile-1', {
			broadcast_enabled: false,
			event_enabled: true
		});

		expect(mockFrom).toHaveBeenCalledWith('hub_notification_preferences');
		expect(mockUpsert).toHaveBeenCalledWith(
			{
				organization_id: 'org-1',
				profile_id: 'profile-1',
				broadcast_enabled: false,
				event_enabled: true
			},
			{ onConflict: 'organization_id,profile_id' }
		);
		expect(result).toEqual(row);
	});

	it('throws on preference save error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'save prefs fail' } });

		await expect(
			saveHubNotificationPreferences('org-1', 'profile-1', {
				broadcast_enabled: true,
				event_enabled: false
			})
		).rejects.toThrow('save prefs fail');
	});
});

describe('fetchHubNotificationReads', () => {
	it('queries read-state rows for a member', async () => {
		const rows = [
			{
				id: 'read-1',
				organization_id: 'org-1',
				profile_id: 'profile-1',
				notification_kind: 'broadcast',
				source_id: 'b1',
				notification_key: 'default',
				read_at: '2026-04-13T10:00:00.000Z',
				created_at: '2026-04-13T10:00:00.000Z',
				updated_at: '2026-04-13T10:00:00.000Z'
			}
		];
		mockOrder.mockResolvedValueOnce({ data: rows, error: null });

		const result = await fetchHubNotificationReads('org-1', 'profile-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_notification_reads');
		expect(result).toEqual(rows);
	});

	it('throws on read-state fetch error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'reads fail' } });

		await expect(fetchHubNotificationReads('org-1', 'profile-1')).rejects.toThrow('reads fail');
	});
});

describe('markHubNotificationRead', () => {
	it('upserts a member alert read marker and returns the row', async () => {
		const row = {
			id: 'read-1',
			organization_id: 'org-1',
			profile_id: 'profile-1',
			notification_kind: 'event',
			source_id: 'e1',
			notification_key: 'default',
			read_at: '2026-04-13T10:05:00.000Z',
			created_at: '2026-04-13T10:05:00.000Z',
			updated_at: '2026-04-13T10:05:00.000Z'
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await markHubNotificationRead({
			organizationId: 'org-1',
			profileId: 'profile-1',
			notificationKind: 'event',
			sourceId: 'e1',
			readAt: '2026-04-13T10:05:00.000Z'
		});

		expect(mockFrom).toHaveBeenCalledWith('hub_notification_reads');
		expect(mockUpsert).toHaveBeenCalledWith(
			{
				organization_id: 'org-1',
				profile_id: 'profile-1',
				notification_kind: 'event',
				source_id: 'e1',
					notification_key: 'default',
				read_at: '2026-04-13T10:05:00.000Z'
			},
				{ onConflict: 'organization_id,profile_id,notification_kind,source_id,notification_key' }
		);
		expect(result).toEqual(row);
	});

		it('uses a reminder notification key when marking reminder alerts read', async () => {
			const row = {
				id: 'read-2',
				organization_id: 'org-1',
				profile_id: 'profile-1',
				notification_kind: 'event_reminder',
				source_id: 'e1',
				notification_key: '120',
				read_at: '2026-04-13T10:10:00.000Z',
				created_at: '2026-04-13T10:10:00.000Z',
				updated_at: '2026-04-13T10:10:00.000Z'
			};
			mockSingle.mockResolvedValueOnce({ data: row, error: null });

			await markHubNotificationRead({
				organizationId: 'org-1',
				profileId: 'profile-1',
				notificationKind: 'event_reminder',
				sourceId: 'e1',
				notificationKey: '120'
			});

			expect(mockUpsert).toHaveBeenCalledWith(
				{
					organization_id: 'org-1',
					profile_id: 'profile-1',
					notification_kind: 'event_reminder',
					source_id: 'e1',
					notification_key: '120',
					read_at: expect.any(String)
				},
				{ onConflict: 'organization_id,profile_id,notification_kind,source_id,notification_key' }
			);
		});

	it('throws on read-state save error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'mark read fail' } });

		await expect(
			markHubNotificationRead({
				organizationId: 'org-1',
				profileId: 'profile-1',
				notificationKind: 'broadcast',
				sourceId: 'b1'
			})
		).rejects.toThrow('mark read fail');
	});
});

// ── Resources ──

describe('fetchResources', () => {
	it('queries hub_resources filtered by organization_id', async () => {
		mockOrder.mockResolvedValueOnce({ data: [{ id: 'r1', title: 'Guide' }], error: null });

		const result = await fetchResources('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_resources');
		expect(result).toEqual([{ id: 'r1', title: 'Guide' }]);
	});

	it('throws on resource query error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'resources fail' } });

		await expect(fetchResources('org-1')).rejects.toThrow('resources fail');
	});
});

describe('createResource', () => {
	it('inserts into hub_resources and returns the row', async () => {
		const payload = {
			title: 'Guide',
			description: 'Setup steps',
			href: 'https://example.com/guide',
			resource_type: 'document' as const,
			sort_order: 0
		};
		const row = {
			id: 'r1',
			organization_id: 'org-1',
			...payload,
			created_at: '2026-01-01',
			updated_at: '2026-01-01'
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await createResource('org-1', payload);

		expect(mockFrom).toHaveBeenCalledWith('hub_resources');
		expect(mockInsert).toHaveBeenCalledWith({ organization_id: 'org-1', ...payload });
		expect(result).toEqual(row);
	});

	it('throws on resource insert error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'resource insert fail' } });

		await expect(
			createResource('org-1', {
				title: 'Guide',
				description: 'Setup steps',
				href: 'https://example.com/guide',
				resource_type: 'document',
				sort_order: 0
			})
		).rejects.toThrow('resource insert fail');
	});
});

describe('updateResource', () => {
	it('updates a resource and returns the latest row', async () => {
		const row = {
			id: 'r1',
			organization_id: 'org-1',
			title: 'Updated guide',
			description: 'Setup steps',
			href: 'https://example.com/guide',
			resource_type: 'document',
			sort_order: 2,
			created_at: '2026-01-01',
			updated_at: '2026-01-02'
		};
		mockSingle.mockResolvedValueOnce({ data: row, error: null });

		const result = await updateResource('r1', {
			title: 'Updated guide',
			description: 'Setup steps',
			href: 'https://example.com/guide',
			resource_type: 'document',
			sort_order: 2
		});

		expect(mockUpdate).toHaveBeenCalledWith({
			title: 'Updated guide',
			description: 'Setup steps',
			href: 'https://example.com/guide',
			resource_type: 'document',
			sort_order: 2
		});
		expect(result).toEqual(row);
	});

	it('throws on resource update error', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'resource update fail' } });

		await expect(
			updateResource('r1', {
				title: 'Guide',
				description: 'Setup steps',
				href: 'https://example.com/guide',
				resource_type: 'document'
			})
		).rejects.toThrow('resource update fail');
	});
});

describe('saveResourceOrder', () => {
	it('updates each resource sort order', async () => {
		mockEq.mockResolvedValueOnce({ error: null });
		mockEq.mockResolvedValueOnce({ error: null });

		await saveResourceOrder([
			{ id: 'r1', sort_order: 0 },
			{ id: 'r2', sort_order: 1 }
		]);

		expect(mockFrom).toHaveBeenCalledWith('hub_resources');
		expect(mockUpdate).toHaveBeenNthCalledWith(1, { sort_order: 0 });
		expect(mockUpdate).toHaveBeenNthCalledWith(2, { sort_order: 1 });
	});

	it('throws when any resource order update fails', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'resource order fail' } });

		await expect(saveResourceOrder([{ id: 'r1', sort_order: 0 }])).rejects.toThrow(
			'resource order fail'
		);
	});
});

describe('deleteResource', () => {
	it('deletes from hub_resources by id', async () => {
		mockEq.mockResolvedValueOnce({ error: null });

		await deleteResource('r1');

		expect(mockFrom).toHaveBeenCalledWith('hub_resources');
	});

	it('throws on delete error', async () => {
		mockEq.mockResolvedValueOnce({ error: { message: 'resource delete fail' } });

		await expect(deleteResource('r1')).rejects.toThrow('resource delete fail');
	});
});

// ── Plugins ──

describe('fetchActivePlugins', () => {
	it('queries hub_plugins by organization_id', async () => {
		mockEq.mockResolvedValueOnce({
			data: [{ plugin_key: 'broadcasts', is_enabled: true }],
			error: null
		});

		const result = await fetchActivePlugins('org-1');

		expect(mockFrom).toHaveBeenCalledWith('hub_plugins');
		expect(result).toEqual([{ plugin_key: 'broadcasts', is_enabled: true }]);
	});

	it('throws on error', async () => {
		mockEq.mockResolvedValueOnce({ data: null, error: { message: 'plugins fail' } });

		await expect(fetchActivePlugins('org-1')).rejects.toThrow('plugins fail');
	});
});

describe('togglePlugin', () => {
	it('upserts the plugin state', async () => {
		mockUpsert.mockResolvedValueOnce({ error: null });

		await togglePlugin('org-1', 'broadcasts', true);

		expect(mockFrom).toHaveBeenCalledWith('hub_plugins');
	});

	it('throws on upsert error', async () => {
		mockUpsert.mockResolvedValueOnce({ error: { message: 'toggle fail' } });

		await expect(togglePlugin('org-1', 'broadcasts', false)).rejects.toThrow('toggle fail');
	});
});
