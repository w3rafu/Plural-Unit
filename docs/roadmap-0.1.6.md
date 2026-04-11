# 0.1.6 — Resilience & modularity

**Theme**: Harden error handling, break apart large components, fill accessibility gaps, and raise test coverage.

No new features — this release makes the existing surface more robust and easier to work on.

---

## Pre-work (completed)

### Responsive card-grid layout

Global `.card-grid` CSS Grid utility in `layout.css`. Uses `auto-fit` with `minmax(20rem, 1fr)` — cards flow as a row and wrap naturally from 3 → 2 → 1 columns as the viewport narrows. `align-items: start` keeps natural card heights. `.card-grid-wide` modifier spans all columns.

Applied to: `LoginForm.svelte`, `hub/+page.svelte` (plugin sections), `hub/manage/content/+page.svelte`.

---

## Slices

### a · Store error state

Add a `lastError` property and a `clearError()` method to the three data stores (`currentUser`, `currentOrganization`, `currentHub`). Each async method resets `lastError` before work and captures failures so the UI can display them declaratively instead of relying on try/catch.

**Files**: `currentUser.svelte.ts`, `currentOrganization.svelte.ts`, `currentHub.svelte.ts`

---

### b · Split OrganizationMembersCard (318 → ~170 + ~150)

Extract a presentational `MemberRow` component for the per-member row (avatar badge, name, role select, remove button). The parent keeps the list, loading state, and confirmation modal.

**Files**: `OrganizationMembersCard.svelte`, new `MemberRow.svelte`

---

### c · Split OrganizationAccessCard (343 → ~190 + ~160)

Extract `InviteForm` (channel toggle, email/phone input, send button) into its own component. The parent keeps the pending-invitations table and join-code section.

**Files**: `OrganizationAccessCard.svelte`, new `InviteForm.svelte`

---

### d · Split ProfileDetailsCard (315 → ~170 + ~150)

Extract `ProfileAvatarSection` (upload, preview, remove). The parent keeps the name/phone fields and save button.

**Files**: `ProfileDetailsCard.svelte`, new `ProfileAvatarSection.svelte`

---

### e · Hub admin accessibility

Add `aria-label` to the icon-only delete buttons in `BroadcastEditor` and `EventEditor`. Add `role="status"` to inline feedback banners where missing.

**Files**: `BroadcastEditor.svelte`, `EventEditor.svelte`

---

### f · Store reset on logout

When `currentUser` signs out, auto-clear `currentOrganization` and `currentHub` so stale data from a previous session is never shown.

**Files**: `currentUser.svelte.ts`, `currentOrganization.svelte.ts`, `currentHub.svelte.ts`

---

### g · `updated_at` timestamps

Add an `updated_at` column (default `now()`, auto-updated via trigger) to `profiles`, `organizations`, `organization_memberships`, `organization_invitations`, `hub_broadcasts`, and `hub_events`.

**Files**: new `supabase/migrations/011_add_updated_at.sql`

---

### h · Test coverage expansion

1. Add store integration tests for the `currentUser → currentOrganization` load flow.
2. Add unit tests for any new extracted components (`MemberRow`, `InviteForm`, `ProfileAvatarSection`) — at minimum, verify they render without errors.
3. Add `vitest --coverage` script to `package.json`.

**Files**: new test files, `package.json`

---

### i · Version bump

Update `package.json` version from `0.1.3` to `0.1.6`.

**Files**: `package.json`

---

## Out of scope

- Messages / inbox feature (separate milestone)
- Bulk member operations (0.1.7 candidate)
- Audit log table (0.1.7 candidate)
- Request deduplication / caching (0.1.7 candidate)
- Notification preferences (0.1.7 candidate)
