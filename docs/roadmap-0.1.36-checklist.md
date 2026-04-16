# 0.1.36 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Schema changes are additive and backward-compatible
- [ ] Account deletion remains request-first and admin-mediated
- [ ] Message cleanup is soft-delete only; no hard-delete path ships in-app
- [ ] Event detail remains usable for non-admin members
- [ ] Re-run `npm run check` and `npm test` as each major slice lands

## a — Directory bio visibility

- [ ] Create `supabase/migrations/037_include_profile_bio_in_member_roster.sql`
- [ ] Update `get_organization_members` to return nullable `bio`
- [ ] Extend `OrganizationMember` with `bio`
- [ ] Update organization roster repository tests for the new shape
- [ ] Add a muted bio preview to `MemberRow.svelte`
- [ ] Add a full bio section to `DirectoryMemberProfile.svelte`
- [ ] Verify empty bio state renders cleanly in both roster and directory views

## b — Account deletion review loop

- [ ] Create `supabase/migrations/038_add_account_deletion_review_fields.sql`
- [ ] Fetch `deletion_requested_at` into current user profile state
- [ ] Show pending-request state in `ProfileDangerZoneCard.svelte`
- [ ] Add admin RPC(s) to list and resolve deletion requests
- [ ] Create `DeletionRequestsCard.svelte`
- [ ] Mount the deletion-requests card in the organization members section
- [ ] Record who reviewed a deletion request and when
- [ ] Verify the requester can no longer submit duplicate requests while one is pending

## c — Event detail admin context

- [ ] Add an admin-only status block to `EventDetailCard.svelte`
- [ ] Show delivery status using `currentHub.getEventDeliveryStatus()`
- [ ] Show reminder summary using `currentHub.getEventReminderSummary()`
- [ ] Reuse `EventAttendanceRosterPanel.svelte` on the event detail route for admins
- [ ] Add a clear “Open in manage” path for deeper editing
- [ ] Verify non-admin members do not see admin-only controls

## d — Message self-delete

- [ ] Create `supabase/migrations/039_soft_delete_messages.sql`
- [ ] Add repository support for soft-deleting a message
- [ ] Extend the message model to preserve deleted placeholders in-thread
- [ ] Add owner-only delete actions in `ThreadPane.svelte`
- [ ] Update `currentMessages` store to reconcile deletion state
- [ ] Verify deleted messages remain in chronological position with placeholder copy
- [ ] Verify a member cannot delete another participant’s message

## e — Coverage and smoke hardening

- [ ] Create `EventDetailCard.test.ts`
- [ ] Create `ContactPicker.test.ts`
- [ ] Create `DirectoryMemberProfile.test.ts`
- [ ] Add deletion-request state tests to `currentUser.test.ts`
- [ ] Add message self-delete tests to `currentMessages.test.ts`
- [ ] Extend `e2e/hub-smoke.spec.ts` to cover event detail navigation
- [ ] Create `e2e/profile-smoke.spec.ts` for bio + deletion request flow
- [ ] Update smoke fixtures for new profile and deletion metadata
- [ ] Verify total test count increases materially over 0.1.35