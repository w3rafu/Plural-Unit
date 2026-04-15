/**
 * currentHub/notifications — alert preference and read-state mutations.
 *
 * These helpers keep the notification-specific write logic out of the main
 * store coordinator while preserving the current in-memory read map.
 */

import {
	upsertHubNotificationReadMap,
	type HubNotificationItem,
	type HubNotificationPreferences
} from '$lib/models/hubNotifications';
import {
	markHubNotificationRead,
	saveHubNotificationPreferences
} from '$lib/repositories/hubRepository';

export async function updateCurrentHubNotificationPreferences(input: {
	orgId: string;
	ownProfileId: string;
	nextPreferences: HubNotificationPreferences;
}) {
	const row = await saveHubNotificationPreferences(input.orgId, input.ownProfileId, {
		broadcast_enabled: input.nextPreferences.broadcast,
		event_enabled: input.nextPreferences.event
	});

	return {
		broadcast: row.broadcast_enabled,
		event: row.event_enabled
	};
}

export async function markCurrentHubActivityRead(input: {
	orgId: string;
	ownProfileId: string;
	notification: Pick<
		HubNotificationItem,
		'id' | 'kind' | 'sourceId' | 'notificationKey' | 'isRead'
	>;
	currentReadMap: Record<string, string>;
}) {
	const row = await markHubNotificationRead({
		organizationId: input.orgId,
		profileId: input.ownProfileId,
		notificationKind: input.notification.kind,
		sourceId: input.notification.sourceId,
		notificationKey: input.notification.notificationKey
	});

	return upsertHubNotificationReadMap(input.currentReadMap, row);
}

export async function markAllCurrentHubActivityRead(input: {
	orgId: string;
	ownProfileId: string;
	items: HubNotificationItem[];
	currentReadMap: Record<string, string>;
}) {
	const unreadItems = input.items.filter((item) => !item.isRead);
	if (unreadItems.length === 0) {
		return input.currentReadMap;
	}

	const readAt = new Date().toISOString();
	const rows = await Promise.all(
		unreadItems.map((item) =>
			markHubNotificationRead({
				organizationId: input.orgId,
				profileId: input.ownProfileId,
				notificationKind: item.kind,
				sourceId: item.sourceId,
				notificationKey: item.notificationKey,
				readAt
			})
		)
	);

	let nextReadMap = input.currentReadMap;
	for (const row of rows) {
		nextReadMap = upsertHubNotificationReadMap(nextReadMap, row);
	}

	return nextReadMap;
}
