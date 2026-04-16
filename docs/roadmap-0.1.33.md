# 0.1.33 — Member Engagement, Real-Time Messaging, and Push Notifications

**Theme:** make the app feel alive for members. After `0.1.32` hardened the admin operator workflow, this release shifts focus to the member experience — broadcast acknowledgments, real-time conversations, and push notifications so members don't miss what matters.

## Status

Not started.

## Product constraints

- keep each slice independently shippable so the release can land incrementally
- prefer Supabase-native infrastructure (Realtime channels, Edge Functions, storage) over third-party services where practical
- don't add features that require admin configuration before members benefit — sensible defaults everywhere
- keep the messaging schema backward-compatible so existing threads and messages survive the migration
- push notifications are opt-in and respect the existing notification preference toggles

## Context

What exists today:

- **Event RSVPs** work end-to-end: members pick `going`, `maybe`, or `cannot_attend`, admins see response rosters and attendance outcomes
- **Broadcasts** are read-only for members — no acknowledgment, reaction, or read-receipt mechanism
- **Messaging** is one-to-one, text + image, with thread-level `last_read_at` — but uses 15-second polling instead of real-time subscriptions
- **In-app notifications** have full preference toggles, read-state tracking, and an alert sheet — but there is zero out-of-app delivery (no push, no email)
- Supabase Realtime JS (`@supabase/realtime-js` v2) is already in `package.json` but unused

What's missing:

- members have no way to signal they've seen or engaged with a broadcast
- conversations feel laggy because of the polling interval
- members who aren't actively in the app miss everything

## Recommended features

### a — Broadcast acknowledgments

Give members a lightweight way to signal they've read or engaged with a broadcast, and give admins visibility into engagement.

Goals:

- add a single-tap acknowledgment action on broadcast cards (not a full reaction system — one action, reversible)
- show aggregate acknowledgment count on each broadcast for all members
- surface per-broadcast acknowledgment coverage in admin manage content
- reuse the existing notification-read infrastructure pattern (per-org, per-profile, RLS)

Candidate files:

- `supabase/migrations/030_add_broadcast_acknowledgments.sql`
- `src/lib/repositories/hubRepository/broadcasts.ts`
- `src/lib/stores/currentHub/broadcasts.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/models/broadcastModel.ts` (or new `broadcastEngagementModel.ts`)
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`

Implementation sketch:

Migration shape:

- add `public.hub_broadcast_acknowledgments` with `organization_id`, `broadcast_id`, `profile_id`, `acknowledged_at`
- enforce `unique (organization_id, broadcast_id, profile_id)` so each member can acknowledge once
- RLS: members insert/delete own acknowledgments, read all acknowledgments within their org (so aggregate counts work)
- add index on `(organization_id, broadcast_id)` for cheap per-broadcast counts

Repository API:

- `fetchBroadcastAcknowledgments(organizationId: string): Promise<BroadcastAcknowledgmentRow[]>` — bulk load for all active broadcasts on hub load
- `acknowledgeBroadcast(organizationId: string, broadcastId: string): Promise<BroadcastAcknowledgmentRow>` — upsert own acknowledgment
- `unacknowledgeBroadcast(organizationId: string, broadcastId: string): Promise<void>` — remove own acknowledgment

Store flow:

- load acknowledgments alongside broadcasts during `currentHub.load()`
- derive per-broadcast acknowledgment count and `hasAcknowledged` flag
- optimistic toggle in the store with write-through to repository

Member UI:

- add a compact acknowledge button on each broadcast card in `BroadcastsSection.svelte` — tap to acknowledge, tap again to undo
- show `{count} acknowledged` text beside the button
- keep the interaction as minimal as possible — no modal, no emoji picker

Admin UI:

- show acknowledgment count and coverage percentage in `BroadcastEditor.svelte` summary section
- no need for a full per-member roster in v1

Smoke mode:

- seed one acknowledged and one unacknowledged broadcast in fixtures
- keep acknowledgment writes local in smoke mode

### b — Real-time messaging via Supabase Realtime

Replace the 15-second polling loop with Supabase Realtime channels so conversations update instantly.

Goals:

- subscribe to new messages in real time instead of polling
- subscribe to thread-level presence for typing indicators
- preserve the existing thread-level `last_read_at` mechanism (no per-message read receipts yet)
- keep smoke mode and demo mode working without live Supabase channels

Candidate files:

- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/repositories/messageRepository.ts`
- `src/lib/models/messageModel.ts`
- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/components/messages/MessageComposer.svelte`
- `src/lib/components/messages/InboxPane.svelte`

Implementation sketch:

Channel architecture:

- one Supabase Realtime channel per user session: `messages:{userId}`
- listen for postgres_changes on `messages` table filtered by threads owned by the current user
- on `INSERT` event: append message to the correct thread in `currentMessages`, update unread count, trigger incoming-reply detection
- on thread selection or focus: mark thread read via existing `markMessageThreadRead` RPC

Typing indicators:

- use Supabase Realtime presence on a per-thread channel: `thread:{threadId}`
- when the user starts typing in `MessageComposer.svelte`, broadcast presence state `{ typing: true }`
- when the user stops typing (debounce 2s or sends), clear presence state
- in `ThreadPane.svelte`, subscribe to presence and show a compact "typing…" indicator when the other participant is typing
- unsubscribe from the thread channel when navigating away from the thread

Polling fallback:

- if the Realtime channel fails to connect or repeatedly errors, fall back to the existing 15-second polling loop
- log connection state transitions for debugging but do not surface them to the user

Store changes:

- replace `startPolling()` / `stopPolling()` with `subscribe()` / `unsubscribe()` that manage Realtime channels
- keep `refresh()` as a manual method so the UI can still force a reload
- add `typingState` derived per active thread

Smoke mode:

- skip Realtime subscription in smoke mode — keep existing poll-based refresh
- typing indicators return empty state in smoke mode

### c — Visible read status in conversations

Surface the existing `last_read_at` data as a "seen" indicator so senders know their messages were read.

Goals:

- show a "Seen" or checkmark indicator on the last message the other participant has read
- use the existing `last_read_at` field — no new schema needed
- keep it lightweight and non-intrusive

Candidate files:

- `src/lib/models/messageModel.ts`
- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/components/messages/messageUi.ts`

Implementation sketch:

Model:

- the existing `message_threads` table has `last_read_at` per-owner — each user's thread row tracks when they last opened the conversation
- to show "seen" to the sender, we need the contact's `last_read_at` — this requires a small schema addition or a new RPC
- add `contact_last_read_at` to the thread fetch query: join against the contact's thread row for the same conversation to get their `last_read_at`

Migration:

- `supabase/migrations/031_add_thread_read_receipt_view.sql` — create an RPC or view that returns both the owner's and the contact's `last_read_at` per thread, respecting RLS so each user only sees their own conversations

UI:

- in `ThreadPane.svelte`, after the last owner-sent message that falls before `contact_last_read_at`, show a small "Seen" label
- only show "Seen" for the most recent such message — not on every message
- style it as muted, compact text below the message bubble

### d — Web push notification infrastructure

Add opt-in browser push notifications so members get alerts even when the tab is closed.

Goals:

- register a service worker for push delivery
- store push subscriptions per user per device in Supabase
- use a Supabase Edge Function to send push notifications via the Web Push API
- respect existing notification preference toggles (broadcast_enabled, event_enabled)
- deliver notifications for: new messages, new broadcasts, event reminders

Candidate files:

- `static/sw.js` (new — service worker)
- `src/lib/services/pushSubscription.ts` (new)
- `src/lib/stores/currentUser.svelte.ts`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`
- `supabase/migrations/032_add_push_subscriptions.sql`
- `supabase/functions/send-push/index.ts` (new — Edge Function)

Implementation sketch:

Service worker:

- `static/sw.js` handles the `push` event: parse payload, show browser notification with title, body, icon, and click URL
- handle `notificationclick` to focus or open the correct app route
- keep the service worker minimal — no caching strategy, no offline support in v1

Subscription storage:

- `supabase/migrations/032_add_push_subscriptions.sql` — add `public.push_subscriptions` table with `profile_id`, `endpoint`, `p256dh_key`, `auth_key`, `user_agent`, `created_at`
- enforce `unique (profile_id, endpoint)` so re-subscribing on the same browser updates instead of duplicates
- RLS: users manage own subscriptions only

Client registration:

- `src/lib/services/pushSubscription.ts` — on login (or on explicit opt-in), request notification permission, subscribe via `PushManager`, and send the subscription to Supabase
- store a VAPID public key as an environment variable (`PUBLIC_VAPID_KEY`)
- if the user revokes permission, delete the subscription row

Preference integration:

- update `ProfileNotificationPreferencesCard.svelte` to include a push toggle that requests browser permission on enable
- gate push delivery on existing `broadcast_enabled` and `event_enabled` preferences per notification kind

Edge Function:

- `supabase/functions/send-push/index.ts` — accepts a payload with `organization_id`, `notification_kind`, `title`, `body`, `url`, and optional `exclude_profile_id`
- looks up all push subscriptions for members of the org who have the relevant preference enabled
- sends via the Web Push protocol using the VAPID private key (stored as an Edge Function secret)
- cleans up expired or rejected subscriptions on 410 responses

Trigger integration:

- call the Edge Function from existing store mutation points when broadcasts are published, events are updated, or messages are sent
- alternatively, use a Supabase database webhook on `INSERT` to the `messages` table to trigger push delivery — evaluate which pattern is simpler
- exclude the sender from receiving their own push notification

Smoke mode:

- skip push registration and Edge Function calls in smoke mode
- push preference toggle is visible but non-functional in smoke mode

### e — Delivery-aware smoke, migration, and rollout safety

Cover the new infrastructure seams so push delivery and real-time messaging don't break silently.

Goals:

- extend smoke fixtures to cover broadcast acknowledgments, real-time fallback, and push subscription state
- document the VAPID key generation and Edge Function deployment in the rollout checklist
- add migration safety checks for the new tables

Candidate files:

- `src/lib/demo/smokeMode.ts`
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/demo/smokeFixtures.test.ts`
- `e2e/hub-smoke.spec.ts`
- `docs/hub-schema-recovery.md`
- `README.md`

## What this release does NOT touch

- **Group messaging** — schema enforces 1-to-1; group threads are a larger lift for a future release
- **Message editing or deletion** — not needed for MVP engagement
- **Email notifications** — push first; email is a separate infrastructure investment
- **Per-message read receipts** — thread-level "seen" is sufficient for v1
- **Broadcast comments or replies** — acknowledgment is the engagement primitive; comments can come later
- **Event waitlists or guest counts** — RSVP already works; enhancements are lower priority

## Suggested work order

1. **Slice a** — Broadcast acknowledgments (member engagement, independent of other slices)
2. **Slice b** — Real-time messaging (replace polling, add typing indicators)
3. **Slice c** — Visible read status in conversations (builds on messaging infrastructure)
4. **Slice d** — Web push notification infrastructure (new infra, can parallel with b/c)
5. **Slice e** — Smoke, migration, and rollout safety (after all feature slices land)

Each slice is a mergeable chunk. Slices a and d are independent and can be developed in parallel.
