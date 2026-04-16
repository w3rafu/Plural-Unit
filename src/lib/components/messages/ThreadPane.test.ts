// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MessageEntry, MessageThread } from '$lib/models/messageModel';
import ThreadPane from './ThreadPane.svelte';

function makeMessage(overrides: Partial<MessageEntry> = {}): MessageEntry {
	return {
		id: 'msg-1',
		threadId: 'thread-1',
		senderId: 'user-1',
		senderKind: 'owner',
		kind: 'text',
		body: 'Hello',
		imageUrl: '',
		sentAt: '2026-04-10T12:00:00Z',
		deletedAt: null,
		isDeleted: false,
		...overrides
	};
}

function makeThread(overrides: Partial<MessageThread> = {}): MessageThread {
	return {
		id: 'thread-1',
		participant: {
			id: 'contact-1',
			profileId: 'profile-1',
			name: 'Alice',
			avatar_url: '',
			subtitle: 'Direct conversation',
			isFakeUser: false
		},
		messages: [makeMessage()],
		unreadCount: 0,
		lastReadAt: '2026-04-10T12:00:00Z',
		contactLastReadAt: null,
		hasMoreMessages: false,
		...overrides
	};
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('ThreadPane', () => {
	it('renders a delete action only for owner messages and forwards the click', async () => {
		const onDeleteMessage = vi.fn();

		render(ThreadPane, {
			props: {
				thread: makeThread({
					messages: [
						makeMessage({ id: 'owner-msg', senderKind: 'owner' }),
						makeMessage({ id: 'contact-msg', senderKind: 'contact', senderId: 'contact-1', body: 'Reply' })
					]
				}),
				onSendMessage: () => {},
				onSendImage: () => {},
				onDeleteMessage
			}
		});

		const deleteButton = screen.getByRole('button', { name: 'Delete' });
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);

		await fireEvent.click(deleteButton);

		expect(onDeleteMessage).toHaveBeenCalledWith('owner-msg');
	});

	it('renders deleted messages as placeholders without a delete action', () => {
		render(ThreadPane, {
			props: {
				thread: makeThread({
					messages: [
						makeMessage({
							id: 'deleted-msg',
							kind: 'image',
							body: 'This message was deleted.',
							imageUrl: '',
							deletedAt: '2026-04-10T12:05:00Z',
							isDeleted: true
						})
					]
				}),
				onSendMessage: () => {},
				onSendImage: () => {},
				onDeleteMessage: () => {}
			}
		});

		expect(screen.getByText('This message was deleted.')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
		expect(screen.queryByRole('img')).toBeNull();
	});
});