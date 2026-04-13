# 0.1.24 slice scope - Access operations refinement

## Goal

Make organization admin access review faster by surfacing who has access, who is waiting to join, and which records need attention without weakening role and removal safeguards.

## Status

Implemented in code on 2026-04-12.

- member review now supports search, role-based filtering, and recent-join visibility
- pending invitation review now supports search, channel filtering, stale invite visibility, and denser summary metrics
- organization admin-only access actions are now guarded in the store so non-admin users cannot load or mutate invitation and membership state
- validation passed with `npm run check` and `npm test`
- no schema migration was required because the existing member and invitation data already included joined-at, joined-via, contact channel, and created-at context

## Product decisions

- keep the member-facing directory simple and communication-focused; deeper access review remains in organization settings
- recent member joins and stale invitations both use a seven-day threshold for the first version
- invitation review should surface delivery channel and age before adding heavier workflow states
- store-level admin guards matter as much as UI-level hiding because access state can outlive route transitions and role changes

## UI constraints

- keep the organization members and access cards aligned with the tighter 0.1.24 density pass
- prefer compact metrics, badges, and filters over extra explanatory copy blocks
- keep scanning speed high by surfacing search and filter controls above the table without adding another full-width settings band
- preserve existing destructive-action safeguards and confirmation flows while reducing the time needed to identify the right row

## Model and store changes

Implemented in `src/lib/models/accessReviewModel.ts`:

- member review helpers for recent-join detection, filter matching, summary text, and empty-state copy
- invitation review helpers for recipient display, channel display, stale detection, filter matching, summary text, and empty-state copy

Implemented in `src/lib/stores/currentOrganization.svelte.ts`:

- admin-only guards for invitation loading, invitation sending, join-code regeneration, member role changes, and member removal
- invitation state is cleared when the current user loses admin access during a refresh
- existing member-visible loading behavior remains intact for live roster reading elsewhere in the app

## Member and admin surface changes

Members review surface:

- `src/lib/components/organization/OrganizationMembersCard.svelte`
- compact summary metrics for total members, admins, and recent joins
- search plus filter controls for all, admins, members, and recent joins
- filtered empty-state copy that changes with the current review mode

Member row details:

- `src/lib/components/organization/MemberRow.svelte`
- joined-via and recent badges
- existing message, role update, and removal actions preserved

Invitation review surface:

- `src/lib/components/organization/OrganizationAccessCard.svelte`
- compact metrics for pending, stale, email, and phone invitations
- invitation search and filter controls for all, stale, email, and phone

Invitation rows:

- `src/lib/components/organization/PendingInvitationsTable.svelte`
- delivery channel, stale badge, and reusable empty-state messaging

Density alignment:

- `src/lib/components/organization/InviteForm.svelte`
- tighter spacing to keep the access screen aligned with the release-wide density pass

## Testing scope

Added or extended coverage for:

- recent-member and stale-invitation helper behavior
- member and invitation filtering and summary text
- store admin guards for invitation and member mutations
- invitation state clearing after loss of admin access

## Definition of done

- admins can search and filter organization members without losing role and removal safeguards
- admins can identify recent joins, stale invitations, and invitation channel at a glance
- non-admin users cannot keep stale invitation state or trigger admin-only access actions through the store
- touched access review surfaces stay compact and consistent with the 0.1.24 density pass
- validation passes with `npm run check` and `npm test`