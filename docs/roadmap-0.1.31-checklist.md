# 0.1.31 checklist

## Release-wide product constraints

- [x] Keep operator work inside the existing manage content screen, manage sections screen, and alerts sheet
- [x] Optimize for larger rosters and noisier queues where one-by-one admin actions become tedious
- [x] Keep closeout and triage actions reversible when practical
- [x] Avoid new schema unless shared persistence proves necessary for the operator workflow
- [x] Sync app metadata and release docs to `0.1.31` as part of closeout
- [x] Keep browser smoke coverage narrow and deterministic instead of growing a broad end-to-end suite
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Event closeout progress and bulk attendance actions

- [x] Show closeout progress for live or recently finished events inside the existing event editor workflow
- [x] Add safe bulk attendance actions for the most obvious unresolved attendee groups
- [x] Preserve per-member attendance overrides and message shortcuts after bulk actions land
- [x] Keep attendance copy action-oriented and useful for real roster cleanup work
- [x] Add focused tests for touched attendance models, stores, and UI logic

## b - Queue triage and reviewed-state controls

- [x] Let operators mark queue and follow-up items as reviewed, deferred, or surfaced again
- [x] Reduce queue noise without deleting or corrupting the underlying execution-ledger history
- [x] Make summary counts and queue sections reflect triaged state without hiding urgent work
- [x] Keep the first persistence model lightweight unless shared admin state is clearly required
- [x] Add focused tests for queue triage state, filtering, and touched selectors

## c - Alerts as an operator inbox

- [x] Align alert labels and actions with queue recovery, attendance closeout, and follow-up workflows
- [x] Make alert shortcuts land on the exact manage or roster context that needs action
- [x] Keep read-state behavior predictable after operators act from the sheet
- [x] Preserve member-facing notification semantics while sharpening admin usefulness
- [x] Add focused tests for touched alert models and UI behavior

## d - Mutation-focused smoke harness

- [x] Cover at least one plugin toggle in smoke mode
- [x] Cover at least one alert read or filter interaction in smoke mode
- [x] Cover at least one attendance mutation in smoke mode
- [x] Cover at least one queue triage or focus interaction in smoke mode
- [x] Keep CI runtime short and smoke mode blank-env safe
