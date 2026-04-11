import type { MessageEntry, MessageThread } from '$lib/models/messageModel';

/**
 * Format a timestamp for thread card previews.
 * Shows time for today, day name for this week, otherwise short date.
 */
export function formatThreadTimestamp(isoDate: string): string {
	if (!isoDate) return '';

	const date = new Date(isoDate);
	const now = new Date();

	const isToday =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate();

	if (isToday) {
		return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	}

	const weekAgo = new Date(now);
	weekAgo.setDate(weekAgo.getDate() - 6);
	weekAgo.setHours(0, 0, 0, 0);

	if (date >= weekAgo) {
		return date.toLocaleDateString(undefined, { weekday: 'short' });
	}

	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Format a date for day separator headers in the thread view.
 */
export function formatDaySeparator(isoDate: string): string {
	const date = new Date(isoDate);
	const now = new Date();

	const isToday =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate();

	if (isToday) return 'Today';

	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);

	const isYesterday =
		date.getFullYear() === yesterday.getFullYear() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getDate() === yesterday.getDate();

	if (isYesterday) return 'Yesterday';

	return date.toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Format a message timestamp for the thread view.
 */
export function formatMessageTime(isoDate: string): string {
	return new Date(isoDate).toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	});
}

/**
 * Group messages by day for rendering day separators.
 */
export type DayGroup = {
	dateKey: string;
	label: string;
	messages: MessageEntry[];
};

export function groupMessagesByDay(messages: MessageEntry[]): DayGroup[] {
	const groups: DayGroup[] = [];
	let currentKey = '';
	let currentGroup: DayGroup | null = null;

	for (const message of messages) {
		const dateKey = message.sentAt.slice(0, 10); // YYYY-MM-DD
		if (dateKey !== currentKey) {
			currentKey = dateKey;
			currentGroup = {
				dateKey,
				label: formatDaySeparator(message.sentAt),
				messages: []
			};
			groups.push(currentGroup);
		}
		currentGroup!.messages.push(message);
	}

	return groups;
}

/**
 * Check if a thread has any messages from the contact (not just owner).
 */
export function hasContactMessages(thread: MessageThread): boolean {
	return thread.messages.some((m) => m.senderKind === 'contact');
}
