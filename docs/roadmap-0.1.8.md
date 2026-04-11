# 0.1.8 Roadmap

Two workstreams: simplify the organization page and prepare the messaging data layer.

## Slice a — Simplify organization page layout

Remove OrganizationSummaryCard (redundant with OrganizationOverviewCard).
Promote the section selector to be the first element after PageHeader.
Move member count + pending invites stats into the OrganizationOverviewCard so that
admin context is still available at a glance.

Files changed:
- `src/routes/organization/+layout.svelte` — remove SummaryCard import/render
- `src/lib/components/organization/OrganizationSummaryCard.svelte` — delete file
- `src/lib/components/organization/OrganizationOverviewCard.svelte` — add member count + invites stats for admins

## Slice b — Message tables migration (012)

Port the CommunionLink message schema to plural-unit:
- `message_contacts` — contact entities (demo + profile-linked)
- `message_threads` — per-user thread ownership
- `messages` — text & image messages
- RLS policies + security definer RPCs
- Storage bucket for message images
- Demo contact seed + demo thread functions
- Profile thread function

File: `supabase/migrations/012_create_message_tables.sql`

## Slice c — Message model + types

Port `messageModel.ts` with all domain types and pure helpers.

File: `src/lib/models/messageModel.ts`

## Slice d — Message repository

Port `supabaseMessageRepository.ts` adapted to plural-unit's repository conventions
(uses `throwRepositoryError`, `withRetry` from `$lib/services/*`).

File: `src/lib/repositories/messageRepository.ts`

## Slice e — Messages store

Port `currentMessages.svelte.ts` using Svelte 5 runes, matching existing store
patterns (like `currentHub.svelte.ts`).

File: `src/lib/stores/currentMessages.svelte.ts`

## Slice f — Version bump 0.1.7 → 0.1.8
