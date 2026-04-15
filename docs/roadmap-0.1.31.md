# 0.1.31 - Operator Closeout & Inbox Actions

**Theme:** help operators finish the work that `0.1.30` made visible. After queue filters, recovery guidance, editor diagnostics, and fixture-backed smoke coverage, the next release should reduce the number of clicks and context switches needed to close out events, triage queue noise, and act on alerts.

## Status

Planned and closed out on 2026-04-15.

- `0.1.30` is released, and `0.1.31` now closes the operator workflow loop inside the existing manage content screen, manage sections screen, and alerts sheet.
- App metadata is now synced to `0.1.31`, and the latest local validation holds at `npm run check` with `0` errors and `0` warnings, `npm test` at `49` files / `646` tests, and blank-env `npm run test:smoke` with `4` passing browser smoke checks.
- Slice a, event closeout progress and bulk attendance actions, is complete and validated with focused model, store, and component coverage.
- Slice b, queue triage and reviewed-state controls, is complete and validated with focused queue-model and store coverage.
- Slice c, alerts as an operator inbox, is complete and validated with activity-model and component coverage.
- Slice d, the mutation-focused smoke harness, is complete and now exercises one alert interaction, one attendance mutation, one queue triage interaction, and one plugin toggle in smoke mode.
- Triage persistence stayed browser-scoped, and the only new migration in the batch is the forward fix `028_fix_get_organization_members_ambiguity.sql` to keep member-directory and admin roster loads stable on upgraded databases.
- Existing split modules under `src/lib/stores/currentHub/` and `src/lib/repositories/hubRepository/` absorbed the work instead of re-growing a larger hub coordinator file.

## Additional product notes

Carry these constraints through every `0.1.31` slice:

- keep operator work inside the existing manage content screen, manage sections screen, and alerts sheet
- optimize for larger rosters and noisier queues where repeated one-by-one actions become tedious
- keep actions reversible when practical so operators can recover from a mistaken triage or attendance update
- treat the smoke harness as release safety, not as a full browser-integration test matrix
- if a feature needs persistence, start with browser-scoped state unless multi-admin coordination proves necessary

## Context

`0.1.30` improved operator visibility:

- the operations queue can now be filtered and linked directly from summary metrics
- failed and skipped work carries clearer next-step guidance
- broadcasts and events now explain their publish and reminder execution state inline
- the browser smoke harness catches load-time regressions and one simulated stale-schema failure path in CI

The operator flow is still incomplete:

- day-of attendance and recent event follow-up still degrade into repeated member-by-member clicks on larger rosters
- queue rows can be inspected, retried, or opened, but there is no explicit reviewed or deferred state for operators who intentionally leave something alone
- the alerts sheet exposes shortcuts, but it still behaves more like a feed than a lightweight operator inbox
- smoke coverage proves that critical routes load, but it does not yet exercise the high-risk admin mutations that are most likely to regress during refactors

`0.1.31` should therefore turn the current explanatory surfaces into completion surfaces before another broad feature batch expands the hub again.

## Recommended features

### a - Event closeout progress and bulk attendance actions

Make post-event follow-up workable for real rosters instead of forcing a long sequence of one-member actions.

Goals:

- show closeout progress for each live or recently finished event, including how many expected attendees still need a recorded outcome
- add safe bulk attendance actions for obvious groups such as RSVP-positive members or unresolved expected attendees
- keep per-member attendance overrides and direct message shortcuts available after bulk actions land
- make the existing event editor feel like the primary event closeout workspace instead of a partial roster preview

Candidate files:

- `src/lib/components/hub/admin/EventAttendanceRosterPanel.svelte`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/models/eventAttendanceModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentHub.test.ts`

### b - Queue triage and reviewed-state controls

Give operators a way to say "I reviewed this" or "leave this deferred" without deleting history or letting known items dominate the queue forever.

Goals:

- let operators mark recovery, processed, and follow-up rows as reviewed, deferred, or surfaced again
- reduce repeated queue noise while preserving the real execution-ledger history underneath
- keep the first version reversible and lightweight, ideally browser-scoped before considering shared persistence
- make summary counts and queue sections reflect triaged state without hiding truly urgent work

Candidate files:

- `src/lib/components/hub/admin/HubExecutionQueueCard.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`
- `src/lib/models/hubExecutionQueue.ts`
- `src/lib/models/hubExecutionQueue.test.ts`
- `src/lib/stores/currentHub.svelte.ts`

### c - Alerts as an operator inbox

Turn the alerts sheet into a quicker first-stop for action instead of a feed you open after you already know where to go.

Goals:

- align alert groupings and action labels more closely with queue recovery, attendance closeout, and follow-up workflows
- surface stronger manage shortcuts so alerts can open the exact editor or roster state that needs action
- make read-state transitions feel predictable after an operator acts from the sheet
- keep member-facing alert semantics intact while sharpening the admin-facing inbox feel

Candidate files:

- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/components/hub/member/hubActivityModel.ts`
- `src/lib/models/hubNotifications.ts`
- `src/lib/stores/currentHub/notifications.ts`
- `src/routes/hub/manage/+layout.svelte`

### d - Mutation-focused smoke harness

Extend the smoke harness from route-load confidence into the admin mutations most likely to break during future hub refactors.

Goals:

- cover at least one plugin toggle, one alert read or filter interaction, one attendance mutation, and one queue triage or focus interaction
- keep smoke mode deterministic and safe under blank `PUBLIC_SUPABASE_*` env vars
- preserve the fast CI loop by preferring one focused happy-path mutation per seam instead of broad end-to-end coverage
- document which admin flows are intentionally still out of scope for Playwright

Candidate files:

- `e2e/hub-smoke.spec.ts`
- `playwright.config.ts`
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/demo/smokeFixtures.test.ts`
- `src/lib/demo/smokeMode.ts`
- `.github/workflows/ci.yml`

## What not to do in 0.1.31

- do not add a separate operator dashboard or inbox route
- do not introduce multi-channel delivery, workflow automation, or escalation logic yet
- do not add shared server-side triage state unless a browser-scoped approach clearly fails the real use case
- do not turn the smoke suite into a full browser regression matrix
- do not spend the batch on unrelated refactors that do not directly improve operator closeout speed or confidence

## Recommended order

1. Event closeout progress and bulk attendance actions
2. Queue triage and reviewed-state controls
3. Alerts as an operator inbox
4. Mutation-focused smoke harness

## Why this order

Event closeout already has the strongest low-level support in the store layer, so it should land first and establish the action patterns for the batch. Queue triage should come next because it reduces operator noise once closeout actions exist. Alerts should then mirror the same action model instead of inventing a second one. The smoke harness should come last so it can lock down the final mutation flows instead of chasing moving targets during the earlier slices.
