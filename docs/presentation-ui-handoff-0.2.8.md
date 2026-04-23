# Presentation UI Handoff: 0.2.8

This is the next presentation pass after 0.2.7.

0.2.7 made the product friendlier.

0.2.8 should make it more presentation-tight and more intentionally local to the demo story.

Not louder.

More deliberate.

The fresh screenshot set shows that the product is now coherent across routes, but several screens still spend too much space on soft framing, repeated context, and similarly weighted panels. The demo cast, theme controls, resources presentation, volunteer card density, and alerts model also still need a clearer point of view.

For 0.2.8, the goal is to improve screenshot impact by tightening composition, reducing dead air, simplifying the shell, and making the demo story feel intentionally chosen rather than inherited from earlier fixture passes.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.8-review/`:

- `tmp/screens-0.2.8-review/home-desktop.png`
- `tmp/screens-0.2.8-review/home-mobile.png`
- `tmp/screens-0.2.8-review/volunteers-desktop.png`
- `tmp/screens-0.2.8-review/volunteers-mobile.png`
- `tmp/screens-0.2.8-review/signup-desktop.png`
- `tmp/screens-0.2.8-review/signup-mobile.png`
- `tmp/screens-0.2.8-review/checkin-desktop.png`
- `tmp/screens-0.2.8-review/checkin-mobile.png`

## What is working now

- The product looks like one system across home, volunteers, signup, and check-in.
- The Old Town Cape identity is now consistent in the live app.
- Volunteer surfaces are more human than they were before, especially with portraits and larger date cues.
- The alerts and organization surfaces no longer feel like default admin scaffolding.
- Mobile is generally clearer than desktop in terms of first-read hierarchy.

## What still weakens the screenshots

- Desktop home still feels too evenly dark. The three lead panels are cleaner than before, but the focal object is not strong enough for a deck cover.
- The current demo names and portraits still do not reflect the new U.S.-born presentation story you want the branch to carry.
- The palette button makes the header feel like a demo control strip instead of product chrome, and the light theme still reads too gray instead of zinc.
- The resources widget still behaves like a vertical list of soft cards when it should read more like a curated resource board.
- Volunteer dashboard desktop still burns too much height in the hero block. The left half carries one headline and one small supporting box while a large quiet field remains below it.
- The volunteer cards still spend too much space on soft framing relative to how much information they actually carry.
- Signup desktop still has the clearest composition problem in the product. The left card does not earn its height, the right form card feels equally weighted, and the CTA is still too visually soft.
- The alerts sheet still looks like a polished drawer rather than the right UI pattern for the work it is trying to hold.
- Check-in desktop works operationally, but it is still list-heavy and slightly overpadded. The right rail is useful, but not visually tight enough to justify its width.
- Mobile survives well, but the top bars and hero stacks on the volunteer routes still feel plain and a little too tall.

## Core direction for 0.2.8

### Tighten composition and simplify the product story before adding more decoration

The next pass should not invent new widgets.

It should:

- replace inherited demo-story leftovers with a more intentional U.S.-born cast
- remove shell controls that read as demo tooling rather than product UI
- reduce oversized empty zones
- make hero vs support weight clearer
- turn plain resource lists into stronger visual modules
- compress list density where the task is operational
- make the strongest action win faster
- give the shell slightly more polish without turning it into a redesign
- rethink weak UI patterns instead of polishing them indefinitely

The question for every screen should be:

Does the first screenful make one strong visual claim, or does it just look tidy?

If it only looks tidy, it still needs work.

## 0.2.8 priorities

### 1. Change the demo cast to match the new U.S.-born story

This is a presentation-story correction, not just a fixture cleanup.

What needs to change:

- Demo names should be replaced across the visible smoke and preview state so the cast reads as U.S.-born.
- Portrait selection should be updated alongside the new names instead of keeping the old cast and only changing text.
- Organization, volunteer, message, and profile surfaces should all tell the same demographic story.
- Affiliation and helper copy should still sound local and plausible in a U.S. civic or community context.

0.2.8 direction:

- Update the visible demo cast in preview fixtures, smoke fixtures, volunteer fixtures, and portrait maps together.
- Do not leave mixed generations of names across routes.
- Treat this as one coordinated fixture pass, not isolated one-off renames.

Likely files:

- `src/lib/demo/ui-visual-fixtures.json`
- `src/lib/demo/smokeFixtures.ts`
- `src/lib/demo/volunteerFixtures.ts`
- `src/lib/demo/portraitAvatars.ts`

Desired result:

- the entire demo branch reads as one intentionally chosen U.S.-born cast instead of a stitched-together fixture history

### 2. Simplify the header and revise the default light theme

This is the highest-value shell cleanup in your feedback.

What the current UI shows:

- The palette button reads like a demo switch, not a product control.
- The header feels busier because light/dark and palette are both present.
- The light theme still reads too neutral gray when it should feel more clearly zinc-toned.
- Dark mode already has a clearer identity and should not inherit the zinc tinting.

0.2.8 direction:

- Remove the palette button from the header entirely.
- Keep light/dark mode support, but make the light theme zinc-forward by default.
- Leave dark mode in the current dark-gray family rather than giving it the same zinc treatment.
- Make sure the remaining header controls feel more product-like once the extra button is gone.

Likely files:

- `src/lib/components/ui/ThemeToggle.svelte`
- `src/lib/components/ui/Header.svelte`
- `src/lib/stores/currentTheme.svelte.ts`
- `src/themes/zinc.css`
- `src/themes/midnight.css`

Desired result:

- the shell feels cleaner, and the light theme looks intentionally zinc rather than generically gray

### 3. Turn resources into a grid and consider one cover-led resource card

This is now one of the clearest missed opportunities on home.

What the current UI suggests:

- Resources still behave like a stacked list of utility cards.
- The section does not use desktop width confidently.
- Every resource has the same visual weight, so none of them becomes a quick-entry anchor.

0.2.8 direction:

- Convert the resources widget into a grid on desktop instead of a one-column stack.
- Keep the cards compact and more editorial than administrative.
- Consider one lead resource card with a cover image or stronger visual header if the image improves understanding immediately.
- Avoid turning all resource cards into repeated thumbnails.

Likely files:

- `src/lib/components/hub/member/ResourcesSection.svelte`
- `src/routes/+page.svelte`
- `src/lib/demo/smokeFixtures.ts`

Desired result:

- resources reads like a curated board of useful links instead of a plain saved-links list

### 4. Tighten volunteer card density and remove the remaining dead air

This includes both the volunteer route hero and the cards themselves.

What the screenshots show:

- Volunteer cards still spend too much space on soft padding and repeated framing.
- The volunteer dashboard hero is still too tall before the schedule begins.
- The schedule is useful, but the cards can still do the same work in less height.

0.2.8 direction:

- Reduce vertical padding in the volunteer cards.
- Keep only the lines that help the next decision.
- Start the schedule sooner on desktop by cutting hero dead air.
- Preserve the stronger CTA hierarchy from 0.2.7, but make the cards feel sharper and faster.

Likely files:

- `src/lib/components/volunteer/EventCard.svelte`
- `src/lib/components/hub/member/VolunteersSection.svelte`
- `src/routes/volunteers/+page.svelte`

Desired result:

- volunteer surfaces feel more composed and less padded without losing warmth

### 5. Replace the current alerts-sheet approach

This should be treated as an approach change, not just another polish pass.

What the current UI shows:

- The alerts sheet is improved from before, but it still feels like a long drawer trying to hold too many kinds of work.
- The model is still text-heavy and panel-heavy for something that should probably feel quicker and more decisive.
- The interaction pattern may be wrong, not just the styling.

0.2.8 direction:

- Reconsider whether alerts should remain a right-side sheet at all.
- Explore a more compact inbox, popover, or focused panel model that surfaces the highest-priority work without opening a long drawer.
- If the sheet remains, its information model needs to be simplified more aggressively than in 0.2.7.
- Prioritize speed of triage over exhaustiveness.

Likely files:

- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/stores/currentHub.svelte.ts`
- `src/lib/components/hub/member/hubActivityModel.ts`

Desired result:

- alerts feels like the right UI pattern for the work instead of a drawer that has been repeatedly refined

### 6. Fix desktop signup after the shell and resources shifts are defined

This is the weakest major screenshot in the current set.

What the screenshot shows:

- The left event summary card is too tall for how little it says.
- The page still spends too much width and height on repeated context.
- The right form card has the same overall weight as the left summary card.
- The submit button is clearer than before, but it still does not feel like the visual destination of the screen.

0.2.8 direction:

- Shorten the left card substantially on desktop.
- Move only the most decision-relevant event details into the persistent summary.
- Make the form card feel more obviously primary than the left summary card.
- Pull the submit area up slightly by tightening the lower field spacing.
- Consider making the selected shift state more concise so the card reaches the CTA faster.

Likely files:

- `src/routes/signup/[eventId]/+page.svelte`

Desired result:

- signup desktop feels direct and low-friction instead of polite and slightly sparse

### 7. Reduce volunteer dashboard hero dead air after the card-density pass

This is the next clearest desktop issue.

What the screenshot shows:

- The headline is strong, but the left hero panel stays tall after the useful content is already over.
- The right-side stat grid is doing more work than the main left column.
- The schedule begins too far below the fold.
- The featured portrait card helps, but the top section still feels vertically unbalanced.

0.2.8 direction:

- Collapse the volunteer hero height by tightening vertical padding and reducing the empty area under the “Why this matters” block.
- Either let the left hero carry one more meaningful object, or shorten the whole hero so the schedule starts sooner.
- Make the right-side stat rail feel like support, not the densest part of the page.
- Give the schedule section a little more authority relative to the hero once it appears.

Likely files:

- `src/routes/volunteers/+page.svelte`

Desired result:

- volunteers desktop feels like a working board, not a hero card sitting above a second page

### 8. Strengthen the home cover moment after resources are rebuilt

Home is better, but it still is not the strongest possible deck screenshot.

What the screenshot shows:

- The first fold is organized, but the three top panels are too similar in tone.
- The Recent activity card is useful, but it still feels slightly detached from the main focus block instead of completing one composed story.
- The Broadcasts section starts well enough, but the top fold still wins more on cleanliness than on visual conviction.

0.2.8 direction:

- Increase contrast separation between the lead hub-focus card and its support cards.
- Give the first fold one unmistakable anchor and two quieter satellites.
- Tighten the relationship between the hub-focus card and the recent activity panel so the whole row reads like one composition.
- Reduce shell distraction around the top fold where possible.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`

Desired result:

- home desktop feels presentation-ready, not just well organized

### 9. Tighten check-in density

Check-in is credible, but still slightly too tall and polite.

What the screenshot shows:

- Pending-arrival rows are readable, but taller than they need to be.
- The hero and right rail are clear, but the page still spends more height on framing than on rapid roster scanning.
- The progress rail is useful, but not visually distinct enough from the other support card.

0.2.8 direction:

- Reduce row height in the pending and checked-in lists.
- Trim secondary metadata so the eye lands on name, arrival state, and action faster.
- Tighten the shift pills so more of them read cleanly in one scan.
- Sharpen the contrast between the live-progress card and the up-next card.

Likely files:

- `src/routes/volunteers/[eventId]/checkin/+page.svelte`

Desired result:

- check-in feels faster and more operational without losing clarity

### 10. Do a shell-polish pass only where screenshots still feel plain

The shared shell is no longer broken, but it should still be tightened after the palette removal and theme decision land.

What the screenshots show:

- Home desktop header is acceptable, but still not especially memorable.
- Public volunteer route top bars are functional, but plain on both desktop and mobile.
- Mobile header and action groupings can still feel a bit cramped or mechanical once the extra palette control is removed.

0.2.8 direction:

- Tighten public route top bars so they feel more intentional.
- Let the simplified header feel cleaner and more exact after the palette button is gone.
- Keep the main shell restrained, but improve spacing and visual precision where the chrome still reads as default.
- Avoid reopening the one-row desktop header unless a specific screenshot proves it is failing.

Likely files:

- `src/lib/components/ui/Header.svelte`
- `src/lib/components/ui/ThemeToggle.svelte`
- `src/routes/volunteers/+page.svelte`
- `src/routes/volunteers/[eventId]/checkin/+page.svelte`
- `src/routes/signup/[eventId]/+page.svelte`

Desired result:

- shell chrome supports the screenshots instead of merely staying out of the way

## Mobile notes

Mobile is generally in better shape than desktop.

Still worth tightening:

- volunteer and check-in top bars can become slightly more compact
- some hero stacks are still taller than they need to be
- signup mobile remains usable, but the full-page flow is longer than necessary because too much context appears before and after the form task
- resources should collapse into a mobile pattern that still feels curated rather than reverting to a bland stack

Mobile should be a follow-up after the desktop composition issues above.

## Recommended working order

1. Demo cast rename and portrait replacement
2. Header palette removal and light-theme zinc revision
3. Resources widget grid and lead-card experiment
4. Volunteer card density and dashboard hero height
5. Alerts-sheet replacement or aggressive simplification
6. Signup desktop composition
7. Home top-fold contrast and composition
8. Check-in density and right-rail contrast
9. Mobile tightening pass
10. Shell polish after the palette removal lands
11. Fresh screenshot recapture into a new review folder

## Validation checklist

Before handing back, verify all of the following:

- `npm run check` passes
- the visible demo cast has been replaced consistently across the presentation routes
- the palette button is gone and the light theme reads zinc by default
- resources reads as a grid or curated board, not a vertical saved-links list
- volunteer cards no longer feel overpadded
- alerts uses a stronger interaction model than the current sheet, or the sheet has been radically simplified
- signup desktop reaches the CTA faster and feels less sparse
- volunteer desktop starts the schedule sooner or uses the hero height more effectively
- home desktop has a clearer visual anchor for a deck screenshot
- check-in desktop scans faster with tighter rows
- mobile still feels clear and approachable after any density reductions

## Definition of done

0.2.8 is successful when:

- the desktop screenshots feel more composed than merely clean
- the demo story feels intentionally cast and locally grounded
- the shell no longer exposes demo-style theme controls
- resources and alerts use patterns that feel chosen, not inherited
- signup and volunteer dashboard no longer waste the most obvious space
- check-in looks faster and more mature
- the app keeps its friendly tone while reading more confidently in presentation captures
