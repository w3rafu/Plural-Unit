# 0.1.26 checklist

## Release-wide product constraints

- [x] Keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer card radius pass
- [x] Keep new delivery and follow-up UI compact, action-first, and grounded in the existing hub, alerts, and messages shells
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Event reminder rules and reminder readiness

- [x] Add a Supabase migration for event reminder rules or reminder schedule support
- [x] Extend the hub repository and store with reminder timing and next-send state
- [x] Surface reminder timing and upcoming reminder context inside `EventEditor.svelte`
- [x] Extend reminder-aware admin copy into engagement summaries or alert modeling without adding external delivery yet
- [x] Add focused tests for reminder timing helpers and touched store/editor behavior

## b - Scheduled publish delivery state and recovery

- [x] Add publish outcome or delivery-log support for scheduled broadcasts and events
- [x] Extend the repository and store so scheduled items can surface `published`, `failed`, or `skipped` state
- [x] Update `BroadcastEditor.svelte` and `EventEditor.svelte` with compact recovery or retry actions
- [x] Extend `HubManageSummaryCard.svelte` and touched notification helpers with delivery-aware follow-up signal
- [x] Add focused tests for delivery-state transitions and member-visible filtering rules

## c - Response roster and message-driven follow-up

- [x] Extend event response shaping to surface responder and non-responder roster data
- [x] Ensure hub manage flows can load the roster context needed for direct follow-up without weakening access rules
- [x] Add a compact response roster and follow-up handoff inside `EventEditor.svelte`
- [x] Reuse `currentMessages.openConversationForProfile(...)` instead of building a second outreach flow
- [x] Add focused tests for roster derivation and message handoff behavior

## d - Member notification preferences and alert state

- [x] Add schema support for per-member hub notification preferences and alert read state
- [x] Extend repositories and stores to load, update, and apply notification preferences
- [x] Add lightweight read-state behavior to `HubNotificationsSheet.svelte`
- [x] Add a compact member settings surface for notification preferences
- [x] Add focused tests for preference defaults, read-state derivation, and filtered alert behavior