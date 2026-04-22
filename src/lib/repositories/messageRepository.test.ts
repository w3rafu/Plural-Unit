// @ts-nocheck — Supabase mock chain returns are loosely typed by design.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the Supabase client ──

const mockEq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq, in: mockIn }));
const mockRpc = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

const mockFrom = vi.fn(() => ({
	select: mockSelect
}));

const mockStorage = {
	from: vi.fn(() => ({
		upload: mockUpload,
		getPublicUrl: mockGetPublicUrl
	}))
};

const mockClient = {
	from: mockFrom,
	rpc: mockRpc,
	storage: mockStorage
};

vi.mock('$lib/supabaseClient', () => ({
	getSupabaseClient: () => mockClient
}));

import {
	fetchOwnMessageThreads,
	ensureDemoMessageThread,
	ensureMessageThreadForProfile,
	resetDemoMessageThread,
	archiveMessageThread,
	unarchiveMessageThread,
	muteMessageThread,
	unmuteMessageThread,
	sendMessageToThread,
	uploadMessageImage,
	sendImageMessageToThread,
	softDeleteMessage,
	markMessageThreadRead
} from './messageRepository';

beforeEach(() => {
	vi.clearAllMocks();

	// Default chain: select → eq → order (for threads), select → in → order → limit (for messages)
	mockEq.mockReturnValue({ order: mockOrder });
	mockIn.mockReturnValue({ order: mockOrder });
	mockOrder.mockReturnValue({ data: [], error: null, in: mockIn, limit: mockLimit });
	mockLimit.mockReturnValue({ data: [], error: null });
});

// ── fetchOwnMessageThreads ──

describe('fetchOwnMessageThreads', () => {
	it('queries message_threads then messages and returns mapped threads', async () => {
		const threadRows = [
			{
				id: 'thread-1',
				contact_id: 'contact-1',
				last_read_at: null,
				archived_at: null,
				muted_at: null,
				created_at: '2026-04-10T10:00:00Z',
				updated_at: '2026-04-10T12:00:00Z',
				contact: { id: 'contact-1', profile_id: null, name: 'Alice', avatar_url: '', subtitle: '', is_demo: false }
			}
		];
		const messageRows = [
			{
				id: 'msg-1',
				thread_id: 'thread-1',
				sender_kind: 'contact',
				message_kind: 'text',
				body: 'Hi',
				image_url: null,
				sent_at: '2026-04-10T11:00:00Z',
				created_at: '2026-04-10T11:00:00Z'
			}
		];

		// First order() call → thread rows
		mockOrder.mockResolvedValueOnce({ data: threadRows, error: null });
		// Second order().limit() call → message rows
		mockLimit.mockResolvedValueOnce({ data: messageRows, error: null });

		const result = await fetchOwnMessageThreads('user-1');

		expect(mockFrom).toHaveBeenCalledWith('message_threads');
		expect(result).toHaveLength(1);
		expect(result[0].participant.name).toBe('Alice');
		expect(result[0].messages[0].body).toBe('Hi');
	});

	it('returns empty array when no threads exist', async () => {
		mockOrder.mockResolvedValueOnce({ data: [], error: null });

		const result = await fetchOwnMessageThreads('user-1');
		expect(result).toEqual([]);
	});

	it('throws on thread fetch error', async () => {
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'db fail' } });

		await expect(fetchOwnMessageThreads('user-1')).rejects.toThrow('db fail');
	});

	it('throws on message fetch error', async () => {
		mockOrder.mockResolvedValueOnce({
			data: [{ id: 'thread-1', contact_id: 'c1', last_read_at: null, archived_at: null, muted_at: null, created_at: '', updated_at: '', contact: { id: 'c1', profile_id: null, name: 'X', avatar_url: '', subtitle: '', is_demo: false } }],
			error: null
		});
		mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'message fail' } });

		await expect(fetchOwnMessageThreads('user-1')).rejects.toThrow('message fail');
	});
});

describe('muteMessageThread', () => {
	it('calls mute_message_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: '2026-04-16T12:00:00.000Z', error: null });

		const result = await muteMessageThread('thread-1');

		expect(mockRpc).toHaveBeenCalledWith('mute_message_thread', {
			target_thread_id: 'thread-1'
		});
		expect(result).toBe('2026-04-16T12:00:00.000Z');
	});

	it('throws when id is empty', async () => {
		await expect(muteMessageThread('')).rejects.toThrow('Thread id is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'mute fail' } });

		await expect(muteMessageThread('thread-1')).rejects.toThrow('mute fail');
	});
});

describe('unmuteMessageThread', () => {
	it('calls unmute_message_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await unmuteMessageThread('thread-1');

		expect(mockRpc).toHaveBeenCalledWith('unmute_message_thread', {
			target_thread_id: 'thread-1'
		});
	});

	it('throws when id is empty', async () => {
		await expect(unmuteMessageThread('')).rejects.toThrow('Thread id is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'unmute fail' } });

		await expect(unmuteMessageThread('thread-1')).rejects.toThrow('unmute fail');
	});
});

// ── archiveMessageThread ──

describe('archiveMessageThread', () => {
	it('calls archive_message_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: '2026-04-16T12:00:00.000Z', error: null });

		const result = await archiveMessageThread('thread-1');

		expect(mockRpc).toHaveBeenCalledWith('archive_message_thread', {
			target_thread_id: 'thread-1'
		});
		expect(result).toBe('2026-04-16T12:00:00.000Z');
	});

	it('throws when id is empty', async () => {
		await expect(archiveMessageThread('')).rejects.toThrow('Thread id is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'archive fail' } });

		await expect(archiveMessageThread('thread-1')).rejects.toThrow('archive fail');
	});
});

// ── unarchiveMessageThread ──

describe('unarchiveMessageThread', () => {
	it('calls unarchive_message_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await unarchiveMessageThread('thread-1');

		expect(mockRpc).toHaveBeenCalledWith('unarchive_message_thread', {
			target_thread_id: 'thread-1'
		});
	});

	it('throws when id is empty', async () => {
		await expect(unarchiveMessageThread('')).rejects.toThrow('Thread id is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'restore fail' } });

		await expect(unarchiveMessageThread('thread-1')).rejects.toThrow('restore fail');
	});
});

// ── ensureDemoMessageThread ──

describe('ensureDemoMessageThread', () => {
	it('calls ensure_demo_message_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'thread-1', error: null });

		const result = await ensureDemoMessageThread();

		expect(mockRpc).toHaveBeenCalledWith('ensure_demo_message_thread');
		expect(result).toBe('thread-1');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'rpc fail' } });

		await expect(ensureDemoMessageThread()).rejects.toThrow('rpc fail');
	});
});

// ── ensureMessageThreadForProfile ──

describe('ensureMessageThreadForProfile', () => {
	it('calls ensure_message_thread_for_profile RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'thread-2', error: null });

		const result = await ensureMessageThreadForProfile('profile-1');

		expect(mockRpc).toHaveBeenCalledWith('ensure_message_thread_for_profile', {
			target_profile_id: 'profile-1'
		});
		expect(result).toBe('thread-2');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'rpc fail' } });

		await expect(ensureMessageThreadForProfile('profile-1')).rejects.toThrow('rpc fail');
	});
});

// ── resetDemoMessageThread ──

describe('resetDemoMessageThread', () => {
	it('calls reset_demo_message_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'thread-1', error: null });

		const result = await resetDemoMessageThread();

		expect(mockRpc).toHaveBeenCalledWith('reset_demo_message_thread');
		expect(result).toBe('thread-1');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'rpc fail' } });

		await expect(resetDemoMessageThread()).rejects.toThrow('rpc fail');
	});
});

// ── sendMessageToThread ──

describe('sendMessageToThread', () => {
	it('sends text via send_message_to_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'msg-1', error: null });

		const result = await sendMessageToThread('thread-1', 'Hello');

		expect(mockRpc).toHaveBeenCalledWith('send_message_to_thread', {
			target_thread_id: 'thread-1',
			message_body: 'Hello'
		});
		expect(result).toBe('msg-1');
	});

	it('throws when body is empty', async () => {
		await expect(sendMessageToThread('thread-1', '   ')).rejects.toThrow('Message body is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'send fail' } });

		await expect(sendMessageToThread('thread-1', 'Hello')).rejects.toThrow('send fail');
	});
});

// ── uploadMessageImage ──

describe('uploadMessageImage', () => {
	it('uploads file and returns public URL', async () => {
		mockUpload.mockResolvedValueOnce({ error: null });
		mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://example.com/img.jpg' } });

		const file = new File(['data'], 'photo.png', { type: 'image/png' });
		const result = await uploadMessageImage('user-1', 'thread-1', file);

		expect(mockStorage.from).toHaveBeenCalledWith('message-images');
		expect(result).toBe('https://example.com/img.jpg');
	});

	it('throws on upload error', async () => {
		mockUpload.mockResolvedValueOnce({ error: { message: 'upload fail' } });

		const file = new File(['data'], 'photo.png');
		await expect(uploadMessageImage('user-1', 'thread-1', file)).rejects.toThrow('upload fail');
	});

	it('throws when public URL is empty', async () => {
		mockUpload.mockResolvedValueOnce({ error: null });
		mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: '' } });

		const file = new File(['data'], 'photo.png');
		await expect(uploadMessageImage('user-1', 'thread-1', file)).rejects.toThrow('Could not generate public image URL.');
	});
});

// ── sendImageMessageToThread ──

describe('sendImageMessageToThread', () => {
	it('calls send_image_message_to_thread RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: 'msg-2', error: null });

		const result = await sendImageMessageToThread('thread-1', 'https://example.com/img.jpg');

		expect(mockRpc).toHaveBeenCalledWith('send_image_message_to_thread', {
			target_thread_id: 'thread-1',
			message_image_url: 'https://example.com/img.jpg'
		});
		expect(result).toBe('msg-2');
	});

	it('throws when image URL is empty', async () => {
		await expect(sendImageMessageToThread('thread-1', '   ')).rejects.toThrow('Message image is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'image send fail' } });

		await expect(sendImageMessageToThread('thread-1', 'https://x.com/img.jpg')).rejects.toThrow('image send fail');
	});
});

// ── softDeleteMessage ──

describe('softDeleteMessage', () => {
	it('calls soft_delete_message RPC', async () => {
		mockRpc.mockResolvedValueOnce({ data: '2026-04-16T12:00:00.000Z', error: null });

		const result = await softDeleteMessage('msg-1');

		expect(mockRpc).toHaveBeenCalledWith('soft_delete_message', {
			target_message_id: 'msg-1'
		});
		expect(result).toBe('2026-04-16T12:00:00.000Z');
	});

	it('throws when id is empty', async () => {
		await expect(softDeleteMessage('')).rejects.toThrow('Message id is required.');
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'delete fail' } });

		await expect(softDeleteMessage('msg-1')).rejects.toThrow('delete fail');
	});
});

// ── markMessageThreadRead ──

describe('markMessageThreadRead', () => {
	it('calls mark_message_thread_read RPC', async () => {
		mockRpc.mockResolvedValueOnce({ error: null });

		await markMessageThreadRead('thread-1');

		expect(mockRpc).toHaveBeenCalledWith('mark_message_thread_read', {
			target_thread_id: 'thread-1'
		});
	});

	it('throws on RPC error', async () => {
		mockRpc.mockResolvedValueOnce({ error: { message: 'mark fail' } });

		await expect(markMessageThreadRead('thread-1')).rejects.toThrow('mark fail');
	});
});
