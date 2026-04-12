# 0.1.22 — Shared Surfaces & Demo Harness

**Theme:** turn the new fixture-backed demo routes into a durable review tool, while removing the remaining duplication between live and demo UI surfaces.

## Context

0.1.21 shipped three important pieces:

- denser Messages, Directory, and Hub surfaces
- a refined directory detail view
- fixture-backed `/preview` and `/demo` routes for richer UI review

That release improved visual quality, but it also exposed the next structural gap:

- Messages still uses separate live and demo workspace shells
- Directory list rendering is duplicated between the live route and the demo route
- Hub activity is visually stronger, but the feed is still more informative than actionable
- the new fixture helpers and demo-route shell behavior are useful, but not protected by focused tests

0.1.22 should tighten those edges before more features are layered on top.

## Slices

### a · Shared messages workspace shell

Extract the split-pane Messages workspace into a reusable component so live and demo routes use the same shell layout, empty state, and pane structure.

Goals:

- one shared desktop/mobile messages workspace shell
- live route only owns store wiring
- demo route only owns fixture-backed local state
- no visual drift between `/messages` and `/demo/messages`

Candidate files:

- `src/lib/components/messages/MessageWorkspace.svelte` — new shared shell
- `src/routes/messages/+page.svelte` — switch to shared shell
- `src/lib/components/messages/DemoMessagesWorkspace.svelte` — either slim down or replace
- `src/routes/demo/messages/+page.svelte` — switch to shared shell

### b · Shared directory roster surface

Extract the searchable directory list UI into a shared roster component used by both the live directory and the fixture-backed demo directory.

Goals:

- one shared directory search/summary/list surface
- preserve live route message actions and detail links
- keep demo route read-only where appropriate
- preserve mobile cards + desktop table without duplicating layout code

Candidate files:

- `src/lib/components/directory/DirectoryRoster.svelte` — new shared list surface
- `src/routes/directory/+page.svelte` — switch to shared roster
- `src/routes/demo/directory/+page.svelte` — switch to shared roster

### c · Hub continuity pass

Make the Hub feel more connected to the rest of the product by turning activity cards into clearer next steps instead of passive summaries.

Goals:

- featured activity item should suggest the next place to go
- broadcasts and events sections should feel like part of the same surface system
- demo hub and live hub should stay visually aligned

Potential improvements:

- CTA row or deep-link treatment from featured activity
- tighter metadata hierarchy across activity, broadcasts, and events
- section-level counts and small contextual labels where they add scanning value

Candidate files:

- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`
- `src/routes/hub/+page.svelte`
- `src/routes/demo/hub/+page.svelte`

### d · Demo harness hardening

Protect the new fixture layer with small, focused tests so UI review routes stop being purely manual.

Goals:

- verify fixture helpers return stable counts and member lookup behavior
- verify cloned threads are safe to mutate in demo mode
- verify locked-height shell behavior for demo message/directory routes through extracted route helpers or focused tests

Candidate files:

- `src/lib/demo/uiPreviewFixtures.test.ts` — new tests for counts, lookup, and cloning
- `src/lib/demo/uiPreviewFixtures.ts`
- `src/routes/+layout.svelte` — extract lock-route predicate if needed
- `src/lib/*` helper for shell lock rules, if extraction makes testing cleaner

### e · Version bump

When implementation starts, bump the app version from `0.1.21` to `0.1.22`.
