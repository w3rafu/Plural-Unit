# 0.1.38 release notes

**Theme:** Thread hygiene, invitation follow-through, and role-aware hub access.

## What shipped

- **Message thread archive and recovery**
  - Members can archive any direct-message thread owner-side via `message_threads.archived_at`; archived threads disappear from the default inbox buckets but remain searchable and recoverable.
  - Sending a new message to an archived thread clears `archived_at` automatically on both the text and image send RPCs so resumed conversations re-enter active triage.
  - Smoke fixtures seed one archived Yara Haddad thread so the archive restore path stays covered by Playwright.

- **Message thread mute and push narrowing**
  - Members can mute any thread owner-side via `message_threads.muted_at`; muted state shows in the inbox and the active thread header.
  - `send-push` now skips direct-message push delivery when the recipient's mirror thread exists and carries a non-null `muted_at`; the organization-level `message_enabled` gate still applies first.
  - Mute persists across new sends so it behaves like a preference rather than a one-time triage action.

- **Invitation expiry and lifecycle clarity**
  - `organization_invitations` now carries an explicit `expires_at` column set at send time.
  - Admin invitation review separates active `pending` rows from `expired` rows; stale-age labeling continues to work alongside the stricter expired state.
  - Resending an expired or stale invite resets `status`, `created_at`, and `expires_at` so the refreshed link is fully usable again.
  - Smoke-mode resend recovers expired invites locally in-memory without calling Supabase.

- **Role-aware hub section targeting**
  - `hub_plugins` now carries a `visibility_mode` column (`all_members` or `admins_only`).
  - Hub plugin state is now `{ isEnabled, visibility }` throughout the plugin registry and store.
  - The root hub route derives member-facing section visibility from plugin state so admins can hide full sections from general members without disabling the section for themselves.
  - Smoke fixtures seed the `events` plugin as `admins_only` so audience-targeting coverage is exercised on every Playwright run.

- **Smoke coverage and contributor guidance**
  - Playwright smoke coverage added for archived threads, muted threads, expired invitations, and admin-only hub sections.
  - `docs/release-notes-0.1.37.md` was added during closeout.
  - README was refreshed to point contributors at the `0.1.38` roadmap and the `0.1.37` shipped handoff.

## Required migrations

Apply the following migrations before deploying this release. Environments that went through 0.1.37 already have `039_soft_delete_messages.sql` in place.

1. `040_add_message_thread_archive.sql` — adds nullable `archived_at` to `message_threads`; both text and image send RPCs updated to clear it on send.
2. `041_add_message_thread_mute.sql` — adds nullable `muted_at` to `message_threads`; `send-push` reads recipient mirror thread for mute state.
3. `042_add_invitation_expiry.sql` — adds `expires_at` to `organization_invitations` with backfill for existing rows.
4. `043_add_hub_plugin_visibility.sql` — adds `visibility_mode` to `hub_plugins` with `all_members` as default.

## Operational notes

- Mute state is owner-scoped. Muting a thread on your side does not change the counterpart's thread or suppress outbound push from your account.
- Invitation `expires_at` is set at send time. Rows inserted before migration `042` are backfilled based on `created_at`. Resend always rotates the expiry forward.
- Hub plugin visibility only affects member-facing rendering on the root hub route. Admins always see enabled sections in manage regardless of visibility mode.
- Smoke failures for these flows typically indicate a missing smoke-mode local branch in a store mutation rather than a production data change.

## Related docs

- Current planning: [docs/roadmap-0.1.39.md](./roadmap-0.1.39.md)
- Current execution checklist: [docs/roadmap-0.1.39-checklist.md](./roadmap-0.1.39-checklist.md)
