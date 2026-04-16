# 0.1.38 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Message thread archive and mute remain owner-scoped
- [ ] Thread-level mute only narrows direct-message push delivery
- [ ] Invitation expiry changes stay backward-compatible for existing pending rows
- [ ] Hub section targeting reuses the existing `admin` and `member` roles only
- [ ] Smoke-mode thread, invite, and hub-access mutations stay local and fixture-backed
- [ ] Re-run `npm run check`, `npx vitest run`, and targeted Playwright smoke as each major slice lands

## a — Message thread archive and recovery

- [x] Create `supabase/migrations/040_add_message_thread_archive.sql`
- [x] Add repository support for archiving and unarchiving message threads
- [x] Extend the message-thread model with archive state
- [x] Keep archived threads out of the default inbox sections
- [x] Add a recovery affordance for archived threads without introducing a new route
- [x] Verify archive state does not delete history or break unread counts

## b — Muted direct-message threads and push narrowing

- [x] Create `supabase/migrations/041_add_message_thread_mute.sql`
- [x] Add repository and store support for muting and unmuting a thread
- [x] Show muted state in the thread header and inbox surfaces
- [x] Update `supabase/functions/send-push/index.ts` to skip message push when the recipient thread is muted
- [x] Keep organization-level message notification settings unchanged as the broader gate
- [x] Verify muted threads still load and track unread state correctly in-app

## c — Invitation expiry and stale follow-through

- [x] Create `supabase/migrations/042_add_invitation_expiry.sql`
- [x] Extend invitation repository and store payloads with expiry metadata
- [x] Distinguish stale invites from expired invites in access-review helpers
- [x] Update invitation review UI with expiry badges and recovery copy
- [x] Keep resend as the main recovery path for expired invites
- [x] Verify existing pending invitations stay usable or migrate safely

## d — Role-aware hub section targeting

- [ ] Create `supabase/migrations/043_add_hub_plugin_visibility.sql`
- [ ] Extend plugin rows beyond simple enabled and disabled state
- [ ] Update admin plugin controls to choose the visibility mode per section
- [ ] Derive member-visible hub sections centrally in the root hub route
- [ ] Keep hub manage available to admins regardless of member-facing targeting
- [ ] Verify non-admin members only see sections allowed by both enablement and visibility mode

## e — Smoke, release handoff, and rollout safety

- [ ] Extend `e2e/messages-smoke.spec.ts` for archive and mute flows
- [x] Extend `e2e/organization-smoke.spec.ts` for invitation expiry and resend recovery
- [ ] Extend `e2e/hub-smoke.spec.ts` for role-targeted section visibility
- [x] Update smoke fixtures for archived threads, muted threads, and expired invitations
- [ ] Create `docs/release-notes-0.1.37.md`
- [ ] Update README only after the latest roadmap and release notes stay aligned
- [ ] Verify missing-migration guidance stays accurate for any new thread, invite, or plugin-visibility schema changes
