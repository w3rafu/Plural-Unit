import { getSupabaseClient } from '$lib/supabaseClient';
import { isSmokeModeEnabled } from '$lib/demo/smokeMode';

const PUSH_SUBSCRIPTIONS_TABLE = 'push_subscriptions';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

export function isPushSupported(): boolean {
	if (typeof window === 'undefined') return false;
	return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getPushPermissionState(): Promise<PermissionState | null> {
	if (!isPushSupported()) return null;
	const registration = await navigator.serviceWorker.getRegistration('/sw.js');
	if (!registration) return 'prompt';
	const sub = await registration.pushManager.permissionState({ userVisibleOnly: true });
	return sub;
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
	if (!isPushSupported()) return null;
	const registration = await navigator.serviceWorker.getRegistration('/sw.js');
	if (!registration) return null;
	return registration.pushManager.getSubscription();
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
	if (!isPushSupported() || isSmokeModeEnabled()) return null;

	const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
	await navigator.serviceWorker.ready;

	const existingSub = await registration.pushManager.getSubscription();
	if (existingSub) return existingSub;

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
	});

	return subscription;
}

export async function savePushSubscription(subscription: PushSubscription): Promise<void> {
	if (isSmokeModeEnabled()) return;

	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return;

	const json = subscription.toJSON();
	const endpoint = json.endpoint ?? '';
	const p256dhKey = json.keys?.p256dh ?? '';
	const authKey = json.keys?.auth ?? '';
	if (!endpoint || !p256dhKey || !authKey) return;

	const { error } = await supabase.from(PUSH_SUBSCRIPTIONS_TABLE).upsert(
		{
			profile_id: user.id,
			endpoint,
			p256dh_key: p256dhKey,
			auth_key: authKey,
			user_agent: navigator.userAgent.slice(0, 512)
		},
		{ onConflict: 'profile_id,endpoint' }
	);

	if (error) {
		console.warn('[push] Could not save subscription:', error.message);
	}
}

export async function removePushSubscription(): Promise<void> {
	if (isSmokeModeEnabled()) return;

	const subscription = await getExistingPushSubscription();
	if (!subscription) return;

	const endpoint = subscription.endpoint;

	try {
		await subscription.unsubscribe();
	} catch {
		// Browser may have already cleared the subscription.
	}

	try {
		const supabase = getSupabaseClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		await supabase
			.from(PUSH_SUBSCRIPTIONS_TABLE)
			.delete()
			.eq('profile_id', user.id)
			.eq('endpoint', endpoint);
	} catch {
		console.warn('[push] Could not remove subscription from server.');
	}
}

export async function hasSavedPushSubscription(): Promise<boolean> {
	if (isSmokeModeEnabled()) return false;
	if (!isPushSupported()) return false;

	try {
		const supabase = getSupabaseClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return false;

		const { count } = await supabase
			.from(PUSH_SUBSCRIPTIONS_TABLE)
			.select('id', { count: 'exact', head: true })
			.eq('profile_id', user.id);

		return (count ?? 0) > 0;
	} catch {
		return false;
	}
}
