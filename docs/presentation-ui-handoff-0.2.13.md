# Presentation UI Handoff: 0.2.13

This is the next presentation pass after 0.2.12.

0.2.12 finished the compaction work that was still needed across home, organization, directory, profile, and the volunteer flows.

0.2.13 should not chase another generic "make everything smaller" pass.

The remaining weak spots now come from hierarchy, shell chrome, and low-density layouts more than from oversized cards.

The product now looks coherent enough that the next gains need to be structural.

For 0.2.13, the job is to make attention feel deliberate.

It is not to reopen every route again.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.13-review/`:

- `tmp/screens-0.2.13-review/home-desktop.png`
- `tmp/screens-0.2.13-review/home-mobile.png`
- `tmp/screens-0.2.13-review/messages-desktop.png`
- `tmp/screens-0.2.13-review/directory-desktop.png`
- `tmp/screens-0.2.13-review/organization-members-desktop.png`
- `tmp/screens-0.2.13-review/profile-desktop.png`
- `tmp/screens-0.2.13-review/volunteers-desktop.png`
- `tmp/screens-0.2.13-review/volunteers-mobile.png`
- `tmp/screens-0.2.13-review/signup-desktop.png`
- `tmp/screens-0.2.13-review/signup-mobile.png`
- `tmp/screens-0.2.13-review/checkin-desktop.png`
- `tmp/screens-0.2.13-review/checkin-mobile.png`

## What is working now

- Messages desktop feels like an active workspace instead of a sparse shell.
- Signup desktop and mobile are stable, readable, and visually credible.
- Volunteer and check-in desktop now behave like operational boards, not hero pages.
- Profile is finally balanced enough that notifications appear early without feeling cramped.
- Organization reaches the roster quickly, and home no longer feels wildly oversized.
- The app now reads as one product family across dark and light routes.

## What still weakens the screenshots

- Shared shell chrome still carries too much attention on desktop, especially when title, primary nav, route action, admin button, alerts, and theme all compete in one band.
- Mobile home still gives strong weight to header controls above the content while the bottom dock repeats another strong navigation layer below.
- Home desktop still spends the top fold on three competing summary destinations before the work surface fully takes over.
- Directory now looks sparse mainly because there are only 8 members in the fixture set, and the current dashboard-like grid exposes that scarcity instead of using it intentionally.
- Organization members now gets to the roster quickly, but each row still reads partly like a management form because role select, save role, and remove member carry too much visual weight.
- Section and filter segmented controls are clearer than before but still rely on soft states that flatten out in screenshots.
- Volunteers mobile still spends slightly too much height on intro context before the schedule begins.
- Profile, signup, messages, and volunteer/check-in desktop no longer justify another broad structural rewrite.

## Core direction for 0.2.13

### Shift from compaction to hierarchy

0.2.13 should keep the current visual language, spacing scale, and component set.

It should:

- reduce shared chrome competition before trimming route content again
- make low-density screens feel intentional instead of merely smaller
- push repeated admin actions into calmer secondary treatment where people are the focus
- strengthen active and selected states that need to survive in screenshots
- protect the routes that are already compositionally healthy

The working question for each route should be:

Is this screen weak because it is too tall, or because attention is split across too many peers?

If attention is split, solve hierarchy before spacing.

## 0.2.13 priorities

### 1. Rebalance the shared shell chrome

What the screenshots show:

- The desktop shell header gives near-equal energy to brand/title, section nav, route action, admin button, alerts, and theme control.
- The mobile home route shows strong header controls before the main content while the bottom dock repeats another strong navigation treatment below.
- The shell is coherent, but it is not quiet enough yet.

0.2.13 direction:

- Reduce visual competition between page identity and shell controls.
- Make route-specific actions feel contextual instead of always commanding the same primary weight.
- Clarify desktop section-nav active state without making the whole header heavier.
- Keep mobile header actions from fighting the bottom dock for the same attention.

Likely files:

- `src/lib/components/ui/Header.svelte`
- `src/lib/components/ui/BottomNav.svelte`
- `src/lib/components/ui/bottomNavModel.ts`

Desired result:

- screenshots begin with page intent instead of shell controls

### 2. Turn home into one clear lead surface

What the screenshots show:

- Hub focus, signal check, and recent activity still read as three peers.
- Broadcasts start earlier than before, but support context still takes a full row before the live content settles in.
- Mobile home is coherent, yet the same hierarchy still feels heavier than it needs to.

0.2.13 direction:

- Keep one dominant focus block.
- Either fold signal logic closer into the lead card or reduce it into a much flatter utility strip.
- Make recent activity feel like a narrow queue rather than a second destination card.
- Pull the first live content higher by removing duplicated summaries, not only by shaving padding.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`

Desired result:

- home desktop reads as one working surface with support rails, not three equal destinations over content

### 3. Make directory intentional at low member counts

What the screenshots show:

- Directory still feels unfinished because there are only 8 members in the smoke fixture set.
- The current spotlight-plus-grid pattern exaggerates empty lower space once the grid runs out.
- More compression will not solve that problem.

0.2.13 direction:

- Design the low-density state on purpose.
- Prefer a layout that can hold a short roster gracefully, even if that means stronger spotlighting, a mixed card/list rhythm, or taller information blocks.
- Let the directory feel curated instead of underfilled.

Likely files:

- `src/lib/components/directory/DirectoryRoster.svelte`

Desired result:

- directory feels complete with 8 members instead of looking like a half-populated dashboard

### 4. Make organization members more people-first

What the screenshots show:

- The page reaches the roster quickly now, but each row still puts strong emphasis on role select, save role, and remove member.
- The section segmented control is better, but still too soft for screenshot reading.
- The management strip is functional, yet still layered enough that the page feels like controls plus rows rather than one roster surface.

0.2.13 direction:

- Strengthen active-state visibility for section and filter controls.
- Reduce the perceived weight of row actions so name, role, and summary lead first.
- Keep deletion review embedded, but stop it from feeling like a second destination.
- Preserve full admin functionality while making repeated controls feel more secondary.

Likely files:

- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`
- `src/lib/components/organization/OrganizationOverviewCard.svelte`

Desired result:

- organization members feels like a roster with actions attached, not a management form repeated for every person

### 5. Treat messages, signup, profile, and volunteer/check-in desktop as protection routes

What the screenshots show:

- Messages desktop is stable.
- Signup desktop and mobile are strong.
- Profile is in a good enough place that it no longer needs a structural pass.
- Volunteer and check-in desktop now present clearly and no longer need more compression work.

0.2.13 direction:

- Leave these routes alone unless shared-shell or shared-control work improves them incidentally.
- Avoid reopening their internal layout unless a later screenshot pass proves regression.

Likely files:

- none unless shared chrome work naturally touches them too

Desired result:

- stable routes stay stable while attention moves to the remaining structural issues

### 6. Optional: trim volunteer mobile intro weight

What the screenshots show:

- Volunteers mobile still spends a little too much space on summary context before the schedule begins.
- The board snapshot is useful, but it still occupies meaningful first-fold height.

0.2.13 direction:

- Only if earlier work leaves time, shorten the pre-schedule stack on mobile.
- Do not reopen the desktop volunteer board structure.

Likely files:

- `src/routes/volunteers/+page.svelte`

Desired result:

- the schedule begins slightly earlier on mobile without losing the board logic

## Recommended working order

1. Shared shell chrome rebalance
2. Home lead-surface hierarchy pass
3. Directory low-density layout pass
4. Organization members people-first pass
5. Only then consider volunteer mobile intro trimming

## Validation checklist

- Rerun `node tmp/capture-0.2.13-review.mjs`
- Compare desktop shell weight on home, organization, directory, messages, and profile
- Confirm home desktop reaches live content earlier through hierarchy, not just compression
- Confirm directory still feels complete with only 8 members in the fixture set
- Confirm organization roster reads more like people management and less like repeated form controls
- Confirm messages, signup, profile, and volunteer/check-in desktop remain stable after any shared changes
- Confirm mobile home and volunteers do not regress when shell work lands
- Preserve the exact `Deletion requests` label unless the capture script is updated too, because the organization screenshot prepare step still waits for that text

## Definition of done

0.2.13 is successful when:

- the shared shell header and mobile dock feel quieter without losing navigation clarity
- home has one obvious lead surface instead of three competing top cards
- directory looks intentional even with sparse fixture data
- organization members feels people-first while keeping admin controls obvious
- messages, signup, profile, and volunteer/check-in desktop remain stable
