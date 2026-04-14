# 0.1.28 checklist

## Release-wide product constraints

- [x] Keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer card radius pass
- [x] Keep attendance and follow-up UI compact, action-first, and grounded in the existing hub manage, home, alerts, and messages shells
- [x] Prefer explicit persisted attendance and follow-through state over client-only heuristics for in-progress and completed events
- [x] Leave app metadata at `0.1.27` until 0.1.28 ships, then sync package files and docs as part of release closeout
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Attendance records and event outcome primitives

- [x] Add schema support for persisted attendance or equivalent event outcome records
- [x] Extend repositories and stores to load, mutate, and summarize attendance state beside RSVP data
- [x] Add compact model helpers for pending, attended, and absent day-of outcomes
- [x] Keep the first version manual and admin-driven without kiosk or guest flows
- [x] Add focused tests for attendance shaping, mutations, and store hydration

## b - Day-of roster and quick attendance actions

- [x] Add a compact admin roster for live and just-finished events
- [x] Support quick attendance actions inside `EventEditor.svelte`
- [x] Reuse the existing Messages flow for follow-up handoff where needed
- [x] Keep summary copy attention-oriented instead of dashboard-heavy
- [x] Add focused tests for roster filtering, quick actions, and touched admin UI logic

## c - Attendance-aware member surfaces and recent event history

- [x] Extend member surfaces with `today`, `in progress`, and `recently completed` event states
- [x] Reuse existing commitment and RSVP data instead of building a separate calendar or archive area
- [x] Keep recent-history copy compact on the home and hub surfaces
- [x] Avoid journaling, media, or long-lived archive features in this slice
- [x] Add focused tests for recent-event grouping, member copy, and touched surfaces

## d - Post-event follow-up signals and reminder cleanup

- [ ] Surface no-show, low-turnout, or attendance-still-unrecorded signals in existing admin summary areas
- [ ] Align notification and activity copy with day-of and post-event states
- [ ] Keep the first version limited to in-app follow-up cues rather than campaigns or surveys
- [ ] Reduce stale reminder framing once an event is underway or complete
- [ ] Add focused tests for attendance-aware follow-up signals and notification behavior
