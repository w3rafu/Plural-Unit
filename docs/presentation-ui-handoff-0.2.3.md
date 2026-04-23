# Presentation UI Handoff: 0.2.3

This document is the next visual planning handoff after the 0.2.2 presentation pass.

The app is now materially stronger than the original `prototype/0.2` baseline and more polished than the first two presentation rounds, but it still reads as a product that is trying to show too much surface treatment at once.

The next branch should aim for a calmer product language:

- simpler
- more minimalistic
- more actionable
- more insightful
- more useful

The important shift for 0.2.3 is this:

Do not chase “more designed.” Chase “more obvious.”

The best next improvements are the ones that reduce visual noise, reduce repeated status treatment, and help a person understand what matters and what to do next without scanning as much UI.

## Goal

Make the product feel calmer and more decision-oriented without flattening it back into a dull prototype.

That means:

- fewer competing visual treatments
- fewer decorative pills and support blocks
- fewer equal-weight panels on the same screen
- stronger prioritization of next actions
- better separation between information, signal, and action
- more useful summaries and less ornamental metadata

## Current assessment after 0.2.2

### What is working now

- The shared shell is less awkward on desktop than it was before.
- The volunteer flow is much easier to present than the original baseline.
- Signup success and check-in are far clearer than they were in the first pass.
- Messages, directory, and profile are cleaner and more deliberate on mobile.
- Dark mode now works across the key presentation routes instead of being obviously neglected.

### What still feels heavy

- There are still too many chips, badges, and outlined micro-surfaces competing for attention.
- Several screens still explain status more than they help a person decide what to do.
- Some important pages still have too many bordered containers inside other bordered containers.
- The home route is stronger, but it still feels more like a well-styled dashboard than a sharply prioritized control surface.
- Check-in still communicates “list of things” more than “live operational tool.”
- Volunteer signup still looks polished, but not yet especially minimal.
- Messages is cleaner now, but still spends too much space on chrome rather than thread usefulness.

## Core design direction for 0.2.3

### 1. Reduce visual vocabulary

The UI should use fewer kinds of emphasis.

Right now, the app often uses all of these at once:

- rounded bordered pills
- inset cards
- tinted blocks
- bold metrics
- uppercase labels
- icon chips
- secondary stat blocks

That is too much for a product that wants to feel useful.

For 0.2.3, reduce the number of visual accents per screen.

Prefer this order:

1. title
2. primary action or primary signal
3. one supporting explanation
4. one compact secondary signal group

Not everything deserves a chip.

### 2. Replace status decoration with decision support

Many screens currently say what is true, but not what matters.

Examples:

- “8 members” is weaker than “2 invites still need follow-up.”
- “65% coverage” is weaker than “Riverside Arts Festival still needs 14 people.”
- “5 recent items” is weaker than “3 need response today.”

The next pass should convert more neutral metrics into actionable summaries.

The rule should be:

If a number is shown, it should either:

- help prioritize
- help decide
- help act

If it does none of those, remove it or demote it.

### 3. Make the useful thing visually largest

Several screens still give too much area to support information.

In 0.2.3, each page should have one dominant useful object:

- home: today’s key follow-ups
- volunteers: the event that most needs action
- signup: the currently selected role and the value of taking it
- check-in: the active roster and its exceptions
- messages: the actual conversation and any urgent unread state
- directory: the fastest path to identify or contact the right person
- profile: the few settings that matter most often

Everything else should serve that object, not compete with it.

### 4. Remove redundant framing

The product still overuses nested containers.

Common pattern to reduce:

- card
- inside card section
- inside section sub-card
- inside sub-card multiple pills

This often makes the UI look “styled” rather than “clear.”

For 0.2.3:

- use fewer nested cards
- let spacing do more work
- rely on typography and grouping more than borders
- reserve heavy borders for truly interactive or operational surfaces

### 5. Make insight feel editorial, not analytical

The app should not feel like a metrics dashboard.

It should feel like a calm operations tool.

That means copying patterns from editorial product summaries rather than analytics tools:

- plain language over internal labels
- one sentence that explains why something matters
- grouped related data rather than scattering it into separate stat cards
- fewer progress bars unless they change a decision

## Highest-priority visual follow-up work

### 1. Rebuild the home route around “what needs attention now”

This is the highest-value 0.2.3 opportunity.

The home page is much better than before, but it still spreads meaning across too many small surfaces.

Shift it toward:

- one lead summary about what needs action today
- one compact follow-up list or triage stack
- one restrained secondary area for broader app health

What to reduce:

- duplicate signal framing
- multiple adjacent metric tiles that say similar things
- decorative support cards that do not change the next action

What to add or strengthen:

- “needs response today” language
- more explicit urgency ranking
- more direct wording about who or what requires follow-up

Likely files:

- [src/lib/components/hub/member/HubOverviewCards.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubOverviewCards.svelte)
- [src/lib/components/hub/member/HubActivityFeed.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubActivityFeed.svelte)
- [src/lib/components/hub/member/VolunteersSection.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/VolunteersSection.svelte)
- [src/routes/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/+page.svelte)

Target outcome:

- home feels like a calm command surface
- attention is prioritized faster
- fewer panels do more work

### 2. Make the volunteer dashboard more operational and less card-driven

The volunteer dashboard is useful, but still relies on several equally important containers.

For 0.2.3:

- make the “needs attention” event the primary object
- reduce duplicate season and participation stats unless they support a decision
- simplify the top-volunteers block so it reads as proof, not a second dashboard
- make the schedule list itself more obviously the main working surface

Likely files:

- [src/routes/volunteers/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/+page.svelte)
- [src/lib/components/volunteer/EventCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/volunteer/EventCard.svelte)
- [src/lib/components/volunteer/FillPill.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/volunteer/FillPill.svelte)

Target outcome:

- fewer ornamental summary blocks
- clearer “what needs staffing next” hierarchy
- faster scan from hero to schedule

### 3. Simplify volunteer signup into a near-single-purpose page

Signup is polished, but it can still become calmer.

The next improvement is not more styling. It is reduction.

For 0.2.3:

- reduce the number of chips shown at once
- simplify shift rows so the distinction is mainly selection, availability, and time
- make the selection summary feel more like confirmation and less like another card layer
- keep the form fast and quiet

In practice, the page should feel closer to:

- event identity
- chosen role
- required details
- submit

Everything else should support that path.

Likely files:

- [src/routes/signup/[eventId]/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/signup/[eventId]/+page.svelte)
- [src/lib/components/volunteer/FillPill.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/volunteer/FillPill.svelte)

Target outcome:

- less visual noise
- stronger sense of completion
- easier mobile scan

### 4. Turn check-in into a more useful live tool

Check-in still has the biggest remaining gap between clarity and usefulness.

The page is readable, but the roster still feels visually flat and overlong.

For 0.2.3:

- make the active shift tabs simpler and stronger
- make the roster rows look like live operational entries, not neutral list tiles
- highlight exceptions or pending gaps more clearly than completed routine rows
- reduce anything that looks like decorative softness in the roster area

What would improve usefulness most:

- stronger distinction between unchecked, checked-in, and late/problem states
- tighter row anatomy with more emphasis on name and status
- less tonal ambiguity in dark mode

Likely files:

- [src/routes/volunteers/[eventId]/checkin/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/volunteers/[eventId]/checkin/+page.svelte)

Target outcome:

- check-in feels live, not static
- action states are obvious at a glance
- the roster reads like a working tool rather than a styled card list

### 5. Make messages more useful than ornamental

Messages improved in 0.2.2, but the next step is to further reduce visual framing around the conversation.

For 0.2.3:

- simplify the inbox row anatomy
- reduce repeated metadata and labels in the thread header
- let the conversation itself dominate the workspace
- make unread or recent urgency more meaningful than generic labels

Likely files:

- [src/routes/messages/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/messages/+page.svelte)
- [src/lib/components/messages/InboxPane.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/messages/InboxPane.svelte)
- [src/lib/components/messages/ThreadPane.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/messages/ThreadPane.svelte)
- [src/lib/components/messages/ThreadCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/messages/ThreadCard.svelte)

Target outcome:

- lower chrome overhead
- faster inbox triage
- stronger focus on the actual exchange

### 6. Make directory and profile feel quieter

These routes are already serviceable. The next improvement is restraint.

For 0.2.3:

- reduce visible framing around secondary actions
- make text hierarchy do more work than borders
- simplify supporting details so the card body does not feel busy

Likely files:

- [src/lib/components/directory/DirectoryRoster.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/directory/DirectoryRoster.svelte)
- [src/routes/directory/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/directory/+page.svelte)
- [src/lib/components/profile/ProfileSection.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/profile/ProfileSection.svelte)
- [src/lib/components/profile/ProfileDetailsCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/profile/ProfileDetailsCard.svelte)

Target outcome:

- less “settings screen” density
- more calm product rhythm
- faster recognition of the one thing to do on each card

## Practical design rules for 0.2.3

Use these as branch-level rules.

### Prefer fewer pills

If a row or card already has a title and one useful description, do not add multiple chips unless one of them changes a decision.

### Prefer sentence insight over label stacks

When possible, replace multiple tiny labels with one sentence that explains what matters.

### Prefer one useful summary over three decorative stats

If the user only needs one takeaway, present one takeaway.

### Prefer primary action clarity over balance

If a layout feels “balanced” but the next action is not obvious, it is worse.

### Prefer plain surfaces for low-stakes content

Not every group needs its own bordered panel.

### Prefer dark mode parity, not dark mode exception work

Avoid one-off dark-mode overrides when a token or shared pattern should solve the problem.

## Constraints

- Do not redesign the product.
- Do not introduce route-specific accent colors.
- Do not make the UI sterile or enterprise-heavy.
- Keep the product approachable.
- Preserve light and dark mode parity.
- Keep improving the current design language instead of replacing it.

## If time is limited

Do only these five things for 0.2.3:

1. Rebuild home around a smaller number of truly useful attention surfaces.
2. Simplify volunteer dashboard and signup by removing non-essential chips and support framing.
3. Turn check-in into a more obvious operational tool with stronger state contrast.
4. Reduce message chrome and emphasize actual conversation usefulness.
5. Quiet directory and profile so they feel more minimal than merely tidy.