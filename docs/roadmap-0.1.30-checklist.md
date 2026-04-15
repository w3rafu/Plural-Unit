# 0.1.30 checklist

## Release-wide product constraints

- [x] Keep new operator tooling inside the existing hub manage summary, queue, and content editors
- [x] Keep copy action-oriented and specific instead of generic dashboard language
- [x] Prefer compact filters and diagnostics over a new reporting route or analytics surface
- [x] Avoid new schema unless diagnostics work proves it is necessary
- [x] Sync app metadata and release docs to `0.1.30` as part of closeout
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Execution-ledger filtering and focus controls

- [x] Add queue focus controls for bucket, job kind, and subject type
- [x] Surface optional upcoming work without making the default queue noisy
- [x] Support deep-link or route-state driven focus from summary metrics and queue actions
- [x] Keep the queue compact and usable on both desktop and mobile widths
- [x] Add focused tests for queue filtering, grouping, and focus-state behavior

## b - Recovery guidance and failure classification

- [x] Normalize common failed and skipped causes into stable operator-facing labels and next-step copy
- [x] Distinguish schedule-fix, migration-fix, restore-visibility, and ignore-for-history cases where appropriate
- [x] Align queue copy, toasts, and repository error messaging for the same failure family
- [x] Keep schema-recovery guidance aligned with the existing hub recovery docs
- [x] Add focused tests for failure classification and touched error helpers

## c - Inline delivery diagnostics in content editors

- [x] Show publish or reminder execution context directly in broadcast and event editors
- [x] Expose due time, last attempt, state, and recent failure or skip reason where available
- [x] Make queue `Open` actions land on content that already explains the issue
- [x] Reuse existing retry, run-now, publish, and lifecycle controls instead of adding a second action panel
- [x] Add focused tests for touched delivery-diagnostics models, selectors, and UI logic

## d - Lightweight browser smoke harness for hub operations

- [x] Add a lightweight browser smoke harness for the release-critical hub routes
- [x] Make the harness straightforward to run locally during rollout prep
- [x] Cover alerts and manage-shell loading against the current happy path
- [x] Explore one cheap stale-schema or partially-behind scenario if the repo setup can support it reliably
- [x] Document how to run the smoke pass during release closeout
