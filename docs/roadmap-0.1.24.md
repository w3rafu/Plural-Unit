# 0.1.24 - Live Operations & Actionable Hub

**Theme:** deepen the live product now that 0.1.23 stabilized the shared surfaces. Ignore demo and preview work unless a live change cannot land cleanly without it.

## Status

Implemented in code as of 2026-04-12.

Completed so far:

- the live density pass tightened card radius and reduced excess vertical spacing on touched profile, organization, directory, and section-switcher surfaces
- Event RSVPs are implemented end-to-end, including the new `hub_event_responses` table, member response actions, admin attendance summaries, and focused test coverage
- the `014_add_hub_event_responses.sql` migration has been applied
- broadcast lifecycle controls are implemented end-to-end, including edit, pin, archive, restore, and optional expiry behavior across the repository, store, admin editor, member broadcasts list, and hub activity feed
- the `015_add_hub_broadcast_lifecycle.sql` migration has been applied
- access operations refinement is implemented end-to-end, including member and invitation review filters, recent and stale access signals, tighter admin review density, admin-only store safeguards, and focused test coverage
- resources plugin is implemented end-to-end, including the new `hub_resources` migration, registry and store support, the member resources section, the admin resource editor, and focused test coverage
- the `016_add_hub_resources.sql` migration has been applied
- validation passed with `npm run check` and `npm test` at 35 files and 477 tests

## Additional product notes

Carry these UI constraints through every 0.1.24 slice:

- card corners are currently reading softer and rounder than intended on live screens, especially the main card shell and inset metric tiles
- several live screens still spend too much vertical space on summary blocks, segmented controls, and stacked supporting copy
- when touching a live surface in 0.1.24, prefer tighter density and a firmer radius before adding more ornament or more helper text

## Context

0.1.23 finished the structural cleanup that the app needed:

- live Messages and Directory now run through shared surfaces
- hub activity has clearer CTA behavior
- route locking and directory loading rules are explicit and tested

That leaves a different kind of gap on the live side. The product is tidy, but the real workflows are still thin:

- broadcasts and events can be created and deleted, but they still have almost no lifecycle management
- events are informative, but members still cannot respond or signal intent
- organization access is manageable, but still light on operational review tools
- the hub plugin system is ready for another live section, but the app only offers timeline-style content today

0.1.24 should therefore focus on live follow-through, not more shared-surface cleanup.

## Recommended features

### a · Event RSVPs

Turn events from passive announcements into something organizers can actually plan around.

Goals:

- let members respond to an event with a simple status such as going, maybe, or cannot attend
- show aggregate counts and recent responders on the member-facing event cards
- give admins a lightweight attendance snapshot in the manage surface
- keep the first version intentionally simple: no waitlists, no ticketing, no recurring-event system

Candidate files:

- `supabase/migrations/*` - new event response table and policies
- `src/lib/repositories/hubRepository.ts` - fetch and mutate RSVP state
- `src/lib/stores/currentHub.svelte.ts` - load and update per-user event responses
- `src/lib/components/hub/member/EventsSection.svelte` - member response UI and counts
- `src/lib/components/hub/admin/EventEditor.svelte` - organizer-side response summary

### b · Broadcast lifecycle controls

Give broadcasts enough structure that admins can manage live communications without deleting and recreating content.

Goals:

- edit an existing broadcast after publishing
- pin one broadcast as the current top message for the organization
- archive or expire stale broadcasts instead of only deleting them
- make the hub activity feed respect pinned and active content states

Candidate files:

- `supabase/migrations/*` - pinned, archived, or expires-at fields for broadcasts
- `src/lib/repositories/hubRepository.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/BroadcastEditor.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`

### c · Access operations refinement

Make the organization admin surfaces better at answering who has access, who is waiting, and what needs attention.

Goals:

- add search and filtering to the members and pending-invitations surfaces
- highlight recent joins, stale invites, and invite method at a glance
- keep role-change and removal safeguards intact while making review faster
- preserve the member-facing directory as a simple communication surface, but keep admin-grade review in organization settings

Candidate files:

- `src/lib/stores/currentOrganization.svelte.ts`
- `src/lib/repositories/organizationRepository.ts`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/PendingInvitationsTable.svelte`
- `src/lib/components/organization/OrganizationAccessCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`

### d · Resources plugin

Add the first non-timeline hub plugin so organizations can keep stable reference material inside the app.

Goals:

- introduce a `resources` plugin for links, forms, documents, and contact references
- give members a clean browseable resource list with title, description, and destination
- give admins a lightweight editor for ordering, editing, and removing resources
- use the existing registry-driven hub architecture instead of hardcoding another one-off page

Candidate files:

- `supabase/migrations/*` - new resources table
- `src/lib/stores/pluginRegistry.ts` - add the new plugin definition
- `src/lib/repositories/hubRepository.ts` - resource CRUD
- `src/lib/stores/currentHub.svelte.ts` - load resource data and activation state
- `src/lib/components/hub/member/ResourcesSection.svelte` - new member section
- `src/lib/components/hub/admin/ResourceEditor.svelte` - new admin editor
- `src/routes/+page.svelte` - register live member rendering
- `src/routes/hub/manage/content/+page.svelte` - register live admin rendering

## What not to do in 0.1.24

- do not spend the release on demo parity or preview-fixture expansion
- do not add a large analytics layer before the content workflows are actionable
- do not add multiple new plugins at once; one good third plugin is enough
- do not build a heavy calendar system until event participation exists

## Recommended order

1. Event RSVPs
2. Broadcast lifecycle controls
3. Access operations refinement
4. Resources plugin

## Why this order

The app already lets admins publish content, but it still does not let members act on that content in a meaningful way. Event RSVPs fix the biggest product gap first. Broadcast lifecycle controls then make the existing communication tool sustainable. Access refinement improves the admin workflow around real organizations. After that, a `resources` plugin becomes a safe expansion instead of a distraction.
