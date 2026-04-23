# Presentation UI Handoff: 0.2 Second Pass

This document is the handoff for the next visual branch after the first presentation polish pass.

The current app is clearly stronger than the original `prototype/0.2` baseline, but it is still not fully presentation-tight. The next branch should focus less on structural rescue work and more on visual attractiveness, density control, and making the app feel more intentionally designed at every layer.

## Goal

Make the app more visually attractive and tight without turning it into a redesign.

This pass should:

- keep the friendly, approachable product tone
- preserve the existing design system and token structure
- improve visual confidence, not just cleanliness
- reduce soft, repetitive gray surfaces that flatten screenshots
- tighten spacing, hierarchy, and chrome so the product feels more finished

## What changed in the first pass

The previous pass successfully improved the biggest structural issues:

- the desktop home top fold now has a real focal point
- volunteer dashboard hierarchy is stronger
- signup and check-in flows are clearer
- fixture content is more presentation-safe
- status chips and supporting cards are more intentional than before

That work should be preserved. The next pass should not re-open those wins unless a change clearly improves the final screenshot quality.

## Fresh screenshots to review

Use this newer screenshot set as the baseline for the next branch:

- [home-volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/home-volunteers-desktop.png)
- [home-volunteers-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/home-volunteers-mobile.png)
- [volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/volunteers-desktop.png)
- [volunteers-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/volunteers-mobile.png)
- [signup-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/signup-desktop.png)
- [signup-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/signup-mobile.png)
- [signup-success-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/signup-success-desktop.png)
- [signup-success-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/signup-success-mobile.png)
- [checkin-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/checkin-desktop.png)
- [checkin-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens-second-pass/checkin-mobile.png)

## Current assessment

### What is now working

- The home route reads like a real product surface rather than a blank shell.
- Volunteer status and CTA hierarchy are substantially clearer than before.
- The dashboard, signup, and check-in routes all feel coherent with each other.
- Fixture content is more human and less obviously generic.
- Mobile layouts are generally usable and easier to understand than the original baseline.

### What still weakens the presentation

- The app is still too monochrome in key screenshots. Many panels share nearly the same soft gray treatment, so the eye does not get enough contrast hierarchy.
- Desktop chrome still feels utilitarian. The header, action row, and especially the desktop home bottom navigation do not feel intentionally designed enough for a deck screenshot.
- Several screens still have too much dead air or oversize padding, especially signup desktop, signup-success desktop, and parts of the check-in and home supporting surfaces.
- Supporting cards are improved but still slightly anonymous. More of them need tighter copy, stronger internal composition, or more deliberate contrast.
- Some operational surfaces still feel too tall and list-heavy instead of compact and crisp.

## Highest-priority follow-up work

### 1. Tighten the shared shell and desktop chrome

This is the highest-value shared follow-up.

The product body has improved, but the shell still feels less designed than the route cards inside it.

Specific concerns:

- desktop home bottom navigation is visually heavy and presentation-awkward
- header controls feel functional, not memorable
- top bars on public volunteer routes are still generic
- spacing around shell-level elements is slightly loose

Likely files:

- [src/lib/components/ui/Header.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/Header.svelte)
- [src/lib/components/ui/BottomNav.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/BottomNav.svelte)
- [src/routes/+layout.svelte](/Users/rafa/Desktop/plural-unit/src/routes/+layout.svelte)
- [src/routes/layout.css](/Users/rafa/Desktop/plural-unit/src/routes/layout.css)

Target outcome:

- desktop shell chrome looks intentional, not merely functional
- bottom navigation no longer weakens desktop screenshots
- header/actions feel cleaner and more premium without becoming enterprise-like

### 2. Add more contrast hierarchy to hero vs supporting panels

The app still leans too heavily on one soft panel style.

Specific concerns:

- home hero and progress card are better, but still close in tone
- volunteer dashboard hero, coverage card, and supporting cards need slightly clearer separation
- signup left card and right form card are still too similar in visual weight
- check-in hero/support panels need a little more contrast or density distinction

Likely files:

- [src/lib/components/hub/member/HubOverviewCards.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubOverviewCards.svelte)
- [src/routes/volunteers/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/+page.svelte)
- [src/routes/signup/[eventId]/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/signup/[eventId]/+page.svelte)
- [src/routes/volunteers/[eventId]/checkin/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/[eventId]/checkin/+page.svelte)

Target outcome:

- primary panels feel clearly primary
- supporting cards feel subordinate, not equal-weight blocks
- screenshots gain depth and visual rhythm without needing loud color

### 3. Fix the remaining empty-space problems

This is now more important than broad layout work.

Specific concerns:

- signup desktop still leaves too much open space below the left event card
- signup-success desktop is especially sparse and does not feel like a finished screen
- check-in desktop still has more whitespace than it needs in the top fold and the list region
- home recent-activity rows are still slightly oversized for presentation use

Likely files:

- [src/routes/signup/[eventId]/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/signup/[eventId]/+page.svelte)
- [src/routes/volunteers/[eventId]/checkin/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/[eventId]/checkin/+page.svelte)
- [src/lib/components/hub/member/HubActivityFeed.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubActivityFeed.svelte)

Target outcome:

- fewer oversized empty zones in screenshots
- better use of width and vertical space
- more compact, editorial-looking composition

### 4. Tighten operational density on list-heavy surfaces

The check-in roster and some volunteer list regions still feel too padded and flat.

Specific concerns:

- check-in rows are readable but still taller than necessary
- volunteer schedule rows could feel a bit tighter and more information-dense
- some chips and counters still occupy more space than their informational value justifies

Likely files:

- [src/routes/volunteers/[eventId]/checkin/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/[eventId]/checkin/+page.svelte)
- [src/lib/components/volunteer/EventCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/volunteer/EventCard.svelte)
- [src/lib/components/volunteer/FillPill.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/volunteer/FillPill.svelte)

Target outcome:

- operational views feel sharper and faster to scan
- information density improves without looking cramped
- the app feels more mature and less like a lightly padded prototype

### 5. Do a real mobile tightening pass after desktop polish

Mobile is serviceable, but it is not yet notably elegant.

Specific concerns:

- top bars on volunteer public routes still feel plain
- some pill groupings wrap awkwardly
- hero sections on mobile are still a little tall
- the mobile home hero is better, but still soft and slightly overlong

Likely files:

- [src/routes/volunteers/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/+page.svelte)
- [src/routes/signup/[eventId]/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/signup/[eventId]/+page.svelte)
- [src/routes/volunteers/[eventId]/checkin/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/[eventId]/checkin/+page.svelte)
- [src/lib/components/ui/Header.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/Header.svelte)
- [src/lib/components/ui/BottomNav.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/BottomNav.svelte)

Target outcome:

- mobile screenshots look tighter and more deliberate
- CTA prominence survives smaller breakpoints
- mobile no longer feels like a compressed desktop layout

## Route-by-route notes

### Home

Current state:

- desktop top fold is much better
- still slightly too soft overall
- recent-activity cards are useful but visually repetitive
- desktop bottom nav hurts the screenshot more than it helps

What to improve next:

- strengthen shell chrome and reduce desktop nav awkwardness
- make recent activity feel more compact and more obviously interactive
- consider a slightly stronger visual distinction between hero and progress panels

### Volunteer dashboard

Current state:

- strong foundation
- main hero is readable and practical
- right sidebar and top volunteers card are still a little generic

What to improve next:

- tighten supporting-card copy and spacing
- make the coverage sidebar feel more designed and less like a default stat card
- increase contrast hierarchy between hero, schedule, and supporting info

### Signup

Current state:

- clearer than before
- good primary CTA structure
- selection state is understandable

What to improve next:

- reduce dead space on desktop
- make the left summary card work harder visually
- improve signup-success so it feels like a finished celebratory state, not just a sparse confirmation block

### Check-in

Current state:

- first fold is understandable and operational
- active-shift and progress surfaces are useful

What to improve next:

- tighten the roster density
- give the check-in list more visual precision and slightly less padding
- make the progress and active-shift relationship feel more composed on desktop

## Constraints

- Do not turn this into a redesign.
- Do not introduce route-specific one-off colors.
- Do not make the product feel more technical or enterprise-heavy.
- Keep the tone welcoming and useful.
- Preserve light and dark mode support.
- Prefer improving composition, density, and hierarchy over adding more content.

## Strong recommendation on scope

If time is limited, do only these four things:

1. Tighten shared shell chrome, especially desktop nav and header controls.
2. Reduce soft-gray sameness across hero and supporting cards.
3. Fix empty-space problems on signup and signup-success.
4. Compress check-in and activity list density.

That is the highest-value next branch.

## Suggested working order

1. Review the screenshots in `tmp/screens-second-pass/`.
2. Improve the shared shell and desktop chrome first.
3. Tighten hero/supporting-card hierarchy on home and volunteers.
4. Fix signup and signup-success composition.
5. Tighten check-in density and operational row design.
6. Re-capture screenshots into a new review folder before deciding whether more work is needed.

## Validation checklist

Before handing back, verify all of the following:

- `npm run check` passes.
- the desktop shell looks more intentional, especially on home
- signup-success no longer feels sparse or underdesigned
- check-in reads faster and tighter than the current second-pass screenshots
- mobile still works and looks more deliberate, not more crowded
- screenshots feel more attractive, not just more polished

## Definition of done

This next pass is successful when:

- the app feels visually tighter in both chrome and content
- the strongest screenshots look attractive, not merely competent
- supporting surfaces stop blending into one another
- signup-success and other weak moments no longer look unfinished
- the product still feels like the same friendly app, just more designed

## Notes for the next agent

- Start from the screenshots, not the code.
- The problem is no longer broad layout rescue; it is visual confidence and tightness.
- If a screen feels soft, first reduce repetition and dead space before adding more decoration.
- Shared shell improvements are now worth the risk if done conservatively.
- The best next branch will improve attractiveness through composition and restraint, not through louder styling.