import { getSupabaseClient } from '$lib/supabaseClient';
import { throwRepositoryError } from '$lib/services/repositoryError';
import { withRetry } from '$lib/services/retry';
import type { MessageRow, MessageThread, MessageThreadRow } from '$lib/models/messageModel';
import { mapMessageThreads, normalizeMessageBody, normalizeMessageImageUrl } from '$lib/models/messageModel';

const MESSAGE_THREADS_TABLE = 'message_threads';
const MESSAGES_TABLE = 'messages';
const MESSAGE_IMAGE_BUCKET = 'message-images';

function requireClient() {
	const supabase = getSupabaseClient();
	if (!supabase) {
		throw new Error('Supabase client is not configured.');
	}

	return supabase;
}

export async function fetchOwnMessageThreads(userId: string): Promise<MessageThread[]> {
	const supabase = requireClient();
	const { data: threadRows, error: threadError } = await withRetry(
		async () =>
			await supabase
				.from(MESSAGE_THREADS_TABLE)
				.select(
					'id, contact_id, last_read_at, created_at, updated_at, contact:message_contacts(id, profile_id, name, avatar_url, subtitle, is_demo)'
				)
				.eq('owner_user_id', userId)
				.order('updated_at', { ascending: false })
	);

	if (threadError) {
		throwRepositoryError(threadError, 'Could not load message threads.');
	}

	const threads = (threadRows ?? []) as MessageThreadRow[];
	if (threads.length === 0) {
		return [];
	}

	const threadIds = threads.map((thread) => thread.id);
	const [messageResult, contactReadResult] = await Promise.all([
		withRetry(
			async () =>
				await supabase
					.from(MESSAGES_TABLE)
					.select('id, thread_id, sender_kind, message_kind, body, image_url, sent_at, created_at')
					.in('thread_id', threadIds)
					.order('sent_at', { ascending: true })
		),
		fetchContactLastReadAtMap(threadIds)
	]);

	if (messageResult.error) {
		throwRepositoryError(messageResult.error, 'Could not load messages.');
	}

	return mapMessageThreads({
		ownerId: userId,
		threads,
		messages: (messageResult.data ?? []) as MessageRow[],
		contactLastReadAtMap: contactReadResult
	});
}

export async function ensureDemoMessageThread() {
	const supabase = requireClient();
	const { data, error } = await withRetry(
		async () => await supabase.rpc('ensure_demo_message_thread')
	);
	if (error) {
		throwRepositoryError(error, 'Could not create demo thread.');
	}

	return String(data ?? '');
}

export async function ensureMessageThreadForProfile(profileId: string) {
	const supabase = requireClient();
	const { data, error } = await withRetry(
		async () =>
			await supabase.rpc('ensure_message_thread_for_profile', {
				target_profile_id: profileId
			})
	);
	if (error) {
		throwRepositoryError(error, 'Could not create thread for profile.');
	}

	return String(data ?? '');
}

export async function resetDemoMessageThread() {
	const supabase = requireClient();
	const { data, error } = await withRetry(
		async () => await supabase.rpc('reset_demo_message_thread')
	);
	if (error) {
		throwRepositoryError(error, 'Could not reset demo thread.');
	}

	return String(data ?? '');
}

export async function sendMessageToThread(threadId: string, body: string) {
	const supabase = requireClient();
	const normalizedBody = normalizeMessageBody(body);
	if (!normalizedBody) {
		throw new Error('Message body is required.');
	}

	const { data, error } = await withRetry(
		async () =>
			await supabase.rpc('send_message_to_thread', {
				target_thread_id: threadId,
				message_body: normalizedBody
			})
	);

	if (error) {
		throwRepositoryError(error, 'Could not send message.');
	}

	return String(data ?? '');
}

export async function uploadMessageImage(userId: string, threadId: string, file: File) {
	const supabase = requireClient();
	const extensionFromName = file.name.includes('.') ? file.name.split('.').pop() : undefined;
	const extension = (extensionFromName || 'jpg').toLowerCase();
	const path = `${userId}/${threadId}/${crypto.randomUUID()}.${extension}`;

	const { error: uploadError } = await withRetry(() =>
		supabase.storage.from(MESSAGE_IMAGE_BUCKET).upload(path, file, {
			upsert: false,
			contentType: file.type || 'application/octet-stream'
		})
	);
	if (uploadError) {
		throwRepositoryError(uploadError, 'Could not upload image.');
	}

	const { data } = supabase.storage.from(MESSAGE_IMAGE_BUCKET).getPublicUrl(path);
	if (!data.publicUrl) {
		throw new Error('Could not generate public image URL.');
	}

	return data.publicUrl;
}

export async function sendImageMessageToThread(threadId: string, imageUrl: string) {
	const supabase = requireClient();
	const normalizedImageUrl = normalizeMessageImageUrl(imageUrl);
	if (!normalizedImageUrl) {
		throw new Error('Message image is required.');
	}

	const { data, error } = await withRetry(
		async () =>
			await supabase.rpc('send_image_message_to_thread', {
				target_thread_id: threadId,
				message_image_url: normalizedImageUrl
			})
	);

	if (error) {
		throwRepositoryError(error, 'Could not send image message.');
	}

	return String(data ?? '');
}

export async function markMessageThreadRead(threadId: string) {
	const supabase = requireClient();
	const { error } = await withRetry(
		async () =>
			await supabase.rpc('mark_message_thread_read', {
				target_thread_id: threadId
			})
	);

	if (error) {
		throwRepositoryError(error, 'Could not mark thread as read.');
	}
}

async function fetchContactLastReadAtMap(
	threadIds: string[]
): Promise<Record<string, string | null>> {
	if (threadIds.length === 0) return {};

	try {
		const supabase = requireClient();
		const { data, error } = await withRetry(
			async () =>
				await supabase.rpc('get_contact_last_read_at', {
					target_thread_ids: threadIds
				})
		);

		if (error) return {};

		const map: Record<string, string | null> = {};
		for (const row of data ?? []) {
			map[row.thread_id] = row.contact_last_read_at ?? null;
		}
		return map;
	} catch {
		return {};
	}
}
