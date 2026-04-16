# 0.1.36 — Directory Presence, Deletion Ops, Event Admin Context, and Message Cleanup

**Theme:** Finish the loops opened in 0.1.35 by making profile presence visible across the organization, giving admins a real offboarding queue, bringing admin context into the new event detail route, and adding basic message cleanup.

## Status

Not started.

## Product constraints

- keep each slice independently shippable
- keep all schema changes additive and backward-compatible
- account deletion remains request-first and admin-mediated; no destructive delete path from the member UI
- message cleanup must be soft-delete only so realtime sync and auditability stay intact
- event detail must continue to work for members without pulling in the full hub-manage surface
- do not break smoke mode or the existing directory-initiated messaging flow

## Context

What exists today (after 0.1.35):

- **Event detail** — members can open `/hub/event/[eventId]`, review title/description/date/location, RSVP, and export to calendar. But the page is still member-centric: admins do not see delivery status, reminder plan, or attendance operations there, so they still have to bounce back into hub manage.
- **Messaging** — inbox compose and body search now exist, and users can open a thread from the messages route or directory. But messages are still append-only; there is no way to retract a mistaken send or hide sensitive content after the fact.
- **Profile** — members can edit a bio and request account deletion. But `bio` does not flow through the organization member shape or directory UI, and `deletion_requested_at` is only written, not surfaced back to the requester or to admins who need to process it.
- **Organization admin** — member management already lives under `/organization` and is the natural place for offboarding operations. But there is no queue or review surface for pending deletion requests.
- **Quality** — 750 tests pass, but the newly added 0.1.35 surfaces still lack focused component/store tests and smoke coverage.

What's missing:

- profile bios are editable but not visible anywhere useful outside the member's own profile page
- deletion requests stop at the write path and do not create an admin workflow
- the event detail route does not yet reduce admin context switching
- direct messaging has no cleanup/retraction affordance
- 0.1.35 feature coverage is still thinner than the rest of the app

## Recommended features

### a — Directory bio visibility

Make the new bio field visible in the organization and directory surfaces that actually need member context.

Goals:

- extend the organization member shape to include nullable `bio`
- update the `get_organization_members` RPC so bio travels with the roster
- show a truncated bio in the admin member roster where it improves scanning
- show the full bio in the directory member profile view
- keep empty-bio behavior quiet and additive

Candidate files:

- `supabase/migrations/037_include_profile_bio_in_member_roster.sql` (new)
- `src/lib/models/organizationModel.ts`
- `src/lib/repositories/organizationRepository.ts`
- `src/lib/repositories/organizationRepository.test.ts`
- `src/lib/components/organization/MemberRow.svelte`
- `src/lib/components/directory/DirectoryMemberProfile.svelte`

Implementation sketch:

- Update the roster RPC to select `profiles.bio` alongside existing profile fields.
- Extend `OrganizationMember` with `bio: string | null`.
- In `MemberRow.svelte`, render a muted one-line preview below contact details when bio exists.
- In `DirectoryMemberProfile.svelte`, add a dedicated card/section for the full bio with a simple empty-state fallback.

### b — Account deletion review loop

Turn the existing member deletion request into an actual admin-operated workflow.

Goals:

- fetch `deletion_requested_at` into current user state so the requester sees their request status
- replace the danger-zone CTA with a pending state after a request is submitted
- add an admin queue for pending deletion requests inside the organization members section
- let admins mark requests as reviewed/resolved without hard-deleting data in-app
- keep a minimal audit trail for who reviewed the request and when

Candidate files:

- `supabase/migrations/038_add_account_deletion_review_fields.sql` (new)
- `src/lib/models/userModel.ts`
- `src/lib/repositories/profileRepository.ts`
- `src/lib/stores/currentUser.svelte.ts`
- `src/lib/components/profile/ProfileDangerZoneCard.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/DeletionRequestsCard.svelte` (new)

Implementation sketch:

- Add nullable review metadata to `profiles` such as `deletion_reviewed_at` and `deletion_reviewed_by`.
- Extend profile fetches so the requester can see `deletion_requested_at` and the UI can swap the destructive button for a non-destructive status panel.
- Add admin RPC(s) to list and resolve pending requests.
- Render a compact deletion-requests panel under the members section so offboarding sits next to the roster it affects.

### c — Event detail admin context

Make the new event detail route useful for admins, not just members.

Goals:

- surface delivery status and reminder summary on the event detail page for admins
- reuse the existing attendance roster tooling from hub manage instead of duplicating it
- expose a direct path from event detail to any relevant manage action when deeper editing is needed
- keep the member-facing detail view lean and unchanged for non-admins

Candidate files:

- `src/lib/components/hub/member/EventDetailCard.svelte`
- `src/routes/hub/event/[eventId]/+page.svelte`
- `src/lib/components/hub/admin/EventAttendanceRosterPanel.svelte`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/member/hubActivityModel.ts`

Implementation sketch:

- Add an admin-only section below the member detail content.
- Reuse `currentHub.getEventReminderSummary()` and `currentHub.getEventDeliveryStatus()` to show the queued/published/reminder state in plain language.
- Mount `EventAttendanceRosterPanel` directly on the detail route for admins when the event is in a state that supports roster review.
- Keep one clear “Open in manage” escape hatch rather than rebuilding the full editor there.

### d — Message self-delete

Give members a basic way to clean up their own direct-message mistakes.

Goals:

- allow a member to soft-delete their own sent messages
- preserve the thread timeline with a “message deleted” placeholder instead of removing rows outright
- sync deletions across open threads without a hard refresh
- prevent deleting other participants' messages

Candidate files:

- `supabase/migrations/039_soft_delete_messages.sql` (new)
- `src/lib/repositories/messageRepository.ts`
- `src/lib/models/messageModel.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/stores/currentMessages.test.ts`

Implementation sketch:

- Add `deleted_at` and any minimal metadata needed to represent a soft-deleted message.
- Extend message mapping so deleted entries remain in the thread with a placeholder body/state.
- Add a small per-message action for owner-sent messages only.
- Apply optimistic local updates, then reconcile through the existing refresh/realtime paths.

### e — Coverage and smoke hardening

Bring the new surfaces up to the repo’s usual coverage bar before adding more breadth.

Goals:

- add focused tests for event detail, contact picker, deletion-request state, and directory bio rendering
- add smoke coverage for the event detail route and deletion-request flow
- verify the new admin event/detail and deletion queue surfaces work in smoke mode
- run `npm run check` alongside tests as each slice lands

Candidate files:

- `src/lib/components/hub/member/EventDetailCard.test.ts` (new)
- `src/lib/components/messages/ContactPicker.test.ts` (new)
- `src/lib/components/directory/DirectoryMemberProfile.test.ts` (new)
- `src/lib/stores/currentUser.test.ts`
- `src/lib/stores/currentMessages.test.ts`
- `e2e/hub-smoke.spec.ts`
- `e2e/profile-smoke.spec.ts` (new)
- `src/lib/demo/smokeFixtures.ts`
- `docs/roadmap-0.1.36-checklist.md`

Implementation sketch:

- Add direct component tests for the 0.1.35 additions that still have no targeted coverage.
- Add at least one smoke path that exercises event detail navigation and one that verifies deletion-request UI state without hitting a real backend.
- Fold admin-only branches into component tests where smoke coverage would be too expensive.