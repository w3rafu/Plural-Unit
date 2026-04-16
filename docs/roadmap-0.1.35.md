# 0.1.35 — Push Activation, Event Detail View, Messaging Compose, and Profile Enrichment

**Theme:** Activate the push notification pipeline for real users, give events their own detail page, add a compose entry point to messaging, and expand the profile with bio and account-management basics.

## Status

Not started.

## Product constraints

- keep each slice independently shippable
- push activation must not break environments without VAPID keys (graceful degradation already exists)
- event detail route should deep-link from the hub activity feed and push notifications
- messaging compose button must not disrupt the existing directory-initiated flow
- profile schema changes must be backward-compatible (nullable columns)
- do not introduce new runtime dependencies unless strictly necessary

## Context

What exists today (after 0.1.34):

- **Push notifications** — full pipeline (service worker `sw.js`, VAPID signing in Edge Function, subscription table, 3 trigger points for broadcast/event/message, preference toggles in profile UI). But `PUBLIC_VAPID_KEY` is empty so the push toggle never renders. No VAPID key generation documentation. No offline caching in the service worker.
- **Events** — complete CRUD, lifecycle states (draft → scheduled → live → past → canceled/archived), RSVP (going/maybe/can't make it), attendance recording, reminders (in-app only). But no event detail page — events are only viewable in the hub section list. Push notifications link to `/hub` not to a specific event. Reminders don't fire push.
- **Messaging** — 1:1 real-time threads with typing indicators, read status, image messages, pagination. But no "New Message" button in the inbox — users must navigate to Directory first. No full-text message body search. No message deletion or editing.
- **Profile** — name, email, phone, avatar (all editable), password change, notification preferences. But no bio/description field, no timezone, no account deletion path.
- **Quality** — 749 tests, ESLint + Prettier configs, error page, skip-to-content link.

What's missing:

- push never activates because the VAPID public key is empty and undocumented
- events have no deep-linkable detail page
- messaging has no compose entry point from the inbox
- profiles are minimal — no self-description or account removal

## Recommended features

### a — Push notification activation

Make push notifications actually work for deployed environments by documenting VAPID key setup, adding a generation helper, and improving the service worker.

Goals:

- add a `scripts/generate-vapid-keys.mjs` helper that outputs `PUBLIC_VAPID_KEY` and `VAPID_PRIVATE_KEY`
- update `.env.example` with clear documentation for all three VAPID env vars
- add basic offline fallback in `static/sw.js` (cache app shell on install, serve from cache when offline)
- update push notification URLs to deep-link to specific content (`/hub?event=<id>`, `/messages?thread=<id>`) instead of generic `/hub` or `/messages`
- add a dev-mode push test button in profile notification preferences (only in dev) to verify the pipeline

Candidate files:

- `scripts/generate-vapid-keys.mjs` (new)
- `.env.example` (update)
- `static/sw.js` (update)
- `src/lib/stores/currentHub.svelte.ts` (update push URLs)
- `src/lib/stores/currentMessages.svelte.ts` (update push URLs)
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte` (dev test button)

Implementation sketch:

VAPID key generation:

- Node.js script using the `web-push` library: `import webpush from 'web-push'; const keys = webpush.generateVAPIDKeys();`
- Output the keys as environment variable format ready to paste into `.env`
- Add `"generate-vapid-keys": "node scripts/generate-vapid-keys.mjs"` to `package.json`

Service worker improvements:

- On `install`: cache the app shell (index.html, key assets)
- On `fetch`: network-first with cache fallback for navigation requests
- Keep existing push event listener unchanged

Deep-link URLs:

- Broadcast push: `/hub` (unchanged — broadcasts show in activity feed)
- Event push: `/hub?highlight=event:<id>` so the hub can scroll to or expand the event
- Message push: `/messages?thread=<id>` so the inbox can auto-select the thread

### b — Event detail page

Give events a dedicated route so members can view full event info, RSVP, and share a link.

Goals:

- add `src/routes/hub/event/[id]/+page.svelte` with event detail view
- show title, description, dates/times, location, RSVP status, and attendance count
- allow members to set or change their RSVP from the detail page
- admins see additional info: delivery state, reminder settings, attendance roster link
- link to event detail from `EventsSection.svelte` card titles
- update push notification URLs for events to use `/hub/event/<id>`

Candidate files:

- `src/routes/hub/event/[id]/+page.svelte` (new)
- `src/routes/hub/event/[id]/+page.ts` (new — load event by id)
- `src/lib/components/hub/member/EventDetailCard.svelte` (new)
- `src/lib/components/hub/member/EventsSection.svelte` (add links)
- `src/lib/stores/currentHub.svelte.ts` (add `getEventById` accessor)
- `src/lib/stores/currentHub/load.ts` (update push URL)

Implementation sketch:

Route:

- `+page.ts`: extract `params.id`, call a store method or derive from `currentHub.events`
- Require auth. If event not found in loaded hub state, show "Event not found" with link to hub.
- `+page.svelte`: render `EventDetailCard` with full event data

EventDetailCard:

- Hero section: title, date range (formatted), location
- Description body (rendered as plain text or markdown-light)
- RSVP section: current response highlighted, change response inline
- Info footer: created date, delivery state (admin), response count
- Back link to hub

### c — Messaging compose entry point

Add a "New Message" button in the inbox and a contact picker so users can start conversations without leaving the messages route.

Goals:

- add a compose button to `InboxPane.svelte` header
- open a contact picker sheet/dialog that searches organization members
- on member selection, call `openConversationForProfile` and switch to the new thread
- add full-text message body search to the inbox filter (search message content, not just participant names)

Candidate files:

- `src/lib/components/messages/InboxPane.svelte` (add compose button)
- `src/lib/components/messages/ContactPicker.svelte` (new)
- `src/lib/stores/currentMessages.svelte.ts` (expose member search)
- `src/lib/models/messageModel.ts` (extend search to message bodies)
- `src/lib/repositories/messageRepository.ts` (add body search query)

Implementation sketch:

Compose button:

- Positioned in InboxPane header next to the search input
- Opens a `ContactPicker` sheet (reuses `ConfirmActionSheet` pattern or a dedicated sheet)
- ContactPicker shows org members (from `currentOrganization.members`), searchable
- Selecting a member calls `currentMessages.openConversationForProfile(profileId)` and closes the picker

Message body search:

- Extend `filterThreadsByInboxQuery` to also match against recent message text in each thread
- Keep it client-side for now (messages are already loaded per thread)
- If no match on participant name, fall back to checking `thread.messages[].body`

### d — Profile enrichment

Add a bio field and account deletion request so profiles are more useful and GDPR-aware.

Goals:

- add `bio` text column to `profiles` table (nullable, max 500 chars)
- display bio in profile details card and member directory
- add bio edit field to `ProfileDetailsCard`
- add "Delete my account" flow: confirmation dialog → calls a deletion-request RPC
- add a `deletion_requested_at` column to `profiles` (nullable timestamp) — actual deletion handled out-of-band

Candidate files:

- `supabase/migrations/035_add_profile_bio.sql` (new)
- `supabase/migrations/036_add_account_deletion_request.sql` (new)
- `src/lib/models/userModel.ts` (add `bio` field)
- `src/lib/repositories/profileRepository.ts` (update select, add deletion RPC call)
- `src/lib/stores/currentUser.svelte.ts` (add `updateBio`, `requestAccountDeletion`)
- `src/lib/components/profile/ProfileDetailsCard.svelte` (bio field)
- `src/lib/components/profile/ProfileDangerZoneCard.svelte` (new — deletion UI)
- `src/routes/profile/+page.svelte` (add danger zone card)
- `src/lib/components/organization/MemberRow.svelte` (show bio in directory)

Implementation sketch:

Bio:

- Migration 035: `alter table public.profiles add column bio text;`
- Update profile select to include `bio`
- Add textarea (max 500 chars) in `ProfileDetailsCard` below phone field
- Show bio in `MemberRow` as a secondary line in the member directory

Account deletion:

- Migration 036: `alter table public.profiles add column deletion_requested_at timestamptz;`
- RPC `request_account_deletion`: sets `deletion_requested_at = now()` for `auth.uid()`
- New `ProfileDangerZoneCard`: red-bordered card with "Delete my account" button → confirmation dialog
- On confirm, mark the profile and show a "Deletion requested" badge; actual data removal is an ops process

### e — Rollout safety and test coverage

Verify new features work under smoke mode and expand test coverage for the new slices.

Goals:

- add smoke fixtures for event detail page (mock event data)
- add tests for the ContactPicker component
- add tests for the event detail route/card
- add tests for bio update and account deletion request
- add tests for VAPID key generation script
- verify push deep-link URLs in existing push trigger tests
- create `docs/rollout-0.1.35-checklist.md`

Candidate files:

- `src/lib/demo/smokeFixtures.ts` (add event detail fixture)
- `src/lib/components/messages/ContactPicker.test.ts` (new)
- `src/lib/components/hub/member/EventDetailCard.test.ts` (new)
- `src/lib/stores/currentUser.test.ts` (add bio + deletion tests)
- `src/lib/stores/currentMessages.test.ts` (update push URL assertions)
- `src/lib/stores/currentHub.test.ts` (update push URL assertions)
- `docs/rollout-0.1.35-checklist.md` (new)
