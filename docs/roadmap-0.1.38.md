# 0.1.38 — Thread Hygiene, Invitation Follow-through, and Role-aware Hub Access

**Theme:** Give members and admins better control over noisy conversation, invitation, and hub-access surfaces without introducing a larger permissions system.

## Status

Slices `a` through `d` are implemented locally and validated. Slice `e` remains planned.

## Product constraints

- keep each slice independently shippable
- keep message-thread lifecycle owner-scoped; archive or mute on one side must not alter the counterpart's thread state
- preserve the existing organization-level `message_enabled` and device-push controls; any new thread-level delivery control can only narrow push delivery, not widen it
- keep invitation changes additive and backward-compatible for existing pending rows
- reuse the existing `admin` and `member` roles instead of introducing a new role hierarchy
- keep smoke-mode invite, thread, and hub-access mutations local and fixture-backed whenever a new browser path would otherwise call Supabase

## Context

What exists today (after 0.1.37):

- **Broadcasts** now have detail routes, admin follow-up context, deep-linkable notifications, and roster-aware acknowledgment review.
- **Notification settings** now separate hub alerts in the app, direct-message push, and device push state so the saved semantics match the UI copy.
- **Smoke coverage** now spans hub, profile, organization, directory, and messages, with local fixture-backed mutation branches for the covered flows.
- **Messages** now support directory-initiated conversations, image send, seen state, soft delete, typing presence, older-message loading, owner-side archive and recovery, and owner-side mute state that narrows push delivery without hiding the thread in-app.
- **Organization access** supports send, resend, revoke, search, and stale-age filtering for pending invites. But pending invites do not expire, warn when they are close to becoming unusable, or distinguish between "stale" and truly inactive invite links.
- **Hub sections** are still toggled only at the organization level. The root hub route renders every enabled plugin for every member, and admin controls only support on or off state.
- **Docs** now point contributors to `0.1.37`, but there is no `0.1.37` release handoff doc yet.

What is still missing:

- invitation expiry and recovery signals beyond a simple stale-age badge
- role-aware hub section visibility using the existing admin and member roles
- `0.1.37` release handoff and closeout docs

## Recommended features

### a — Message thread archive and recovery

Give members a real way to clean up the inbox without losing conversation history.

Goals:

- add owner-side archive and unarchive controls for message threads
- keep archived threads out of the default unread, recent, and older inbox buckets while preserving search and recovery
- expose archived-thread access without adding a separate route
- preserve unread counts, last-read markers, and full message history

Candidate files:

- `supabase/migrations/040_add_message_thread_archive.sql` (new)
- `src/lib/repositories/messageRepository.ts`
- `src/lib/models/messageModel.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/messages/InboxPane.svelte`
- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/components/messages/ThreadCard.svelte`

Implementation sketch:

- Add nullable `archived_at` to `message_threads`, scoped to the owner's copy of the thread.
- Treat archived threads as recoverable, not deleted.
- Keep the default inbox focused on active work and add a compact recovery affordance for archived threads.
- Clear `archived_at` automatically when a new message is sent so resumed conversations return to active triage.

### b — Muted direct-message threads and push narrowing

Let members quiet a noisy conversation without turning off all direct-message push for the organization.

Goals:

- add per-thread mute and unmute controls
- show muted state in the inbox and active thread header
- suppress direct-message push delivery when the recipient's owner-side thread is muted
- keep in-app thread access and unread state intact even when push is muted

Candidate files:

- `supabase/migrations/041_add_message_thread_mute.sql` (new)
- `src/lib/repositories/messageRepository.ts`
- `src/lib/models/messageModel.ts`
- `src/lib/stores/currentMessages.svelte.ts`
- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/components/messages/ThreadCard.svelte`
- `supabase/functions/send-push/index.ts`

Implementation sketch:

- Add nullable `muted_at` to `message_threads` and keep it owner-scoped like archive state.
- Resolve muted state from the recipient-side thread during push delivery so thread mute narrows push after the current organization-level preference gate.
- Keep the profile notification card honest by treating thread mute as a conversation-level override, not a replacement for organization-level message push settings.
- Keep mute persistent across sends so it behaves like an alert preference instead of a triage state.

### c — Invitation expiry and stale follow-through

Turn the current stale-invite review into a clearer invitation lifecycle.

Goals:

- distinguish between merely stale invites and truly expired invites
- add explicit expiry metadata and recovery copy for pending invites
- extend resend behavior so refreshed invites rotate the token and extend expiry consistently
- keep join-code access separate from direct-invite lifecycle rules
- keep smoke-mode invitation review and recovery deterministic with fixture-backed expired invites

Candidate files:

- `supabase/migrations/042_add_invitation_expiry.sql` (new)
- `src/lib/repositories/organizationRepository.ts`
- `src/lib/models/accessReviewModel.ts`
- `src/lib/components/organization/OrganizationAccessCard.svelte`
- `src/lib/components/organization/PendingInvitationsTable.svelte`
- `src/lib/stores/currentOrganization.svelte.ts`

Implementation sketch:

- Add explicit expiry metadata to invitation rows instead of inferring everything from `created_at`.
- Preserve the current stale-age badge as an attention signal, but add a stronger expired state when an invite can no longer be used.
- Keep resend as the main recovery path for expired invites.

### d — Role-aware hub section targeting

Let admins decide whether a hub section is visible to everyone or only to admins.

Goals:

- add a per-plugin visibility mode such as `all_members` or `admins_only`
- preserve the existing enabled and disabled behavior as the default shape
- derive member-visible hub sections centrally instead of sprinkling role checks through section components
- keep hub manage available to admins regardless of member-facing plugin visibility
- keep smoke-mode hub targeting fixture-backed so admin-only sections can be exercised without Supabase writes

Candidate files:

- `supabase/migrations/043_add_hub_plugin_visibility.sql` (new)
- `src/lib/repositories/hubRepository/plugins.ts`
- `src/lib/stores/pluginRegistry.ts`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/admin/PluginActivationCard.svelte`
- `src/routes/+page.svelte`

Implementation sketch:

- Extend the current `hub_plugins` state shape instead of creating a second permissions table.
- Keep the role model intentionally narrow: `admin` and `member` only.
- Make the root hub route the only place that decides which enabled sections render for the current member.

### e — Smoke, release handoff, and rollout safety

Close the release by validating the new lifecycle controls and documenting what shipped in `0.1.37`.

Goals:

- extend smoke coverage for archived and muted threads, invitation expiry states, and role-targeted hub sections
- add `docs/release-notes-0.1.37.md`
- update contributor-facing pointers only after the release notes and latest roadmap stay aligned
- verify any new migrations produce helpful runtime guidance when they are missing

Candidate files:

- `e2e/messages-smoke.spec.ts`
- `e2e/organization-smoke.spec.ts`
- `e2e/hub-smoke.spec.ts`
- `src/lib/demo/smokeFixtures.ts`
- `README.md`
- `docs/release-notes-0.1.37.md` (new)
- `docs/roadmap-0.1.38.md`
- `docs/roadmap-0.1.38-checklist.md`

Implementation sketch:

- Keep the smoke harness deterministic and local; archived, muted, and expired states should come from fixtures, not timing-dependent waits.
- Treat `0.1.37` release notes as operator-facing handoff, not marketing copy.
- Update README only during closeout so contributor guidance stays synchronized with the latest shipped release and active roadmap.

## Recommended order

If keeping `0.1.38` tight, start with:

1. `a` — message thread archive and recovery
2. `b` — muted direct-message threads and push narrowing
3. `c` — invitation expiry and stale follow-through
4. `d` — role-aware hub section targeting
5. `e` — smoke, release handoff, and rollout safety

That order lands the highest-friction inbox cleanup first, then narrows noisy delivery, then tightens organization-access operations and hub targeting before closeout.
