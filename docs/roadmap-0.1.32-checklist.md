# 0.1.32 checklist

## Release-wide product constraints

- [x] Keep operator work inside the existing manage content screen, manage sections screen, and alerts sheet
- [x] Prefer one shared workflow-state model instead of separate persistence flows for queue, closeout, and follow-up review state
- [x] Keep review and defer actions reversible while surfacing when an older decision has gone stale
- [x] Add schema only where it directly improves cross-admin coordination and release confidence
- [ ] Sync app metadata and release docs to `0.1.32` only as part of closeout
- [x] Keep browser smoke coverage narrow and deterministic instead of growing a broad multi-user suite
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Shared workflow-state persistence for queue and follow-up

- [x] Add `029_create_hub_operator_workflow_state.sql` with `workflow_key`, `workflow_kind`, `status`, `reviewed_by_profile_id`, `note`, `reviewed_against_signature`, timestamps, and a unique `(organization_id, workflow_key)` constraint
- [x] Add admin-safe RLS policies and supporting indexes for per-org shared workflow-state loads
- [x] Create `src/lib/repositories/hubRepository/operatorWorkflow.ts` with typed fetch, batch upsert, and batch delete helpers, then re-export it from the hub repository barrel
- [x] Replace `currentHub` `localStorage` triage hydration with repository-backed load logic while preserving optimistic reviewed, defer, and surface-again actions
- [x] Reuse one workflow-state model for both queue rows and follow-up signals instead of splitting persistence by surface
- [x] Add a one-time per-org import or reset path for legacy browser-local triage so existing operator state is not silently lost on upgrade
- [x] Keep smoke-mode shared workflow-state reads and writes local and blank-env safe
- [x] Add focused repository, store, and queue-model tests for the new persistence seam before slice b starts

## b - Change-aware staleness and re-review signals

- [x] Extend queue items and follow-up signals with machine-readable signature inputs instead of relying on rendered copy for stale-review checks
- [x] Add execution-item review-signature builders based on state, due time, processed time, and normalized recovery family
- [x] Add follow-up review-signature builders based on signal kind, completion context, and attendance or turnout counts
- [x] Introduce explicit stale-reason helpers and types such as `execution_state_changed`, `due_time_changed`, `recovery_family_changed`, `followup_kind_changed`, `attendance_gap_changed`, and `turnout_changed`
- [x] Surface stale reviewed or deferred items in the default queue and operator inbox even when hidden triage is still collapsed
- [x] Update summary counts and copy so hidden triage and stale-review work are reported separately
- [x] Show compact `Needs re-review` or `Changed since review` cues without adding admin-only stale state to the member-facing alert feed
- [x] Keep `Reviewed`, `Defer`, and `Surface again` actions able to overwrite or clear the persisted signature without extra workflow steps
- [x] Add focused tests for one execution-state change, one due-time shift, one recovery-family change, one follow-up-kind change, and one attendance-gap or turnout change

## c - Lightweight handoff notes in existing operator surfaces

- [x] Add workflow-summary helpers that combine triage status, reviewer name fallback, relative timestamp copy, and compact note snippets for queue items and follow-up signals
- [x] Resolve reviewer display names from the loaded organization member roster when available, with a neutral fallback label when roster data is missing
- [x] Normalize note input before persistence by trimming whitespace, collapsing blank notes, and enforcing one compact snippet budget
- [x] Extend `markExecutionQueueItemReviewed`, `deferExecutionQueueItem`, `markFollowUpSignalReviewed`, and `deferFollowUpSignal` to accept an optional note payload instead of creating separate note-specific actions
- [x] Add one-inline-composer-at-a-time note entry in `HubExecutionQueueCard.svelte` while preserving fast no-note `Reviewed` and `Defer` actions
- [x] Render the latest workflow summary under triaged or stale rows in `HubExecutionQueueCard.svelte` without displacing existing action buttons or manage links
- [x] Reuse the same workflow summary copy in `HubNotificationsSheet.svelte` for recovery, closeout, and follow-up cards
- [x] Surface read-only workflow summaries beside existing diagnostics or manage metadata in `EventEditor.svelte` and `BroadcastEditor.svelte`
- [x] Keep member-facing alert surfaces free of operator-only handoff note copy
- [x] Add focused tests for note normalization, reviewer-name fallback, queue note submission, operator-inbox summary rendering, and one editor-adjacent workflow-summary display

## d - Persistence-aware smoke, migration, and rollout safety

- [x] Add a smoke-only workflow-state fixture seam that can model reviewed, deferred, and resurfaced queue or follow-up work without hitting the real repository
- [x] Keep smoke-mode workflow reads and writes local and blank-env safe inside `currentHub.svelte.ts`, matching the new shared workflow-state selectors without requiring live Supabase auth
- [x] Replace the current browser-local queue-triage assumptions in `currentHub.test.ts` with focused coverage for one-time legacy import, smoke-mode local bypass, and workflow-state overwrite or clear behavior
- [x] Extend `smokeFixtures.test.ts` so the smoke dataset explicitly covers one persisted workflow row and one stale-review re-surface setup
- [x] Exercise one shared workflow write path in `e2e/hub-smoke.spec.ts` and verify the queue or operator inbox reflects the change
- [x] Cover one stale-review re-surface path in the browser harness without broadening the smoke suite into multi-user synchronization coverage
- [x] Add a dedicated workflow-schema drift smoke scenario in `src/lib/demo/smokeMode.ts` so recovery guidance can point to the workflow-state migration instead of the older delivery-state drift path
- [x] Extend `docs/hub-schema-recovery.md` with the new workflow-state migration, its likely runtime errors, and the expected recovery sequence
- [x] Update the README smoke section to explain that production triage becomes shared workflow state while smoke-mode workflow mutations remain local to the harness
- [x] Prepare the next rollout checklist from the existing `0.1.29` pattern, adding migration-presence, first-load import, persisted workflow action, stale re-review, and recovery-runbook checks for the shared workflow-state seam
