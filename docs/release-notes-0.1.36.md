# 0.1.36 release notes

**Theme:** Directory presence, deletion ops, event admin context, and message cleanup.

## What shipped

- **Directory bio visibility**
  - `profiles.bio` now saves from profile details and appears in both the organization member roster and directory profile views.
  - The organization member RPC now returns nullable `bio` so roster and directory surfaces stay aligned.

- **Account deletion review loop**
  - Members can request account deletion once and then see a pending state instead of a duplicate destructive CTA.
  - Organization admins now have a pending deletion queue with review metadata instead of an out-of-band-only request write.

- **Event detail admin context**
  - `/hub/event/[eventId]` now surfaces delivery status, reminder summaries, and attendance follow-up for admins without forcing a return to hub manage.

- **Direct-message soft delete**
  - Senders can soft-delete their own messages.
  - Threads keep chronological placeholders instead of removing deleted rows outright.

- **Coverage and smoke hardening**
  - Added focused component/store coverage and smoke coverage for event detail, directory bio rendering, deletion-request state, and message cleanup behavior.

## Required migrations

Apply these in order on any database that predates `0.1.36`:

1. `035_add_profile_bio.sql`
   Adds `public.profiles.bio`.
2. `036_add_account_deletion_request.sql`
   Adds `public.profiles.deletion_requested_at` and the initial `request_account_deletion()` RPC.
3. `037_include_profile_bio_in_member_roster.sql`
   Drops and recreates `get_organization_members(uuid)` so roster payloads include `bio`.
4. `038_add_account_deletion_review_fields.sql`
   Adds `deletion_reviewed_at` and `deletion_reviewed_by`, recreates `request_account_deletion()`, and adds the pending-review RPCs.
5. `039_soft_delete_messages.sql`
   Adds `public.messages.deleted_at` and creates `soft_delete_message(uuid)`.

## Operational notes

- Do not skip `036` just because `038` recreates `request_account_deletion()`; `036` adds the base `deletion_requested_at` column.
- `037` intentionally drops and recreates `get_organization_members(uuid)`. If your environment drifted on grants or `search_path`, reapply the migration instead of patching the function manually.
- `039` is required both for the message delete action and for thread hydration that now reads `messages.deleted_at`.

## Related docs

- Current planning: [docs/roadmap-0.1.37.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.37.md)
- Current execution checklist: [docs/roadmap-0.1.37-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.37-checklist.md)
