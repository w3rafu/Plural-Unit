// send-push Edge Function
//
// Receives a push notification payload, looks up eligible subscribers
// from the push_subscriptions table, and delivers via the Web Push protocol.
//
// Expected body:
// {
//   kind: 'broadcast' | 'event' | 'message',
//   organization_id: string,
//   source_id: string,
//   title: string,
//   body: string,
//   url?: string
// }
//
// Secrets required:
//   VAPID_PRIVATE_KEY — base64url-encoded ECDSA P-256 private key
//   PUBLIC_VAPID_KEY  — base64url-encoded ECDSA P-256 public key
//   VAPID_SUBJECT     — mailto: or https: URL identifying the app server

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const vapidPublicKey = Deno.env.get('PUBLIC_VAPID_KEY') ?? '';
		const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
		const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@plural.unit';

		if (!vapidPublicKey || !vapidPrivateKey) {
			return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

		const authHeader = req.headers.get('Authorization') ?? '';
		const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

		// Verify the caller is authenticated.
		const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
			global: { headers: { Authorization: authHeader } }
		});
		const { data: { user }, error: authError } = await anonClient.auth.getUser();
		if (authError || !user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const payload = await req.json();
		const { kind, organization_id, title, body, url, target_profile_id } = payload;

		if (!kind || !organization_id || !title) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Use service role to read all subscriptions.
		const adminClient = createClient(supabaseUrl, serviceRoleKey);

		// Get org members who have the relevant notification preference enabled.
		const preferenceColumn =
			kind === 'event' ? 'event_enabled' : kind === 'message' ? 'message_enabled' : 'broadcast_enabled';

		let eligibleProfileIds: string[];

		if (kind === 'message' && target_profile_id) {
			// For messages, check preference for just the target recipient.
			const { data: recipientPref } = await adminClient
				.from('hub_notification_preferences')
				.select('profile_id')
				.eq('organization_id', organization_id)
				.eq('profile_id', target_profile_id)
				.eq(preferenceColumn, true)
				.maybeSingle();

			if (!recipientPref) {
				eligibleProfileIds = [];
			} else {
				const { data: recipientThread } = await adminClient
					.from('message_threads')
					.select('id, muted_at, message_contacts!inner(profile_id)')
					.eq('owner_user_id', target_profile_id)
					.eq('message_contacts.profile_id', user.id)
					.maybeSingle();

				eligibleProfileIds = recipientThread?.muted_at ? [] : [recipientPref.profile_id];
			}
		} else {
			const { data: eligibleMembers } = await adminClient
				.from('hub_notification_preferences')
				.select('profile_id')
				.eq('organization_id', organization_id)
				.eq(preferenceColumn, true);

			eligibleProfileIds = (eligibleMembers ?? [])
				.map((row: { profile_id: string }) => row.profile_id)
				.filter((id: string) => id !== user.id); // Exclude sender.
		}

		if (eligibleProfileIds.length === 0) {
			return new Response(JSON.stringify({ sent: 0 }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Fetch push subscriptions for eligible members.
		const { data: subscriptions } = await adminClient
			.from('push_subscriptions')
			.select('id, profile_id, endpoint, p256dh_key, auth_key')
			.in('profile_id', eligibleProfileIds);

		if (!subscriptions || subscriptions.length === 0) {
			return new Response(JSON.stringify({ sent: 0 }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const notificationPayload = JSON.stringify({ title, body, url: url || '/' });
		const expiredIds: string[] = [];
		let sent = 0;

		await Promise.allSettled(
			subscriptions.map(async (sub: { id: string; endpoint: string; p256dh_key: string; auth_key: string }) => {
				try {
					await webpush.sendNotification(
						{
							endpoint: sub.endpoint,
							keys: { p256dh: sub.p256dh_key, auth: sub.auth_key }
						},
						notificationPayload,
						{ TTL: 60 * 60 } // 1 hour
					);
					sent++;
				} catch (err: unknown) {
					const status = (err as { statusCode?: number }).statusCode;
					if (status === 404 || status === 410) {
						expiredIds.push(sub.id);
					}
				}
			})
		);

		// Clean up expired subscriptions.
		if (expiredIds.length > 0) {
			await adminClient.from('push_subscriptions').delete().in('id', expiredIds);
		}

		return new Response(JSON.stringify({ sent, expired: expiredIds.length }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
