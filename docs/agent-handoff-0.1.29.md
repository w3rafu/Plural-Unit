# Agent Handoff: 0.1.29

This document is the quickest way to onboard a new agent after the `0.1.29` hub stabilization batch.

## Status

- Release commit: `fed29b5` (`release: 0.1.29`)
- Follow-up docs commits:
  - `5c045eb` (`docs: add hub schema recovery runbook`)
  - `ca99dc5` (`docs: add 0.1.29 rollout checklist`)
- Worktree status at handoff: clean
- Latest verified app state: no active hub schema/runtime errors observed

## What Changed

### Schema recovery and drift handling

- Added [027_backfill_hub_delivery_metadata.sql](/Users/rafa/Desktop/plural-unit/supabase/migrations/027_backfill_hub_delivery_metadata.sql) to catch databases that missed `021_add_hub_delivery_state.sql`.
- Added clearer migration-guidance messaging for repository-level schema drift failures in [repositoryError.ts](/Users/rafa/Desktop/plural-unit/src/lib/services/repositoryError.ts).
- Added operational recovery docs:
  - [hub-schema-recovery.md](/Users/rafa/Desktop/plural-unit/docs/hub-schema-recovery.md)
  - [rollout-0.1.29-checklist.md](/Users/rafa/Desktop/plural-unit/docs/rollout-0.1.29-checklist.md)

### Hub refactor

- Split [hubRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/hubRepository.ts) into domain files under [src/lib/repositories/hubRepository/](/Users/rafa/Desktop/plural-unit/src/lib/repositories/hubRepository).
- Split [currentHub.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub.svelte.ts) orchestration into helper modules under [src/lib/stores/currentHub/](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub).
- Preserved public store and repository import paths while reducing file size and coupling.

### UI and reliability

- Tightened empty/loading/error/busy states across hub surfaces, especially alerts and admin editors.
- Added tests covering delivery metadata, schema drift messaging, and alert loading paths.
- Improved alerts sheet contrast and accessibility behavior.

## Files Worth Reading First

If a new agent needs to continue hub work, start here:

- [README.md](/Users/rafa/Desktop/plural-unit/README.md)
- [docs/hub-schema-recovery.md](/Users/rafa/Desktop/plural-unit/docs/hub-schema-recovery.md)
- [docs/rollout-0.1.29-checklist.md](/Users/rafa/Desktop/plural-unit/docs/rollout-0.1.29-checklist.md)
- [src/lib/stores/currentHub.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub.svelte.ts)
- [src/lib/stores/currentHub/load.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub/load.ts)
- [src/lib/stores/currentHub/sync.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub/sync.ts)
- [src/lib/repositories/hubRepository/broadcasts.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/hubRepository/broadcasts.ts)
- [src/lib/repositories/hubRepository/events.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/hubRepository/events.ts)
- [src/lib/components/ui/HubNotificationsSheet.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/HubNotificationsSheet.svelte)

## Verified During Handoff

### Database checks

The active Supabase project was checked manually during incident follow-up:

- `013_open_member_directory.sql` effect verified as applied
- `025_add_hub_event_attendances.sql` table presence verified
- delivery metadata columns verified on both `hub_broadcasts` and `hub_events`
- no current evidence of missing hub migrations in the checked areas

### Browser smoke test

Local browser smoke testing was performed against `http://127.0.0.1:4173/` using a live signed-in session.

Verified pages loaded without the old `hub_events.delivery_state` error:

- `/`
- `/hub/manage/content`
- `/hub/manage/sections`
- `/profile/details`

Verified `Alerts` behavior:

- empty alerts sheet rendered cleanly
- populated alerts sheet rendered cleanly after publishing a temporary broadcast
- alert badge incremented correctly
- populated tray showed the broadcast notification and expected action buttons
- no visible schema/runtime error in either empty or populated alert states

Cleanup completed:

- temporary smoke-test broadcast was archived after verification

## Validation History

Before the docs-only follow-up commits, the latest full validation pass was:

- `npm run check` → passed with `0` errors and `0` warnings
- `npm test` → passed with `620` tests

Docs-only follow-up commits after that did not rerun the full suite.

## Risks Still Worth Watching

- Older environments still need migrations `021` through `027` applied in order, even though `027` provides catch-up coverage for delivery metadata.
- The highest-risk hub runtime areas remain delivery metadata sync, execution-ledger reconciliation, reminders, and attendance writes.
- Browser verification covered real flows, but there is still no repeatable Playwright-style end-to-end suite in the repo.

## Recommended Next Work

1. Add a lightweight browser smoke test harness for the hub and alerts flows.
2. Do a staging or production-like integration pass against a partially stale schema scenario.
3. Start the next feature batch around operator visibility:
   - execution-ledger filtering
   - failed/skipped recovery guidance
   - clearer delivery diagnostics in manage surfaces

## Notes For The Next Agent

- Do not assume the Supabase SQL Editor sidebar reflects true migration history. It lists saved queries, not authoritative applied-migration state.
- If a missing-column error reappears, check actual schema objects first, then use [hub-schema-recovery.md](/Users/rafa/Desktop/plural-unit/docs/hub-schema-recovery.md).
- If you need to continue hub refactoring, prefer extending the split helper modules instead of re-growing [currentHub.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub.svelte.ts) or [hubRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/hubRepository.ts).
