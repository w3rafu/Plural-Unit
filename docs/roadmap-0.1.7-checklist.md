# 0.1.7 checklist

## a · Repository integration tests
- [x] `profileRepository.test.ts` — 31 tests: auth, profile CRUD, avatar upload/delete
- [x] `organizationRepository.test.ts` — 30 tests: context, create, join, invitations, members
- [x] `hubRepository.test.ts` — 17 tests: broadcasts, events, plugin toggles

## b · Store unit tests
- [x] `toast.svelte.test.ts` — 9 tests: push, dismiss, auto-dismiss
- [x] `currentHub.test.ts` — 9 tests: load, toggle, CRUD, reset
- [x] `currentOrganization.test.ts` — 17 tests: refresh, create, join, invites, members
- [x] `currentUser.test.ts` — 17 tests: login, register, logout, profile

## c · Consolidate inline date formatting
- [x] `BroadcastEditor.svelte` — use `formatShortDate`
- [x] `BroadcastsSection.svelte` — use `formatShortDate`
- [x] `EventEditor.svelte` — use `formatEventDateTime`
- [x] `EventsSection.svelte` — use `formatEventDateTime`
- [x] `HubOverviewCard.svelte` — use `formatShortDateTime`

## d · JSDoc for repository helpers
- [x] `profileRepository.ts` — normalizeEmail, buildVersionedPublicUrl, getAvatarExtension, withTimeout, withAuthTimeout

## e · Version bump
- [x] `package.json` version → `0.1.7`
