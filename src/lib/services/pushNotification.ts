import { getSupabaseClient } from '$lib/supabaseClient';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';

export type PushNotificationPayload = {
	kind: 'broadcast' | 'event' | 'message';
	organization_id: string;
	source_id: string;
	title: string;
	body: string;
	url?: string;
	target_profile_id?: string;
	include_actor_profile?: boolean;
};

/**
 * Triggers push notifications by invoking the send-push Edge Function.
 * Fire-and-forget — errors are logged but never thrown to the caller.
 */
export async function triggerPushNotification(payload: PushNotificationPayload): Promise<void> {
	if (isSmokeModeEnabled()) return;

	try {
		const supabase = getSupabaseClient();
		const { error } = await supabase.functions.invoke('send-push', {
			body: payload
		});

		if (error) {
			console.warn('[push] Edge Function error:', error.message);
		}
	} catch (err) {
		console.warn('[push] Could not trigger push notification:', err);
	}
}
