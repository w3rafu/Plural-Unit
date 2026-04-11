# Plural Unit 0.1.5 Checklist

This checklist turns the `0.1.5` roadmap into small execution slices.

Read these first:
- [docs/roadmap-0.1.5.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.5.md)
- [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md)

## 0.1.5-a Database Indexes

- [x] Create `supabase/migrations/010_add_performance_indexes.sql`.
- [x] Add index on `organization_memberships(profile_id)`.
- [x] Add index on `organization_invitations(organization_id)`.
- [x] Add index on `organization_invitations(token)`.
- [x] Add index on `hub_broadcasts(organization_id)`.
- [x] Add index on `hub_events(organization_id)`.
- [x] Verify migration is syntactically valid.

## 0.1.5-b Repository Error Wrapping

- [x] Create `src/lib/services/repositoryError.ts` with a `throwRepositoryError` helper.
- [x] Add `repositoryError.test.ts` with cases for Error, plain object, string, and null inputs.
- [x] Replace all 14 `throw error` sites in `organizationRepository.ts`.
- [x] Replace all 9 sites in `hubRepository.ts`.
- [x] Replace all sites in `profileRepository.ts`.
- [x] Each replacement has a short, human-readable fallback message.
- [x] Run `npm run check`.
- [x] Run `npm test`.

## 0.1.5-c Date Formatting Utility

- [x] Create `src/lib/utils/dateFormat.ts` with `formatShortDate`, `formatShortDateTime`, `formatEventDateTime`.
- [x] Add `dateFormat.test.ts` covering valid ISO, midnight edge, far-future, and invalid inputs.
- [x] Replace inline formatting in `OrganizationMembersCard.svelte`.
- [x] Replace inline formatting in `OrganizationOverviewCard.svelte`.
- [x] Replace inline formatting in `PendingInvitationsTable.svelte`.
- [x] Replace inline formatting in `hubNotifications.ts` (2 call sites).
- [x] Run `npm run check`.
- [x] Run `npm test`.

Note: EventsSection, BroadcastsSection, HubOverviewCard, EventEditor, BroadcastEditor
did not exist as separate files — those hub components were not present.

## 0.1.5-d Type Safety Fixes

- [x] Added comment explaining why `: any` is necessary in `select.svelte` (bits-ui union type).
- [x] Added comment explaining `as unknown as` FK-join assertion in `organizationRepository.ts`.
- [x] Run `npm run check`.

Note: The `: any` in select.svelte cannot be removed because bits-ui's Root component uses
a union type (single | multiple) that cannot be narrowed in a wrapper. The `as unknown as`
in organizationRepository is required because Supabase types the to-one FK join as an array.

## 0.1.5-e Extract Member-Management Helpers

- [x] Create `src/lib/models/memberManagementHelpers.ts`.
- [x] Move `formatJoinedVia`, `formatJoinedAt`, `formatContact`, `getMemberInitials`.
- [x] Move `isLastAdmin`, `wouldDemoteLastAdmin` (now accept explicit parameters).
- [x] Move confirmation copy builders (6 functions + `PendingMemberAction` type).
- [x] Update `OrganizationMembersCard.svelte` to import from the new module.
- [x] Script block reduced from ~238 to ~130 lines.
- [x] Run `npm run check`.

## 0.1.5-f Extract Invitation Helpers

- [x] Create `src/lib/models/invitationHelpers.ts`.
- [x] Move confirmation copy builders (6 functions + `PendingInviteAction` type).
- [x] Update `OrganizationAccessCard.svelte` to import from the new module.
- [x] Component reduced from 391 to 343 lines.
- [x] Run `npm run check`.

## 0.1.5-g authBoundary Submit Guards

- [x] Added `beginSubmit()` / `endSubmit()` private helpers.
- [x] Replaced repeated 4-line guard pattern in all 6 submit methods.
- [x] Public API of `authBoundary` is unchanged — no component edits required.
- [x] Run `npm run check`.

Note: Splitting into 4 separate action files was not practical because every method
mutates reactive `$state` via `this`. The submit guard pattern eliminates boilerplate
and removes a class of early-return bugs instead.

## 0.1.5-h JSDoc And Section Headings

- [x] Add JSDoc to every exported function in `organizationRepository.ts` (14 functions + 1 type).
- [x] Add JSDoc to every exported function in `hubRepository.ts` (11 functions + 3 types).
- [x] Add JSDoc to types in `organizationModel.ts` (4 types + 1 alias).
- [x] Add JSDoc to `hubNotifications.ts` (1 type + 1 function).
- [x] Add JSDoc to `userModel.ts` (`INITIAL_DETAILS` const).
- [x] Add JSDoc to `unsavedChanges.ts` (2 functions).
- [x] Add JSDoc to `memberManagementHelpers.ts` (1 type + 7 functions).
- [x] Add JSDoc to `invitationHelpers.ts` (1 type + 6 functions).
- [x] Run `npm run check`.

## 0.1.5-i Name Magic Numbers

- [x] Replace `limit: 100` in `profileRepository.ts` with `AVATAR_LIST_PAGE_SIZE`.
- [x] Replace `slice(0, 5)` in `HubActivityFeed.svelte` with `MAX_VISIBLE_ACTIVITY_ITEMS`.
- [x] Date format options already extracted to `dateFormat.ts` in slice c.
- [x] Run `npm run check`.

## 0.1.5-j Test Coverage Expansion

- [x] Create `memberManagementHelpers.test.ts` — 18 tests covering formatters, admin guards, and copy builders.
- [x] Create `invitationHelpers.test.ts` — 11 tests covering copy builders.
- [x] Confirm `dateFormat.test.ts` exists and passes (10 tests from slice c).
- [x] Confirm `repositoryError.test.ts` exists and passes (7 tests from slice b).
- [x] Run `npm test` — 150 tests across 15 files, all pass.

## Cross-Cutting Checks

- [x] No new UI changes were introduced.
- [x] No new routes were added.
- [x] All existing tests still pass.
- [x] `npm run check` passes with zero errors.
- [x] Light and dark mode were not affected.

## Release Sign-Off

- [x] All ten slices complete.
- [x] `npm run check` passes (0 errors, 0 warnings).
- [x] `npm test` passes (150/150).
- [x] No behavior change visible to users.
- [ ] A new developer can read any file and understand its purpose without jumping to other files.
