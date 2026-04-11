# 0.1.7 — Test Coverage & Date Format Consolidation

**Theme:** Close the critical test gaps in repositories and stores, consolidate duplicated date formatting, and add JSDoc to repo helpers.

## Context

0.1.6 hardened error handling (`lastError`/`captureError`) and split large components.
Test coverage remains low: models and services are well-tested, but repositories (0/3), most stores (5/8 untested), and components have zero test coverage.

Four components also duplicate date formatting that already exists in `src/lib/utils/dateFormat.ts`.

Admin mutations use `security definer` RPCs (migrations 008, 009), so no additional RLS policies are needed.

## Slices

### a · Repository integration tests

Mock `getSupabaseClient()` via `vi.mock` and verify each exported function calls the right Supabase method, passes the correct arguments, and surfaces errors via `throwRepositoryError`.

- `profileRepository.test.ts` — auth flows, profile CRUD, avatar upload/delete
- `organizationRepository.test.ts` — context fetch, create, join, invitations, member management
- `hubRepository.test.ts` — broadcasts, events, plugin toggle CRUD

### b · Store unit tests

Test public method state transitions (loading flags, error capture, state reset) with mocked repository imports.

- `toast.svelte.test.ts` — push, dismiss, auto-dismiss timing
- `currentHub.test.ts` — load, toggle, add/remove broadcasts and events
- `currentOrganization.test.ts` — refresh, create, join, invite, member management
- `currentUser.test.ts` — login, register, logout, profile update, reset

### c · Consolidate inline date formatting

Replace inline `formatDate` / `formatDateTime` / `formatEventDate` in 4 hub components with imports from `$lib/utils/dateFormat`.

- `BroadcastEditor.svelte` — replace `formatDate` → `formatShortDate`
- `BroadcastsSection.svelte` — replace `formatDate` → `formatShortDate`
- `EventEditor.svelte` — replace `formatDateTime` → `formatEventDateTime`
- `EventsSection.svelte` — replace `formatEventDate` → `formatEventDateTime`
- `HubOverviewCard.svelte` — replace `formatEventDate` → `formatShortDateTime`

### d · JSDoc for repository helpers

Add JSDoc to private helper functions in `profileRepository.ts`:
`normalizeEmail`, `buildVersionedPublicUrl`, `getAvatarExtension`, `withTimeout`, `withAuthTimeout`

### e · Version bump

`package.json` version → `0.1.7`
