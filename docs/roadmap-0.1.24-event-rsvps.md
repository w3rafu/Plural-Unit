# 0.1.24 slice scope - Event RSVPs

## Goal

Turn events into actionable planning objects by letting members respond with a simple attendance status and letting admins see the resulting signal without leaving the hub workflow.

## Status

Implemented on 2026-04-12.

- `014_add_hub_event_responses.sql` is applied
- member RSVP actions are live in `EventsSection.svelte`
- admin attendance summaries are live in `EventEditor.svelte`
- validation passed with `npm run check` and `npm test`

## Product decisions

- supported responses: `going`, `maybe`, `cannot_attend`
- one response per member per event
- members can change their response at any time
- admins see aggregate counts and a recent-responder preview, not a heavy attendance dashboard in v1
- no waitlists, guest counts, recurring-event logic, reminder system, or calendar export in this slice

## UI constraints

These came directly from the current live screens and should shape the implementation:

- do not solve RSVP actions with a tall stacked card inside each event
- do not introduce extra-large pill groups or oversized segmented controls
- reduce corner softness on any new or touched event summary blocks so they sit closer to the rest of the shell
- prefer one compact response row plus a short attendance summary instead of multiple explanatory paragraphs

## Data model

Recommended new table:

- `hub_event_responses`

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `event_id uuid not null references hub_events(id) on delete cascade`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `profile_id uuid not null references profiles(id) on delete cascade`
- `response text not null check (response in ('going', 'maybe', 'cannot_attend'))`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

Recommended constraints and indexes:

- unique index on `(event_id, profile_id)`
- index on `(organization_id, event_id)`
- trigger or update policy for `updated_at`

## Row-level security expectations

- signed-in members can read responses for events in their own organization
- signed-in members can insert their own response row for events in their own organization
- signed-in members can update only their own response row
- members cannot delete or mutate another member's response
- admins do not need special write powers beyond normal self-response behavior for v1 unless you explicitly want organizer-side overrides

## Repository changes

Recommended additions in `src/lib/repositories/hubRepository.ts`:

- `fetchEventResponses(organizationId: string)`
- `upsertOwnEventResponse(payload: { eventId: string; organizationId: string; profileId: string; response: EventResponseStatus })`

Recommended data types:

- `type EventResponseStatus = 'going' | 'maybe' | 'cannot_attend'`
- `type EventResponseRow = { id; event_id; organization_id; profile_id; response; created_at; updated_at }`
- `type EventAttendanceSummary = { going: number; maybe: number; cannotAttend: number; recentProfileIds: string[] }`

Recommended shaping rule:

- repository returns raw response rows
- model or store layer derives counts and recent-responder preview data from those rows

## Store changes

Recommended additions in `src/lib/stores/currentHub.svelte.ts`:

- `eventResponses` state keyed by event id
- `ownEventResponses` state keyed by event id
- `isUpdatingEventResponse` keyed by event id or a single pending event id value
- helper to derive attendance summaries for rendering

Recommended store behavior:

- include RSVP rows in the existing hub load path once the organization is known
- optimistic update is optional; safe immediate refresh after upsert is acceptable for v1
- if the member changes response, update the active event summary without forcing a full route reload
- keep failure feedback local to the event interaction or toast-driven, not both at once unless needed

## Member UI scope

Target file:

- `src/lib/components/hub/member/EventsSection.svelte`

Recommended interaction model:

- keep the existing event card structure
- add one compact action row with three response buttons or chips
- show the member's current selection clearly
- add a short attendance line such as `8 going · 3 maybe · 1 cannot attend`
- optionally show one short recent-responder sentence if the data is available

Avoid:

- full-width tall button stacks
- large empty spacer blocks
- extra nested cards inside each event card

## Admin UI scope

Target file:

- `src/lib/components/hub/admin/EventEditor.svelte`

Recommended first version:

- keep the current create/delete editor structure
- add a compact attendance summary beneath each published event
- show totals only, or totals plus one short responder preview line
- do not build a separate attendance management screen in this slice

## Testing scope

Add focused coverage for:

- repository response shaping assumptions
- store summary derivation and response updates
- member response changes from one status to another
- aggregate counts after repeated updates by the same member
- UI state for selected response and busy response transitions

## Suggested implementation order

1. migration and policy design
2. repository types and CRUD
3. store state and derived summaries
4. member Events section interaction row
5. admin Event editor summary
6. tests and visual density pass on touched event surfaces

## Definition of done

- members can respond to any live event in their organization
- changing a response updates counts correctly
- admins can see attendance signal without leaving the current event management surface
- touched event cards are denser than the current baseline, not taller
- touched RSVP UI uses firmer radii than the current over-rounded metric blocks
- validation passes with `npm run check` and `npm test`
