# 0.1.37 release notes

**Theme:** Broadcast detail follow-through, clearer notification semantics, and route-level smoke confidence.

## What shipped

- **Broadcast detail route and deep links**
  - Broadcasts now have a dedicated `/hub/broadcast/[broadcastId]` route with full content, timing, expiry, and acknowledgment state.
  - Broadcast cards, alert-sheet primary actions, and push targets now deep-link to specific broadcasts while preserving `/#hub-broadcasts` as a fallback.

- **Broadcast admin context and acknowledgment follow-up**
  - Admins can review delivery state, schedule status, and acknowledgment counts from the broadcast detail route.
  - Roster-aware follow-up highlights who still has not acknowledged a broadcast without forcing a jump back into the editor first.

- **Notification preference clarity**
  - The profile notification surface now separates in-app hub alerts, direct-message push behavior, and device push registration.
  - Saved settings and UI copy now describe the same runtime behavior instead of mixing channel semantics.

- **Smoke coverage expansion**
  - Playwright smoke coverage now spans hub, organization, directory, profile, and messages.
  - Covered flows stay local and fixture-backed in smoke mode so route regressions do not depend on live Supabase writes.

- **Contributor guidance refresh**
  - README onboarding pointers were refreshed during the release so contributors land on the current roadmap and latest shipped handoff docs first.

## Required migrations

0.1.37 did not add a new migration of its own, but the shipped routes and smoke-backed workflows assume the recent schema batch is already present on environments that predate this release.

1. Apply `030_add_broadcast_acknowledgments.sql` through `034_allow_org_name_update.sql` for broadcast acknowledgment follow-up, message seen-state hydration, device push registration, direct-message push preference semantics, and organization settings support.
2. Keep `035_add_profile_bio.sql` through `039_soft_delete_messages.sql` in place as well, because 0.1.37 smoke coverage actively exercises profile bio, deletion-review, and message delete surfaces introduced in the previous release.

## Operational notes

- Broadcast notifications now prefer the detail route. Older `/#hub-broadcasts` links still work, but new alert and push flows should land on the broadcast detail page.
- The direct-message preference remains an organization-level push gate. The 0.1.37 UI clarifies that it is not an in-app hub alert toggle.
- Smoke failures on the covered routes usually indicate that a store lost its smoke-mode local branch or a fixture drifted from route expectations, not that production data changed.

## Related docs

- Current planning: [docs/roadmap-0.1.38.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.38.md)
- Current execution checklist: [docs/roadmap-0.1.38-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.38-checklist.md)
