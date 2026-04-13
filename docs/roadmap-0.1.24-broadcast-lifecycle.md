# 0.1.24 slice scope - Broadcast lifecycle controls

## Goal

Make broadcasts manageable after publishing so admins can edit, pin, archive, restore, and expire live updates without deleting and reposting content.

## Status

Implemented in code on 2026-04-12.

- admin broadcast editing, pinning, archiving, restoring, and optional expiry are live in `BroadcastEditor.svelte`
- member broadcast cards now show active content only, with pinned broadcasts first and expiry context where relevant
- the hub activity feed now prioritizes pinned broadcasts and ignores inactive broadcast history
- validation passed with `npm run check` and `npm test`
- `015_add_hub_broadcast_lifecycle.sql` is applied

## Product decisions

- only one broadcast can be pinned at a time for an organization
- archived broadcasts leave the live member view but remain available to admins for restoration or deletion
- expired broadcasts also leave the live member view and can be restored back to an unexpired live state
- the first version keeps broadcast history inside the existing admin editor instead of adding a separate archive screen
- the member-facing surface remains compact and read-first; lifecycle controls stay admin-only

## UI constraints

- keep the editor denser than the pre-0.1.24 card baseline
- avoid tall stacks of one-action buttons inside each published broadcast row
- use status badges and short metadata lines instead of extra explanatory paragraphs
- make live versus inactive state legible without adding a second full-width management panel

## Data model

Migration added in `015_add_hub_broadcast_lifecycle.sql`:

- `is_pinned boolean not null default false`
- `archived_at timestamptz`
- `expires_at timestamptz`
- supporting indexes on organization plus pinned, archived, and expiry fields
- updated member select policy so non-admin readers only see active broadcasts

## Repository and store changes

Implemented in `src/lib/repositories/hubRepository.ts`:

- `BroadcastRow` now includes `updated_at`, `is_pinned`, `archived_at`, and `expires_at`
- `updateBroadcast(...)`
- `setBroadcastPinned(...)`
- `archiveBroadcast(...)`
- `restoreBroadcast(...)`

Implemented in `src/lib/stores/currentHub.svelte.ts`:

- `activeBroadcasts` and `inactiveBroadcasts` derived accessors
- `broadcastTargetId` pending state tracking for admin actions
- store actions for update, pin or unpin, archive, restore, and delete flows
- hub activity feed now derives from active broadcasts only

## Member and admin surface changes

Admin surface:

- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- compact create or edit form with optional expiry input
- live broadcast list with edit, pin or unpin, archive, and delete actions
- inactive history list with restore and delete actions

Member surface:

- `src/lib/components/hub/member/BroadcastsSection.svelte`
- pinned broadcasts sort first
- optional expiry state is surfaced in compact badge and metadata copy
- inactive broadcasts are removed from the member list

Related hub summary updates:

- `src/lib/components/hub/admin/HubManageSummaryCard.svelte` now counts live content instead of all stored broadcasts
- `src/lib/models/hubNotifications.ts` now prioritizes pinned broadcasts in the feed ordering

## Testing scope

Added or extended coverage for:

- lifecycle model helpers and datetime parsing
- broadcast notification ordering with pinned content
- repository update, pin, archive, and restore flows
- store handling for active versus inactive broadcast buckets and lifecycle state transitions

## Definition of done

- admins can edit an existing broadcast without deleting and reposting it
- one broadcast can be pinned at the top of the live member view
- archived and expired broadcasts leave the live member surface and appear in admin history
- admins can restore inactive broadcasts or permanently delete them
- touched broadcast surfaces stay compact and consistent with the 0.1.24 density pass
- validation passes with `npm run check` and `npm test`