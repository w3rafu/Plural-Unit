# Presentation UI Handoff: 0.2.14

This is the next presentation pass after 0.2.13.

0.2.13 improved hierarchy across the shared shell, home, directory, organization members, and the volunteer surfaces.

0.2.14 should not reopen every route.

The next gains now come from reducing stacked visual mass, fixing screenshot legibility where state and content disagree, and tightening the few pages that still spend too much height on support chrome before the real work begins.

The product is close enough that broad polish would now create churn faster than quality.

The right move is a narrower pass with a higher bar.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.14-review/`:

- `tmp/screens-0.2.14-review/home-desktop.png`
- `tmp/screens-0.2.14-review/home-mobile.png`
- `tmp/screens-0.2.14-review/messages-desktop.png`
- `tmp/screens-0.2.14-review/directory-desktop.png`
- `tmp/screens-0.2.14-review/organization-members-desktop.png`
- `tmp/screens-0.2.14-review/profile-desktop.png`
- `tmp/screens-0.2.14-review/volunteers-desktop.png`
- `tmp/screens-0.2.14-review/volunteers-mobile.png`
- `tmp/screens-0.2.14-review/signup-desktop.png`
- `tmp/screens-0.2.14-review/signup-mobile.png`
- `tmp/screens-0.2.14-review/checkin-desktop.png`
- `tmp/screens-0.2.14-review/checkin-mobile.png`

## What is working now

- Messages desktop still reads like a real workspace and does not need another route-specific pass.
- Signup desktop and mobile remain strong, clean, and presentation-safe.
- Check-in desktop and mobile still communicate the task clearly and reach the roster quickly.
- Volunteers mobile now gets into the schedule quickly enough that it no longer feels hero-heavy.
- Volunteers desktop reads as an operational board with one clear staffing problem and one clear schedule surface.
- Directory content quality is better than it was before the low-density pass; the weakness is now composition, not card quality.
- The app still reads as one product family across dark and light surfaces.

## What still weakens the screenshots

- Home desktop still stacks too much dark card mass before the live product surfaces take over. The lead card is better, but it is still followed by another large slab for recent activity and only then the broadcast/event surfaces.
- Home mobile still spends too much first-fold attention on shell controls plus a very tall summary stack before live content starts.
- Organization members now has a more concrete screenshot problem: the visible section control styling does not agree with the page content in the capture, which makes the state feel unreliable even though the roster content is present.
- Organization members still uses a heavy management strip before the roster, and repeated row actions still pull attention away from the people.
- Directory desktop no longer looks broken, but it still reads like three equal rows of cards inside one large tray. With only 8 members, it needs stronger composition, not more of the same card rhythm.
- Profile desktop now feels slightly overbuilt again: the hero/support card is tall for the amount of information it contains, the security rail is visually heavy, and the main preferences start lower than they need to.
- Shared shell chrome is quieter than before, but admin routes still put a lot of peer-level controls in the top band.

## Core direction for 0.2.14

### Reduce stacked mass and fix state legibility

0.2.14 should keep the current visual language, spacing scale, and component system.

It should:

- reduce the number of full-width heavy slabs that stack before the main content begins
- make active and selected states survive in screenshots without ambiguity
- keep low-density surfaces intentional instead of merely tidy
- compress support rails that carry too little information for the space they claim
- leave the already-stable volunteer, signup, messages, and check-in routes alone unless shared changes clearly help them

The working question for each screen should be:

Is the screenshot weak because the hierarchy is wrong, or because a support surface is claiming too much height and contrast for too little information?

If a support surface is overbuilt, shrink or merge it before redesigning the route.

## 0.2.14 priorities

### 1. Break up the stacked home slabs

What the screenshots show:

- The home route now has a clearer lead card, but the page still reads as one large dark slab, followed by another large dark slab, before the product sections begin.
- Recent activity is clearer than it was as a narrow rail, but it still behaves like a second hero block.
- Broadcasts and events start too low relative to how important they are to the story of the product.
- Mobile home still spends too much attention on support summaries before live content.

0.2.14 direction:

- Keep one clear lead surface, but reduce its vertical depth.
- Make recent activity feel more like a tight operational queue and less like a second destination panel.
- Pull at least one live content surface into the first desktop reading rhythm sooner.
- On mobile, reduce the distance between the top of the page and the first clearly actionable/live module.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`
- `src/lib/components/ui/PageHeader.svelte`

Desired result:

- home starts with one lead decision, one compact queue, and then live hub content instead of reading as stacked overview trays

### 2. Fix organization state clarity first, then simplify the management band

What the screenshots show:

- The organization members capture shows roster content while the section control still appears visually selected on `Access`, which is the kind of screenshot bug that undermines trust immediately.
- Search, filter chips, and deletion review are all embedded, but the full management strip still feels heavy ahead of the roster.
- Member rows are better than before, yet the select/save/remove cluster still competes with the person identity.

0.2.14 direction:

- Treat section-state legibility as the first fix on this route.
- Make the selected section unmistakable even in static screenshots.
- Compress or reorganize the management strip so the roster begins with less chrome overhead.
- Continue demoting row-level admin controls so the person, role, and short summary lead the scan.

Likely files:

- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`

Desired result:

- organization members reads as one confident roster surface with clear section state and calm attached controls

### 3. Give directory a stronger low-density composition

What the screenshots show:

- The directory is neat, legible, and no longer obviously underfilled, but it still feels like a card grid that happens to stop after eight people.
- The top row is slightly emphasized, yet the overall rhythm is still three nearly equal rows in one large container.
- The search and segmented filter row is wide and calm, but it does not help create a stronger editorial hierarchy.

0.2.14 direction:

- Keep the low-density premise, but make the layout feel intentionally curated.
- Consider a more obvious distinction between the featured people and the remainder of the roster.
- Reduce the sense that all eight entries share equal weight in the same tray.
- Prefer one stronger spotlight rhythm over a larger number of similar card rows.

Likely files:

- `src/lib/components/directory/DirectoryRoster.svelte`

Desired result:

- directory feels editorial and complete with 8 people instead of simply well-spaced

### 4. Compress the profile support architecture

What the screenshots show:

- Profile now uses a large top support block and a tall security rail for relatively little information.
- The notification preferences start lower than they should for a route where those preferences are the main task.
- The right rail is visually strong, but its information density does not justify that weight.

0.2.14 direction:

- Pull the main preferences slightly higher.
- Reduce the height or dominance of the profile hero/support block.
- Re-evaluate whether the sticky security rail needs that much persistent emphasis.
- Keep the route clean and calm rather than turning it into another dashboard.

Likely files:

- `src/routes/profile/+page.svelte`
- `src/lib/components/profile/ProfileSection.svelte`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`
- `src/lib/components/profile/ProfileSecurityCard.svelte`

Desired result:

- profile feels like one streamlined settings route instead of a profile summary plus settings sidebar

### 5. Treat shell work as support, not as the main pass

What the screenshots show:

- Shared shell chrome is in a better place than it was during 0.2.12 planning.
- Desktop admin routes still carry a lot of peer-level controls in the top band.
- Mobile home still shows a strong manage/control layer above content while the dock remains strong below.

0.2.14 direction:

- Only touch the shared shell where it directly helps home or organization.
- Avoid turning 0.2.14 into another generic header pass.
- Use shell edits to support content hierarchy, not to become the headline of the release.

Likely files:

- `src/lib/components/ui/Header.svelte`
- `src/lib/components/ui/BottomNav.svelte`

Desired result:

- shared controls stay present, but they stop competing with the route’s primary story on the screens that still need help

### 6. Keep messages, signup, volunteers, and check-in in the protection bucket

What the screenshots show:

- Messages desktop is stable.
- Signup desktop and mobile are stable.
- Volunteers mobile is stable enough.
- Check-in desktop and mobile remain clear and believable.
- Volunteers desktop may benefit from shared polish if other work lands, but it does not justify route-specific churn right now.

0.2.14 direction:

- Do not reopen these routes unless shared work clearly improves them without tradeoffs.

Likely files:

- none unless shared changes naturally touch them

Desired result:

- stable routes stay stable while the remaining weak spots get focused attention

## Recommended working order

1. Home stacked-mass reduction
2. Organization state legibility and management-band simplification
3. Directory low-density composition pass
4. Profile support-architecture trim
5. Shared shell follow-up only if it directly improves home or organization

## Validation checklist

- Rerun `node tmp/capture-0.2.14-review.mjs`
- Compare home desktop and mobile against the current captures and verify live content starts sooner
- Confirm the organization section control visibly matches the rendered content state in screenshots
- Confirm directory feels more curated with the same 8-member fixture set
- Confirm profile reaches the primary settings content earlier without becoming cramped
- Confirm messages, signup, volunteers, and check-in do not regress
- Preserve the exact `Deletion requests` label unless the capture script is updated too, because the organization screenshot prepare step still waits for that text

## Definition of done

0.2.14 is successful when:

- home no longer reads as stacked overview slabs before the real product surfaces begin
- organization section state is unmistakable in screenshots and the roster reads as the primary surface
- directory feels deliberately composed at low density
- profile reaches settings work sooner and uses less support chrome to say the same thing
- stable routes remain stable

## Post-pass review

After the first 0.2.14 implementation pass, the screenshots changed in the right direction.

Directory, profile, and organization are all materially better than the planning baseline.

The next remaining weak spots are now much narrower.

### Still weakest

- Home desktop still reads as two heavy stacked overview slabs before broadcasts and events begin. The lead card is cleaner than before, but `Recent activity` still behaves like a second hero surface instead of a compact queue.
- Home mobile still gives too much first-fold height to summary surfaces before the live hub modules begin, and the `Manage hub` control remains visually strong above that stack.

### Improved enough to stop

- Organization members now has clear section state and calmer row actions. The roster reads correctly, even if the right-side role control column is still somewhat repetitive.
- Directory now feels intentionally composed with a `Featured people` split and a calmer roster rhythm.
- Profile now reaches the notifications surface sooner and no longer wastes space on a separate support rail.
- Messages desktop remains stable and should stay untouched.
- Signup desktop/mobile and check-in desktop/mobile remain strong and should stay untouched.
- Volunteers desktop/mobile remain stable; any further work there would be optional polish, not a priority.

### Recommendation before push

- If 0.2.14 is meant to be a tight incremental pass, it is ready to push as-is.
- If one more improvement is worth taking before push, spend it only on home and leave the other routes alone.