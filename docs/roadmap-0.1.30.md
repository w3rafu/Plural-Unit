# 0.1.30 - Operator Visibility & Recovery Confidence

**Theme:** make scheduled hub work explain itself before the product expands again. After `0.1.29` stabilized schema drift handling, split the hub orchestration, and tightened loading/error states, the next release should help operators answer four questions quickly inside the existing manage tools: what is due next, what failed or was skipped, why it happened, and what to do next.

## Status

Planned and closed out on 2026-04-15.

- `0.1.29` rollout prep is complete in this workspace, with the latest local validation holding at `npm run check` with `0` errors and `0` warnings plus `npm test` at `44` files / `620` tests.
- App metadata is now synced to `0.1.30`, and the repo includes a CI workflow that reruns `npm run check`, `npm test`, and `npm run test:smoke` under blank public Supabase env vars.
- Slice a, execution-ledger filtering and focus controls, was implemented on 2026-04-15 and validated with `npm run check` plus `npm test` at `44` files / `623` tests.
- Slice b, recovery guidance and failure classification, was implemented on 2026-04-15 and validated with `npm run check` plus `npm test` at `45` files / `627` tests.
- Slice c, inline delivery diagnostics in content editors, was implemented on 2026-04-15 and validated with `npm run check` plus `npm test` at `46` files / `631` tests.
- Slice d, the lightweight browser smoke harness, now includes a simulated stale-schema browser failure path and validates with `npm run check`, `npm test` at `47` files / `633` tests, plus `npm run test:smoke` with `4` passing browser smoke checks.
- The current hub already has queue actions, delivery-state sync, and schema-drift guidance; `0.1.30` should deepen those seams instead of introducing a parallel operator surface.
- Prefer a release with no new schema unless a concrete diagnostics requirement appears during implementation.
- Existing split modules under `src/lib/stores/currentHub/` and `src/lib/repositories/hubRepository/` should be extended rather than bypassed.

## Additional product notes

Carry these constraints through every `0.1.30` slice:

- keep operator work inside the existing hub manage summary, queue, and content editors
- keep copy specific and action-oriented instead of generic or dashboard-heavy
- prefer compact filters and diagnostics over a new reporting route
- treat browser smoke coverage as release safety, not a second product surface
- avoid external delivery channels, analytics expansion, or broad refactors that do not directly improve operator clarity

## Context

`0.1.29` made the hub safer to operate:

- schema-drift failures now point operators toward running the latest migrations
- delivery metadata and execution-ledger rows stay aligned more reliably
- alerts and manage screens no longer fail on the old missing delivery-state columns
- queue rows can already be retried, run immediately, or opened in the related content area

The operator experience is still shallower than it needs to be:

- the operations queue groups work into broad sections, but it does not yet let operators focus the list by bucket, job kind, or subject type
- failed and skipped rows often surface generic copy or raw failure text without a stable next-step recommendation
- broadcast and event editors show a short delivery line, but not the execution context behind it
- rollout confidence still depends on manual browser smoke passes instead of a repeatable lightweight harness

`0.1.30` should therefore focus on visibility, diagnosis, and recovery confidence before another feature batch expands the hub again.

## Recommended features

### a - Execution-ledger filtering and focus controls

Make the existing queue easier to scan and safer to operate when there is more than a handful of rows.

Implemented on 2026-04-15.

- Expanded `src/lib/models/hubExecutionQueue.ts` and `src/lib/models/hubExecutionQueue.test.ts` with URL-backed queue focus state, filtered section building, optional upcoming rows, and focused coverage for queue filtering plus deep-link serialization.
- Updated `src/lib/components/hub/admin/HubExecutionQueueCard.svelte` to add compact status, job, and content filters, preserve focus state in the URL, and reveal upcoming scheduled work only on demand.
- Updated `src/lib/components/hub/admin/HubManageSummaryCard.svelte` so the due and recovery metrics jump straight into filtered queue views inside the manage content route.

Goals:

- let operators narrow the queue by bucket, job kind, and subject type without leaving manage
- show optional upcoming work so schedule issues can be spotted before rows become due or failed
- support deep-link-friendly focus states so summary cards and queue actions can land on a filtered view
- keep the default surface compact; filters should reveal detail without turning the queue into a reporting tool

Candidate files:

- `src/lib/components/hub/admin/HubExecutionQueueCard.svelte`
- `src/lib/models/hubExecutionQueue.ts`
- `src/lib/models/hubExecutionLedger.ts`
- `src/routes/hub/manage/content/+page.svelte`

### b - Recovery guidance and failure classification

Turn queue rows and related error messaging into stable operator guidance instead of forcing people to parse raw failure text every time.

Implemented on 2026-04-15.

- Added `src/lib/models/hubRecoveryGuidance.ts` and `src/lib/models/hubRecoveryGuidance.test.ts` to centralize known queue failure families plus targeted schema-drift recovery copy.
- Updated `src/lib/models/scheduledDeliveryModel.ts` and `src/lib/models/hubExecutionLedger.ts` to reuse shared failure-reason constants instead of scattering hardcoded operator strings across delivery and reminder paths.
- Updated `src/lib/models/hubExecutionQueue.ts`, `src/lib/models/hubExecutionQueue.test.ts`, and `src/lib/components/hub/admin/HubExecutionQueueCard.svelte` so recovery rows now carry stable guidance badges, next-step copy, and clearer action labeling instead of generic retry language.
- Updated `src/lib/services/repositoryError.ts`, `src/lib/services/repositoryError.test.ts`, `src/lib/repositories/hubRepository.test.ts`, and `src/lib/stores/currentHub.test.ts` so schema-drift toasts and load failures point to the specific migration family when the missing object is known.

Goals:

- classify the most common failed and skipped causes into consistent operator-facing labels and next actions
- distinguish action types such as fix schedule, restore visibility, rerun after migration, or ignore archived/canceled work
- surface clearer next-step guidance in queue rows, toasts, and repository error handling
- keep schema-drift guidance aligned with the existing recovery docs instead of inventing a second runbook voice

Candidate files:

- `src/lib/models/hubExecutionQueue.ts`
- `src/lib/services/repositoryError.ts`
- `src/lib/models/scheduledDeliveryModel.ts`
- `src/lib/models/eventReminderModel.ts`
- `docs/hub-schema-recovery.md`

### c - Inline delivery diagnostics in content editors

Expose the execution context directly where admins already edit broadcasts and events, so queue-driven recovery does not dead-end in another generic list.

Implemented on 2026-04-15.

- Added `src/lib/models/hubExecutionDiagnostics.ts` and `src/lib/models/hubExecutionDiagnostics.test.ts` to shape publish and reminder execution metadata into editor-ready diagnostics entries with due times, last-attempt copy, processed state, attempt counts, and recovery guidance.
- Extended `src/lib/stores/currentHub/derived.ts`, `src/lib/stores/currentHub.svelte.ts`, and `src/lib/stores/currentHub.test.ts` so broadcasts and events can request execution diagnostics directly from the current hub state instead of rebuilding them in components.
- Added `src/lib/components/hub/admin/ExecutionDiagnosticsPanel.svelte` and mounted it inside `src/lib/components/hub/admin/BroadcastEditor.svelte` plus `src/lib/components/hub/admin/EventEditor.svelte` so publish and reminder execution context now sits beside the existing delivery lines in the editors themselves.
- Preserved the earlier recovery-guidance follow-up, but folded it into the fuller diagnostics panel so the editor surfaces now show the same next-step guidance plus concrete execution metadata in one place.

Goals:

- show the relevant publish and reminder execution context next to each scheduled broadcast or event
- expose last attempt, due time, state, and recent failure or skip reason without forcing operators back to the queue
- make the queue `Open` action feel precise by landing on content that already explains the issue
- keep diagnostics read-only except for the existing retry, run-now, publish, and lifecycle controls

Candidate files:

- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentHub/derived.ts`
- `src/lib/models/hubExecutionQueue.ts`

### d - Lightweight browser smoke harness for hub operations

Capture the critical routes and states that `0.1.29` still verified manually so rollout confidence improves with every future batch.

Implemented on 2026-04-15.

- Added `playwright.config.ts`, `e2e/hub-smoke.spec.ts`, and `package.json` smoke scripts to run a focused Chromium smoke pass against the real route tree.
- Added `src/lib/demo/smokeMode.ts`, `src/lib/demo/smokeFixtures.ts`, and `src/lib/demo/smokeFixtures.test.ts` so the browser harness can seed the existing auth, organization, messages, and hub stores without building a parallel route tree or network-mocking Supabase.
- Added an explicit `stale-hub-schema` smoke scenario so the browser harness can force the old delivery-column failure path and verify that the targeted migration guidance still reaches home, Alerts, and manage surfaces.
- Updated `src/lib/stores/currentUser.svelte.ts`, `src/lib/stores/currentOrganization.svelte.ts`, `src/lib/stores/currentMessages.svelte.ts`, `src/lib/stores/currentHub.svelte.ts`, and `src/routes/+layout.svelte` so smoke mode survives direct route loads and internal navigation.
- Updated `src/lib/components/ui/HubNotificationsSheet.svelte` so the sheet footer stays reachable inside the viewport; the smoke harness exposed that layout bug while verifying the Alerts-to-profile-settings shortcut.

Goals:

- cover the release-critical routes: home, alerts, manage content, manage sections, and profile preferences
- make the smoke pass cheap to rerun after schema or queue changes
- support one partially stale-schema scenario if it can be simulated cheaply in the existing test setup
- keep the harness narrow and reliable; it should catch rollout regressions, not model every hub flow end to end

Candidate files:

- `package.json`
- `playwright.config.ts`
- `e2e/hub-smoke.spec.ts`
- `README.md`
- `docs/rollout-0.1.29-checklist.md`
- `src/lib/demo/smokeMode.ts`
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/components/ui/HubNotificationsSheet.svelte`

## What not to do in 0.1.30

- do not build a separate operations dashboard route or analytics suite
- do not add email, SMS, push, or other external delivery channels
- do not replace the current queue with a full audit-log explorer
- do not spend the batch on generic refactors unless they directly unblock visibility or smoke coverage
- do not introduce a heavy browser-testing matrix if a focused smoke harness will catch the same regressions

## Recommended order

1. Execution-ledger filtering and focus controls
2. Recovery guidance and failure classification
3. Inline delivery diagnostics in content editors
4. Lightweight browser smoke harness for hub operations

## Why this order

Filters and focus controls make the queue usable before it gets more detailed. Once the list is navigable, failure classification can make each row actionable instead of generic. Inline diagnostics should come next so queue `Open` actions resolve into context instead of another summary surface. The smoke harness comes last because it will be most valuable once the operator flows and regression targets are settled.
