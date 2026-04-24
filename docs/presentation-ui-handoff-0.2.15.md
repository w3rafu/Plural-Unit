# Presentation UI Handoff: 0.2.15

This is the next presentation pass after 0.2.14.

0.2.14 shipped with materially better organization, directory, and profile screens, and without regressions on the volunteer, signup, check-in, or messages routes.

The latest screenshot review confirms that the remaining presentation risk is now much narrower.

0.2.15 should not be another broad polish pass.

It should be a home-first pass with only minimal shell follow-up when that follow-up directly improves the home screenshots.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.15-review/`:

- `tmp/screens-0.2.15-review/home-desktop.png`
- `tmp/screens-0.2.15-review/home-mobile.png`
- `tmp/screens-0.2.15-review/messages-desktop.png`
- `tmp/screens-0.2.15-review/directory-desktop.png`
- `tmp/screens-0.2.15-review/organization-members-desktop.png`
- `tmp/screens-0.2.15-review/profile-desktop.png`
- `tmp/screens-0.2.15-review/volunteers-desktop.png`
- `tmp/screens-0.2.15-review/volunteers-mobile.png`
- `tmp/screens-0.2.15-review/signup-desktop.png`
- `tmp/screens-0.2.15-review/signup-mobile.png`
- `tmp/screens-0.2.15-review/checkin-desktop.png`
- `tmp/screens-0.2.15-review/checkin-mobile.png`

## What is working now

- Messages desktop still reads like a finished workspace and does not need route-specific changes.
- Directory desktop now feels intentional enough at the current fixture density and should stay in the protection bucket.
- Organization members is materially clearer than before; the section state reads correctly and the roster is now the primary surface.
- Profile desktop reaches the actual settings work quickly enough and no longer wastes space on a separate support rail.
- Volunteers desktop and mobile remain strong, with the key staffing problem and schedule surfaces visible early.
- Signup desktop/mobile and check-in desktop/mobile are still presentation-safe and should remain untouched.
- The overall product family still feels consistent across dark and light routes.

## What still weakens the screenshots

- Home desktop still reads as two stacked summary slabs before the live product story begins: first `Hub focus`, then `Recent activity`, and only then broadcasts and events.
- Home mobile still spends too much first-fold height on summary and control surfaces before the first live hub module appears.
- The `Hub focus` card still tries to do too many jobs at once: headline counts, people context, and signal-strip analysis are all competing inside one large surface.
- `Recent activity` is calmer than it used to be, but for a single visible item it still occupies too much height and contrast.
- The home header controls are acceptable elsewhere, but on home they still compete with the main story because the page already opens with multiple summary layers.

## Core direction for 0.2.15

### Turn home into a live landing page instead of a summary stack

0.2.15 should keep the current visual language and component family.

It should:

- move one live content module into the first desktop reading rhythm
- compress `Hub focus` into a clearer, shallower decision surface
- stop `Recent activity` from behaving like a second hero panel
- reduce the amount of shell and support chrome that appears before live hub content on mobile
- leave the stable routes alone unless a home-driven shared change clearly helps them without churn

The working question for 0.2.15 should be:

Is this element helping the user act on the live hub right now, or is it only summarizing information that could sit behind the live modules instead?

If it is only summarizing, demote it before redesigning anything else.

## 0.2.15 priorities

### 1. Rebuild the home first fold around live content

What the screenshots show:

- On desktop, the first meaningful broadcast card begins well below two large dark overview surfaces.
- The events section starts even lower, which makes the home route read like a dashboard summary instead of the operational front door to the product.
- The strongest part of the product story is still too far down the page.

0.2.15 direction:

- Keep one top-level attention summary, but make it clearly secondary to at least one live content block.
- Bring either the pinned broadcast or the lead upcoming event into the first fold on desktop.
- Treat the home page more like a landing page for active work and less like an executive summary.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/hub/member/EventsSection.svelte`

Desired result:

- home opens with one compact attention layer and at least one clearly live hub module in the same first reading rhythm

### 2. Shrink `Hub focus` from a dashboard into a compact decision strip

What the screenshots show:

- `Hub focus` still combines three metric cards, a people panel, and a signal analysis card into one very large surface.
- The content is individually useful, but the current combination makes the page feel top-heavy.
- The user understands the counts quickly, but the card keeps spending space after the main point is already clear.

0.2.15 direction:

- Preserve the single headline and the most important counts.
- Reduce or relocate the `People in motion` and `Signal strip` content if they prevent live modules from arriving sooner.
- Prefer one clear summary row over a layered mini-dashboard.

Likely files:

- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/routes/+page.svelte`

Desired result:

- `Hub focus` communicates urgency quickly, then gets out of the way

### 3. Demote `Recent activity` into a true queue

What the screenshots show:

- `Recent activity` now shows only one visible item, but the card still has destination-panel weight.
- On both desktop and mobile, that card still delays the start of the broadcast and event surfaces.
- The `View all 5 items` call to action is useful, but the surrounding chrome is still too tall for the role the card now plays.

0.2.15 direction:

- Treat `Recent activity` as a queue or feed preview, not a featured panel.
- Compress the header, padding, and vertical spacing around the one visible item.
- Keep the route from feeling like it has two different hero sections.

Likely files:

- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/routes/+page.svelte`

Desired result:

- `Recent activity` reads as a quick operational queue beneath the top summary, not as a second headline surface

### 4. Only use shell changes if they directly help home

What the screenshots show:

- The shared header is acceptable on messages, directory, organization, and profile.
- On home, the `Manage hub` pill and surrounding utility controls still contribute to the crowded first fold because the route already starts with heavy summary content.

0.2.15 direction:

- Do not reopen shared shell work for its own sake.
- Only reduce action weight or adjust spacing when it clearly helps the home fold.
- Avoid new styling churn on routes that are already stable.

Likely files:

- `src/lib/components/ui/Header.svelte`
- `src/lib/components/ui/PageHeader.svelte`

Desired result:

- header controls stay usable, but home regains visual ownership of its first fold

### 5. Keep everything else in the protection bucket

What the screenshots show:

- Messages, directory, organization, profile, volunteers, signup, and check-in all look stable enough for presentation purposes.
- Reopening them now would likely create churn without moving the overall quality bar much.

0.2.15 direction:

- Leave these routes alone unless a home-driven shared change gives them a free improvement.

Likely files:

- none unless shared changes naturally touch them

Desired result:

- the next pass spends energy where the screenshots still clearly need it

## Recommended working order

1. Home desktop first-fold restructure
2. Home mobile first-fold reduction
3. `Hub focus` compaction
4. `Recent activity` queue demotion
5. Shared shell follow-up only if it directly improves home

## Validation checklist

- Rerun `node tmp/capture-0.2.15-review.mjs`
- Confirm desktop home shows a live broadcast or event module noticeably sooner
- Confirm mobile home reaches the first live hub module without two large summary slabs first
- Confirm `Hub focus` still communicates urgency after compaction
- Confirm `Recent activity` reads as a queue preview instead of a second hero card
- Confirm messages, directory, organization, profile, volunteers, signup, and check-in do not regress
- Preserve the exact `Deletion requests` label unless the organization capture script is changed too

## Definition of done

0.2.15 is successful when:

- home no longer reads as stacked summary trays before the real product surfaces begin
- desktop home brings live broadcast or event content into the first fold
- mobile home reaches live hub content meaningfully sooner
- the rest of the presentation routes remain stable

## Recommendation before implementation

- If only one route gets attention in 0.2.15, spend it entirely on home.
- If a second slice is needed, make it a shell-support adjustment only when it directly improves the home fold.
- Do not reopen directory, organization, profile, messages, volunteers, signup, or check-in as standalone work for this pass.

## Post-pass review

After the home-first 0.2.15 implementation pass, the screenshots changed in the right direction.

The main presentation problem from 0.2.14 was that home still read like stacked summary slabs before the live product surfaced.

That is no longer the dominant read.

### What improved

- Desktop home now reaches the pinned broadcast immediately after `Hub focus`, so the page starts telling a live product story much sooner.
- Mobile home now shows the first live broadcast card before the route falls back into lower-priority content.
- `Hub focus` is still substantial, but it no longer behaves like a full mini-dashboard that blocks everything beneath it.
- Messages, directory, organization, profile, volunteers, signup, and check-in all remain stable after the home changes.

### What is still slightly heavy

- The `Manage hub` pill is still somewhat visually strong on mobile home.

These are now optional polish points, not blockers.

### Recommendation before push

- If 0.2.15 is meant to stay tight, it is ready to ship without another home-only micro-pass.
- If one more tiny improvement is ever worth taking after this, spend it on the mobile home action weight before reopening any shell work.