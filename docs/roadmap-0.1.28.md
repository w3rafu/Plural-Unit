# 0.1.28 - Attendance Confidence & Post-Event Follow-Through

**Theme:** move the hub from reminder-driven commitments into day-of and after-event accountability. After 0.1.27 added durable due work, operator recovery, reminder-aware alerts, and compact commitment views, the next release should distinguish RSVP intent from actual turnout, make day-of event handling compact for admins, and keep recent event outcomes visible without inventing a second operations product.

## Status

Completed on 2026-04-14.

- 0.1.27 is documented as complete.
- App metadata in `package.json` and `package-lock.json` is now synced to `0.1.28`.
- Slice a, attendance records and event outcome primitives, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 44 files / 603 tests.
- Slice b, day-of roster and quick attendance actions, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 44 files / 607 tests.
- Slice c, attendance-aware member surfaces and recent event history, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 44 files / 609 tests.
- Slice d, post-event follow-up signals and reminder cleanup, was implemented on 2026-04-14 and validated with `npm run check` plus `npm test` at 44 files / 616 tests.
- Release closeout re-ran `npm run check` and `npm test` with app metadata synced to `0.1.28`, holding at 44 files / 616 tests.
- This release should assume hub migrations `014` through `026` are already applied before development resumes.
- Existing execution-ledger seams, direct-message follow-up flow, and member commitment surfaces should be reused rather than replaced.

## Additional product notes

Carry these constraints through every 0.1.28 slice:

- keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer radius choices
- keep attendance and follow-up UI compact, action-first, and grounded in the existing hub manage, home, alerts, and messages shells
- prefer explicit persisted attendance and follow-through state over inferred client-only heuristics once an event is in progress or complete
- stay focused on in-app day-of and post-event coordination; do not spend the release on public kiosks, guest registration, or external campaign delivery

## Context

0.1.27 closed the biggest execution gaps in the live hub:

- scheduled publish and reminder work now lives in a durable execution ledger
- admins can review and recover due or failed work inside the existing hub manage flow
- reminder settings now materialize real in-app member alerts with stable notification identity
- members can see reply-needed and upcoming commitment states instead of only a flat event list

That still leaves a day-of and post-event gap:

- RSVP state still captures intent, not whether someone actually attended
- admins can see response rosters, but they still do not have a compact way to confirm turnout or identify likely no-shows once an event begins
- reminder alerts and commitment cards help before the event, but the product still gets thin during the event itself and immediately after it ends
- historical events move out of live surfaces, but the app still lacks a compact summary of who attended, who missed, and what needs follow-up next

0.1.28 should therefore focus on attendance confidence and post-event follow-through instead of adding another new hub capability.

## Recommended features

### a - Attendance records and event outcome primitives

Build the smallest durable attendance model needed to distinguish RSVP intent from actual turnout without turning the hub into a ticketing system.

Implemented on 2026-04-14.

- Added migration `025_add_hub_event_attendances.sql` for persisted event attendance outcomes, admin write rules, and member-readable own-attendance state.
- Added `src/lib/models/eventAttendanceModel.ts` and `src/lib/models/eventAttendanceModel.test.ts` so attendance rows can be grouped, upserted, cleared, and summarized separately from RSVP intent.
- Extended `src/lib/repositories/hubRepository.ts`, `src/lib/repositories/hubRepository.test.ts`, `src/lib/stores/currentHub.svelte.ts`, and `src/lib/stores/currentHub.test.ts` so attendance rows load with event state and admins can record or clear per-member attendance outcomes without inventing a second store seam.

Goals:

- persist attendance outcomes separately from RSVP responses so admins can record who attended and who did not
- support a compact initial state model such as pending, attended, and absent or equivalent without adding guest or seat-management complexity
- keep first-write behavior manual and admin-driven; no kiosk, QR code, or self-serve public check-in in this release
- let existing store and summary code read concrete attendance rows once an event is underway

Candidate files:

- `supabase/migrations/*` - attendance rows or event outcome support
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/models/eventResponseModel.ts`
- `src/lib/models/*` helper for attendance shaping and copy

### b - Day-of roster and quick attendance actions

Extend the current admin event flow with a compact day-of roster so event handling stays inside the existing manage surface.

Implemented on 2026-04-14.

- Expanded `src/lib/models/eventAttendanceModel.ts` and `src/lib/stores/currentHub.svelte.ts` so live and recently finished events can derive compact attendance-review windows, expected-attendee rosters, and quick per-member attendance actions from the existing RSVP plus attendance seams.
- Added `src/lib/components/hub/admin/EventAttendanceRosterPanel.svelte` and mounted it inside `src/lib/components/hub/admin/EventEditor.svelte` so admins can mark attended, absent, clear, or message members from the existing live and just-finished event lanes.
- Extended `src/lib/models/hubEngagementModel.ts`, `src/lib/models/hubEngagementModel.test.ts`, `src/lib/components/hub/admin/HubManageSummaryCard.svelte`, `src/lib/models/eventAttendanceModel.test.ts`, and `src/lib/stores/currentHub.test.ts` so the manage summary surfaces attendance-review counts and the new roster behavior is covered by focused tests before the full-suite validation pass.

Goals:

- show RSVP intent beside recordable attendance state for live and just-finished events
- support quick mark-attended and mark-absent actions without requiring a second admin console
- keep direct follow-up paths lightweight by reusing the existing `currentMessages.openConversationForProfile(...)` seam where needed
- highlight only the members who still need a day-of decision instead of flooding the editor with dashboard copy

Candidate files:

- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`
- `src/lib/models/eventResponseModel.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/organization/*` helper if roster rendering needs extraction

### c - Attendance-aware member surfaces and recent event history

Close the loop for members by keeping the commitment surfaces useful during the event window and immediately after it ends.

Implemented on 2026-04-14.

- Added migration `026_expand_member_event_visibility_for_recent_history.sql` so published events remain member-readable through the recent post-event window instead of disappearing the moment they start.
- Expanded `src/lib/models/memberCommitmentModel.ts` and `src/lib/models/memberCommitmentModel.test.ts` so member-facing commitment state now distinguishes reply-needed, today, in-progress, upcoming, and recently completed items while reusing persisted attendance outcomes when they exist.
- Updated `src/lib/components/hub/member/MemberCommitmentsCard.svelte` and `src/lib/components/hub/member/EventsSection.svelte` so the home and hub surfaces expose compact day-of and recent outcome copy without creating a separate history route.

Goals:

- extend member-facing event and commitment surfaces so `today`, `in progress`, and `recently completed` states are clearer
- show a compact recent history or outcome line for the events a signed-in member responded to or attended
- keep the first version inside existing home and hub surfaces rather than creating a dedicated history or calendar page
- avoid personal journaling, photo sharing, or long-lived archive work in this slice

Candidate files:

- `src/lib/components/hub/member/MemberCommitmentsCard.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/routes/+page.svelte`
- `src/lib/models/memberCommitmentModel.ts`
- `src/lib/models/*` helper for recent-event grouping and copy

### d - Post-event follow-up signals and reminder cleanup

Make the hub operational after events end by surfacing what still needs attention instead of letting all day-of state disappear into history.

Implemented on 2026-04-14.

- Expanded `src/lib/models/hubNotifications.ts`, `src/lib/components/hub/member/hubActivityModel.ts`, `src/lib/components/ui/HubNotificationsSheet.svelte`, `src/lib/components/hub/member/HubActivityFeed.svelte`, `src/lib/models/hubNotifications.test.ts`, `src/lib/components/hub/member/hubActivityModel.test.ts`, and `src/lib/stores/currentHub.test.ts` so event alerts and reminder alerts stay timing-aware through `today`, `in progress`, and `recently completed` states instead of assuming every event update targets an upcoming item.
- Expanded `src/lib/models/hubEngagementModel.ts`, `src/lib/models/hubEngagementModel.test.ts`, `src/lib/stores/currentHub.svelte.ts`, `src/lib/stores/currentHub.test.ts`, and `src/lib/components/hub/admin/HubExecutionQueueCard.svelte` so the admin surface now derives compact recent follow-up signals for attendance review, recorded no-shows, and low-turnout events without creating a separate analytics or campaign layer.
- Kept the first version inside existing manage and alert surfaces only, with validation passing at `44 files / 616 tests` after the slice-d notification cleanup and admin follow-up passes landed together.

Goals:

- surface compact no-show, low-turnout, or attendance-still-unrecorded signals in existing admin summary areas
- keep notifications and activity copy aligned so members do not keep seeing stale pre-event reminder framing after the event starts or ends
- support light post-event follow-up prompts without expanding into campaigns, surveys, or analytics dashboards
- add focused model and store seams that can support later recap or volunteer follow-up work without committing to it yet

Candidate files:

- `src/lib/models/hubEngagementModel.ts`
- `src/lib/models/hubNotifications.ts`
- `src/lib/components/hub/admin/HubExecutionQueueCard.svelte`
- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/models/*` helper for attendance-aware follow-up signals

## What not to do in 0.1.28

- do not build a public check-in kiosk, QR scanning flow, or ticketing system
- do not add guest management, household rollups, or seat assignment logic
- do not add external email, SMS, or push follow-up campaigns before the in-app attendance loop is trustworthy
- do not turn recent event history into a heavy analytics dashboard or CRM

## Recommended order

1. Attendance records and event outcome primitives
2. Day-of roster and quick attendance actions
3. Attendance-aware member surfaces and recent event history
4. Post-event follow-up signals and reminder cleanup

## Why this order

Attendance records are the root seam because every later slice depends on a real outcome model instead of inferring turnout from RSVPs alone. Once that exists, the admin roster can support quick day-of decisions inside the current manage surface. Member-facing recent history should come next so it can reuse the same attendance state without inventing parallel copy. Follow-up signals come last because they become much clearer only after the product knows what actually happened at and after the event.
