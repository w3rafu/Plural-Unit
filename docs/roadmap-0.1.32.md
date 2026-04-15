# 0.1.32 - Shared Operator Workflow State

**Theme:** make operator decisions durable across admins, browsers, and follow-up sessions. After `0.1.31` reduced the number of clicks needed to close out work, the next release should make reviewed and deferred decisions trustworthy as shared workflow state instead of browser-local hints.

## Status

Implemented on 2026-04-15. Release closeout is still pending.

- `0.1.31` is still the last closed-out app metadata target, so version bumps and any remaining release-doc metadata should stay on `0.1.31` until `0.1.32` is formally closed out.
- Shared operator workflow state now persists through `029_create_hub_operator_workflow_state.sql` and the hub repository/store flow instead of browser-local triage only.
- Queue and follow-up review state now supports stale re-review surfacing plus lightweight handoff notes across the queue, alerts inbox, and editor-adjacent operator surfaces.
- Smoke mode, recovery guidance, and rollout checklists now cover the shared workflow-state seam, including the `stale-workflow-schema` failure path.
- The slice plans below remain as the implementation record for what shipped in `0.1.32` and what still belongs to release closeout.

## Additional product notes

Carry these constraints through every `0.1.32` slice:

- keep operator work inside the existing manage content screen, manage sections screen, and alerts sheet
- prefer one shared workflow-state model for queue triage, closeout context, and follow-up review state instead of multiple narrow mini-systems
- keep review and defer actions reversible, but let the product surface when an old decision is now stale because the underlying content changed
- keep copy short and action-oriented instead of turning the hub into a project-management product
- add schema only where it directly improves cross-admin coordination and release confidence

## Context

`0.1.31` improved single-admin throughput:

- unresolved attendance can now be closed out in bulk inside the event workflow
- queue and follow-up items can be reviewed, deferred, or surfaced again
- the alerts sheet behaves more like a lightweight operator inbox with exact manage deep links
- the smoke harness now covers one alert interaction, one attendance mutation, one queue-triage interaction, and one plugin toggle

The operator workflow is still incomplete:

- reviewed and deferred state is browser-local, so one admin cannot trust what another already handled
- queue and alert surfaces can say something was triaged, but they cannot explain who reviewed it, when, or why it was left deferred
- a triage decision can outlive meaningful content changes or new failure context without a strong re-review signal
- release docs and smoke mode do not yet cover a server-backed workflow-state migration or persistence seam

`0.1.32` should therefore harden operator decisions into a small shared workflow-state layer before another feature batch expands collaboration or delivery behavior.

## Recommended features

### a - Shared workflow-state persistence for queue and follow-up

Move triage out of browser-local storage and into a compact server-backed shape that admins can actually share.

Goals:

- persist reviewed, deferred, and surfaced-again state per organization instead of keeping it only in `localStorage`
- reuse one workflow-state model for queue rows and follow-up signals rather than building separate persistence flows for each surface
- keep existing actions reversible and preserve the current low-friction operator feel
- support a cheap one-time import or overwrite strategy for existing browser-local triage when the shared store first loads

Candidate files:

- `supabase/migrations/029_create_hub_operator_workflow_state.sql`
- `src/lib/repositories/hubRepository.ts`
- `src/lib/repositories/hubRepository/operatorWorkflow.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentHub.test.ts`
- `src/lib/models/hubExecutionQueue.ts`

Implementation sketch:

Migration shape:

- add `public.hub_operator_workflow_state` with one row per org-scoped workflow decision
- use `workflow_key text not null` as the shared identifier so existing queue keys such as `execution:{entryId}` and `followup:{eventId}:{kind}` can survive the move without re-shaping every caller first
- include `workflow_kind text not null check (workflow_kind in ('execution_item', 'followup_signal'))` so follow-up and execution rows can share one persistence model without ambiguous parsing
- include `status text not null check (status in ('reviewed', 'deferred'))`
- include `reviewed_by_profile_id uuid not null references public.profiles(id) on delete cascade` and `note text not null default ''` so slice c can reuse the same row shape instead of adding a second table later
- include `reviewed_against_signature text null` so slice b can detect stale decisions without needing another migration
- include `created_at timestamptz not null default timezone('utc', now())` plus `updated_at timestamptz not null default timezone('utc', now())`, with the repo-level `updated_at` trigger pattern reused if practical
- enforce `unique (organization_id, workflow_key)` and add indexes on `(organization_id, workflow_kind)` and `(organization_id, updated_at desc)` for cheap per-org loads
- keep RLS admin-only for writes and admin-or-member read access only if the product actually needs member-facing rendering later; default this slice to admin-only reads and writes

Repository API:

- add `src/lib/repositories/hubRepository/operatorWorkflow.ts` instead of overloading the execution-ledger repository with a second concern
- export `HubOperatorWorkflowStateKind = 'execution_item' | 'followup_signal'`
- export `HubOperatorWorkflowStateStatus = 'reviewed' | 'deferred'`
- export `HubOperatorWorkflowStateRow` with `organization_id`, `workflow_key`, `workflow_kind`, `status`, `reviewed_by_profile_id`, `note`, `reviewed_against_signature`, `created_at`, and `updated_at`
- export `HubOperatorWorkflowStateMutationPayload` as the upsert contract used by the store
- add `fetchHubOperatorWorkflowState(organizationId: string): Promise<HubOperatorWorkflowStateRow[]>`
- add `upsertHubOperatorWorkflowStateEntries(entries: HubOperatorWorkflowStateMutationPayload[]): Promise<HubOperatorWorkflowStateRow[]>`
- add `deleteHubOperatorWorkflowStateEntries(organizationId: string, workflowKeys: string[]): Promise<void>` for surface-again flows
- re-export the new file from `src/lib/repositories/hubRepository.ts`

Store flow:

- load remote workflow-state rows during `currentHub.load()` beside the existing execution-ledger fetch, then derive `queueTriageMap` from repository rows instead of `localStorage`
- keep optimistic `mark*Reviewed`, `defer*`, and `surface*` actions in `currentHub`, but make them write through the repository after updating in-memory state
- keep the current triage-key helpers in `hubExecutionQueue.ts` so UI callers and selectors do not need a second identifier system
- add a one-time per-org browser import path: if remote workflow state is empty and legacy `localStorage` triage exists, upsert it once and mark that import locally so refreshes do not replay stale browser data forever
- preserve smoke-mode safety by routing shared workflow-state reads and writes to an in-memory smoke fixture map whenever smoke mode is active

Suggested task order inside slice a:

1. Add the migration and RLS policies.
2. Add the new repository file, types, and barrel export.
3. Replace `localStorage` hydration in `currentHub` with repository-backed load plus optimistic mutation helpers.
4. Add the one-time legacy browser import path and smoke-mode bypass.
5. Update queue-shaping tests and store tests before any UI copy or stale-review work starts.

### b - Change-aware staleness and re-review signals

Make triage smarter than a sticky reviewed flag so operators can trust that hidden work is still safe to ignore.

Goals:

- invalidate or soften old reviewed and deferred decisions when failure family, timing, attendance backlog, or delivery context changes materially
- surface explicit `needs re-review` or `changed since review` copy wherever a prior decision should no longer hide work by default
- keep urgent work visible even if an earlier version of the row was reviewed on another day or device
- centralize the staleness rules in model helpers so components do not each invent their own workflow heuristics

Candidate files:

- `src/lib/models/hubExecutionQueue.ts`
- `src/lib/models/hubEngagementModel.ts`
- `src/lib/stores/currentHub/derived.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/HubExecutionQueueCard.svelte`
- `src/lib/components/ui/HubNotificationsSheet.svelte`

Implementation sketch:

Signature rules:

- compare every shared workflow-state row against a computed `review_signature` instead of relying on timestamps alone
- execution-item signatures should be derived from the fields that actually change operator meaning: `execution_state`, `due_at`, `processed_at`, normalized recovery family from `getHubExecutionRecoveryGuidance(...)`, and the fallback failure text when no stable family exists
- follow-up signatures should be derived from machine-readable signal inputs rather than rendered copy, so `attendance_review`, `no_show`, and `low_turnout` can go stale when counts or kind change without parsing strings
- a stale signature should preserve the previous `reviewed` or `deferred` state as historical context, but it should no longer hide the item from the default queue or inbox views
- keep v1 deterministic: if the computed signature differs from `reviewed_against_signature`, the item is stale; avoid time-window heuristics until the simpler rules prove insufficient

Model surface:

- extend queue-item and follow-up-signal shaping so they can carry richer review metadata instead of only `triageStatus`
- add a stale-reason layer such as `execution_state_changed`, `due_time_changed`, `recovery_family_changed`, `followup_kind_changed`, `attendance_gap_changed`, and `turnout_changed`
- add helpers in `hubExecutionQueue.ts` like `buildHubExecutionQueueItemReviewSignature(...)`, `buildHubExecutionFollowUpReviewSignature(...)`, and `resolveHubExecutionReviewState(...)` so components consume one resolved view model instead of re-checking workflow rows themselves
- extend `HubEventFollowUpSignal` or its queue-shaped wrapper with machine-readable counts and completion context, because the current `copy` and `timingCopy` strings are not a safe source for stale-review logic
- keep the stale-review logic in model and derived-store code, not in `HubExecutionQueueCard.svelte` or `HubNotificationsSheet.svelte`

Default visibility behavior:

- reviewed and deferred rows should stay hidden by default only while their persisted signature still matches the current computed signature
- stale reviewed or deferred rows should return to the default visible queue and inbox lists even when `showTriagedItems` is off
- summary counts should distinguish hidden triaged items from surfaced stale-review items so operators can tell the difference between intentionally parked work and work that changed underneath them
- stale follow-up signals should re-enter admin summaries and the operator inbox, but the member-facing alert feed should not gain admin-only stale badges or copy

UI behavior:

- show a compact `Needs re-review` or `Changed since review` badge wherever stale state is surfaced in queue and operator-inbox rows
- preserve last-review context in the row metadata so operators can still see that the item had been reviewed or deferred before it changed
- make `Reviewed`, `Defer`, and `Surface again` overwrite or clear the persisted signature in place, without forcing operators through a second confirmation step
- keep stale-state explanation copy short and reason-specific, for example `Due time changed since review.` or `Attendance backlog changed since review.`

Suggested task order inside slice b:

1. Extend follow-up and queue models with machine-readable signature inputs.
2. Add signature builders plus stale-reason resolution helpers.
3. Update derived selectors so stale reviewed items are visible by default and counted separately from hidden triage.
4. Update queue and operator-inbox badges, copy, and action overwrite behavior.
5. Add focused tests for at least one execution-state change, one due-time shift, one recovery-family change, and one attendance-gap change.

### c - Lightweight handoff notes in existing operator surfaces

Give admins just enough shared context to explain why work was reviewed or deferred without turning the product into a full comments system.

Goals:

- allow a short optional handoff note when admins review or defer queue and follow-up work
- show who last reviewed something, when they did it, and the latest note snippet in queue, inbox, and editor-adjacent diagnostics where it adds real context
- keep note entry inline and compact instead of introducing threaded discussions, assignments, or a separate collaboration route
- reuse existing manage deep links so alerts remain a shortcut into the real workflow, not a second workflow engine

Candidate files:

- `src/lib/models/hubExecutionQueue.ts`
- `src/lib/components/hub/admin/HubExecutionQueueCard.svelte`
- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/lib/stores/currentOrganization.svelte.ts`
- `src/lib/stores/currentHub.svelte.ts`

Implementation sketch:

Workflow metadata shape:

- treat the slice-a workflow row as the only persistence seam for notes: `note`, `reviewed_by_profile_id`, `status`, and `updated_at` should be enough to render the latest handoff context without adding a second note table
- add a model-level workflow-summary helper that resolves one compact view model for queue items and follow-up signals: reviewer display name, status label, relative timestamp copy, note snippet, and note-presence flags
- resolve reviewer names from `currentOrganization.members` when roster data is already available, and fall back to neutral copy such as `Another admin` instead of exposing raw profile IDs when the roster is not loaded
- normalize note input in one place before persistence: trim whitespace, collapse empty notes to `''`, and cap the stored or displayed snippet to a compact length that fits the current card layouts

Inline entry flow:

- keep `Reviewed` and `Defer` as the no-note fast path, but add a compact inline note affordance per row so operators can attach context without leaving the queue
- allow only one open note composer per surface at a time, using the existing workflow key so queue and follow-up rows do not need a second local identifier system
- wire note submission into the existing `markExecutionQueueItemReviewed`, `deferExecutionQueueItem`, `markFollowUpSignalReviewed`, and `deferFollowUpSignal` actions by extending them to accept an optional note payload instead of creating parallel APIs
- keep `Surface again` as the reset path for both status and note so resurfacing an item clears stale handoff context cleanly

Placement rules:

- in `HubExecutionQueueCard.svelte`, show the summary directly beneath row detail copy for triaged or stale items, and keep the note composer visually attached to the same action cluster as `Reviewed` and `Defer`
- in `HubNotificationsSheet.svelte`, reuse the same summary copy under recovery, closeout, and follow-up cards so the operator inbox reflects shared workflow context instead of just raw queue state
- in `EventEditor.svelte` and `BroadcastEditor.svelte`, surface read-only workflow summaries beside existing execution diagnostics or manage-card metadata rather than creating a new collaboration panel
- keep member-facing alert surfaces unchanged; handoff notes remain operator-only workflow context

Formatting and fallback rules:

- standardize summary copy around `Reviewed by {name}` or `Deferred by {name}` plus relative time, with the note snippet on a second line only when present
- when roster data is missing, still show status and timestamp so shared state remains visible even if name lookup cannot complete yet
- truncate long notes in the model helper rather than in each component so queue, inbox, and editor-adjacent summaries stay visually consistent
- if slice-b stale-review state is active, continue showing the previous note as historical context while making the item visible for fresh review

Suggested task order inside slice c:

1. Add workflow-summary model helpers and reviewer-name fallback rules.
2. Extend `currentHub` triage actions and local UI state to accept optional notes.
3. Add inline note entry plus summary rendering in `HubExecutionQueueCard.svelte`.
4. Reuse the same summary helper in `HubNotificationsSheet.svelte`, `EventEditor.svelte`, and `BroadcastEditor.svelte`.
5. Add focused model, store, and component tests before moving on to slice d.

### d - Persistence-aware smoke, migration, and rollout safety

Lock down the new shared workflow seam so release confidence does not drop as triage moves from browser-only state into the database.

Goals:

- extend smoke mode so shared workflow-state reads and writes can be exercised safely under blank `PUBLIC_SUPABASE_*` env vars
- cover at least one persisted triage interaction and one stale-review re-surface path in the browser harness
- document rollout and recovery expectations for the new workflow-state schema, including any local-to-server migration behavior
- keep the browser harness narrow and deterministic instead of expanding into multi-user end-to-end coverage

Candidate files:

- `e2e/hub-smoke.spec.ts`
- `src/lib/demo/smokeMode.ts`
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/demo/smokeFixtures.test.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentHub.test.ts`
- `README.md`
- `docs/hub-schema-recovery.md`

Implementation sketch:

Smoke-mode workflow seam:

- replace the current queue-triage assumption that smoke mode is just browser-local state with an explicit smoke-only workflow-state fixture seam that mirrors the slice-a repository contract closely enough to exercise reviewed, deferred, and surfaced transitions
- keep that seam fully local to the browser test run: no live Supabase client, no auth requirement, and no dependency on populated `PUBLIC_SUPABASE_*` env vars even when triage mutations are executed repeatedly
- seed deterministic workflow-state fixtures in `smokeFixtures.ts` so at least one queue item and one follow-up signal can start reviewed or deferred, then be resurfaced after a signature change without requiring brittle UI setup in Playwright
- update `currentHub.svelte.ts` so smoke-mode workflow reads and writes bypass the real repository just like other smoke-safe admin mutations, while still exercising the same store selectors and UI code paths as production

Focused regression coverage:

- extend `currentHub.test.ts` away from steady-state `localStorage` persistence assertions and toward the new responsibilities: one-time legacy browser import when remote workflow state is empty, smoke-mode local bypass behavior, and safe clearing or overwriting of workflow entries
- extend `smokeFixtures.test.ts` to assert the smoke dataset includes the workflow-state rows and stale-review conditions needed by the browser harness, so the smoke spec does not silently depend on accidental fixture shapes
- keep the Playwright harness narrow: one test should prove a reviewed or deferred workflow write is reflected in the queue or inbox, and one test should prove a stale-signature change resurfaces work without reaching live backend state

Failure simulation and recovery docs:

- add a dedicated smoke scenario for workflow-state schema drift instead of overloading the existing delivery-state failure scenario, so `smokeMode.ts` can surface migration guidance that points specifically at the new workflow-state table or columns
- extend `docs/hub-schema-recovery.md` with `029_create_hub_operator_workflow_state.sql` plus the runtime symptoms that indicate it is missing
- document the local-to-server migration behavior explicitly: legacy browser triage should import only once when remote workflow state is empty, and operators should know that later edits live in the database rather than in per-browser storage
- update the README smoke section so it stops describing queue triage as browser-local behavior in normal app operation and instead explains that smoke mode keeps workflow mutations local while production uses shared persistence

Rollout checklist shape:

- use `docs/rollout-0.1.29-checklist.md` as the pattern for a future `0.1.32` rollout checklist, but add workflow-specific checks: migration presence, one operator queue write, one follow-up resurfacing check, and one smoke-scenario verification for workflow-schema drift
- include a release-closeout note that the one-time browser import path should be observed only on the first admin load against an empty remote workflow table, not on every refresh
- keep rollout verification operational rather than exhaustive: confirm schema presence, load health, one persisted workflow action, one stale re-review path, and the recovery runbook link

Suggested task order inside slice d:

1. Add smoke-only workflow-state fixtures and store bypass coverage.
2. Extend `currentHub.test.ts` and `smokeFixtures.test.ts` for import, bypass, and stale-review expectations.
3. Update `e2e/hub-smoke.spec.ts` with one workflow write path and one stale re-surface path.
4. Add a workflow-schema drift smoke scenario in `smokeMode.ts`.
5. Update README, the schema-recovery runbook, and the next rollout checklist with the new persistence expectations.

## What not to do in 0.1.32

- do not build a separate operator dashboard, task board, or assignment surface
- do not turn lightweight handoff notes into threaded comments, mentions, or chat-like collaboration
- do not add broad audit-log exploration or analytics reporting as part of this batch
- do not add bulk group messaging, campaigns, or external escalation channels here
- do not spend the batch on unrelated refactors that do not directly improve shared operator coordination or release safety

## Recommended order

1. Shared workflow-state persistence for queue and follow-up
2. Change-aware staleness and re-review signals
3. Lightweight handoff notes in existing operator surfaces
4. Persistence-aware smoke, migration, and rollout safety

## Why this order

Shared persistence has to land first, because the rest of the batch depends on a single source of truth instead of browser-local flags. Once the state is shared, staleness rules can make that state trustworthy instead of dangerously sticky. Lightweight handoff notes should sit on top of that stable workflow model rather than inventing a second persistence seam. The smoke and rollout work should come last so it can validate the final shared-state behavior and migration story instead of chasing moving targets.
