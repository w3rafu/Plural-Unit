# 0.1.39 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Event lifecycle follow-through continues to respect existing event notification and push preference gates
- [ ] Existing in-app reminder behavior stays backward-compatible for current reminder rows
- [ ] Resource lifecycle changes stay additive for existing `hub_resources` rows
- [ ] Resource engagement stays lightweight and does not introduce a new permissions model
- [ ] Smoke-mode event and resource mutations stay local and fixture-backed
- [ ] Re-run `npm run check`, `npx vitest run`, and targeted Playwright smoke as each major slice lands

## a — Event cancellation and restore follow-through

- [ ] Update event notification copy to distinguish canceled and restored lifecycle states
- [ ] Trigger member-facing push follow-through when a visible event is canceled or restored
- [ ] Show explicit canceled-state guidance on the event detail route
- [ ] Keep cancel and restore behavior quiet for draft-only admin edits
- [ ] Add focused tests around event lifecycle notification copy and push triggering

## b — Reminder delivery channels and timing clarity

- [ ] Create `supabase/migrations/044_expand_hub_event_reminder_delivery_channel.sql`
- [ ] Extend reminder settings beyond the current `in_app`-only channel
- [ ] Wire reminder executions to push delivery when the selected channel allows it
- [ ] Keep admin reminder planning copy aligned with the actual delivery channel
- [ ] Verify existing reminder rows default safely to the current in-app behavior

## c — Resource lifecycle and admin history

- [ ] Create `supabase/migrations/045_add_hub_resource_lifecycle.sql`
- [ ] Extend resource rows beyond always-live and hard-delete behavior
- [ ] Keep member-facing resources limited to live rows only
- [ ] Add admin restore and history affordances for inactive resources
- [ ] Preserve current ordering behavior for live resource rows

## d — Resource engagement signals and cleanup guidance

- [ ] Create `supabase/migrations/046_add_hub_resource_engagement.sql`
- [ ] Record member resource opens through the repository and store layers
- [ ] Surface lightweight engagement signals in admin resource tools
- [ ] Add cleanup guidance for unused or stale resources
- [ ] Keep smoke-mode resource engagement local and deterministic

## e — Smoke, release handoff, and rollout safety

- [ ] Extend `e2e/hub-smoke.spec.ts` for event cancellation and restore follow-through
- [ ] Extend `e2e/hub-smoke.spec.ts` for reminder channel behavior and resource lifecycle or engagement flows
- [ ] Update smoke fixtures for canceled events, reminder channels, and resource engagement state
- [ ] Create `docs/release-notes-0.1.38.md`
- [ ] Update README only after the latest roadmap and release notes stay aligned
- [ ] Verify missing-migration guidance stays accurate for new reminder and resource schema changes
