# 0.2 Checklist

## Fixtures and state

- [x] `src/lib/demo/volunteerFixtures.ts` seeds volunteer events, shifts, contacts, and season stats
- [x] `src/lib/demo/smokeMode.ts` forces smoke mode on for the prototype branch
- [x] `src/lib/demo/smokeFixtures.ts` enables volunteers in the seeded hub state

## Plugin system

- [x] `src/lib/stores/pluginRegistry.ts` registers `volunteers` in the shared plugin model
- [x] `src/lib/stores/currentHub/state.ts` includes volunteers in default plugin state
- [x] `src/lib/stores/pluginRegistry.test.ts` covers the new plugin wiring

## Components

- [x] `src/lib/components/volunteer/FillPill.svelte`
- [x] `src/lib/components/volunteer/ShiftCard.svelte`
- [x] `src/lib/components/volunteer/EventCard.svelte`
- [x] `src/lib/components/volunteer/NewEventSheet.svelte`
- [x] `src/lib/components/volunteer/CheckInRow.svelte`
- [x] `src/lib/components/hub/member/VolunteersSection.svelte`

## Routes

- [x] `src/routes/+page.svelte` shows volunteers on the real hub home
- [x] `src/routes/volunteers/+page.svelte` ships the coordinator dashboard
- [x] `src/routes/volunteers/[eventId]/checkin/+page.svelte` ships the check-in flow
- [x] `src/routes/signup/[eventId]/+page.svelte` ships the public signup and success state
- [x] `src/routes/+layout.svelte` exposes `/volunteers` and `/signup` without auth chrome

## Route cleanup

- [x] Removed the separate `src/routes/demo/*` flow from the active prototype experience
- [x] Restored `/` as the real shell entry point with smoke-hydrated fixture data

## Verification

- [x] `npm run check` passes with no Svelte or TypeScript errors
- [x] `/` renders the member-facing volunteers section through the real hub home
- [x] `/volunteers` renders the coordinator dashboard
- [x] `/volunteers/vol-event-1/checkin` renders the day-of check-in flow
- [x] `/signup/vol-event-1` renders the public signup flow with a local success state
- [x] Mobile and desktop screenshot passes were captured against the live local app
