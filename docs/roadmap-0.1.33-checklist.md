# 0.1.33 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Prefer Supabase-native infrastructure (Realtime, Edge Functions) over third-party services
- [ ] Push notifications are opt-in and respect existing preference toggles
- [ ] Messaging schema is backward-compatible — existing threads and messages survive
- [ ] Re-run `npm run check` and `npm test` as each major slice lands

## a — Broadcast acknowledgments

- [ ] Add `030_add_broadcast_acknowledgments.sql` with `organization_id`, `broadcast_id`, `profile_id`, `acknowledged_at`, and unique `(organization_id, broadcast_id, profile_id)` constraint
- [ ] Add RLS policies: members insert/delete own, read all within org
- [ ] Add repository helpers: `fetchBroadcastAcknowledgments`, `acknowledgeBroadcast`, `unacknowledgeBroadcast`
- [ ] Load acknowledgments alongside broadcasts during `currentHub.load()`
- [ ] Derive per-broadcast acknowledgment count and `hasAcknowledged` flag in the store
- [ ] Add optimistic acknowledge/unacknowledge toggle with store write-through
- [ ] Add compact acknowledge button on broadcast cards in `BroadcastsSection.svelte`
- [ ] Show `{count} acknowledged` beside the button
- [ ] Show acknowledgment count and coverage in `BroadcastEditor.svelte` admin summary
- [ ] Seed one acknowledged and one unacknowledged broadcast in smoke fixtures
- [ ] Keep acknowledgment writes local in smoke mode
- [ ] Add focused repository, store, and model tests

## b — Real-time messaging via Supabase Realtime

- [ ] Replace 15-second polling with a Supabase Realtime channel per user session (`messages:{userId}`)
- [ ] Listen for `INSERT` postgres_changes on `messages` table filtered by owned threads
- [ ] On new message event: append to thread, update unread count, trigger incoming-reply detection
- [ ] Add per-thread presence channel (`thread:{threadId}`) for typing indicators
- [ ] Broadcast typing presence from `MessageComposer.svelte` with 2-second debounce
- [ ] Show compact "typing…" indicator in `ThreadPane.svelte` from presence state
- [ ] Unsubscribe from thread presence channel on navigation away
- [ ] Add polling fallback if Realtime channel fails to connect
- [ ] Replace `startPolling()` / `stopPolling()` with `subscribe()` / `unsubscribe()` in the store
- [ ] Keep `refresh()` as a manual reload method
- [ ] Skip Realtime subscription in smoke mode — keep poll-based refresh
- [ ] Add focused store tests for channel lifecycle and fallback behavior

## c — Visible read status in conversations

- [ ] Add `031_add_thread_read_receipt_view.sql` — RPC or view returning both owner and contact `last_read_at` per thread
- [ ] Extend thread fetch to include `contact_last_read_at`
- [ ] Update `MessageThread` type with optional `contactLastReadAt` field
- [ ] In `ThreadPane.svelte`, show "Seen" label after the last owner-sent message before `contactLastReadAt`
- [ ] Only show "Seen" on the most recent qualifying message
- [ ] Style as muted compact text below the message bubble
- [ ] Add model tests for seen-indicator placement logic

## d — Web push notification infrastructure

- [ ] Create `static/sw.js` service worker: handle `push` event, show notification, handle `notificationclick`
- [ ] Add `032_add_push_subscriptions.sql` with `profile_id`, `endpoint`, `p256dh_key`, `auth_key`, `user_agent`, unique `(profile_id, endpoint)`
- [ ] Add RLS: users manage own subscriptions only
- [ ] Create `src/lib/services/pushSubscription.ts` — request permission, subscribe via PushManager, store subscription in Supabase
- [ ] Add `PUBLIC_VAPID_KEY` environment variable
- [ ] On login or opt-in: register push subscription; on revoke: delete subscription row
- [ ] Update `ProfileNotificationPreferencesCard.svelte` with push toggle that requests browser permission
- [ ] Create `supabase/functions/send-push/index.ts` Edge Function
- [ ] Edge Function: look up subscriptions by org + preference filter, send via Web Push API, clean up 410 responses
- [ ] Trigger push from store mutations: broadcast publish, event update, message send
- [ ] Exclude sender from receiving their own push notification
- [ ] Store VAPID private key as an Edge Function secret
- [ ] Skip push registration and Edge Function calls in smoke mode
- [ ] Add focused tests for subscription lifecycle and preference gating

## e — Delivery-aware smoke, migration, and rollout safety

- [ ] Extend smoke fixtures to cover broadcast acknowledgments, real-time fallback, and push subscription state
- [ ] Add smoke-only acknowledgment and push subscription fixture seams
- [ ] Exercise one broadcast acknowledgment toggle in `e2e/hub-smoke.spec.ts`
- [ ] Document VAPID key generation in rollout checklist
- [ ] Document Edge Function deployment steps in rollout checklist
- [ ] Extend `docs/hub-schema-recovery.md` with new migrations (030, 031, 032)
- [ ] Update README smoke section for real-time fallback and push behavior
- [ ] Prepare `rollout-0.1.33-checklist.md` with migration presence, push infra, and Edge Function checks
