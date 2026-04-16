# 0.1.34 — Notification Pipeline Completion, Scale Readiness, and Project Quality

**Theme:** close the loops opened in `0.1.33`. Push notification infrastructure shipped but only fires for broadcast publish. This release wires push for messages and events, adds message pagination so the inbox scales, introduces lint/format tooling and an error page, and fills the most critical test-coverage gaps.

## Status

Complete.

## Product constraints

- keep each slice independently shippable
- push notifications remain opt-in, respecting existing preference toggles
- messaging schema stays backward-compatible — pagination is transparent to the user
- lint and format rules are enforced but auto-fixable — no manual clean-up burden
- do not introduce new runtime dependencies for quality tooling

## Context

What exists today (after 0.1.33):

- **Push notifications** — full pipeline (service worker, VAPID, Edge Function, subscription table, profile toggle) but only wired for broadcast publish-now. `kind: 'message'` and `kind: 'event'` are defined in the payload type but never triggered. Scheduled broadcasts that fire via the execution ledger also don't push.
- **Messaging** — real-time via Supabase channels with polling fallback, typing indicators, "Seen" read status. But `fetchOwnMessageThreads` loads all threads and all messages in one query — no pagination. `keepScrolledToBottom` runs once on mount but does not react to new messages.
- **Notification preferences** — broadcast and event toggles in `hub_notification_preferences`, but no `message_enabled` column. The Edge Function falls back to `broadcast_enabled` for `kind: 'message'`.
- **Tests** — 678 passing, but `pushSubscription.ts`, `realtimeService.ts`, `authBoundary.svelte.ts`, and `currentTheme.svelte.ts` have zero coverage.
- **Quality tooling** — no ESLint, no Prettier, no error page, no skip-to-content landmark.

What's missing:

- members with push enabled don't get notified about new messages or events
- heavy threads will degrade as messages accumulate
- new real-time and push services lack test coverage
- the project has no automated code style enforcement

## Recommended features

### a — Complete push notification triggers

Wire push notifications for the remaining two content kinds (message send and event publish/update) and fix the preference gating gap.

Goals:

- trigger push on message send so the recipient gets a notification when they're away
- trigger push on event publish so org members know about new events
- add a `message_enabled` preference column so message push has its own opt-in toggle
- update the Edge Function to use `message_enabled` for `kind: 'message'`
- add the message toggle to `ProfileNotificationPreferencesCard`
- ensure scheduled broadcasts that transition to active via the execution ledger also fire push (not just manual publish-now)

Candidate files:

- `supabase/migrations/033_add_message_notification_preference.sql`
- `supabase/functions/send-push/index.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/stores/currentHub.svelte.ts` (event publish + scheduled broadcast delivery)
- `src/lib/services/pushNotification.ts`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`
- `src/lib/repositories/hubRepository/notifications.ts`
- `src/lib/models/hubNotifications.ts`

Implementation sketch:

Migration 033:

- `alter table public.hub_notification_preferences add column message_enabled boolean not null default true;`

Edge Function update:

- add `message_enabled` column lookup when `kind === 'message'`
- for message push, target a single profile_id rather than the whole org (recipient only, not sender)

Message store:

- after `sendMessageToThread` resolves, fire `triggerPushNotification({ kind: 'message', ... })` with the active thread's participant profileId
- skip for demo/fake users

Hub store:

- after event publish (`publishEvent` or update that transitions to active state), fire `triggerPushNotification({ kind: 'event', ... })`
- in the execution-ledger delivery path, fire push for scheduled broadcasts that just became active

Profile UI:

- add a third checkbox: "Message notifications — receive a push when someone sends you a direct message"

Smoke mode:

- all new push calls already no-op via `isSmokeModeEnabled()` in `pushNotification.ts`

### b — Message pagination

Replace the all-at-once message fetch with a paginated approach so conversations scale.

Goals:

- paginate messages per thread (newest first, page size ~50)
- lazy-load older messages when the user scrolls to the top of the thread
- keep the initial thread list lightweight (most recent message per thread for preview)
- fix scroll-to-bottom reactivity — auto-scroll when a new message arrives while the user is already at the bottom
- preserve existing inbox search behavior

Candidate files:

- `src/lib/repositories/messageRepository.ts`
- `src/lib/models/messageModel.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/messages/ThreadPane.svelte`

Implementation sketch:

Repository:

- `fetchOwnMessageThreads` continues to load all threads (thread count is low per user) but limits messages to the most recent N per thread (e.g., 50)
- add `fetchOlderMessages(threadId, beforeSentAt, limit)` for lazy loading
- use `.lt('sent_at', cursor).order('sent_at', { ascending: false }).limit(pageSize)`

Store:

- add `loadOlderMessages()` method that prepends results to the active thread
- track `hasMoreMessages` flag per thread (set to `false` when a fetch returns fewer than pageSize)

ThreadPane:

- detect when the user scrolls to the top of the message list → trigger `loadOlderMessages`
- show a compact loading indicator while fetching
- fix `keepScrolledToBottom` to re-scroll on `thread.messages.length` change when the user is already near the bottom

Model:

- no type changes needed — `MessageEntry[]` already supports variable length

### c — Test coverage for new services

Fill the most critical test-coverage gaps in services and stores added in 0.1.32 and 0.1.33.

Goals:

- add unit tests for `pushSubscription.ts` — subscribe, save, remove, smoke bypass, permission checks
- add unit tests for `realtimeService.ts` — channel lifecycle, typing broadcast, unsubscribe
- add unit tests for `authBoundary.svelte.ts`
- add unit tests for `currentTheme.svelte.ts`

Candidate files:

- `src/lib/services/pushSubscription.test.ts` (new)
- `src/lib/services/realtimeService.test.ts` (new)
- `src/lib/stores/authBoundary.test.ts` (new)
- `src/lib/stores/currentTheme.test.ts` (new)

### d — Lint, format, and error page

Add automated code-style enforcement and a user-facing error boundary.

Goals:

- add ESLint + Prettier with SvelteKit-appropriate configs
- add `npm run lint` and `npm run format` scripts
- create a `+error.svelte` route for 404 and runtime errors
- add a skip-to-content link in the layout for keyboard accessibility

Candidate files:

- `eslint.config.js` (new)
- `.prettierrc` (new)
- `.prettierignore` (new)
- `package.json` (add lint/format scripts and dev dependencies)
- `src/routes/+error.svelte` (new)
- `src/routes/+layout.svelte` (skip-to-content link)

Implementation sketch:

Lint and format:

- use `eslint` v9 flat config with `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`
- Prettier with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss`
- do not auto-fix the entire codebase in this slice — add the config and scripts, format only changed files going forward
- add to CI later (out of scope for this release)

Error page:

- minimal `+error.svelte` using the SvelteKit `$page.error` and `$page.status` stores
- friendly messaging for 404 ("page not found") with a link back to home
- generic fallback for other status codes

Skip-to-content:

- visually hidden anchor at the top of `+layout.svelte` that becomes visible on focus
- targets `#main-content` id on the main content area

### e — Organization settings editing

Let admins update basic organization settings (name, description) and let admins promote/demote members.

Goals:

- add an "Edit organization" form for admins (name only in v1)
- surface the existing `setOrganizationMemberRole` and `removeOrganizationMember` store methods in the members card UI
- add confirmation dialogs for destructive actions (role change, member removal)

Candidate files:

- `src/lib/components/organization/OrganizationOverviewCard.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/repositories/organizationRepository.ts`
- `src/lib/stores/currentOrganization.svelte.ts`
- `supabase/migrations/034_allow_org_name_update.sql` (if RLS needs adjusting)

Implementation sketch:

Org name editing:

- toggle the overview card between read and edit mode for admins
- save via existing repository (or new `updateOrganization` repo method + RPC if needed)
- optimistic update in the store

Member role management:

- in `OrganizationMembersCard`, add a dropdown or action menu per member row (admin only)
- promote member → admin, demote admin → member
- remove member with confirmation dialog
- reuse the existing `setOrganizationMemberRole()` and `removeOrganizationMember()` store methods
