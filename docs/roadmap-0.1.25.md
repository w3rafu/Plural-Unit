# 0.1.25 - Scheduled Coordination & Lightweight Insights

**Theme:** turn the hub from a publish-now surface into a planning-aware coordination system. After 0.1.24 made events, broadcasts, access review, and resources actionable, the next release should help admins plan content ahead of time and see enough response signal to know what needs follow-up.

## Status

Completed on 2026-04-13.

- 0.1.24 is documented as complete.
- app metadata is now synced to `0.1.25` in `package.json` and `package-lock.json`.
- Slice a, event lifecycle and scheduled visibility, was implemented on 2026-04-12 and validated with `npm run check` plus `npm test` at 36 files / 494 tests.
- Slice b, calendar export and reminder-ready event details, was implemented on 2026-04-12 and validated with `npm run check` plus `npm test` at 37 files / 499 tests.
- Slice c, broadcast drafts and scheduled publishing, was implemented on 2026-04-12 and validated with `npm run check` plus `npm test` at 37 files / 510 tests.
- Slice d, lightweight engagement summaries, was implemented on 2026-04-13 and validated with `npm run check` plus `npm test` at 38 files / 518 tests.
- Slice e, actionable alerts sheet, was implemented on 2026-04-13 and validated with `npm run check` plus `npm test` at 38 files / 522 tests after the final load-deduplication and manage-link polish pass.

## Additional product notes

Carry these constraints through every 0.1.25 slice:

- keep the denser 0.1.24 card spacing and firmer radius choices on any touched live surface
- keep member-facing event, broadcast, and alert flows action-first instead of turning them into management dashboards
- favor lightweight derived summaries and clearly separated content states over a new analytics surface
- stay focused on live product follow-through; do not spend the release on demo or preview expansion unless a live change requires it

## Context

0.1.24 finished the most obvious live workflow gaps:

- members can now RSVP to events and admins can see lightweight attendance summaries
- broadcasts support edit, pin, archive, restore, and expiry behavior
- organization access review supports faster search and filtering with better operational signals
- the hub now supports a third plugin for stable resources alongside timeline content

That leaves a different class of gap in the live product:

- `EventEditor.svelte` is still a publish-or-delete surface, so admins cannot edit, cancel, archive, or stage events ahead of time
- the event RSVP slice explicitly deferred reminder systems and calendar export, so member follow-through still stops at the hub card
- broadcasts can expire or move into history, but admins still cannot save a draft or schedule a publish time for future updates
- `HubNotificationsSheet.svelte` still summarizes content passively, and it does not yet give route-aware next-step actions as scheduled and historical states grow

0.1.25 should therefore focus on planned coordination and lightweight follow-through rather than adding another new product area.

## Recommended features

### a - Event lifecycle and scheduled visibility

Make events manageable after creation instead of treating them as publish-now records.

Goals:

- edit an existing event instead of relying on delete-and-repost only
- add lightweight lifecycle states such as scheduled, live, canceled, or archived without building a heavy calendar admin tool
- optionally delay member visibility until a publish time so admins can prepare future events ahead of announcement
- keep past or canceled items in admin history instead of leaving them mixed into the live member list forever

Candidate files:

- `supabase/migrations/*` - lifecycle and visibility fields on `hub_events`
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/lib/models/hubNotifications.ts`

### b - Calendar export and reminder-ready event details

Give members a concrete next step after RSVPing so events can leave the app without needing a full reminder system yet.

Goals:

- let members add a live event to their calendar from the member-facing event card
- add the minimum extra detail needed for export links to feel real, such as optional end time or clearer location handling
- keep future reminder automation in mind when shaping event data, without building background delivery yet
- avoid recurring events, waitlists, guest counts, or a full calendar view in this slice

Candidate files:

- `supabase/migrations/*` - optional event timing fields if needed
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/lib/models/*` helper for calendar export links and copy

### c - Broadcast drafts and scheduled publishing

Give broadcasts the same planning affordances that events need, so admins can prepare communication ahead of time.

Goals:

- save a draft broadcast without making it member-visible yet
- optionally schedule a publish time for future updates
- separate draft, scheduled, live, and historical broadcast buckets in the admin editor without creating a second management page
- preserve the single pinned live broadcast rule while keeping scheduled or draft items out of the member view

Candidate files:

- `supabase/migrations/*` - draft and scheduled publish fields on `hub_broadcasts`
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`
- `src/lib/models/hubNotifications.ts`

### d - Lightweight engagement summaries

Implemented on 2026-04-13.

Add enough signal for admins to spot what needs attention without jumping to a large analytics layer.

Goals:

- show compact RSVP uptake and response freshness for admins once event lifecycle states exist
- extend hub summary metrics beyond simple live counts to include draft, scheduled, and historical content state
- surface basic follow-up signals such as events with no responses or scheduled items approaching publish time
- avoid per-member scoring, reporting dashboards, or broad behavioral analytics

Candidate files:

- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`
- `src/lib/models/*` helper for compact admin summary derivation

### e - Actionable alerts sheet

Implemented on 2026-04-13.

Make the header alert sheet behave like a follow-through tool instead of a passive copy dump.

Goals:

- add route-aware open or manage actions inside `HubNotificationsSheet.svelte`
- support lightweight filtering or grouping so alerts remain scannable as scheduled and historical states expand
- keep the alert sheet and hub activity feed fed by the same notification model rather than inventing a second system
- avoid introducing read-tracking or notification delivery infrastructure in this slice

Candidate files:

- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/models/hubNotifications.ts`
- `src/lib/components/hub/member/hubActivityModel.ts`
- `src/routes/+page.svelte`
- `src/lib/components/ui/Header.svelte`

## What not to do in 0.1.25

- do not build recurring events, ticketing, guest management, or a full calendar screen
- do not build email, SMS, or push reminder delivery yet
- do not introduce a heavy analytics dashboard before lightweight summaries prove out
- do not add another new hub plugin before scheduled event and broadcast flows are stable

## Recommended order

1. Event lifecycle and scheduled visibility
2. Calendar export and reminder-ready event details
3. Broadcast drafts and scheduled publishing
4. Lightweight engagement summaries
5. Actionable alerts sheet

## Why this order

Now that members can RSVP, events are the most obviously unfinished live workflow. Event lifecycle and calendar follow-through make the hub useful before the day of the event instead of only at posting time. Broadcast scheduling then gives communications parity with events. Engagement summaries come after those planning states exist, so admins can judge what needs attention without jumping into heavy analytics. The alerts sheet comes last because it should reflect the richer scheduled and historical content model, not invent it.