# 0.1.37 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Broadcast deep links preserve existing section-anchor fallbacks
- [ ] Admin-only broadcast context stays hidden from non-admin members
- [ ] Notification preference copy matches actual saved/runtime behavior
- [ ] Smoke-mode flows stay local and fixture-backed
- [ ] Re-run `npm run check`, `npx vitest run`, and targeted Playwright smoke as each major slice lands

## a — Broadcast detail route and deep linking

- [x] Create `src/routes/hub/broadcast/[broadcastId]/+page.svelte`
- [x] Create `BroadcastDetailCard.svelte`
- [x] Show full broadcast content, timing, and acknowledgment state on the route
- [x] Link member broadcast cards to the new detail route
- [x] Update alert-sheet primary actions for broadcasts to use the detail route
- [x] Update broadcast push notifications to target `/hub/broadcast/[broadcastId]`
- [x] Keep `/#hub-broadcasts` fallback navigation working

## b — Broadcast admin context and acknowledgment follow-up

- [x] Add an admin-only context block to `BroadcastDetailCard.svelte`
- [x] Show delivery status and schedule/expiry summary using existing hub selectors
- [x] Add a roster-aware acknowledgment follow-up summary
- [x] Create `BroadcastAcknowledgmentRosterPanel.svelte`
- [x] Load organization members when admin broadcast follow-up needs roster context
- [x] Add a clear “Open in manage” path for deeper edits and recovery work
- [x] Verify non-admin members do not see admin-only controls

## c — Notification preference clarity and channel boundaries

- [x] Rename or restructure the profile notification card so in-app and push concepts are not mixed
- [x] Separate hub alert preferences from device push controls in the UI
- [x] Clarify the direct-message preference label and description
- [x] Align success/error copy with the preferences actually being saved
- [x] Add or expand component tests for the clarified notification settings UI
- [x] Verify no schema change is needed before introducing any migration

## d — Smoke coverage expansion for broadcast, organization, directory, and messages

- [x] Extend `e2e/hub-smoke.spec.ts` to cover broadcast detail navigation
- [x] Create `e2e/organization-smoke.spec.ts`
- [x] Create `e2e/directory-smoke.spec.ts`
- [x] Create `e2e/messages-smoke.spec.ts`
- [x] Update smoke fixtures for broadcast detail, roster follow-up, and preference-state expectations
- [x] Verify message send/delete flows still stay local in smoke mode
- [x] Verify total smoke coverage now spans hub, profile, organization, directory, and messages

## e — Release-doc and onboarding refresh

- [x] Update README roadmap pointers to the newest release docs
- [x] Refresh README migration/runtime dependency notes for the latest release batch
- [x] Create `docs/release-notes-0.1.36.md`
- [x] Keep `docs/roadmap-0.1.37.md` and this checklist aligned as scope changes
- [x] Verify the newest roadmap appears first in contributor-facing guidance
