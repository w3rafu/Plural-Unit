# 0.2 — Volunteers Prototype

**Branch:** `prototype/0.2`
**Goal:** ship a fixture-backed volunteers experience across the real app routes for investor screenshots, with no Supabase dependency and no separate demo route.

## Final product shape

Volunteers ships as a first-class hub plugin alongside broadcasts, events, and resources.

- Members see a `Volunteers` section directly on the real hub home at `/`.
- Coordinators get a dedicated volunteer dashboard at `/volunteers`.
- Day-of check-in lives at `/volunteers/[eventId]/checkin`.
- Public signup lives at `/signup/[eventId]`.

For this prototype branch, smoke mode is intentionally forced on in `src/lib/demo/smokeMode.ts` so the real app shell hydrates fixture data everywhere without login or backend wiring.

## Scope boundaries

- All volunteer data is hardcoded in `src/lib/demo/volunteerFixtures.ts`.
- Signup submission is local success-state only.
- Check-in toggles are local page state only.
- Coordinator actions like `New event`, `Public signup`, and export-style affordances are presentational.
- No migrations, repositories, or RPCs were added for volunteers in 0.2.
- The work is intentionally screenshot-driven: polished mobile and desktop surfaces matter more than persistence.

## Architecture

### Smoke-mode routing

- `src/lib/demo/smokeMode.ts` always returns `true` on this branch.
- `src/lib/demo/smokeFixtures.ts` enables the volunteers plugin in the seeded hub state.
- `src/routes/+layout.svelte` treats `/signup` and `/volunteers` as public-style routes by skipping `AuthGate` and `BottomNav` there, while keeping `/` on the real app shell.

### Plugin integration

- `volunteers` is registered in `src/lib/stores/pluginRegistry.ts` using the same visibility and enablement model as the existing hub plugins.
- `src/lib/stores/currentHub/state.ts` includes volunteers in the default plugin state map.
- `src/routes/+page.svelte` renders `VolunteersSection` inside the real plugin loop, so the home page reflects fixture data through the same surface investors would see later with live data.

## Files

### New fixtures

- `src/lib/demo/volunteerFixtures.ts` — volunteer events, shifts, contacts, and season stats

### New components

- `src/lib/components/volunteer/FillPill.svelte` — fill status badge
- `src/lib/components/volunteer/ShiftCard.svelte` — shift row with fill visuals
- `src/lib/components/volunteer/EventCard.svelte` — member-facing volunteer event card
- `src/lib/components/volunteer/NewEventSheet.svelte` — cosmetic create-event sheet
- `src/lib/components/volunteer/CheckInRow.svelte` — volunteer check-in row
- `src/lib/components/hub/member/VolunteersSection.svelte` — hub home volunteers section

### New routes

- `src/routes/volunteers/+page.svelte` — coordinator dashboard
- `src/routes/volunteers/[eventId]/checkin/+page.svelte` — day-of check-in
- `src/routes/signup/[eventId]/+page.svelte` — public signup and success state

### Modified files

- `src/lib/demo/smokeFixtures.ts` — volunteers plugin enabled in smoke fixtures
- `src/lib/demo/smokeMode.ts` — smoke mode forced on for the prototype branch
- `src/lib/stores/pluginRegistry.ts` — volunteers added to the plugin registry
- `src/lib/stores/currentHub/state.ts` — volunteers added to default hub state
- `src/routes/+layout.svelte` — root shell now exposes `/volunteers` and `/signup` as public-style routes
- `src/routes/+page.svelte` — real hub home renders the volunteers section

### Removed demo-only routes

- `src/routes/demo/+page.svelte`
- `src/routes/demo/directory/+page.svelte`
- `src/routes/demo/directory/[memberId]/+page.svelte`
- `src/routes/demo/hub/+page.svelte`
- `src/routes/demo/messages/+page.svelte`

## Screenshot targets

| Screen | URL | Mode |
| --- | --- | --- |
| Hub home with volunteers section | `/` | Dark |
| Volunteer coordinator dashboard | `/volunteers` | Dark |
| Volunteer check-in | `/volunteers/vol-event-1/checkin` | Dark |
| Public signup | `/signup/vol-event-1` | Light |
| Public signup success state | `/signup/vol-event-1` after submit | Light |
