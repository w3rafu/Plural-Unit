# 0.1.36 checklist

## Release-wide product constraints

- [x] Each slice is independently shippable
- [x] Schema changes are additive and backward-compatible
- [x] Account deletion remains request-first and admin-mediated
- [x] Message cleanup is soft-delete only; no hard-delete path ships in-app
- [x] Event detail remains usable for non-admin members
- [x] Re-run `npm run check` and `npm test` as each major slice lands

## a — Directory bio visibility

- [x] Create `supabase/migrations/037_include_profile_bio_in_member_roster.sql`
- [x] Update `get_organization_members` to return nullable `bio`
- [x] Extend `OrganizationMember` with `bio`
- [x] Update organization roster repository tests for the new shape
- [x] Add a muted bio preview to `MemberRow.svelte`
- [x] Add a full bio section to `DirectoryMemberProfile.svelte`
- [x] Verify empty bio state renders cleanly in both roster and directory views

## b — Account deletion review loop

- [x] Create `supabase/migrations/038_add_account_deletion_review_fields.sql`
- [x] Fetch `deletion_requested_at` into current user profile state
- [x] Show pending-request state in `ProfileDangerZoneCard.svelte`
- [x] Add admin RPC(s) to list and resolve deletion requests
- [x] Create `DeletionRequestsCard.svelte`
- [x] Mount the deletion-requests card in the organization members section
- [x] Record who reviewed a deletion request and when
- [x] Verify the requester can no longer submit duplicate requests while one is pending

## c — Event detail admin context

- [x] Add an admin-only status block to `EventDetailCard.svelte`
- [x] Show delivery status using `currentHub.getEventDeliveryStatus()`
- [x] Show reminder summary using `currentHub.getEventReminderSummary()`
- [x] Reuse `EventAttendanceRosterPanel.svelte` on the event detail route for admins
- [x] Add a clear “Open in manage” path for deeper editing
- [x] Verify non-admin members do not see admin-only controls

## d — Message self-delete

- [x] Create `supabase/migrations/039_soft_delete_messages.sql`
- [x] Add repository support for soft-deleting a message
- [x] Extend the message model to preserve deleted placeholders in-thread
- [x] Add owner-only delete actions in `ThreadPane.svelte`
- [x] Update `currentMessages` store to reconcile deletion state
- [x] Verify deleted messages remain in chronological position with placeholder copy
- [x] Verify a member cannot delete another participant’s message

## e — Coverage and smoke hardening

- [x] Create `EventDetailCard.test.ts`
- [x] Create `ContactPicker.test.ts`
- [x] Create `DirectoryMemberProfile.test.ts`
- [x] Add deletion-request state tests to `currentUser.test.ts`
- [x] Add message self-delete tests to `currentMessages.test.ts`
- [x] Extend `e2e/hub-smoke.spec.ts` to cover event detail navigation
- [x] Create `e2e/profile-smoke.spec.ts` for bio + deletion request flow
- [x] Update smoke fixtures for new profile and deletion metadata
- [x] Verify total test count increases materially over 0.1.35
