# 0.1.39 — Event Delivery Completion and Resource Accountability

**Theme:** finish the event follow-through loops that still stop at generic updates, and give shared resources enough lifecycle and engagement signal to manage them deliberately.

## Status

`0.1.39` is planned. `0.1.38` shipped thread archive and mute controls, invitation expiry follow-through, role-aware hub section targeting, and release-closeout validation.

## Product constraints

- keep each slice independently shippable
- preserve the existing org-level notification preferences and push opt-in model; any new event delivery must still respect the event preference gate
- keep existing in-app reminder behavior as the default path for current rows; new delivery channels must stay backward-compatible
- keep resource changes additive for existing `hub_resources` rows
- avoid introducing a heavier permissions system; reuse the existing admin/member split and current plugin targeting model
- keep smoke-mode event and resource mutations local and fixture-backed whenever a new browser path would otherwise call Supabase

## Context

What exists today (after `0.1.38`):

- **Events** have detail routes, admin context, RSVP and attendance tracking, scheduled visibility, reminder planning, in-app reminder alerts, and event publish push deep links.
- **Event lifecycle** already includes cancel, archive, and restore for admins, and the event detail route can still load historical rows from the shared hub store.
- **Event notifications** still treat lifecycle changes as generic event updates. Cancel and restore flows do not send dedicated member push, and reminder delivery is still modeled as `in_app` only.
- **Resources** have a plugin, admin CRUD, ordering, and a compact member-facing list of openable links, forms, documents, and contacts.
- **Resource operations** are still one-way. Saving a resource makes it live immediately, deleting removes it permanently, and admins have no visibility into whether members ever open what was shared.
- **Smoke coverage** now spans hub, organization, directory, messages, and profile, but the hub smoke suite still does not exercise resource opens, resource lifecycle, or event cancellation/reminder follow-through.
- **Docs** point contributors at `0.1.38`, and the latest shipped handoff is still `docs/release-notes-0.1.37.md`.

What is still missing:

- event cancellation and restore follow-through that reads like a lifecycle signal instead of a generic event update
- reminder delivery beyond fixed in-app alerts
- resource lifecycle controls short of immediate deletion
- resource engagement signals that help admins keep shared links current
- `0.1.38` handoff notes and smoke coverage for the new event and resource workflows

## Recommended features

### a — Event cancellation and restore follow-through

Finish the member-facing loop for admins changing an event's lifecycle.

Goals:

- trigger member-facing follow-through when a visible event is canceled or restored
- update event detail and alert copy so canceled events read as intentional lifecycle changes, not neutral updates
- keep canceled events understandable from direct links instead of relying on members to infer state from missing list placement
- avoid duplicate push or in-app noise when admins make unrelated edits after canceling an event

Candidate files:

- `src/lib/models/hubNotifications.ts`
- `src/lib/models/eventLifecycleModel.ts`
- `src/lib/components/hub/member/EventDetailCard.svelte`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/services/pushNotification.test.ts`

Implementation sketch:

- Reuse the existing event notification identity and push pipeline instead of introducing a second event-notification system.
- Derive cancellation and restore summaries from the existing `canceled_at` state in the notification model and detail card.
- Only trigger follow-through for events that were already visible to members, so draft-only admin changes stay quiet.

### b — Reminder delivery channels and timing clarity

Complete the reminder pipeline so reminder planning is not locked to in-app-only behavior.

Goals:

- extend event reminder settings beyond the current `in_app`-only channel
- allow reminder executions to fan out to push when event notifications and device push are enabled
- keep admin reminder planning copy honest about what channel members will actually receive
- preserve current reminder rows safely by defaulting existing data to the current in-app behavior

Candidate files:

- `supabase/migrations/044_expand_hub_event_reminder_delivery_channel.sql` (new)
- `src/lib/repositories/hubRepository/events.ts`
- `src/lib/models/eventReminderModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/EventEditor.svelte`
- `supabase/functions/send-push/index.ts`

Implementation sketch:

- Expand `delivery_channel` into an additive channel model rather than replacing existing reminder rows.
- Keep in-app reminders as the default for current data, then layer push delivery onto processed reminder executions when the channel allows it.
- Keep reminder alert identity stable so in-app read state and push delivery do not drift apart.

### c — Resource lifecycle and admin history

Give shared resources a recoverable lifecycle instead of forcing admins to choose between "live forever" and hard delete.

Goals:

- add resource draft and archive behavior so admins can stage, retire, and restore resources deliberately
- keep member-facing resource lists limited to live rows
- surface inactive resource history in manage without building a separate resource route
- preserve current ordering behavior for live rows

Candidate files:

- `supabase/migrations/045_add_hub_resource_lifecycle.sql` (new)
- `src/lib/repositories/hubRepository/resources.ts`
- `src/lib/models/resourcesModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/ResourceEditor.svelte`
- `src/lib/components/hub/member/ResourcesSection.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`

Implementation sketch:

- Extend `hub_resources` with lightweight lifecycle fields instead of inventing a second resource workflow table.
- Keep member rendering focused on live resources while admin manage shows draft and archived rows alongside restore actions.
- Reuse current ordering helpers for live rows and keep inactive history grouped separately.

### d — Resource engagement signals and cleanup guidance

Add enough feedback to tell whether shared resources are useful without building a full analytics product.

Goals:

- record when members open a resource
- show simple engagement signals such as total opens and most recent open in admin surfaces
- highlight unused or stale resources so admins can archive or refresh them
- keep smoke-mode resource opens deterministic and local

Candidate files:

- `supabase/migrations/046_add_hub_resource_engagement.sql` (new)
- `src/lib/repositories/hubRepository/resources.ts`
- `src/lib/models/resourcesModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/member/ResourcesSection.svelte`
- `src/lib/components/hub/admin/ResourceEditor.svelte`
- `src/lib/components/hub/admin/HubManageSummaryCard.svelte`

Implementation sketch:

- Start with compact engagement storage and admin summaries, not per-member analytics screens.
- Log opens at the resource button boundary so member behavior is captured without creating a new navigation surface.
- Pair lifecycle and engagement work so unused resources can move into archive instead of piling up in the live list forever.

### e — Smoke, release handoff, and rollout safety

Close the release by validating the new event and resource loops and documenting what shipped in `0.1.38`.

Goals:

- extend smoke coverage for event cancellation and restore follow-through, reminder channel behavior, and resource lifecycle and engagement
- add `docs/release-notes-0.1.38.md`
- update contributor-facing pointers only after the roadmap and shipped handoff stay aligned
- verify missing-migration guidance for the new reminder and resource schema changes

Candidate files:

- `e2e/hub-smoke.spec.ts`
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/models/hubRecoveryGuidance.ts`
- `README.md`
- `docs/release-notes-0.1.38.md` (new)
- `docs/roadmap-0.1.39.md`
- `docs/roadmap-0.1.39-checklist.md` (new)

Implementation sketch:

- Keep the smoke harness deterministic and local; resource opens and event lifecycle actions should not depend on real Supabase writes in Playwright.
- Treat `0.1.38` release notes as operator-facing handoff, not marketing copy.
- Refresh README only during closeout so the planning pointers and latest shipped handoff remain synchronized.

## Recommended order

If keeping `0.1.39` tight, start with:

1. `a` — event cancellation and restore follow-through
2. `b` — reminder delivery channels and timing clarity
3. `c` — resource lifecycle and admin history
4. `d` — resource engagement signals and cleanup guidance
5. `e` — smoke, release handoff, and rollout safety

That order finishes the event-delivery loops first, then gives resources the minimum lifecycle and accountability needed before closeout.
