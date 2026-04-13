# 0.1.26 - Delivery Confidence & Response Follow-Through

**Theme:** move the hub from planning-aware coordination into trustworthy follow-through. After 0.1.25 added scheduling, calendar export, engagement summaries, and actionable alerts, the next release should make scheduled items reliable, show what actually happened, and turn weak response signals into concrete admin action.

## Status

Completed on 2026-04-13.

- 0.1.25 is documented as complete, and app metadata is now synced to `0.1.25` in `package.json` and `package-lock.json`.
- Slice a, event reminder rules and reminder readiness, was implemented on 2026-04-13 and validated with `npm run check` plus `npm test` at 39 files / 533 tests.
- Slice b, scheduled publish delivery state and recovery, was implemented on 2026-04-13 and validated with `npm run check` plus `npm test` at 40 files / 541 tests.
- Slice c, response roster and message-driven follow-up, was implemented on 2026-04-13 and validated with `npm run check` plus `npm test` at 40 files / 545 tests.
- Slice d, member notification preferences and alert state, was implemented on 2026-04-13 and validated with `npm run check` plus `npm test` at 40 files / 561 tests.
- This release should assume hub migrations `014` through `022` are already applied before development resumes.
- Existing messaging infrastructure already supports unread counts, polling, and direct conversation handoff through `currentMessages`, so 0.1.26 should reuse that flow instead of inventing a second outreach surface.

## Additional product notes

Carry these constraints through every 0.1.26 slice:

- keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer radius choices
- keep delivery and follow-up UI compact, action-first, and grounded in the existing hub, alerts, and messages shells
- prefer in-app readiness and trustworthy state modeling before adding broader delivery-channel complexity
- stay focused on the live coordination loop; do not spend the release on demo or preview expansion unless a live change requires it

## Context

0.1.25 closed the biggest planning gaps in the live hub:

- events support lifecycle management, scheduled visibility, RSVP signal, and calendar export
- broadcasts support drafts, scheduled publishing, and richer live/history separation
- admin summaries surface lightweight engagement and scheduled-content follow-up signals
- the alerts sheet now provides route-aware actions instead of a passive feed

That leaves a different class of gap in the live product:

- scheduled events and broadcasts still have no trustworthy delivery-state model, so admins cannot tell whether planned content actually went live as expected
- event engagement is visible in aggregate, but admins still have to infer who needs outreach and manually jump into Messages
- alerts now deep-link well, but they are still not read-aware or preference-aware, so they cannot yet behave like a true task surface
- the app can schedule content, but it still lacks a light reminder model that bridges event planning and member follow-through

0.1.26 should therefore focus on delivery confidence and response follow-through instead of adding another new hub capability.

## Recommended features

### a - Event reminder rules and reminder readiness

Add the minimum reminder structure needed so events can move from “scheduled” to “members are prompted at the right time” without jumping straight into a full campaign system.

Implemented on 2026-04-13.

- Added migration `020_add_hub_event_reminders.sql` for per-event reminder settings.
- Added reminder timing helpers and summary copy in `src/lib/models/eventReminderModel.ts`.
- Extended `currentHub.svelte.ts`, `hubRepository.ts`, and `EventEditor.svelte` so admins can load, save, and review reminder readiness inline.
- Extended event engagement signals so reminder context shows up beside existing RSVP and publish-state follow-up copy.

Goals:

- let admins set simple reminder timing for an event, such as 24 hours before or 2 hours before
- store reminder definitions and next-send timing in a way that can support future delivery channels
- show upcoming reminder state in the admin event surface and related engagement copy
- keep the first version intentionally small: no recurring reminder chains, no per-member override logic, and no generalized automation builder

Candidate files:

- `supabase/migrations/*` - reminder rule or reminder schedule support for events
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/models/*` helper for reminder timing and admin copy
- `src/lib/models/hubNotifications.ts`

### b - Scheduled publish delivery state and recovery

Make scheduled content trustworthy by distinguishing what is merely planned from what actually published, failed, or needs attention.

Implemented on 2026-04-13.

- Added migration `021_add_hub_delivery_state.sql` so hub broadcasts and events persist `delivery_state`, `delivered_at`, and failure-reason metadata.
- Added shared delivery-status and reconciliation helpers in `src/lib/models/scheduledDeliveryModel.ts`.
- Extended `hubRepository.ts` and `currentHub.svelte.ts` so admin loads reconcile stale delivery metadata and expose compact delivery-status lookups.
- Extended `BroadcastEditor.svelte`, `EventEditor.svelte`, and `hubEngagementModel.ts` so admins can review scheduled, published, failed, and skipped outcomes inline and see delivery-recovery follow-up counts.

Goals:

- track publish outcome for scheduled broadcasts and events instead of assuming `publish_at` means success
- surface compact delivery states such as scheduled, published, failed, or skipped
- give admins a lightweight recovery path when a scheduled item misses its publish window or errors
- keep member-facing surfaces filtered to content that is genuinely live

Candidate files:

- `supabase/migrations/*` - publish outcome or delivery-log fields for hub events and broadcasts
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`
- `src/lib/models/broadcastLifecycleModel.ts`
- `src/lib/models/eventLifecycleModel.ts`

### c - Response roster and message-driven follow-up

Turn event engagement from a summary signal into a direct operational workflow by showing who responded, who has not, and how to follow up from the existing messaging system.

Implemented on 2026-04-13.

- Extended `src/lib/models/eventResponseModel.ts` so event replies can be shaped into responder and non-responder rosters keyed to the current organization member list.
- Extended `currentHub.svelte.ts` so admin event surfaces can read response rosters without reaching into repositories directly.
- Updated `src/routes/hub/manage/+layout.svelte` so the hub manage flow loads the organization member roster needed for follow-up.
- Updated `EventEditor.svelte` so live events show a compact response roster, highlight members who still need a reply, and reuse `currentMessages.openConversationForProfile(...)` to hand admins straight into the existing Messages flow.

Goals:

- extend event response shaping beyond totals so admins can review responders and non-responders
- reuse the existing one-to-one Messages workflow for outreach instead of building a second messaging surface
- keep the response roster compact and useful inside the hub manage flow
- avoid group campaigns, bulk messaging, or CRM-style scoring in this release

Candidate files:

- `src/lib/models/eventResponseModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/organization/*` helpers if member-roster display needs reuse
- `src/routes/messages/+page.svelte`

### d - Member notification preferences and alert state

Make alerts sustainable as the hub gets more operational by adding light preference control and basic read-state behavior.

Implemented on 2026-04-13.

- Added migration `022_add_hub_notification_preferences.sql` for per-member in-app alert preferences and persisted read markers.
- Extended `src/lib/repositories/hubRepository.ts`, `src/lib/models/hubNotifications.ts`, and `src/lib/stores/currentHub.svelte.ts` so notification preferences and read state load with hub state, filter member-facing alert surfaces, and support compact mark-read actions.
- Updated `HubNotificationsSheet.svelte` and `src/lib/components/hub/member/HubActivityFeed.svelte` so unread counts, hidden-by-settings copy, and mark-read controls behave consistently across the header tray and member activity feed.
- Added `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte` to the existing profile details surface so members can manage in-app broadcast and event alerts without a new standalone settings route.

Goals:

- let members control whether they want to see certain hub alert categories in-app
- add lightweight read-state behavior so the alerts tray can behave more like a current task list
- keep the first version simple and local to in-app behavior; do not expand to a full email/SMS/push preference matrix yet
- place preference controls in an existing member settings surface instead of creating another standalone management page

Candidate files:

- `supabase/migrations/*` - notification preference and alert read-state support
- `src/lib/repositories/*` and `src/lib/stores/*` for preference loading and updates
- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/components/ui/Header.svelte`
- `src/lib/models/hubNotifications.ts`
- `src/routes/profile/*` or a new compact profile settings card

## What not to do in 0.1.26

- do not build a generalized workflow automation system or background-job dashboard
- do not add bulk messaging, campaigns, or group thread management before one-to-one follow-up is integrated cleanly
- do not add external email, SMS, or push delivery channels before reminder rules and delivery state are trustworthy in-app
- do not add another new hub plugin before the scheduling and follow-through loop is dependable

## Recommended order

1. Event reminder rules and reminder readiness
2. Scheduled publish delivery state and recovery
3. Response roster and message-driven follow-up
4. Member notification preferences and alert state

## Why this order

Reminder rules define what the app should do before an event. Delivery state then confirms whether scheduled content actually did what the admin expected. Once scheduling is trustworthy, response rosters and message handoff let admins act on weak participation without leaving the existing product flow. Preference and read-state work comes last because it becomes most useful only after the alert and reminder volume increases.