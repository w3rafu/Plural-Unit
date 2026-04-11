# Plural Unit 0.1.5 Checklist

This checklist turns the `0.1.5` roadmap into small execution slices.

Read these first:
- [docs/roadmap-0.1.5.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.5.md)
- [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md)

## 0.1.5-a Database Indexes

- [ ] Create `supabase/migrations/010_add_performance_indexes.sql`.
- [ ] Add index on `organization_memberships(profile_id)`.
- [ ] Add index on `organization_invitations(organization_id)`.
- [ ] Add index on `organization_invitations(token)`.
- [ ] Add index on `hub_broadcasts(organization_id)`.
- [ ] Add index on `hub_events(organization_id)`.
- [ ] Verify migration is syntactically valid.

## 0.1.5-b Repository Error Wrapping

- [ ] Create `src/lib/services/repositoryError.ts` with a `throwRepositoryError` helper.
- [ ] Add `repositoryError.test.ts` with cases for Error, plain object, string, and null inputs.
- [ ] Replace all 13 `if (error) throw error` sites in `organizationRepository.ts`.
- [ ] Replace all 8 sites in `hubRepository.ts`.
- [ ] Replace all 7 sites in `profileRepository.ts`.
- [ ] Each replacement has a short, human-readable fallback message.
- [ ] Run `npm run check`.
- [ ] Run `npm test`.

## 0.1.5-c Date Formatting Utility

- [ ] Create `src/lib/utils/dateFormat.ts` with `formatShortDate` and `formatShortDateTime`.
- [ ] Add `dateFormat.test.ts` covering valid ISO, midnight edge, far-future, and invalid inputs.
- [ ] Replace inline formatting in `OrganizationMembersCard.svelte`.
- [ ] Replace inline formatting in `OrganizationOverviewCard.svelte`.
- [ ] Replace inline formatting in `PendingInvitationsTable.svelte`.
- [ ] Replace inline formatting in `EventsSection.svelte`.
- [ ] Replace inline formatting in `BroadcastsSection.svelte`.
- [ ] Replace inline formatting in `HubOverviewCard.svelte`.
- [ ] Replace inline formatting in `EventEditor.svelte`.
- [ ] Replace inline formatting in `BroadcastEditor.svelte`.
- [ ] Replace inline formatting in `hubNotifications.ts`.
- [ ] Run `npm run check`.
- [ ] Run `npm test`.

## 0.1.5-d Type Safety Fixes

- [ ] Replace `: any` in `src/lib/components/ui/select/select.svelte` with a typed props interface.
- [ ] Remove `as unknown as` in `organizationRepository.ts` with a type-guard or query generic.
- [ ] Run `npm run check`.

## 0.1.5-e Extract Member-Management Helpers

- [ ] Create `src/lib/models/memberManagementHelpers.ts`.
- [ ] Move `formatJoinedVia`, `formatContact`, `getMemberInitials` out of the component.
- [ ] Move `isLastAdmin`, `wouldDemoteLastAdmin` out of the component.
- [ ] Move confirmation copy builders (`buildRoleConfirmationCopy`, `buildRemoveConfirmationCopy`).
- [ ] Update `OrganizationMembersCard.svelte` to import from the new module.
- [ ] Svelte script block should be under 80 lines after extraction.
- [ ] Run `npm run check`.

## 0.1.5-f Extract Invitation Helpers

- [ ] Create `src/lib/models/invitationHelpers.ts`.
- [ ] Move `buildResendConfirmationCopy` and `buildRevokeConfirmationCopy` out of the component.
- [ ] Move `validateInviteInput` out of the component.
- [ ] Update `OrganizationAccessCard.svelte` to import from the new module.
- [ ] Svelte script block should be under 120 lines after extraction.
- [ ] Run `npm run check`.

## 0.1.5-g Split authBoundary

- [ ] Create `src/lib/stores/authBoundaryEmailActions.ts` with email login/register functions.
- [ ] Create `src/lib/stores/authBoundaryPhoneActions.ts` with OTP request/verify/resend functions.
- [ ] Create `src/lib/stores/authBoundaryRecoveryActions.ts` with forgot/reset password functions.
- [ ] Create `src/lib/stores/authBoundaryOnboardingActions.ts` with name/organization submit functions.
- [ ] Update `authBoundary.svelte.ts` to delegate to the action modules.
- [ ] `authBoundary.svelte.ts` should be under 160 lines after split.
- [ ] Each action file should be under 100 lines.
- [ ] Public API of `authBoundary` is unchanged — no component edits required.
- [ ] Run `npm run check`.

## 0.1.5-h JSDoc And Section Headings

- [ ] Add JSDoc to every exported function in `organizationRepository.ts`.
- [ ] Add JSDoc to every exported function in `hubRepository.ts`.
- [ ] Add JSDoc to every exported function in `profileRepository.ts`.
- [ ] Add section headings to `profileRepository.ts` where missing.
- [ ] Add JSDoc and section headings to `currentOrganization.svelte.ts`.
- [ ] Add JSDoc and section headings to `currentUser.svelte.ts`.
- [ ] Add JSDoc to `currentHub.svelte.ts`.
- [ ] Add JSDoc to public validators and mappers in `authHelpers.ts`.
- [ ] Add JSDoc to exported functions in `organizationModel.ts`.
- [ ] Add JSDoc to `hubNotifications.ts`.
- [ ] Add JSDoc to new files from slices 5-7.
- [ ] Run `npm run check`.

## 0.1.5-i Name Magic Numbers

- [ ] Replace `limit: 100` in `profileRepository.ts` with `AVATAR_LIST_PAGE_SIZE`.
- [ ] Extract repeated date format options in `hubNotifications.ts` into a named constant.
- [ ] Scan for any other unnamed literals introduced during 0.1.4.
- [ ] Run `npm run check`.

## 0.1.5-j Test Coverage Expansion

- [ ] Create `memberManagementHelpers.test.ts` covering formatters, admin guards, and copy builders.
- [ ] Create `invitationHelpers.test.ts` covering validation and copy builders.
- [ ] Confirm `dateFormat.test.ts` exists and passes (from slice c).
- [ ] Confirm `repositoryError.test.ts` exists and passes (from slice b).
- [ ] Run `npm test` — all new and existing tests pass.

## Cross-Cutting Checks

These apply to every 0.1.5 slice:

- [ ] No new UI changes were introduced.
- [ ] No new routes were added.
- [ ] All existing tests still pass.
- [ ] `npm run check` passes with zero errors.
- [ ] Light and dark mode were not affected (spot check only).

## Release Sign-Off

Do not call `0.1.5` complete until:

- [ ] All ten slices are done or intentionally deferred.
- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] No behavior change is visible to users.
- [ ] A new developer can read any file and understand its purpose without jumping to other files.
