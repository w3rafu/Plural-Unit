# 0.1.27 - Execution Ledger & Member Commitments

**Theme:** turn the hub from planning-aware coordination into a dependable execution loop. After 0.1.26 added reminder rules, delivery outcomes, roster-based follow-up, and read-aware alerts, the next release should persist due work, expose operator recovery, and turn reminder configuration into actual member-visible follow-through.

## Status

Completed on 2026-04-14.

- 0.1.26 is documented as complete.
- App metadata in `package.json` and `package-lock.json` is now synced to `0.1.27`.
- Slice a, execution ledger and due-work primitives, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 41 files / 574 tests.
- Slice b, admin operations queue and recovery actions, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 42 files / 579 tests.
- Slice c, materialized reminder alerts and reminder-aware notification identity, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 42 files / 587 tests.
- Slice d, upcoming commitments and reply-needed member view, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 43 files / 590 tests.
- This release should assume hub migrations `014` through `024` are already applied before development resumes.
- Existing hub admin tooling already supports scheduled content review, direct message handoff, reminder settings, and read-aware in-app alerts, so 0.1.27 should build on those seams instead of introducing a separate operations product.

## Additional product notes

Carry these constraints through every 0.1.27 slice:

- keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer radius choices
- keep execution and recovery UI compact, action-first, and grounded in the existing hub manage, alerts, and home shells
- prefer explicit persisted due-work rows over hidden client-side reconciliation whenever scheduled behavior needs to be trusted
- stay focused on in-app execution and member follow-through; do not spend the release on external delivery channels or a generalized automation system

## Context

0.1.26 closed the biggest modeling gaps in the live hub:

- events support reminder timing rules instead of publish-only planning
- broadcasts and events both track scheduled delivery outcomes such as scheduled, published, failed, or skipped
- admins can see response rosters and hand off directly into the existing Messages flow for one-to-one follow-up
- hub alerts now support per-member preferences plus lightweight read state

That still leaves a root execution gap in the live product:

- scheduled publishes and reminder windows are still derived opportunistically instead of being represented as durable due work
- delivery recovery is visible, but there is still no compact queue showing what is due now, what failed, or what was processed recently
- reminder settings improve admin readiness, but they still do not materialize real member-facing reminder alerts
- the notification model is still shaped around live broadcast and event items, so reminder alerts and future follow-through signals need clearer identity rules
- members can RSVP and receive alerts, but they still do not have a compact view of what they already committed to and what still needs a reply

0.1.27 should therefore focus on execution reliability and member commitments instead of adding another new hub capability.

## Recommended features

### a - Execution ledger and due-work primitives

Build the smallest durable execution model needed for scheduled publishes and reminder windows without introducing a generalized workflow platform.

Implemented on 2026-04-14.

- Added migration `023_add_hub_execution_ledger.sql` for durable broadcast publish, event publish, and event reminder due-work rows.
- Added `src/lib/models/hubExecutionLedger.ts` so scheduled content and reminder plans can be reconciled into pending, due, processed, failed, and skipped ledger entries.
- Extended `src/lib/repositories/hubRepository.ts` and `src/lib/stores/currentHub.svelte.ts` so admin loads fetch, sync, and prune execution ledger rows instead of waiting for the next page load to infer work from timestamps alone.
- Tightened admin content mutations so schedule and reminder changes immediately sync delivery metadata and the execution ledger, reducing reliance on load-time reconciliation.

Goals:

- persist due work for scheduled broadcast publish, scheduled event publish, and event reminder emission
- record compact execution metadata such as due time, processed time, outcome, attempt count, and last failure reason
- let store and model code read concrete due-work rows instead of inferring everything from timestamps alone
- keep the first version intentionally scoped to hub execution; no arbitrary workflow builder, no cross-product job framework, and no external delivery channels yet

Candidate files:

- `supabase/migrations/*` - hub execution ledger or due-work support
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/models/eventReminderModel.ts`
- `src/lib/models/scheduledDeliveryModel.ts`
- `src/lib/models/*` helper for execution shaping and admin copy

### b - Admin operations queue and recovery actions

Build a compact operator queue inside the existing hub manage surface so admins can see what needs attention now and recover quickly.

Implemented on 2026-04-14.

- Added `src/lib/models/hubExecutionQueue.ts` and `src/lib/models/hubExecutionQueue.test.ts` so due, recovery, and recently processed work can be shaped from concrete execution-ledger rows plus related broadcasts and events.
- Added `src/lib/components/hub/admin/HubExecutionQueueCard.svelte` and mounted it in `src/routes/hub/manage/content/+page.svelte`, keeping the recovery queue inside the existing content-manage flow instead of creating a second dashboard.
- Extended `src/lib/stores/currentHub.svelte.ts` with compact queue recovery state and actions, including `executionTargetId`, `recoverableExecutionCount`, `retryExecutionEntry(...)`, and `runExecutionEntryNow(...)`.
- Extended `src/lib/components/hub/admin/HubManageSummaryCard.svelte` so due-work and recovery counts now reflect concrete queue state instead of derived heuristics alone.
- Kept correction flow lightweight by routing `Open` actions to the existing broadcast and event sections rather than adding URL-driven editor hydration, and moved unsaved-form registration for the touched editors behind `src/lib/actions/unsavedChanges.ts` so the Svelte components stay autofixer-clean.

Goals:

- surface due, failed, skipped, and recently processed hub work in one compact queue
- support lightweight actions such as retry, run now, or open the related broadcast or event for correction
- make delivery recovery and reminder recovery consistent instead of scattering them across unrelated summary copy
- keep this inside the existing hub manage flow instead of creating a separate operations dashboard

Candidate files:

- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/routes/hub/manage/+layout.svelte`
- `src/routes/hub/manage/content/+page.svelte`
- `src/lib/components/hub/admin/*` helper if the queue needs extraction

### c - Materialized reminder alerts and reminder-aware notification identity

Turn reminder settings into real member-visible in-app alerts and make the notification model able to distinguish those alerts cleanly.

Implemented on 2026-04-14.

- Added migration `024_add_hub_reminder_notification_identity.sql` so hub notification reads carry `notification_key`, reminder alert reads can use the new `event_reminder` kind, processed reminder executions can be materialized through `process_hub_due_reminder_executions(...)`, and signed-in members can read only processed reminder rows from `hub_execution_ledger`.
- Extended `src/lib/repositories/hubRepository.ts`, `src/lib/models/hubNotifications.ts`, and `src/lib/stores/currentHub.svelte.ts` so reminder alerts are built from processed execution-ledger rows, notification read state uses reminder-aware identity keys, and member loads process due reminders without needing access to admin-only reminder settings.
- Updated `src/lib/components/ui/HubNotificationsSheet.svelte`, `src/lib/components/hub/member/HubActivityFeed.svelte`, `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`, and `src/lib/components/hub/member/hubActivityModel.ts` so reminder alerts stay inside the existing event preference/filter bucket while still using reminder-specific copy and actions.

Goals:

- materialize actual reminder alert instances when a reminder window is reached
- extend notification identity so reminder alerts do not collide with publish alerts for the same event
- keep reminder alerts read-aware and preference-aware in the existing notification sheet and member activity feed
- keep delivery limited to in-app alerts for this release; do not add email, SMS, or push yet

Candidate files:

- `supabase/migrations/*` - reminder delivery or notification-instance support
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/models/hubNotifications.ts`
- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`

### d - Upcoming commitments and reply-needed member view

Close the loop for members once reminder alerts exist by surfacing what they already committed to and what still needs a reply.

Implemented on 2026-04-14.

- Added `src/lib/models/memberCommitmentModel.ts` and `src/lib/models/memberCommitmentModel.test.ts` so live events can be grouped into reply-needed and upcoming commitment buckets using existing RSVP state plus reminder notifications.
- Added `src/lib/components/hub/member/MemberCommitmentsCard.svelte` and mounted it in `src/routes/+page.svelte` plus `src/routes/demo/hub/+page.svelte`, keeping the first version inside existing member home and demo hub surfaces instead of inventing a separate planner area.
- Updated `src/lib/components/hub/member/EventsSection.svelte` to reflect reply-needed, going, maybe, and starts-soon commitment states inline while reusing the existing RSVP controls and calendar actions.
- Extended `src/lib/demo/uiPreviewFixtures.ts` and `src/lib/demo/uiPreviewFixtures.test.ts` with preview RSVP state so the new member commitment surface can be reviewed in the fixture-backed demo route.

Goals:

- show a compact signed-in view of events needing a response and events the member already plans to attend
- highlight reply-needed and starts-soon states using the same event and notification data already used elsewhere in the hub
- keep the first version inside existing member home and hub surfaces instead of creating a separate planner area
- avoid attendance check-in, guest management, or a full personal calendar module in this release

Candidate files:

- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/models/eventResponseModel.ts`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/routes/+page.svelte`
- `src/lib/models/*` helper for member commitment copy and grouping

## What not to do in 0.1.27

- do not build a generalized workflow automation system or background-job platform
- do not add external email, SMS, or push reminder delivery before in-app execution is trustworthy
- do not build a separate admin ops console when the existing hub manage flow can hold the queue
- do not turn member commitments into a full planner, attendance kiosk, or calendar product

## Recommended order

1. Execution ledger and due-work primitives
2. Admin operations queue and recovery actions
3. Materialized reminder alerts and reminder-aware notification identity
4. Upcoming commitments and reply-needed member view

## Why this order

The execution ledger is the root seam because every later slice depends on trustworthy due-work state instead of inferred timing. Once that exists, the admin queue can expose concrete recovery actions instead of more derived copy. Reminder alerts should come next because they are the first member-visible proof that reminder rules actually execute. The member commitment view comes last so it can reuse real reminder and due-state data instead of inventing a parallel summary model.