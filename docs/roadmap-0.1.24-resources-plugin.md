# 0.1.24 slice scope - Resources plugin

## Goal

Add the first non-timeline hub plugin so organizations can keep stable reference material inside the app without leaving the existing registry-driven hub flow.

## Status

Implemented in code on 2026-04-12.

- the `resources` plugin now exists in the shared registry and hub activation flow
- resource persistence is implemented through `hub_resources` and matching repository CRUD helpers
- the current hub store now loads, adds, updates, reorders, and removes resources
- members now see a compact resources section with type labels, destination context, and open actions
- admins now have a lightweight editor for creating, editing, reordering, and deleting resources
- `016_add_hub_resources.sql` is applied
- validation passed with `npm run check` and `npm test`

## Product decisions

- keep the first version intentionally simple with four resource types: link, form, document, and contact
- reuse the existing plugin registry, member coordinator, and admin content route instead of introducing a separate page or navigation branch
- normalize common resource destinations so admins can paste bare domains, email addresses, and phone numbers without manual protocol cleanup
- keep ordering explicit with `sort_order` and simple up or down movement rather than adding drag-and-drop complexity

## UI constraints

- keep the member resource cards aligned with the denser 0.1.24 spacing and firmer radius pass
- keep the admin editor compact enough to sit alongside broadcasts and events without becoming the tallest manage surface
- surface resource type and destination context quickly so members can scan the list without extra helper copy blocks
- preserve the existing admin unsaved-changes safeguards while keeping add and edit actions lightweight

## Model, repository, and store changes

Implemented in `src/lib/models/resourcesModel.ts`:

- resource type options and display labels
- destination normalization and validation helpers
- compact destination label formatting for member and admin surfaces
- ordered row helpers for replace, remove, sort, and move behavior

Implemented in `src/lib/repositories/hubRepository.ts`:

- resource row and type definitions
- fetch, create, update, reorder, and delete operations for `hub_resources`

Implemented in `src/lib/stores/currentHub.svelte.ts`:

- resource loading for active hubs
- ordered resource derivation for rendering
- admin actions for add, update, reorder, and removal flows
- resource mutation target tracking to keep editor controls stable during async work

## Member and admin surface changes

Member hub surface:

- `src/lib/components/hub/member/ResourcesSection.svelte`
- shows type badges, compact destination labels, descriptions, and direct open actions

Admin content surface:

- `src/lib/components/hub/admin/ResourceEditor.svelte`
- create and edit form with type-aware destination guidance
- live resource list with reorder, edit, open, and delete actions

Coordinator registration:

- `src/routes/+page.svelte`
- `src/routes/hub/manage/content/+page.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`

## Testing scope

Added or extended coverage for:

- resource destination normalization, validation, label formatting, and ordering helpers
- resource repository fetch, create, update, reorder, and delete behavior
- current hub store loading and resource mutation flows
- plugin registry behavior for the third hub plugin

## Definition of done

- admins can enable the resources plugin and manage ordered resource entries from the existing hub content surface
- members can browse and open live resources from the main hub route
- resource ordering stays stable after create, update, move, and delete operations
- touched member and admin surfaces stay aligned with the 0.1.24 density pass
- validation passes with `npm run check` and `npm test`