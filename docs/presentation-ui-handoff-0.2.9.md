# Presentation UI Handoff: 0.2.9

This is the next presentation pass after 0.2.8.

0.2.8 tightened the product and made the main routes more coherent.

0.2.9 should make the screenshots feel more decisive.

Not more decorated.

More edited.

The current review set shows that the product is now visually consistent, but several routes still spend too much space on repeated framing, stacked admin chrome, and wide quiet zones that do not improve understanding.

For 0.2.9, the main job is to remove dead air, make the first fold on each important route feel intentional, and stop letting support panels compete evenly with the thing the user is actually here to do.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.9-review/`:

- `tmp/screens-0.2.9-review/home-desktop.png`
- `tmp/screens-0.2.9-review/home-mobile.png`
- `tmp/screens-0.2.9-review/messages-desktop.png`
- `tmp/screens-0.2.9-review/directory-desktop.png`
- `tmp/screens-0.2.9-review/organization-members-desktop.png`
- `tmp/screens-0.2.9-review/profile-desktop.png`
- `tmp/screens-0.2.9-review/volunteers-desktop.png`
- `tmp/screens-0.2.9-review/volunteers-mobile.png`
- `tmp/screens-0.2.9-review/signup-desktop.png`
- `tmp/screens-0.2.9-review/signup-mobile.png`
- `tmp/screens-0.2.9-review/checkin-desktop.png`
- `tmp/screens-0.2.9-review/checkin-mobile.png`

## What is working now

- The product finally reads as one system across hub, volunteer, signup, admin, and profile routes.
- Home mobile is already stronger than home desktop in terms of first-read clarity.
- Messages feels calmer than earlier passes and no longer wastes width on a third context rail.
- Directory is more human than before because the roster uses faces, bios, and contact cues well enough to be believable.
- Check-in looks operational instead of provisional.
- The signup form is friendlier than the earlier versions and the CTA now feels visible.

## What still weakens the screenshots

- Volunteer dashboard desktop still has the clearest composition problem in the branch. The left hero area leaves a large empty field after the useful information ends, so the schedule starts too low.
- Signup desktop is still the weakest major presentation screen. The left summary card is taller than its content deserves, the right form card does not dominate enough, and the composition still feels split rather than directed.
- Signup mobile appears to repeat the event summary below the main reservation card, which makes the full-page screenshot look longer than necessary.
- Home desktop is clean, but the top fold is still too evenly weighted. The three lead panels are all competent, but none of them clearly wins as the anchor.
- The full-width broadcast card below the top fold spends a lot of area on one update and makes the screen feel less edited than it should.
- Organization members and profile both stack too much chrome before the most important controls. They are not broken, but they still read more like complete admin layouts than presentation-tight product moments.
- Directory is useful, but the first row and second row do not share the same card rhythm, which makes the grid feel slightly improvised rather than intentionally paced.
- Messages still leaves a large quiet field in the thread pane once a short conversation is selected. The route is clean, but the screenshot is not using the lower half of the page well.
- Check-in desktop works, but the header, right rail, and chip row still spend too much height before the roster does the real work.
- Mobile shell controls are clearer than before, but the home and volunteer routes still carry slightly too much top-of-page chrome relative to how tight the content below is becoming.

## Core direction for 0.2.9

### Remove repeated framing and make each route choose one lead story

The next pass should not add more modules.

It should:

- shorten routes where the first fold spends height on context that can be compressed
- reduce the number of equally weighted support cards in the first screenful
- let the main action or main operational object become visually dominant
- remove repeated summary content that appears once above and then again below
- simplify admin layout scaffolding so the people or workflow rows arrive faster
- keep mobile strong by trimming chrome rather than flattening the content

The question for every route should be:

Does this first screenful make one strong claim, or does it just show that the layout is tidy?

If it only looks tidy, it still needs editing.

## 0.2.9 priorities

### 1. Rebuild the volunteer dashboard first fold

This is the highest-value improvement.

What the screenshots show:

- Desktop still leaves a large empty zone under the “Why this matters” card.
- The stat rail on the right now does more visual work than the left hero.
- The current schedule, which is the real operational surface, starts too far below the fold.
- Mobile keeps the same hierarchy problem, just in a narrower stack.

0.2.9 direction:

- Collapse the hero height substantially.
- Either move the schedule into the first fold or let the hero and schedule interlock more tightly.
- Keep one strong lead staffing message, but do not give it a large empty afterfield.
- Reduce the number of support boxes that compete with the schedule before it appears.
- Make the first fold read like a working board, not a hero plus a later workspace.

Likely files:

- `src/routes/volunteers/+page.svelte`
- `src/lib/components/volunteer/EventCard.svelte`

Desired result:

- volunteers becomes the strongest desktop screenshot in the branch instead of the most obviously unfinished one

### 2. Turn signup into one decisive surface

This is still the weakest major presentation route.

What the screenshots show:

- Desktop splits attention too evenly between the left event summary and the right form.
- The left card is still too tall for the amount of information it carries.
- The canvas around both cards still reads spacious before it reads intentional.
- Mobile likely repeats the event summary below the main form card, making the page longer than it needs to be.

0.2.9 direction:

- Shorten the desktop summary card aggressively.
- Make the form the unmistakable primary object.
- Keep only the event facts that help the reservation decision.
- Pull the CTA visually closer to the selected shift state.
- Remove any repeated lower-page event summary on mobile if the same context is already present at the top.

Likely files:

- `src/routes/signup/[eventId]/+page.svelte`

Desired result:

- signup feels direct, short, and confident on both desktop and mobile

### 3. Finish the home top-fold composition

Home is close, but still too evenly paced.

What the screenshots show:

- The hub-focus, signal-check, and recent-activity cards are all strong enough, but too equal in tone.
- The first fold wins on cleanliness more than emphasis.
- The single broadcast card below the fold is visually oversized for one item.
- Mobile home is already stronger because the lead card is more obvious there.

0.2.9 direction:

- Make one top-fold card clearly dominant.
- Let the other two cards become quieter satellites rather than equal peers.
- Compress the single broadcast treatment below so it feels like a continuation of the story, not a separate oversized slab.
- Tighten the mobile action row so the shell does not compete with the hub-focus card.

Likely files:

- `src/routes/+page.svelte`
- `src/lib/components/hub/member/HubOverviewCards.svelte`
- `src/lib/components/hub/member/HubActivityFeed.svelte`
- `src/lib/components/hub/member/BroadcastsSection.svelte`

Desired result:

- home desktop becomes presentation-ready without losing the stronger mobile readability it already has

### 4. Compress admin chrome on organization and directory

The admin routes now work, but they still read over-layered.

What the screenshots show:

- Organization stacks overview, section switcher, deletion-request block, stat tiles, search, and member rows into too many full-width bands before the roster becomes the focus.
- Directory uses a useful grid, but the top compact cards and lower taller cards do not share a clear rhythm.
- Both routes still spend more energy on framing than on helping the user scan people quickly.

0.2.9 direction:

- Reduce the number of stacked wrapper bands ahead of the roster.
- Let member management rows arrive faster on the page.
- Unify directory card rhythm so compact and expanded cards feel intentionally related.
- Keep filters and search, but make them consume less visual authority.

Likely files:

- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`
- `src/routes/directory/+page.svelte`
- `src/lib/components/directory/DirectoryGrid.svelte`

Desired result:

- admin and directory surfaces feel edited for scan speed, not simply complete

### 5. Tighten profile so notifications arrive sooner

Profile is credible, but vertically loose.

What the screenshots show:

- The summary card is good.
- The details and security cards are readable, but the security block spends too much height on low-value empty space.
- Notifications and preferred communication are below a larger gap than they need.

0.2.9 direction:

- Reduce the security panel height.
- Bring the notification and communication controls higher in the page flow.
- Keep the top summary intact, but make the lower half feel less separated into isolated slabs.

Likely files:

- `src/routes/profile/+page.svelte`
- `src/lib/components/profile/ProfileDetailsCard.svelte`
- `src/lib/components/profile/ProfileSecurityCard.svelte`
- `src/lib/components/profile/ProfileNotificationPreferencesCard.svelte`

Desired result:

- profile feels like one composed preference surface instead of three distant sections

### 6. Make messages and check-in use the lower half of the page better

These routes are operationally sound, but not yet visually finished.

What the screenshots show:

- Messages looks calm, but a short thread leaves a lot of dead area between the selected conversation and the composer.
- Check-in still spends too much height on header and support cards before the roster does the work.
- Both routes could get tighter without changing their core model.

0.2.9 direction:

- In messages, tighten the selected-thread header and composer spacing so the conversation feels more continuous.
- In check-in, reduce the top-band height and make the roster feel even more immediate.
- Keep the right-side support information, but give it less first-fold authority.

Likely files:

- `src/routes/messages/+page.svelte`
- `src/lib/components/messages/ConversationPane.svelte`
- `src/routes/volunteers/[eventId]/checkin/+page.svelte`

Desired result:

- both routes feel more complete in screenshots without reopening their overall interaction model

## Mobile notes

Mobile is healthier than desktop overall.

The main mobile issues are not visual identity.

They are length and chrome.

Priorities:

- remove repeated context on signup mobile
- shorten the volunteers hero before the schedule begins
- keep the home control row from competing with the lead card
- preserve the current clarity of check-in mobile while trimming only small amounts of support chrome

Do not flatten mobile just to make it shorter.

Keep the strong card hierarchy that already works there.

## Recommended working order

1. Volunteer dashboard first fold
2. Signup desktop and mobile duplication cleanup
3. Home top-fold hierarchy and broadcast compression
4. Organization and directory chrome reduction
5. Profile vertical tightening
6. Messages and check-in follow-up compression
7. Fresh screenshot recapture into a new review folder

## Validation checklist

Before handing back, verify all of the following:

- `npm run check` passes
- volunteer desktop shows the schedule sooner or uses the hero height much better
- signup desktop has one obvious primary surface
- signup mobile no longer repeats event context unnecessarily
- home desktop has one unmistakable top-fold anchor
- organization and directory arrive at their people rows faster
- profile brings notifications into view earlier
- messages and check-in feel tighter without becoming cramped
- mobile still reads clearly after any density cuts

## Definition of done

0.2.9 is successful when:

- the first fold on each important route feels chosen rather than inherited
- volunteers and signup stop being the weakest screenshot candidates
- home desktop feels more decisive than merely clean
- admin and profile surfaces look lighter because they have less chrome, not because they lost capability
- mobile stays strong while becoming shorter where repetition existed
