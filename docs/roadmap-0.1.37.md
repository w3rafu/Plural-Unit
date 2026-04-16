# 0.1.37 — Broadcast Detail, Notification Clarity, and Release Confidence

**Theme:** Finish the asymmetries left after 0.1.36 by giving broadcasts a real detail surface, making notification behavior easier to understand, and broadening smoke coverage to the routes people actually use.

## Status

Planned.

## Product constraints

- keep each slice independently shippable
- prefer additive changes and route-level composition over large store rewrites
- preserve existing `/#hub-broadcasts` and manage-anchor fallbacks while adding deep links
- keep admin-only broadcast context hidden from non-admin members
- keep smoke-mode flows local and fixture-backed whenever a new browser action would otherwise call Supabase
- do not widen notification semantics accidentally; copy and behavior must stay aligned

## Context

What exists today (after 0.1.36):

- **Events** now have a solid member detail route plus admin context, attendance follow-up, reminder summaries, and direct push deep links.
- **Broadcasts** have a mature admin lifecycle already: drafts, scheduling, publish-now, archive/restore, delivery diagnostics, acknowledgments, and workflow signals all exist in the manage surface.
- **Members** can still only interact with broadcasts through list cards and alert-sheet anchors. There is no `/hub/broadcast/[broadcastId]` route, and broadcast push notifications still send members to `/hub` instead of a specific item.
- **Notification settings** currently mix concepts. The profile card is presented as “In-app alerts,” but one toggle explicitly describes direct-message push behavior, while device-level push enablement sits in the same form.
- **Smoke coverage** improved in 0.1.36, but it still only covers `hub` and `profile`. There is no smoke protection for directory flows, organization admin flows, or direct-message interactions.
- **Docs** are stale. README still points contributors at `0.1.32` planning docs and does not reflect the latest migration/runtime dependencies.

What is still missing:

- a deep-linkable broadcast detail route for members and notifications
- admin-only broadcast follow-up context outside the full manage editor
- clearer notification preference boundaries between hub alerts, direct-message push behavior, and device push state
- smoke coverage for the rest of the app's core user/admin flows
- current release docs and onboarding pointers

## Recommended features

### a — Broadcast detail route and deep linking

Give broadcasts the same route-level dignity that events already have.

Goals:

- create `/hub/broadcast/[broadcastId]` so members can open one broadcast directly
- render full broadcast content, meta, publish timing, expiry, and acknowledgment state on that route
- link broadcast cards and alert-sheet actions to the detail route instead of section anchors where appropriate
- update broadcast push notifications to target the detail route rather than generic `/hub`
- keep `/#hub-broadcasts` as a fallback path for older links and generic navigation

Candidate files:

- `src/routes/hub/broadcast/[broadcastId]/+page.svelte` (new)
- `src/lib/components/hub/member/BroadcastDetailCard.svelte` (new)
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/components/hub/member/hubActivityModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/services/pushNotification.test.ts`

Implementation sketch:

- Mirror the event-detail route structure, but keep the member experience lightweight and broadcast-specific.
- Start by supporting route composition in-page before adding any new repository methods; current hub state already contains the broadcast rows needed for rendering.
- Update notification and push destinations so broadcasts no longer dead-end on the generic hub surface.

### b — Broadcast admin context and acknowledgment follow-up

Let admins review broadcast delivery and engagement from the detail route without bouncing back into the editor for every check.

Goals:

- add an admin-only context block to broadcast detail
- show delivery status, scheduling/expiry state, and acknowledgment counts in plain language
- show which members still have not acknowledged a broadcast when roster data is available
- add a clear “Open in manage” path for edits, restore actions, and deeper diagnostics
- keep member-facing broadcast detail lean for non-admin viewers

Candidate files:

- `src/lib/components/hub/member/BroadcastDetailCard.svelte`
- `src/lib/components/hub/admin/BroadcastAcknowledgmentRosterPanel.svelte` (new)
- `src/lib/models/broadcastAcknowledgmentModel.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/routes/hub/broadcast/[broadcastId]/+page.svelte`
- `src/lib/stores/currentOrganization.svelte.ts`

Implementation sketch:

- Reuse the same route-level admin gating pattern from event detail.
- Build roster-aware acknowledgment summaries from the existing acknowledgment map plus organization members.
- Keep all editing actions inside manage; detail should summarize and route, not recreate the full editor.

### c — Notification preference clarity and channel boundaries

Untangle the current profile notification UI so labels, saved settings, and runtime behavior describe the same thing.

Goals:

- stop presenting mixed in-app and push behaviors under one ambiguous “In-app alerts” frame
- separate hub alert preferences from device-level push enablement in the UI
- make the direct-message preference explicitly describe message push behavior if that is what it controls today
- align success/error copy with the actual preferences being saved
- add tests around the clarified preference model and card behavior

Candidate files:

- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`
- `src/lib/models/hubNotifications.ts`
- `src/lib/stores/currentHub/notifications.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.test.ts` (new or expanded)

Implementation sketch:

- Treat this as a semantics and workflow cleanup first, not a schema rewrite.
- Use the current `broadcast` / `event` / `message` preference shape if it can be explained honestly in the UI.
- Only add schema if the clarified model reveals a real missing channel split that cannot be represented with existing fields.

### d — Smoke coverage expansion for broadcast, organization, directory, and messages

Broaden end-to-end confidence beyond the two flows that currently have smoke protection.

Goals:

- extend hub smoke to cover broadcast detail navigation and admin context
- add smoke coverage for organization admin flows such as members, invitations, and deletion review visibility
- add smoke coverage for directory profile views and directory-initiated messaging paths
- add smoke coverage for message send/delete flows in the inbox
- keep smoke fixtures aligned with any new route or preference assumptions

Candidate files:

- `e2e/hub-smoke.spec.ts`
- `e2e/organization-smoke.spec.ts` (new)
- `e2e/directory-smoke.spec.ts` (new)
- `e2e/messages-smoke.spec.ts` (new)
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/stores/currentMessages.svelte.ts`

Implementation sketch:

- Prefer fixture-driven browser coverage over adding more special-case store tests for route composition bugs.
- Add only a few high-signal smoke paths per route so the suite stays fast enough to run regularly.
- Mirror the real RPC shapes in smoke fixtures whenever new route logic depends on roster, acknowledgment, or preference state.

### e — Release-doc and onboarding refresh

Bring the written guidance up to the level of the shipped code so the next release does not start from stale assumptions.

Goals:

- update README to point contributors at the newest roadmap docs instead of `0.1.32`
- refresh the migration/runtime dependency note to include the newer release batch
- add a short `0.1.36` release-notes doc capturing what shipped and what migrations matter most
- keep planning docs easy to find for the next implementation pass

Candidate files:

- `README.md`
- `docs/release-notes-0.1.36.md` (new)
- `docs/roadmap-0.1.37.md`
- `docs/roadmap-0.1.37-checklist.md`

Implementation sketch:

- Keep this slice documentation-only.
- Verify every migration number and runtime dependency against the actual repo before editing README.
- Treat release notes as operator-facing handoff, not marketing copy.

## Recommended order

If keeping `0.1.37` tight, start with:

1. `a` — broadcast detail route and deep linking
2. `c` — notification preference clarity and channel boundaries
3. `b` — broadcast admin context and acknowledgment follow-up
4. `d` — smoke coverage expansion
5. `e` — release-doc and onboarding refresh

That order lands the most visible member/admin improvements first, then uses smoke and docs work to harden the release before moving on again.
