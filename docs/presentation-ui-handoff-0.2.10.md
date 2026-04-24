# Presentation UI Handoff: 0.2.10

This is the next presentation pass after 0.2.9.

0.2.9 solved most of the hierarchy problems.

0.2.10 should make desktop use its width honestly.

Not by adding more cards.

By leaving less dead air between the user and the work.

The fresh review set shows a product that now feels coherent across routes, but several desktop screens still spend too much of the first fold on wrapper bands, empty canvas, or support rails that no longer need this much authority.

For 0.2.10, the job is to convert that cleaner hierarchy into tighter working density.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.10-review/`:

- `tmp/screens-0.2.10-review/home-desktop.png`
- `tmp/screens-0.2.10-review/home-mobile.png`
- `tmp/screens-0.2.10-review/messages-desktop.png`
- `tmp/screens-0.2.10-review/directory-desktop.png`
- `tmp/screens-0.2.10-review/organization-members-desktop.png`
- `tmp/screens-0.2.10-review/profile-desktop.png`
- `tmp/screens-0.2.10-review/volunteers-desktop.png`
- `tmp/screens-0.2.10-review/volunteers-mobile.png`
- `tmp/screens-0.2.10-review/signup-desktop.png`
- `tmp/screens-0.2.10-review/signup-mobile.png`
- `tmp/screens-0.2.10-review/checkin-desktop.png`
- `tmp/screens-0.2.10-review/checkin-mobile.png`

## What is working now

- Signup is no longer the weak presentation route. Desktop and mobile both read clearly and the CTA is easy to find.
- Home mobile still has stronger first-read clarity than desktop because the lead card dominates naturally in the stack.
- Directory now feels human and believable. The cards read like people, not placeholders.
- Organization members is much cleaner than the earlier passes and the roster finally feels like the point of the page.
- Check-in mobile is operational and easy to scan.
- The product now looks like one system across member, admin, volunteer, signup, and profile surfaces.

## What still weakens the screenshots

- Volunteer dashboard desktop still leaves a large empty lower-left field after the useful hero content ends. The schedule starts in a better place than before, but the hero still feels taller than its information.
- The volunteer dashboard right rail still spends too much weight on the featured volunteer portrait and support stack compared to the schedule itself.
- Check-in desktop still has a wide hero with a lot of unused right-side space, while the live-progress rail continues to take authority away from the roster.
- Home desktop has a clear lead card now, but the hub-focus block is still too tall and leaves dead air before broadcasts begin.
- Messages desktop still gives too much of the thread pane to empty canvas above the first visible message cluster. It is calmer, but it is still not using the workspace well.
- Organization members still spends too many horizontal bands on section controls, deletion review, summary pills, search, and filters before the roster becomes dominant.
- Directory is more consistent now, but the cards are still a little too tall for a 1440px desktop capture, so the page shows fewer people than it could.
- Profile still uses too little desktop width and pushes notifications lower than necessary. The route looks tidy, but not fully composed for the screenshot.
- Mobile home and volunteers still carry a little more top chrome than the tightened content below them really needs, but these are now secondary issues.

## Core direction for 0.2.10

### Turn clean hierarchy into working density

The next pass should not reopen the whole design language.

It should:

- move the real task surface higher on desktop routes
- reduce empty canvas inside oversized lead cards
- spend less width on support rails once hierarchy is already clear
- merge stacked admin controls where they can read as one management strip
- show more real rows or real people inside the same viewport
- keep mobile edits surgical and avoid rebreaking the routes that already work

The question for every route should be:

Does this desktop screenshot spend most of its first fold on the actual work, or on the packaging around the work?

If the packaging still wins, it is not finished.

## 0.2.10 priorities

### 1. Make volunteer and check-in desktop feel like working boards

These are the highest-value improvements.

What the screenshots show:

- Volunteer desktop still has the most obvious empty field in the review set.
- The hero has one good note and the right rail has usable stats, but the lower-left half still goes quiet before the schedule arrives.
- The reliable-volunteers rail still competes too hard with the schedule.
- Check-in desktop has the same family problem: a broad top card, a support rail, and a roster that still starts lower than it should.

0.2.10 direction:

- Collapse the volunteer hero further and let the schedule reach higher into the first fold.
- Demote the reliable-volunteers panel so it reads as support, not as a second lead surface.
- Treat volunteer and check-in as operational boards first, not as hero pages with later workspaces.
- In check-in, either shrink the right rail or pull more of its progress summary into the main roster header so the roster claims the fold.

Likely files:

- `src/routes/volunteers/+page.svelte`
- `src/routes/volunteers/[eventId]/checkin/+page.svelte`
- `src/lib/components/volunteer/EventCard.svelte`

Desired result:

- volunteer and check-in desktop both look like the work starts immediately

### 2. Finish the home desktop compression pass

Home is close, but it still reads taller than necessary.

What the screenshots show:

- Hub focus now wins correctly, but the card is still too tall for its content.
- The people-in-motion area and lower support spacing still create a dead field before broadcasts.
- Recent activity works, but the card still reads a little long and article-like for a side satellite.

0.2.10 direction:

- Shorten the lead card without weakening its authority.
- Compress or restructure the lower portion of hub focus so broadcasts begin higher.
- Tighten the recent-activity card so it behaves more like a compact operational queue than a full secondary panel.
- Keep mobile changes light; the desktop surface is the real issue now.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`

Desired result:

- home desktop feels edited to fit, not just edited to look orderly

### 3. Stop messages desktop from feeling half empty

Messages now has one remaining screenshot problem.

What the screenshots show:

- The selected thread is clear and the composer is better.
- The problem is the large quiet field above the first visible date divider and message cluster.
- The route still reads like the conversation starts too late in the viewport.

0.2.10 direction:

- Pull the visible conversation higher in the workspace.
- Reduce the amount of empty canvas between the thread header and the first message cluster.
- Keep the bottom-anchored behavior, but make the composition feel intentional rather than simply sparse.
- If needed, use a compact thread-context block instead of blank space.

Likely files:

- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/components/messages/MessageComposer.svelte`
- `src/lib/components/messages/MessageWorkspace.svelte`

Desired result:

- messages desktop feels active even when the thread is short

### 4. Get organization members and directory to show more people sooner

These surfaces are no longer messy, but they still spend too much area before the scan target arrives.

What the screenshots show:

- Organization members still stacks section control, deletion requests, summary chips, search, and filters into too many layers before the roster gets real authority.
- The active state in segmented controls and filter chips is still softer than it should be for screenshots.
- Directory cards now share a rhythm, but they are still tall enough that the page shows fewer people than it could at desktop width.

0.2.10 direction:

- Merge roster-management controls into fewer rows.
- Make deletion review more compact or more inline so it does not own a whole band.
- Strengthen selected states in the segmented controls and filter chips.
- Reduce directory card height or reflow the grid to show more people in the same capture.

Likely files:

- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/DeletionRequestsCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`
- `src/lib/components/directory/DirectoryRoster.svelte`

Desired result:

- admin and directory screens become scan surfaces first and framing surfaces second

### 5. Use profile width better and bring notifications higher

Profile is now coherent, but still underuses desktop space.

What the screenshots show:

- The page sits in a relatively narrow column with a lot of quiet outer canvas.
- The summary card is fine, but it still holds more height than it needs.
- Security remains tall enough that notifications begin lower than they should.

0.2.10 direction:

- Widen the page composition slightly on desktop.
- Compress the summary and security surfaces so the page reads as one preference workspace.
- Let the notification card begin higher in the screenshot.
- Keep the route calm; the fix is fit, not more ornament.

Likely files:

- `src/routes/profile/+page.svelte`
- `src/lib/components/profile/ProfileSection.svelte`
- `src/lib/components/profile/ProfileSecurityCard.svelte`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`

Desired result:

- profile looks intentionally composed for desktop instead of merely centered and clean

### 6. Treat signup as polish only

Signup is now in a good state.

What the screenshots show:

- Desktop is clear and the form dominates correctly.
- Mobile is short, direct, and readable.
- The remaining issue is mostly the amount of airy surrounding canvas, not hierarchy confusion.

0.2.10 direction:

- Only touch signup if a quick polish naturally fits into the pass.
- If revisited, trim the left summary rail one more step and tighten the distance between selected-state confirmation and the CTA.
- Do not spend major pass budget here while volunteers, home, messages, and check-in still have clearer desktop issues.

Likely files:

- `src/routes/signup/[eventId]/+page.svelte`

Desired result:

- signup stays strong while higher-value routes catch up

## Mobile notes

Mobile is mostly healthy now.

The remaining mobile issues are small:

- home still carries slightly heavy top controls above the lead card
- volunteers still spends a little too much height in the hero before the schedule starts
- check-in mobile is already strong and should only change if desktop work naturally improves it too

Do not reopen mobile just because there is room to keep trimming.

Preserve the routes that already read well.

## Recommended working order

1. Volunteer desktop and check-in desktop
2. Home desktop compression
3. Messages desktop workspace fit
4. Organization members and directory density
5. Profile desktop width and notification lift
6. Signup polish only if quick and obvious
7. Fresh screenshot recapture into a second 0.2.10 review folder

## Validation checklist

Before handing back, verify all of the following:

- `npm run check` passes
- volunteer desktop no longer has a large empty lower-left field
- check-in desktop gives the roster more first-fold authority than the support rail
- home desktop starts broadcasts sooner without weakening hub focus
- messages desktop shows the thread earlier in the workspace
- organization members and directory show more actionable people in the same viewport
- profile brings notifications meaningfully higher
- signup remains clear on both desktop and mobile
- mobile still reads clearly after any desktop-driven density changes

## Definition of done

0.2.10 is successful when:

- the main desktop routes use their first fold for work, not extra packaging
- volunteers and check-in feel like working boards rather than hero pages with a later workspace
- home and messages stop showing obvious dead air after the hierarchy is already solved
- organization, directory, and profile fit more real content into the screenshot without feeling cramped
- signup remains stable and no longer needs to be rescued every pass
