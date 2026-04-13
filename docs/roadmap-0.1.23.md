# 0.1.23 — Shared Surface Extraction & Stability

**Theme:** finish the shared review surfaces that 0.1.22 outlined, then harden the product contracts those surfaces depend on.

## Status

Completed on 2026-04-12.

- shared `MessageWorkspace.svelte` now backs live and demo Messages
- shared `DirectoryRoster.svelte` now backs live and demo Directory
- member-visible directory loading and root layout locking are explicit and tested
- demo fixture helpers and Hub activity CTA flows are covered and aligned
- app version is now `0.1.23`
- validation passed with `npm run check` and `npm test`

## Context

0.1.21 shipped three important things:

- denser Hub, Directory, and Messages surfaces
- fixture-backed `/preview` and `/demo` routes for richer UI review
- stronger detail views and visual primitives for organization browsing

At planning time, that work had improved the product quickly, but the structural cleanup planned for 0.1.22 was still only partially present in the repo:

- live and demo Messages still render through separate workspace shells
- live and demo Directory routes still duplicate most of the roster UI
- Hub activity looks better, but the feed is still mostly passive instead of action-oriented
- the fixture layer is useful, but still lacks focused test coverage
- the app version was still `0.1.21`

At planning time, there was also one contract mismatch to resolve before more polish stacked on top: `npm run check` passed, but `npm test` failed in `currentOrganization.loadMembers` because the test expected non-admin users to skip member loading while the live directory route already depended on member loading for regular signed-in users.

0.1.23 was scoped to treat that mismatch as a release-planning signal: finish the shared surfaces first, make the access rules explicit, then complete the remaining Hub continuity work.

## Slices

### a · Shared messages workspace extraction

Extract the split-pane Messages experience into a reusable workspace component so live and demo routes use the same shell, empty state, and mobile/desktop behavior.

Goals:

- one shared messages workspace shell for desktop and mobile
- live route owns store wiring and async state only
- demo route owns fixture-backed local state only
- no layout drift between `/messages` and `/demo/messages`
- either slim `DemoMessagesWorkspace.svelte` into a thin state wrapper or remove it entirely

Candidate files:

- `src/lib/components/messages/MessageWorkspace.svelte` — new shared shell
- `src/routes/messages/+page.svelte` — switch to shared shell
- `src/routes/demo/messages/+page.svelte` — switch to shared shell
- `src/lib/components/messages/DemoMessagesWorkspace.svelte` — reduce to adapter or replace

### b · Shared directory roster surface

Extract the searchable directory roster into a shared component so live and demo routes stop duplicating the same summary, search, card, and table rendering.

Goals:

- one shared directory roster surface across live and demo
- preserve live route actions for messaging and member detail links
- keep the demo route read-only where appropriate
- preserve loading, empty, mobile-card, and desktop-table states without forking markup

Candidate files:

- `src/lib/components/directory/DirectoryRoster.svelte` — new shared roster surface
- `src/routes/directory/+page.svelte` — switch to shared roster
- `src/routes/demo/directory/+page.svelte` — switch to shared roster
- `src/lib/models/memberDirectoryModel.ts` — keep display summary helpers aligned with the shared component

### c · Directory access contract and shell-lock hardening

Make the member-loading and locked-layout behavior explicit instead of leaving them split between route assumptions, store behavior, and tests.

Goals:

- decide and document whether `currentOrganization.loadMembers()` is member-visible or admin-only
- align the store and tests with the actual directory access model
- extract the locked-content route predicate from `+layout.svelte` into a small helper
- add focused tests for member loading expectations and locked-route behavior

Candidate files:

- `src/lib/stores/currentOrganization.svelte.ts`
- `src/lib/stores/currentOrganization.test.ts`
- `src/routes/+layout.svelte`
- `src/lib/*` helper for locked content route rules, if extraction makes testing cleaner

### d · Hub activity CTA completion

Finish the Hub continuity pass by turning the featured update and follow-on activity cards into clearer next steps instead of purely informational summaries.

Goals:

- featured activity item should suggest the next place to go
- activity cards should support route-aware CTA copy or destination metadata
- broadcasts and events should feel like part of the same action system
- live Hub and demo Hub should stay visually aligned after the pass

Candidate files:

- `src/lib/models/hubNotifications.ts`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/routes/+page.svelte`
- `src/routes/demo/hub/+page.svelte`

### e · Demo harness coverage and release gate

Add the small, focused tests that keep the fixture-backed review routes dependable while the shared-surface refactor lands.

Goals:

- verify fixture helpers return stable counts and member lookup behavior
- verify cloned preview threads remain independently mutable in demo mode
- rerun focused tests for messages, directory, Hub, and organization stores after the refactor
- bump the app version from `0.1.21` to `0.1.23`

Candidate files:

- `src/lib/demo/uiPreviewFixtures.test.ts` — new fixture tests
- `src/lib/demo/uiPreviewFixtures.ts`
- `package.json`

## Recommended order

1. Shared messages workspace extraction
2. Shared directory roster surface
3. Directory access contract and shell-lock hardening
4. Hub activity CTA completion
5. Demo harness coverage and version bump
