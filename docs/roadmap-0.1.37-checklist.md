# 0.1.37 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Broadcast deep links preserve existing section-anchor fallbacks
- [ ] Admin-only broadcast context stays hidden from non-admin members
- [ ] Notification preference copy matches actual saved/runtime behavior
- [ ] Smoke-mode flows stay local and fixture-backed
- [ ] Re-run `npm run check`, `npx vitest run`, and targeted Playwright smoke as each major slice lands

## a — Broadcast detail route and deep linking

- [ ] Create `src/routes/hub/broadcast/[broadcastId]/+page.svelte`
- [ ] Create `BroadcastDetailCard.svelte`
- [ ] Show full broadcast content, timing, and acknowledgment state on the route
- [ ] Link member broadcast cards to the new detail route
- [ ] Update alert-sheet primary actions for broadcasts to use the detail route
- [ ] Update broadcast push notifications to target `/hub/broadcast/[broadcastId]`
- [ ] Keep `/#hub-broadcasts` fallback navigation working

## b — Broadcast admin context and acknowledgment follow-up

- [ ] Add an admin-only context block to `BroadcastDetailCard.svelte`
- [ ] Show delivery status and schedule/expiry summary using existing hub selectors
- [ ] Add a roster-aware acknowledgment follow-up summary
- [ ] Create `BroadcastAcknowledgmentRosterPanel.svelte`
- [ ] Load organization members when admin broadcast follow-up needs roster context
- [ ] Add a clear “Open in manage” path for deeper edits and recovery work
- [ ] Verify non-admin members do not see admin-only controls

## c — Notification preference clarity and channel boundaries

- [ ] Rename or restructure the profile notification card so in-app and push concepts are not mixed
- [ ] Separate hub alert preferences from device push controls in the UI
- [ ] Clarify the direct-message preference label and description
- [ ] Align success/error copy with the preferences actually being saved
- [ ] Add or expand component tests for the clarified notification settings UI
- [ ] Verify no schema change is needed before introducing any migration

## d — Smoke coverage expansion for broadcast, organization, directory, and messages

- [ ] Extend `e2e/hub-smoke.spec.ts` to cover broadcast detail navigation
- [ ] Create `e2e/organization-smoke.spec.ts`
- [ ] Create `e2e/directory-smoke.spec.ts`
- [ ] Create `e2e/messages-smoke.spec.ts`
- [ ] Update smoke fixtures for broadcast detail, roster follow-up, and preference-state expectations
- [ ] Verify message send/delete flows still stay local in smoke mode
- [ ] Verify total smoke coverage now spans hub, profile, organization, directory, and messages

## e — Release-doc and onboarding refresh

- [ ] Update README roadmap pointers to the newest release docs
- [ ] Refresh README migration/runtime dependency notes for the latest release batch
- [ ] Create `docs/release-notes-0.1.36.md`
- [ ] Keep `docs/roadmap-0.1.37.md` and this checklist aligned as scope changes
- [ ] Verify the newest roadmap appears first in contributor-facing guidance
