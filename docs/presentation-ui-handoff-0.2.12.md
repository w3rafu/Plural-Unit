# Presentation UI Handoff: 0.2.12

This is the next presentation pass after 0.2.11.

0.2.11 got the product to a more coherent first-fold rhythm.

0.2.12 should focus on the places where the screenshots still feel slightly underfilled, over-segmented, or one card too tall before the real work takes over.

The fresh review set shows that the app now holds together well across hub, admin, volunteer, profile, and signup routes, but a few desktop screens still spend too much authority on framing surfaces instead of the work surface itself.

For 0.2.12, the job is to finish composition discipline.

It is not to reopen the visual system.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.12-review/`:

- `tmp/screens-0.2.12-review/home-desktop.png`
- `tmp/screens-0.2.12-review/home-mobile.png`
- `tmp/screens-0.2.12-review/messages-desktop.png`
- `tmp/screens-0.2.12-review/directory-desktop.png`
- `tmp/screens-0.2.12-review/organization-members-desktop.png`
- `tmp/screens-0.2.12-review/profile-desktop.png`
- `tmp/screens-0.2.12-review/volunteers-desktop.png`
- `tmp/screens-0.2.12-review/volunteers-mobile.png`
- `tmp/screens-0.2.12-review/signup-desktop.png`
- `tmp/screens-0.2.12-review/signup-mobile.png`
- `tmp/screens-0.2.12-review/checkin-desktop.png`
- `tmp/screens-0.2.12-review/checkin-mobile.png`

## What is working now

- Messages desktop is finally stable enough that the thread feels active from the top instead of abandoned.
- Volunteer and check-in routes now read like real operational boards instead of hero pages with work attached later.
- Signup remains clean, calm, and credible on both desktop and mobile.
- Organization and directory now share a believable management rhythm.
- Mobile check-in is strong and mobile home still feels coherent.
- The product now presents as one application rather than a set of individually polished routes.

## What still weakens the screenshots

- Home desktop still leaves too much empty field between the top card cluster and the first live broadcast.
- Signal check and recent activity on home still behave like equal-height destination cards instead of compressed support rails.
- Directory desktop still underfills the lower half of the frame because the card grid runs out of density before the canvas does.
- Organization desktop is cleaner than before, but the overview, section band, management strip, and roster still read as slightly too many stacked layers.
- Profile desktop still feels like a tall top summary followed by a second act, with notifications starting too low.
- Volunteer desktop is good enough to ship, but the header still carries more explanatory mass than the schedule needs.
- Check-in desktop is similar: the live-progress block is cleaner, but the top band can still tighten so the list claims more authority sooner.
- Volunteers mobile still spends a bit too much height on summary before the schedule starts.

## Core direction for 0.2.12

### Finish desktop occupancy

0.2.12 should keep the same tone, typography, and component language.

It should:

- pull primary lists higher without introducing new wrapper bands
- reduce vertical slack in supporting cards that already proved their value
- make wide desktop canvases show more live content before they show more structure
- preserve the routes that are already healthy instead of restyling them again
- only spend mobile budget where a desktop fix naturally improves mobile too

The working question for each route should be:

Does this screenshot spend its first fold on active content, or on context about the content?

If context still wins, the route needs one more pass.

## 0.2.12 priorities

### 1. Finish home desktop first-fold fit

What the screenshots show:

- The top hub-focus cluster is improved, but broadcasts still start later than they should on a 1440px capture.
- Signal check is useful, yet it still reads too much like a full card rather than a compact utility rail.
- Recent activity still uses enough vertical room that it competes with the primary broadcast surface.

0.2.12 direction:

- Shorten the hub-focus lower half again.
- Compress signal check into a more obviously supporting block.
- Tighten recent activity rows so the first broadcast climbs materially higher.
- Treat home as a work surface with support context, not three equal columns of attention.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`

Desired result:

- home desktop reaches the first live broadcast sooner and feels less top-heavy

### 2. Make organization and directory feel fully occupied

What the screenshots show:

- Directory still has a large quiet lower field because the roster density runs out before the frame does.
- Organization now has the right hierarchy, but still reads as overview band, section band, management band, then roster, rather than one progressively compressed admin surface.
- Both are close enough that the remaining work is occupancy and cadence, not conceptual layout.

0.2.12 direction:

- Tighten directory card height and metadata spacing one more round, or adjust the desktop card rhythm so the grid holds the canvas longer.
- Collapse the perceived separation between the organization section band and the management controls.
- Reduce the visual gap between deletion review, filters, and the first roster rows.
- Make the first member rows feel like the clear destination earlier in the page.

Likely files:

- `src/lib/components/directory/DirectoryRoster.svelte`
- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/DeletionRequestsCard.svelte`

Desired result:

- directory and organization both feel filled by people, not by surrounding chrome

### 3. Rebalance profile around notifications

What the screenshots show:

- The top profile summary is calmer than before, but it still claims a disproportionate amount of height.
- Security still dominates the right rail relative to its day-to-day importance.
- Notifications begin too low for a route that is supposed to read like one workspace.

0.2.12 direction:

- Flatten the top summary another small step.
- Reduce the vertical weight of the support and security blocks.
- Pull the notification card stack upward so preferences begin in the first fold.
- Preserve the route’s calm tone while cutting the sense of a top act and lower act.

Likely files:

- `src/routes/profile/+page.svelte`
- `src/lib/components/profile/ProfileSection.svelte`
- `src/lib/components/profile/ProfileSecurityCard.svelte`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`

Desired result:

- profile reads like a single working surface with notifications visible earlier

### 4. Trim volunteer and check-in header weight, but do not reopen the boards

What the screenshots show:

- Volunteer desktop still gives a little too much room to the summary band before the schedule fully owns the page.
- Check-in desktop still spends a little too much vertical room in the header plus live-progress composition.
- Both routes are much healthier than before and no longer justify broad rewrites.

0.2.12 direction:

- Make one more compacting pass on the top bands only.
- Pull the board and list content slightly higher without changing the overall route structure.
- Keep the board snapshot and live-progress utilities, but make them lighter support surfaces.

Likely files:

- `src/routes/volunteers/+page.svelte`
- `src/routes/volunteers/[eventId]/checkin/+page.svelte`

Desired result:

- the schedule and check-in list become the obvious first destination even faster

### 5. Treat messages, signup, and most mobile surfaces as protection routes

What the screenshots show:

- Messages desktop is in a good place and no longer needs major pass budget.
- Signup desktop and mobile are stable and visually convincing.
- Check-in mobile is strong.
- Home mobile and volunteers mobile are acceptable, with volunteers mobile the only one that still has minor top-heaviness.

0.2.12 direction:

- Do not reopen messages unless another desktop change naturally improves it.
- Leave signup alone except for incidental polish from shared component edits.
- Keep mobile changes surgical, with volunteers mobile the only route worth small follow-up trimming.

Likely files:

- none unless a shared desktop edit naturally improves them too

Desired result:

- stable routes stay stable while remaining desktop occupancy issues catch up

## Recommended working order

1. Home desktop first-fold fit
2. Organization and directory occupancy pass
3. Profile first-fold rebalance
4. Volunteer and check-in header trim
5. Only then consider opportunistic volunteers-mobile cleanup

## Validation checklist

- Rerun `node tmp/capture-0.2.12-review.mjs`
- Rerun `npm run check` after implementation work
- Compare desktop first-fold fit on home, directory, organization, profile, volunteers, and check-in at 1440px width
- Confirm messages, signup, and check-in mobile remain stable after any shared component edits
- Preserve the exact `Deletion requests` label unless the capture script is updated too, because the organization screenshot prepare step still waits for that text

## Definition of done

0.2.12 is successful when:

- home shows broadcasts materially earlier on desktop
- directory and organization feel occupied by roster content rather than layered controls
- profile brings notifications into the first fold without feeling cramped
- volunteer and check-in keep their board clarity while trimming the last header excess
- messages, signup, and the already-healthy mobile routes remain stable
