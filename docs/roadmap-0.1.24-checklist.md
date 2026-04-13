# 0.1.24 checklist

## Release-wide UI constraints

- [x] Reduce excessive corner radius on touched live cards and inset metric tiles
- [x] Trim unnecessary vertical space on touched live surfaces before adding new content
- [x] Keep any 0.1.24 density changes consistent across light and dark mode

## a · Event RSVPs

- [x] Add a Supabase migration for event responses and response policies
- [x] Extend the hub repository with RSVP fetch and mutation functions
- [x] Extend the hub store to load aggregate RSVP data and the current member's response
- [x] Add compact RSVP actions to live event cards without introducing oversized controls
- [x] Show attendee counts and recent responder context in the member-facing Events section
- [x] Show a lightweight attendance summary in the admin event editor
- [x] Add focused tests for RSVP data shaping, store updates, and event response flows

## b · Broadcast lifecycle controls

- [x] Add broadcast lifecycle fields and member read filtering for pinned, archived, and expiry behavior
- [x] Apply the `015_add_hub_broadcast_lifecycle.sql` migration
- [x] Support updating an existing broadcast instead of delete-and-repost only
- [x] Allow admins to pin a current top broadcast
- [x] Add archive, restore, and optional expiry behavior without returning to tall stacked editor rows
- [x] Update the member broadcasts section and hub activity feed to reflect active content state
- [x] Add focused tests for pinned, archived, expired, and editable broadcast behavior


## c · Access operations refinement

- [x] Add search and filtering to the organization members review surface
- [x] Add stale-invite and invite-method visibility to access review surfaces
- [x] Preserve role-change and removal safeguards while speeding up scanning
- [x] Tighten metric and summary block density in organization access and members screens
- [x] Add focused tests for filtering, admin safeguards, and invitation review helpers


## d · Resources plugin

- [x] Add the `resources` plugin to the registry and hub activation flow
- [x] Add a Supabase migration and repository CRUD for resource entries
- [x] Load resources through the current hub store
- [x] Add a compact member-facing resources section
- [x] Add an admin resource editor with ordering, editing, and removal
- [x] Register the new section in the live hub member and admin coordinator routes
- [x] Add focused tests for plugin state, resource ordering, and rendering helpers
