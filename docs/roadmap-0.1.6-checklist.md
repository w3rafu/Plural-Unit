# 0.1.6 checklist

## a · Store error state
- [ ] `currentUser.svelte.ts` — add `lastError`, `clearError()`, wrap async methods
- [ ] `currentOrganization.svelte.ts` — add `lastError`, `clearError()`, wrap async methods
- [ ] `currentHub.svelte.ts` — add `lastError`, `clearError()`, wrap async methods

## b · Split OrganizationMembersCard
- [ ] Create `MemberRow.svelte` (avatar, name, role select, remove button)
- [ ] Slim down `OrganizationMembersCard.svelte` to use `MemberRow`

## c · Split OrganizationAccessCard
- [ ] Create `InviteForm.svelte` (channel toggle, input, send)
- [ ] Slim down `OrganizationAccessCard.svelte` to use `InviteForm`

## d · Split ProfileDetailsCard
- [ ] Create `ProfileAvatarSection.svelte` (upload, preview, remove)
- [ ] Slim down `ProfileDetailsCard.svelte` to use `ProfileAvatarSection`

## e · Hub admin accessibility
- [ ] `BroadcastEditor.svelte` — aria-label on delete button
- [ ] `EventEditor.svelte` — aria-label on delete button
- [ ] Add `role="status"` to feedback banners where missing

## f · Store reset on logout
- [ ] `currentUser.svelte.ts` — call org/hub reset on sign-out
- [ ] `currentOrganization.svelte.ts` — add `reset()` method
- [ ] `currentHub.svelte.ts` — add `reset()` method

## g · `updated_at` timestamps
- [ ] Create `011_add_updated_at.sql` — add column + trigger to 6 tables

## h · Test coverage expansion
- [ ] Store integration tests (user → org load flow)
- [ ] Component render tests for new split components
- [ ] Add `test:coverage` script to `package.json`

## i · Version bump
- [ ] `package.json` version → `0.1.6`
