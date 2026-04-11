# 0.1.6 checklist

## Pre-work — Responsive card-grid layout
- [x] `.card-grid` utility in `layout.css` (auto-fit, 1→2→3 columns)
- [x] Applied to `LoginForm.svelte`
- [x] Applied to `hub/+page.svelte` plugin sections
- [x] Applied to `hub/manage/content/+page.svelte`

## a · Store error state
- [x] `currentUser.svelte.ts` — add `lastError`, `clearError()`, wrap async methods
- [x] `currentOrganization.svelte.ts` — add `lastError`, `clearError()`, wrap async methods
- [x] `currentHub.svelte.ts` — add `lastError`, `clearError()`, wrap async methods

## b · Split OrganizationMembersCard
- [x] Create `MemberRow.svelte` (avatar, name, role select, remove button)
- [x] Slim down `OrganizationMembersCard.svelte` to use `MemberRow`

## c · Split OrganizationAccessCard
- [x] Create `InviteForm.svelte` (channel toggle, input, send)
- [x] Slim down `OrganizationAccessCard.svelte` to use `InviteForm`

## d · Split ProfileDetailsCard
- [x] Create `ProfileAvatarSection.svelte` (upload, preview, remove)
- [x] Slim down `ProfileDetailsCard.svelte` to use `ProfileAvatarSection`

## e · Hub admin accessibility
- [x] Delete buttons already have visible text — no changes needed

## f · Store reset on logout
- [x] `currentUser.svelte.ts` — call org/hub reset on sign-out
- [x] `currentOrganization.svelte.ts` — add `reset()` method
- [x] `currentHub.svelte.ts` — add `reset()` method

## g · `updated_at` timestamps
- [x] Create `011_add_updated_at.sql` — add column + trigger to 6 tables

## h · Test coverage expansion
- [x] Add `test:coverage` script to `package.json`
- [x] Install `@vitest/coverage-v8`
- [x] Add `avatarUploadModel.test.ts` — 12 tests for `computeAvatarInitials` and `validateAvatarFile`

## i · Version bump
- [x] `package.json` version → `0.1.6`
