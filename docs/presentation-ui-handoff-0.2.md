# Presentation UI Handoff: 0.2 Volunteers Prototype

This document is the quickest way to onboard a new agent for a presentation-focused UI polish pass on the `prototype/0.2` branch.

## Goal

The product is already credible enough to demo, but it is not yet visually strong enough to carry a presentation on UI alone.

The next agent should improve the presentation quality of the MVP without turning this into a broad redesign. The work should keep the app friendly, approachable, and easy for non-technical community leaders to understand.

## Product framing to preserve

- This is an adoption and partner-facing MVP, not a venture-style demo.
- The UI should feel welcoming and useful, not technical or enterprise-heavy.
- The product language should support "simple coordination platform" more than "operating system" or other abstract platform language.
- The volunteer flows should remain low-friction and easy to scan.

## Current assessment

The current prototype is presentation-safe, but not presentation-strong.

What is already working:

- The volunteer flows read as a real product rather than a raw prototype.
- The signup screen feels approachable and low-friction.
- The check-in screen feels operational and easy to understand.
- The visual language is coherent across routes.
- The overall tone is friendly, which matches the audience.

What currently weakens the presentation:

- Desktop composition on the home surface feels visually unbalanced.
- The UI is too soft in places, so screenshots can feel flat rather than memorable.
- Primary actions, supporting actions, and status indicators are not differentiated strongly enough.
- Some screens read more like polished product screens than presentation-ready hero surfaces.
- Fixture content is functional, but not yet curated tightly enough for storytelling.

## Screens to review first

Use these screenshots as the baseline before making changes:

- [home-volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-desktop.png)
- [home-volunteers-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-mobile.png)
- [volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/volunteers-desktop.png)
- [volunteers-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens/volunteers-mobile.png)
- [signup-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/signup-desktop.png)
- [signup-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens/signup-mobile.png)
- [signup-success-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/signup-success-desktop.png)
- [checkin-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/checkin-desktop.png)
- [checkin-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens/checkin-mobile.png)

## Highest-priority concerns

### 1. Fix desktop home composition first

This is the most important issue.

The top fold on the desktop home surface feels too open on the left and too light overall. It needs a clearer focal area so the page looks intentionally composed when shown in a deck or live demo.

Likely files:

- [src/routes/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/+page.svelte)
- [src/lib/components/hub/member/HubOverviewCards.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubOverviewCards.svelte)
- [src/lib/components/hub/member/VolunteersSection.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/VolunteersSection.svelte)

Target outcome:

- The top of the home screen has one obvious visual anchor.
- The first screenful reads well in a screenshot without needing explanation.
- The layout feels balanced on desktop, not merely spacious.

### 2. Increase visual hierarchy across primary surfaces

Buttons, badges, and inset panels are too close in tone right now. The next pass should make it easier to see what matters first.

Focus on:

- stronger separation between primary and secondary actions
- clearer emphasis for signup and volunteer-related CTAs
- more distinct status chips, counts, and progress indicators
- better contrast between hero-level surfaces and supporting cards

Likely files:

- [src/lib/components/hub/member/HubOverviewCards.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubOverviewCards.svelte)
- [src/routes/volunteers/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/+page.svelte)
- [src/routes/signup/[eventId]/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/signup/[eventId]/+page.svelte)
- [src/routes/volunteers/[eventId]/checkin/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/[eventId]/checkin/+page.svelte)

Target outcome:

- The eye lands quickly on the main action and the most important state.
- The UI feels more intentional and less uniformly muted.

### 3. Add one stronger brand moment without redesigning the app

The product is clean, but still slightly anonymous. Add one memorable visual signature that works inside the existing design system.

Possible directions:

- strengthen the hero card treatment on the home route
- make the header area feel more designed and less purely utilitarian
- use accent color, contrast, or supporting metrics more deliberately

Do not introduce a separate visual system just for one route.

Use the existing theme tokens and guidance in [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md).

### 4. Curate fixture copy and numbers for presentation

Some fixture content may be technically correct but not especially persuasive in screenshots.

Review the visible event names, shift labels, counts, statuses, and helper text for presentation value.

Goal:

- Every visible label should help tell a story quickly.
- Avoid filler copy that feels generated or generic.
- Prefer realistic, human-readable examples over dense admin wording.

Likely files:

- [src/lib/demo/volunteerFixtures.ts](/Users/rafa/Desktop/plural-unit/src/lib/demo/volunteerFixtures.ts)
- any volunteer route or component with exposed helper copy

### 5. Tighten mobile density only after desktop polish

Mobile is already in better shape than desktop for presentation. Do not start here.

If time remains after desktop work:

- tighten oversized spacing where screens feel tall without purpose
- check bottom-nav readability and header density
- make sure CTA prominence survives on smaller screens

## Constraints

- Do not turn this into a broad redesign.
- Do not break the shared design system to make one route look special.
- Do not add hardcoded one-off colors.
- Do not make the UI feel more technical in pursuit of polish.
- Keep both light and dark mode working.
- Preserve the product's friendly, approachable tone.

## Strong recommendation on scope

If time is limited, do only these three things:

1. Rework the desktop home top fold.
2. Strengthen primary CTA and status hierarchy.
3. Curate screenshot-facing fixture data and labels.

That is the highest-value presentation pass.

## Suggested working order

1. Review the current screenshots listed above.
2. Adjust the desktop home composition until the first fold feels presentation-ready.
3. Improve CTA and status hierarchy across volunteers, signup, and check-in.
4. Curate fixture copy and visible metrics for story value.
5. Re-capture desktop and mobile screenshots.
6. Only then decide whether any secondary polish pass is still needed.

## Validation checklist

Before handing back, verify all of the following:

- `npm run check` passes.
- Desktop screenshots look stronger than the current baseline, especially the home surface.
- Mobile screenshots still feel clear and approachable.
- Light and dark mode both remain usable.
- No route feels visually disconnected from the shared app shell.
- Primary actions are easier to identify at a glance.

## Definition of done

This polish pass is successful when:

- the home screen looks intentionally composed in a deck screenshot
- the volunteer surfaces feel friendlier and more memorable
- the UI still looks like the same product, not a one-off marketing mockup
- a non-technical viewer can understand what to do next on each key screen

## Notes for the next agent

- Start by comparing the current screenshots, not by reading large parts of the codebase.
- Fix the composition problem before tweaking colors or micro-details.
- Prefer improving the existing visual hierarchy over adding more UI.
- If a page looks "clean" but still weak in a presentation, it probably needs a stronger focal point, not more content.
- Keep the product feeling welcoming. Friendly is more important than flashy for this audience.
