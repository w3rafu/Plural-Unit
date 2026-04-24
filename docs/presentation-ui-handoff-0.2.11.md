# Presentation UI Handoff: 0.2.11

This is the next presentation pass after 0.2.10.

0.2.10 fixed most of the loudest density problems.

0.2.11 should remove the last obvious cases where the screenshots still feel like good components arranged into slightly oversized containers.

The fresh review set shows a product that is now visually coherent across member, admin, volunteer, profile, and signup surfaces, but several desktop routes still spend too much of the first fold on hero height, duplicated control bands, or underfilled canvases.

For 0.2.11, the job is not more styling.

It is to make each screenshot feel fully occupied by the work it exists to support.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.11-review/`:

- `tmp/screens-0.2.11-review/home-desktop.png`
- `tmp/screens-0.2.11-review/home-mobile.png`
- `tmp/screens-0.2.11-review/messages-desktop.png`
- `tmp/screens-0.2.11-review/directory-desktop.png`
- `tmp/screens-0.2.11-review/organization-members-desktop.png`
- `tmp/screens-0.2.11-review/profile-desktop.png`
- `tmp/screens-0.2.11-review/volunteers-desktop.png`
- `tmp/screens-0.2.11-review/volunteers-mobile.png`
- `tmp/screens-0.2.11-review/signup-desktop.png`
- `tmp/screens-0.2.11-review/signup-mobile.png`
- `tmp/screens-0.2.11-review/checkin-desktop.png`
- `tmp/screens-0.2.11-review/checkin-mobile.png`

## What is working now

- Volunteer and check-in finally read like operational surfaces instead of presentation placeholders.
- Sparse-thread messages now feels intentional enough to scan instead of broken or abandoned.
- Signup is stable on desktop and mobile and no longer needs major pass budget.
- Directory and organization membership screens now share a believable system rhythm.
- Mobile home remains clear, coherent, and naturally focused.
- The product now looks like one application across hub, admin, volunteer, profile, and public signup routes.

## What still weakens the screenshots

- Home desktop still spends too much height on the hub-focus stack and support cards before broadcasts become visible.
- Messages desktop still opens with a large quiet field above the first meaningful message cluster.
- Directory desktop underfills the frame; the shell is large, the cards are still a little tall, and the lower half of the screen goes quiet too early.
- Organization desktop still burns too many layers on overview, section controls, deletion review, search, counts, and filters before the roster takes over.
- Profile desktop still keeps notifications too low and gives the top summary more height than its content justifies.
- Volunteer and check-in desktop are better than before, but both still carry oversized header mass that delays the actual board.
- Volunteers mobile still spends slightly more height than it should before the schedule begins, but this is now a secondary issue.

## Core direction for 0.2.11

### Finish first-fold composition

The next pass should not reopen the design language.

It should:

- shrink surfaces whose content no longer justifies their height
- collapse adjacent control bands into one management strip where possible
- fill wide desktop canvases with more real rows or people before adding more wrapper chrome
- demote support metrics into inline utilities once the hierarchy is already clear
- avoid touching stable routes unless a desktop fix naturally improves them too

The working question for each route should be:

Does the first fold show the work, or just a well-designed prelude to the work?

If the prelude still wins, the route is not finished.

## 0.2.11 priorities

### 1. Collapse volunteer and check-in desktop header mass

What the screenshots show:

- Volunteer desktop still gives the lead card too much height before the schedule earns full authority.
- The volunteer right rail still spends too much space on standalone metric cards and the reliable-volunteers panel.
- Check-in desktop still has a broad top card with visible empty canvas on the left while live progress occupies a separate side rail.
- Both routes improved in 0.2.10, but both still read like hero pages above boards rather than boards with concise headers.

0.2.11 direction:

- Compress the volunteer and check-in headers again.
- Move more summary data into tighter inline chips or compact header rows.
- Let the schedule and roster start higher on the page.
- Demote reliable volunteers and up next into smaller support lists.
- Treat these routes as operational boards first and informational summaries second.

Likely files:

- `src/routes/volunteers/+page.svelte`
- `src/routes/volunteers/[eventId]/checkin/+page.svelte`

Desired result:

- volunteer and check-in desktop both look like the work starts immediately

### 2. Finish home desktop so broadcasts start earlier

What the screenshots show:

- Hub focus still takes too much vertical space for the amount of information it actually contains.
- Signal check is useful, but it still behaves like a full companion card instead of a compact utility rail.
- Recent activity still has enough weight that the first live broadcast begins too low in the frame.
- The route now feels orderly, but not yet tightly composed.

0.2.11 direction:

- Shorten the lower half of hub focus.
- Compress signal check so its metrics feel supporting rather than equal to the lead surface.
- Tighten recent activity into a more compact queue.
- Pull the first live broadcast higher into the desktop fold.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`

Desired result:

- home desktop feels fully composed rather than merely cleaned up

### 3. Eliminate the quiet ceiling in sparse-thread messages

What the screenshots show:

- The new conversation-context block helped, but the thread still opens with too much empty canvas before the first divider and message stack.
- The header and meta region can still be shorter.
- The workspace is calmer than before, but it still does not look fully occupied when the thread is short.

0.2.11 direction:

- Reduce the reserved top space for sparse threads.
- Pull context closer to the header or the first message cluster.
- Tighten participant subtitle and recency into a smaller header footprint.
- Preserve the bottom-anchored conversation feel without letting the top half read as dead space.

Likely files:

- `src/lib/components/messages/ThreadPane.svelte`
- `src/lib/components/messages/MessageWorkspace.svelte`

Desired result:

- messages desktop feels active from the top of the pane, even when the thread is short

### 4. Make organization and directory fill the canvas with real people sooner

What the screenshots show:

- Organization desktop still stacks too many horizontal bands before the roster becomes the actual point of the page.
- Deletion review is smaller than before, but it still behaves like its own layer instead of part of one management strip.
- Directory desktop now reads well, but the three-column grid and card height still leave a large quiet field in the lower half of the frame.
- Both routes are clean enough now that the remaining problem is occupancy, not hierarchy confusion.

0.2.11 direction:

- Compress the organization overview and section-control footprint.
- Fold deletion review, search, counts, and filters into one denser management strip.
- Tighten roster-row and card height where possible.
- Test whether desktop directory should stay denser at three columns or move to a four-column rhythm at screenshot width.
- Prioritize showing more actual members in the capture before adding new utility chrome.

Likely files:

- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/DeletionRequestsCard.svelte`
- `src/lib/components/directory/DirectoryRoster.svelte`

Desired result:

- organization and directory both read as people surfaces first and framing surfaces second

### 5. Recompose profile around first-fold preferences

What the screenshots show:

- The top summary card still holds more height than its information needs.
- The rhythm panel still claims too much authority for a secondary signal.
- Security dominates the right rail and pushes notifications lower than necessary.
- The route looks calm and tidy, but it still underuses desktop space.

0.2.11 direction:

- Flatten the top summary card.
- Reduce the visual weight of the rhythm panel.
- Bring notifications higher so they begin in the first fold.
- Keep the route calm; this is a fit problem, not a styling problem.

Likely files:

- `src/routes/profile/+page.svelte`
- `src/lib/components/profile/ProfileSection.svelte`
- `src/lib/components/profile/ProfileSecurityCard.svelte`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`

Desired result:

- profile reads like one desktop workspace instead of one strong top card and a lower second act

### 6. Treat signup and mobile as protection surfaces

What the screenshots show:

- Signup is stable on both desktop and mobile.
- Check-in mobile is already strong.
- Home mobile still reads well.
- Volunteers mobile still has a slightly heavy hero, but it is no longer the main presentation problem.

0.2.11 direction:

- Do not spend major pass budget on signup.
- Keep mobile changes surgical.
- Only trim mobile top chrome when the desktop work naturally produces the same improvement.

Likely files:

- none unless a desktop edit naturally benefits mobile too

Desired result:

- stable surfaces stay stable while desktop first-fold issues catch up

## Recommended working order

1. Volunteer desktop and check-in desktop header compression
2. Home desktop first-fold fit
3. Messages sparse-thread fit
4. Organization and directory occupancy pass
5. Profile first-fold composition
6. Only then consider opportunistic mobile or signup trims

## Validation checklist

- Rerun `node tmp/capture-0.2.11-review.mjs`
- Rerun `npm run check` after implementation work
- Compare desktop first-fold fit on home, messages, organization, directory, profile, volunteers, and check-in at 1440px width
- Preserve the exact `Deletion requests` label unless the capture script is updated too, because the organization screenshot prepare step still waits for that text

## Definition of done

0.2.11 is successful when:

- volunteer, check-in, and home all surface the real task area earlier on desktop
- messages no longer looks half empty when the thread is sparse
- organization and directory show more people and fewer stacked control layers
- profile brings notifications into the first fold without feeling cramped
- signup and the already-healthy mobile routes remain stable
