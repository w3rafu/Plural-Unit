# 0.1.25 checklist

## Release-wide product constraints

- [x] Keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer card radius pass
- [x] Keep new draft, scheduled, live, and history states legible without introducing dashboard-heavy admin layouts
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Event lifecycle and scheduled visibility

- [x] Add event lifecycle and visibility fields through a new Supabase migration
- [x] Extend the hub repository with event update and lifecycle mutation helpers
- [x] Extend the current hub store to load and separate scheduled, live, and historical event state
- [x] Support editing, canceling or archiving, and scheduled visibility inside `EventEditor.svelte`
- [x] Update the member-facing events section and hub notifications to respect live event visibility only
- [x] Add focused tests for event lifecycle helpers, repository mutations, and store state transitions

## b - Calendar export and reminder-ready event details

- [x] Add the minimum event detail needed for useful exports, such as optional end time and tighter location formatting
- [x] Create a small event calendar helper for export URLs or file generation
- [x] Add add-to-calendar actions to member-facing event surfaces without making each event card bulky
- [x] Keep the event data model compatible with future reminder work without implementing reminder delivery yet
- [x] Add focused tests for calendar helper output and touched event rendering logic

## c - Broadcast drafts and scheduled publishing

- [x] Add draft and scheduled publish fields for broadcasts through a new Supabase migration
- [x] Extend the hub repository and store with draft, schedule, publish, and history mutations
- [x] Update `BroadcastEditor.svelte` to separate draft, scheduled, live, and inactive broadcast buckets compactly
- [x] Keep member broadcasts, hub summaries, and notifications filtered to the correct live state
- [x] Preserve the single pinned live broadcast rule while excluding draft and scheduled items from member visibility
- [x] Add focused tests for broadcast state transitions and scheduled publish behavior

## d - Lightweight engagement summaries

- [x] Add compact admin summary helpers for RSVP uptake, response freshness, and scheduled content counts
- [x] Extend `HubManageSummaryCard.svelte` beyond raw live item counts once draft and scheduled states exist
- [x] Add lightweight engagement context to the event and broadcast admin editors without introducing a separate analytics panel
- [x] Surface basic follow-up signals such as no-response events or content about to publish
- [x] Add focused tests for summary derivation and touched admin UI logic

## e - Actionable alerts sheet

- [x] Add route-aware open and manage actions inside `HubNotificationsSheet.svelte`
- [x] Add lightweight filter or grouping controls so alerts remain scannable as more content states appear
- [x] Keep the alert sheet and hub activity feed aligned through the same notification model
- [x] Avoid read-tracking or delivery-state work in this slice
- [x] Add focused tests for notification filtering and action-supporting helper behavior