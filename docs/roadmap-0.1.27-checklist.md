# 0.1.27 checklist

## Release-wide product constraints

- [x] Keep touched live surfaces aligned with the denser 0.1.24 spacing and firmer card radius pass
- [x] Keep execution and recovery UI compact, action-first, and grounded in the existing hub manage, alerts, and home shells
- [x] Prefer explicit persisted due-work rows over hidden client-side reconciliation for trusted scheduled behavior
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a - Execution ledger and due-work primitives

- [x] Add schema support for durable scheduled publish and reminder due-work rows
- [x] Extend repositories and stores to load, shape, and update execution ledger state
- [x] Add compact model helpers for due, processed, failed, and skipped execution items
- [x] Reduce reliance on load-time reconciliation where persisted execution rows can be trusted instead
- [x] Add focused tests for execution-row shaping, outcomes, and store hydration

## b - Admin operations queue and recovery actions

- [x] Add a compact admin queue for due, failed, skipped, and recently processed hub work
- [x] Reuse existing hub manage surfaces for retry, run-now, and open-related-content actions
- [x] Keep reminder and scheduled publish recovery behavior consistent across broadcasts and events
- [x] Extend summary copy so recovery counts reflect concrete queue state rather than only derived heuristics
- [x] Add focused tests for admin queue shaping and recovery actions

## c - Materialized reminder alerts and reminder-aware notification identity

- [x] Add support for persisted reminder alert instances or equivalent in-app delivery records
- [x] Extend notification identity so reminder alerts do not collide with publish alerts for the same event
- [x] Make reminder alerts read-aware and preference-aware in the alert tray and member activity surfaces
- [x] Keep the first version limited to in-app alert delivery without expanding the preference matrix to new channels
- [x] Add focused tests for reminder alert derivation, read state, and filtered notification behavior

## d - Upcoming commitments and reply-needed member view

- [x] Surface a compact member view for reply-needed events and upcoming commitments
- [x] Reuse existing RSVP, reminder, and notification data instead of building a separate planner model
- [x] Keep member-facing copy compact and task-first on the home and hub surfaces
- [x] Avoid attendance check-in, guest flows, or full personal calendar management in this slice
- [x] Add focused tests for commitment grouping, reply-needed states, and touched member surfaces