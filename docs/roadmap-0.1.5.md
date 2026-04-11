# Plural Unit 0.1.5 Roadmap

This is a revision-only release. No new features are introduced.

The goal is to review the existing codebase for weaknesses, inconsistencies,
missing safety nets, and readability gaps that accumulated during 0.1.1
through 0.1.4.

If you are new to the project, read these first:
- [README.md](/Users/rafa/Desktop/plural-unit/README.md)
- [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md)

For the execution version of this plan, use [roadmap-0.1.5-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.5-checklist.md).

## Release Goal

Improve the reliability, readability, and maintainability of the existing
code without changing user-facing behavior.

This release should:
1. Add missing database indexes for frequently queried columns.
2. Wrap raw Supabase error re-throws with human-readable context.
3. Extract repeated date formatting logic into a shared utility.
4. Fix the one real `any` type in the Select component wrapper.
5. Remove the double type assertion in the organization repository.
6. Extract pure helper functions out of large Svelte script blocks into model files.
7. Split the largest components and stores so each file has one clear job.
8. Add JSDoc to every exported function in repositories, stores, and models.
9. Name magic numbers and add section headings where missing.
10. Add unit tests for new extracted modules.

This release should **not**:
- Add new features or routes.
- Refactor the store architecture or introduce error state properties.
- Change visual layout or component design.
- Extract validation strings into a message constants file (defer to 0.1.6).

## Build Order

Work in this order:

1. Database indexes
2. Repository error wrapping
3. Date formatting utility
4. Type safety fixes
5. Extract member-management helpers from OrganizationMembersCard
6. Extract invitation helpers from OrganizationAccessCard
7. Split authBoundary into focused modules
8. JSDoc and section headings pass
9. Name magic numbers
10. Test coverage expansion

Why this order:
- Indexes are the only change that affects production query performance.
- Error wrapping improves debugging for everything built on top of the repos.
- Date formatting is a quick extraction that removes duplication early.
- Type fixes are small and isolated.
- Helper extraction (slices 5-7) is easier after the utility layer is clean.
- Documentation (slices 8-9) is best written after the modules are stable.
- Tests come last because they validate the code after all other slices land.

## Slice 1: Database Indexes

### Problem

No explicit indexes exist outside of primary keys and unique constraints.
Every RLS policy sub-select on `organization_memberships.profile_id` does a
sequential scan when the table grows. The invitation `token` column is queried
by the accept RPC with no index.

### Changes

Add a single migration (`010_add_performance_indexes.sql`) with:

```sql
create index idx_memberships_profile on public.organization_memberships(profile_id);
create index idx_invitations_org on public.organization_invitations(organization_id);
create index idx_invitations_token on public.organization_invitations(token);
create index idx_broadcasts_org on public.hub_broadcasts(organization_id);
create index idx_events_org on public.hub_events(organization_id);
```

### Why only these five

- `memberships(profile_id)` — used in every RLS policy across four tables.
- `invitations(organization_id)` — used in admin invitation listing.
- `invitations(token)` — used in the accept-invitation RPC.
- `broadcasts(organization_id)` — used in hub loading and RLS.
- `events(organization_id)` — used in hub loading and RLS.

The composite primary key on memberships already covers `(organization_id, profile_id)`,
so `organization_id` alone does not need a separate index.

### Done Means

- Migration file exists and is syntactically valid.
- `supabase db push` or equivalent accepts the migration without error.

## Slice 2: Repository Error Wrapping

### Problem

28 occurrences of `if (error) throw error;` in the three repository files.
These re-throw raw Supabase `PostgrestError` objects with technical messages
like `"new row violates row-level security"`. The UI catches these in
try/catch blocks and shows them in toasts, which is confusing for users.

### Approach

Add a small helper to each repository file (or a shared one in `services/`):

```typescript
function throwRepositoryError(error: unknown, fallback: string): never {
  const message =
    error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error
      ? String((error as { message: string }).message)
      : fallback;
  throw new Error(message);
}
```

Then replace each `if (error) throw error;` with a contextual message:

```typescript
if (error) throwRepositoryError(error, 'Could not load organization members.');
```

### Files To Touch

- `src/lib/repositories/organizationRepository.ts` (13 sites)
- `src/lib/repositories/hubRepository.ts` (8 sites)
- `src/lib/repositories/profileRepository.ts` (7 sites, after auth timeout wrappers)
- Optionally `src/lib/services/repositoryError.ts` if the helper is shared.

### Done Means

- Every `throw error` in the three repository files is replaced.
- Each replacement includes a short fallback message describing the operation.
- Existing toasts still display meaningful text.
- `npm run check` passes.

## Slice 3: Date Formatting Utility

### Problem

At least six components and one model file create `new Date(value)` and call
`.toLocaleDateString()` or `Intl.DateTimeFormat().format()` with overlapping
options. Changes to date display require touching many files.

### Approach

Create `src/lib/utils/dateFormat.ts` with two or three focused functions:

```typescript
export function formatShortDate(value: string): string { ... }
export function formatShortDateTime(value: string): string { ... }
export function formatRelativeDate(value: string): string { ... }  // if needed
```

Then replace the inline formatting calls in:

- `OrganizationMembersCard.svelte` — `formatJoinedAt`
- `OrganizationOverviewCard.svelte` — created-at display
- `PendingInvitationsTable.svelte` — `formatSentAt`
- `EventsSection.svelte` — event date
- `BroadcastsSection.svelte` — broadcast date
- `HubOverviewCard.svelte` — hub date
- `EventEditor.svelte` — event date display
- `BroadcastEditor.svelte` — broadcast date display
- `hubNotifications.ts` — notification timestamps

### Done Means

- No component contains inline `toLocaleDateString` or `Intl.DateTimeFormat` calls.
- All date display goes through the shared utility.
- A small test file (`dateFormat.test.ts`) covers the two or three functions.
- `npm run check` passes.

## Slice 4: Type Safety Fixes

### Problem A — Select component `any`

`src/lib/components/ui/select/select.svelte` uses `: any` for its props
because the bits-ui `Select.Root` generic type is hard to forward.

### Fix A

Replace `: any` with a minimal typed props interface that covers the
properties the component actually uses (`value`, `open`, `type`, `name`,
`onValueChange`, `children`, `class`). Use `Record<string, unknown>` for
the rest-props spread.

### Problem B — Double type assertion

`src/lib/repositories/organizationRepository.ts` line 37 uses:

```typescript
const org = data.organizations as unknown as OrganizationPayload;
```

This is needed because the Supabase join returns a nested object that
TypeScript cannot infer.

### Fix B

Add an explicit return-type generic to the Supabase query, or extract a
small type-guard function that validates the shape at runtime:

```typescript
function toOrganizationPayload(raw: unknown): OrganizationPayload { ... }
```

### Done Means

- No `: any` remains in the `select.svelte` component.
- No `as unknown as` remains in the repository.
- `npm run check` passes.

## Slice 5: Extract Member-Management Helpers

### Problem

`OrganizationMembersCard.svelte` is 425 lines. Its script block contains
12 functions, most of which are pure logic: formatting, admin guards,
confirmation copy generation, and action dispatch. Only the reactive state
(`roleDrafts`, `confirmationOpen`, `pendingAction`) and the template need
to live in the Svelte file.

### Approach

Create `src/lib/models/memberManagementHelpers.ts` and move:

- `formatJoinedVia(member)` — pure text transform
- `formatJoinedAt(value)` — replaced by `dateFormat.ts` after Slice 3
- `formatContact(member)` — pure text transform
- `getMemberInitials(member)` — delegates to `computeAvatarInitials`
- `isLastAdmin(member, adminCount)` — pure boolean guard
- `wouldDemoteLastAdmin(member, draftRole, adminCount)` — pure boolean guard
- `buildRoleConfirmationCopy(action, memberName, currentUser)` — returns
  `{ title, description, details, label, busyLabel, variant }`
- `buildRemoveConfirmationCopy(action, memberName, orgName, currentUser)` — same shape

The component keeps: reactive state, `openRoleConfirmation`, `openRemoveConfirmation`,
`confirmAction`, and the template.

### Files To Touch

- New: `src/lib/models/memberManagementHelpers.ts`
- Edit: `src/lib/components/organization/OrganizationMembersCard.svelte`

### Done Means

- The Svelte script block is under 80 lines.
- Every extracted function is importable and testable.
- No behavior change.
- `npm run check` passes.

## Slice 6: Extract Invitation Helpers

### Problem

`OrganizationAccessCard.svelte` is 391 lines. The script block handles
invitation form submission, resend/revoke confirmation copy, join code
management, and clipboard logic. Confirmation copy generation is pure
logic that does not depend on Svelte.

### Approach

Create `src/lib/models/invitationHelpers.ts` and move:

- `buildResendConfirmationCopy(invitation)` — returns
  `{ title, description, details, label, busyLabel, variant }`
- `buildRevokeConfirmationCopy(invitation)` — same shape
- `validateInviteInput(method, email, phone)` — returns `{ valid, errorTitle, errorDescription }`

Keep in the component: reactive form state, `sendInvite` (orchestrates
store + toast), `copyJoinCode`, `regenerateCode`, and the template.

### Files To Touch

- New: `src/lib/models/invitationHelpers.ts`
- Edit: `src/lib/components/organization/OrganizationAccessCard.svelte`

### Done Means

- The Svelte script block is under 120 lines.
- Every extracted function is importable and testable.
- No behavior change.
- `npm run check` passes.

## Slice 7: Split authBoundary Into Focused Modules

### Problem

`authBoundary.svelte.ts` is 404 lines. It holds:
- Login state fields and derived booleans (~60 lines)
- Email login/register submit methods (~80 lines)
- Phone OTP request/verify/resend methods (~70 lines)
- Forgot-password and reset-password methods (~70 lines)
- Name and organization onboarding methods (~80 lines)
- Lifecycle subscription setup (~40 lines)

A junior developer looking at this file has to read everything to find
the one method they need to change.

### Approach

Split into focused action modules. The store class stays in
`authBoundary.svelte.ts` with reactive state, derived booleans, and
lifecycle wiring. Each group of action methods becomes a dedicated file
that receives the store instance (or relevant fields) as arguments:

```text
src/lib/stores/
  authBoundary.svelte.ts              (state, derived, lifecycle, delegates to actions)
  authBoundaryEmailActions.ts         (onEmailLoginSubmit, onEmailRegisterSubmit)
  authBoundaryPhoneActions.ts         (onRequestCodeSubmit, onVerifyCodeSubmit, resendPhoneCode)
  authBoundaryRecoveryActions.ts      (onForgotPasswordSubmit, onResetPasswordSubmit)
  authBoundaryOnboardingActions.ts    (submitName, submitOrganization)
```

Each action file exports plain async functions. The store class calls them
and updates its own state:

```typescript
async onEmailLoginSubmit() {
  this.isAuthSubmitting = true;
  const result = await executeEmailLogin(this.email, this.password);
  this.loginFeedback = result.feedback;
  this.isAuthSubmitting = false;
}
```

### Done Means

- `authBoundary.svelte.ts` is under 160 lines.
- Each action file is under 100 lines.
- The public API of `authBoundary` is unchanged.
- Components still import from `authBoundary.svelte` with no changes.
- `npm run check` passes.

## Slice 8: JSDoc And Section Headings

### Problem

Exported functions across repositories, stores, and models lack JSDoc.
Section headings (`// ── Section ──`) are used in some repository files
but missing in stores and models. A new developer has to read the
implementation to understand what a function does.

### Approach

Add a one-line JSDoc comment above every exported function in:

- `src/lib/repositories/organizationRepository.ts` (13 exports, section headings exist)
- `src/lib/repositories/hubRepository.ts` (8 exports, section headings exist)
- `src/lib/repositories/profileRepository.ts` (12 exports, needs more section headings)
- `src/lib/stores/currentOrganization.svelte.ts` (needs section headings)
- `src/lib/stores/currentUser.svelte.ts` (needs section headings)
- `src/lib/stores/currentHub.svelte.ts` (small file, quick pass)
- `src/lib/models/authHelpers.ts` (public validators and mappers need JSDoc)
- `src/lib/models/organizationModel.ts` (types have JSDoc, functions do not)
- `src/lib/models/hubNotifications.ts` (no JSDoc)

Also add section headings where missing. Follow the existing pattern:

```typescript
// ── Invitations (admin) ──
```

### Style Rules

- One-line JSDoc for simple functions: `/** Fetch pending invitations for an organization. */`
- Multi-line only if the function has non-obvious parameters or side effects.
- Do not document private helpers inside store classes.
- Do not add `@param` tags unless the name alone is ambiguous.

### Done Means

- Every exported function has a JSDoc comment.
- Every file with more than three exported functions has section headings.
- `npm run check` passes (JSDoc does not affect type checking, but verify nothing broke).

## Slice 9: Name Magic Numbers

### Problem

A few literal numbers appear without explanation:

| File | Value | Context |
|------|-------|---------|
| `profileRepository.ts` | `100` | `storage.list()` page limit |
| `profileRepository.ts` | `10_000` | Already named `AUTH_TIMEOUT_MS` — good |
| `hubNotifications.ts` | Date format options objects repeated twice | Not numbers, but unnamed config |

### Approach

- Replace `limit: 100` with a named constant: `AVATAR_LIST_PAGE_SIZE = 100`
- Extract the repeated `Intl.DateTimeFormat` options in `hubNotifications.ts`
  into a named constant: `NOTIFICATION_DATE_FORMAT`
- Scan for any other unnamed literals introduced during 0.1.4.

### Done Means

- No unexplained numeric literal remains in repository or model files.
- Repeated format option objects are named constants.
- `npm run check` passes.

## Slice 10: Test Coverage Expansion

### Problem

Only model-level and utility-level code has tests today.
After slices 2, 3, 5, and 6 land, several new pure-logic modules exist
that need tests.

### What To Add

1. **`dateFormat.test.ts`** — Cover each formatting function with 3-4 cases:
   valid ISO string, midnight edge, far-future date, invalid input.

2. **`repositoryError.test.ts`** — Cover the error wrapper with:
   Error instance input, plain object with message, string input, null input.

3. **`memberManagementHelpers.test.ts`** — Cover:
   `formatJoinedVia` for each join type, `isLastAdmin` / `wouldDemoteLastAdmin`
   edge cases, confirmation copy builders.

4. **`invitationHelpers.test.ts`** — Cover:
   `validateInviteInput` edge cases, confirmation copy builders for resend and revoke.

### What To Skip For Now

- Repository integration tests (require Supabase mock or test instance).
- Store tests (require Supabase mock and auth context).
- Component tests (require browser test runner).
- authBoundary action tests (depend on mocked auth calls).

These are valuable but need infrastructure work that belongs in a later release.

### Done Means

- All four test files exist and pass.
- `npm test` passes with all new and existing tests.
- No test file was removed or weakened.
