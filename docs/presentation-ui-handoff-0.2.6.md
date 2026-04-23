# Presentation UI Handoff: 0.2.6

This is the next planning brief after the 0.2.5 density pass.

0.2.5 was about getting sharper.

0.2.6 should get simpler.

Not emptier.

Not flatter.

Simpler in the sense that each screen should explain itself faster, waste less width, and stop repeating context that the layout already made obvious.

The screenshots make the next move clear.

Several routes are still spending desktop width on single-file cards, duplicated metadata, and polite empty space.

The next branch should feel:

- more useful on desktop
- more compressed where content is repetitive
- more visual in its scheduling surfaces
- more color-aware in its pills and state markers
- less dependent on explanatory side rails
- more explicit about communication preferences

The main shift for 0.2.6 is this:

Replace passive layout with active structure.

If a wide area is mostly empty, turn it into a grid.

If a side rail mostly repeats what the main pane already says, remove it.

If a badge carries real meaning, give it a real visual role.

If a screen is about planning across time, show time as a calendar instead of a stack.

## Screens Reviewed

The direction below is based on the current live screenshots and baseline presentation captures.

Reviewed directly:

- `tmp/screens/home-volunteers-desktop.png`
- `tmp/screens/volunteers-desktop.png`
- `tmp/screens/analysis-home-desktop.png`
- `tmp/screens/analysis-events-section.png`
- `tmp/screens/analysis-messages-desktop.png`
- `tmp/screens/analysis-directory-desktop.png`
- `tmp/screens/analysis-profile-desktop.png`

These screenshots are enough to name the current problems precisely.

## What The Screenshots Now Show

### Strong outcomes

- The product already feels calmer and more trustworthy than the earlier presentation passes.
- Real-face avatars improved recognition where the app is about people.
- The volunteer and profile routes already have the beginnings of a stronger two-column desktop composition.
- The home route has the right ingredients, even though the sections are not yet using space efficiently.

### What still feels wasteful

- Home recent-activity rows span too much width for how little they actually say.
- The events section is a vertical stack of broad cards when it should be a planning surface.
- Pills still read as mostly neutral gray containers, even when they represent different levels of urgency or state.
- Volunteer summary widgets still behave like one-off horizontal cards instead of a tighter system of operational tiles.
- Messages loses too much width to a context rail that mostly repeats thread information.
- Directory still looks like a clean roster dump instead of an actually useful people-finding surface.
- Profile still treats notification settings as checkbox groups rather than a clearer communication preference model.

## Core Rule For 0.2.6

### Simplify structure, not meaning

Remove or compress anything that is doing one of these jobs badly:

- repeating the same fact in two places
- filling width without adding scanning value
- turning plain metadata into oversized pills
- using a side rail to restate the selected object
- stacking planning items that would read better as a grid
- delaying the primary task behind explanatory framing

### Add structure where it increases decisions

Spend layout effort on:

- event planning and date awareness
- activity and state cues that improve scan speed
- concise operational summaries
- stronger people recognition in directory and messages
- communication controls that match real user behavior

The question for every screen should be:

Does this region help the user choose, reply, schedule, or scan faster?

If not, compress or remove it.

## 0.2.6 Goals

### 1. Stop wasting horizontal space on single-file cards

Desktop layouts now have enough width to show parallel information.

0.2.6 should stop pretending those wide screens are narrow.

Focus on:

- recent-activity cards that stretch into long quiet rows
- event cards that use broad horizontal surfaces for a handful of facts
- volunteer summary widgets that could become a grid of tighter operational modules
- directory cards that are individually tidy but collectively under-informative

### 2. Turn event browsing into a planning view

The events screenshot makes the problem obvious.

The current layout is a stack of large cards with empty right halves and repeated button rows.

0.2.6 should shift events toward a split planning view:

- a grid of upcoming event cards
- a real calendar adjacent to the grid
- date emphasis that helps users understand cadence at a glance

The calendar should not be decorative.

It should reveal which days are active, dense, or overloaded.

### 3. Give pills a clearer and more attractive visual language

The current pill system is calm, but too many pills feel interchangeable.

0.2.6 should keep restraint while adding meaning through color and hierarchy.

The goal is not a louder app.

The goal is a more legible one.

### 4. Remove duplicated message context

The messages screenshot shows the clearest removable area in the product.

The right rail repeats the selected person, recent note, unread state, and reply history while taking width away from the conversation itself.

0.2.6 should trust the inbox and thread to carry the story.

### 5. Make directory feel useful, not merely organized

Directory currently works as a clean member grid, but it does not help users quickly understand who is who, who is active, or who matters most right now.

0.2.6 should make it a people-finding and people-understanding surface.

### 6. Add a communication preference model on profile

Profile already has content-type notification controls.

It does not yet have a communication preference model that answers a more human question:

How should this person usually be contacted?

That needs to become explicit.

## Route-By-Route Direction

### Home

The home route is close, but the recent-activity block is still using width badly.

What the screenshot suggests:

- Each activity card spans almost the full container width.
- The action label sits far to the right, creating a dead middle zone.
- Repeated row framing makes the section feel longer than it is informative.
- The section is visually calm, but not compositionally efficient.

0.2.6 direction:

- Turn recent activity into a two-column card grid on wide screens.
- Keep one lead item slightly larger when there is a clearly most important update.
- Pull action labels back into the card body instead of right-anchoring them across the whole row.
- Tighten internal padding so each card reads more like a quick brief and less like a full-width list row.
- Let the section surface category, time, and next action with less travel distance.

Desired result:

- home reads like an operational snapshot instead of a feed stretched across a desktop canvas

### Events

Events is the most obvious candidate for a real layout change.

What the screenshot suggests:

- The current cards are too wide for the amount of information they contain.
- Response buttons repeat the same horizontal rhythm on every card.
- The right side of each card carries almost no unique value beyond the timestamp.
- The page communicates individual items, but not the schedule as a whole.

0.2.6 direction:

- Replace the one-column stack with a split layout.
- Left side: a compact card grid of upcoming events.
- Right side: a true month or agenda calendar showing dates with upcoming events.
- Let the selected or nearest event sync with the calendar state.
- Use the calendar to show density, today, and soonest action clearly.
- Compress response actions into a tighter button group or segmented control.
- Treat Google Calendar and `.ics` actions as secondary utilities, not equal-priority buttons.

Desired result:

- events feels like a scheduling surface rather than a list of large RSVP cards

0.2.6 follow-up note:

- Calendar export actions on the event cards and event detail page now sit as quieter ghost affordances instead of reading like co-primary buttons beside the RSVP flow.
- The same utility-weight reduction now carries through to the manage links on event and broadcast detail, so secondary controls stay available without taking attention away from the main task.
- This keeps planning and acknowledgment actions primary while still leaving export and manage utilities easy to reach.

### Pills

Pills now need more meaning and more charm.

What the screenshots suggest:

- Gray pills dominate even when states are meaningfully different.
- Some pills are large enough to feel like mini-cards.
- Neutral styling makes urgency, status, and mode changes harder to scan.

0.2.6 direction:

- Keep pills smaller and tighter than they are now.
- Introduce restrained color families with clear roles.
- Use color sparingly but intentionally.

Suggested role system:

- urgent or blocked: soft red
- today or time-sensitive: warm amber
- confirmed or healthy: green
- informational or planning: blue
- passive metadata: neutral gray

Rules:

- Do not color every pill.
- If a pill is not stateful or actionable, it probably should stay neutral or become plain text.
- Count pills should be denser than status pills.
- Segmented controls should not look identical to badges.

Desired result:

- pills add scan speed and personality without making the product feel noisy

0.2.6 pass note:

- The shared badge language now has a clearer split between neutral metadata pills and semantic status pills instead of relying on interchangeable gray outlines.
- Member-facing metadata chips on home broadcasts and events now stay quiet and neutral, while volunteer fill pills now use restrained green and amber tones so coverage health reads faster.
- The signup surface now reuses that same neutral pill treatment for lightweight context chips, which keeps supporting facts visible without making them compete with the primary action.
- This pass intentionally did not color every pill; the gain comes from making stateful pills more meaningful while letting passive labels recede.

### Volunteers

Volunteers is strong directionally, but some supporting widgets are still spending width too generously.

What the screenshots suggest:

- Coverage, next event, biggest gap, and helper widgets still behave like elongated summary blocks.
- The top region mixes one strong lead story with several quieter widgets that could be systematized better.
- The schedule itself is useful, but the surrounding support surfaces could be tighter and more modular.

0.2.6 direction:

- Turn the supporting summary widgets into a compact grid of operational tiles.
- Keep one lead staffing story, then let coverage, next-up, gap, and recent fill rhythm live as smaller modules.
- Reduce the amount of width given to any widget that only carries one number and one label.
- Consider a denser two-by-two stat grid adjacent to the lead story or schedule.
- Keep the top volunteers module useful, but compress row height and supporting copy.

Desired result:

- volunteers feels like a coordinator workspace with modular tools instead of a hero plus scattered support cards

### Messages

Messages has one very clear simplification available.

What the screenshot suggests:

- The right rail repeats the participant identity that is already in the thread header.
- Latest note duplicates the visible conversation.
- The state block repeats updated, unread, and count information that can live in the thread header or inbox.
- Other active people is useful, but not useful enough to justify a permanent third rail.

0.2.6 direction:

- Remove the conversation context rail from the desktop layout.
- Return that width to the thread pane.
- Keep the inbox plus thread split.
- Move any truly essential context into the thread header itself.
- If reply cadence remains useful, reduce it to a small inline indicator in the thread header or composer region instead of a full side module.
- Keep mute and archive actions, but make them lighter so the conversation remains primary.

Desired result:

- messages becomes a cleaner two-pane communication tool with more room for actual conversation

0.2.6 follow-up note:

- The inbox rows and thread header now separate plain metadata from actual conversation state instead of collapsing everything into one gray text line.
- Updated time stays as quiet copy, while unread, muted, archived, and demo-thread state now use compact local chips that read faster and match the shared pill system.
- This keeps the conversation surface calmer than the old context rail while still making thread state easier to scan at a glance.

### Directory

Directory is currently neat but not insightful.

What the screenshot suggests:

- The page becomes mostly empty after the first two rows of cards.
- Each card gives identity and contact basics, but little sense of relevance or recency.
- The grid is even, but it does not help the eye prioritize.
- The role pills are controlled, but not especially informative.

0.2.6 direction:

- Keep the grid, but make it more useful.
- Introduce one stronger top strip or side module for featured people, admins, or recently active members.
- Add lightweight recency or participation cues where they truly help scanning.
- Strengthen the face-name-role cluster so the first read is more immediate.
- Reduce lower-page emptiness by giving the route a second layer of meaning, not more card padding.

Possible useful signals:

- recently active
- usually replies fast
- admin
- volunteer lead
- joined recently

Desired result:

- directory helps people find the right person, not just any person

### Profile

Profile has the right overall structure, but it still needs one stronger preference model.

What the screenshot suggests:

- The top card is improved, but the notification area is still mostly checkbox-driven.
- There is no explicit preferred communication method.
- The current distinction is content type and push capability, not communication style.

0.2.6 direction:

- Add a communication preference control above or alongside notifications.
- This should be a clear single-choice preference, not another long checkbox list.
- Primary options:
  - Push
  - Message
  - SMS
  - Call
  - Hybrid
- Hybrid should include a short explanation so it does not feel ambiguous.
- Visually, this should feel more like a compact segmented or card-toggle control than a form field.
- Keep existing notification content toggles below it as secondary rules.

Desired result:

- profile answers both what should reach the user and how they prefer to be reached

0.2.6 follow-up note:

- The profile edit cards now drop their extra one-line descriptions, which removes a layer of repeated framing after the page header and top profile snapshot already established the context.
- The forms still read clearly from their section titles, field labels, and actions, but the first fold carries less explanatory chrome before the user reaches the actual controls.

## More Simplifications To Propose

0.2.6 should not stop at the eight requested changes.

There are a few broader simplifications that would improve the whole presentation branch.

### Simplification 1

Reduce duplicate explanatory copy at the top of sections.

Many screens now have a title, a subtitle, and then another short explanation immediately inside the first card.

Often only two of those three layers are needed.

### Simplification 2

Turn repeated utility buttons into quieter secondary affordances.

Calendar export, archive, mute, and similar support actions should stay available, but they should not compete with the primary task.

### Simplification 3

Stop using pills for low-value metadata.

Dates, joined labels, and passive facts often read better as plain compact text.

### Simplification 4

Compress top-of-page card framing where the page already has a strong shell.

Not every route needs a large hero card and another large card immediately below it.

### Simplification 5

Prefer one clear supporting module over two weak ones.

If a side surface cannot justify its width with decisions or scan speed, fold it into the primary pane.

### Simplification 6

Make desktop grids work harder before adding more sections.

When there is empty lower-page real estate, first ask whether the existing information should be reorganized before inventing new content.

## Priority Order For 0.2.6

If time is limited, do these five things first:

1. Remove the messages context rail and rebalance the thread layout.
2. Redesign events into a grid plus adjacent calendar.
3. Rework home recent activity into a tighter desktop grid.
4. Introduce a more intentional pill color system.
5. Add the communication preference control to profile and make directory more insight-led.

## Screenshot Review Method For 0.2.6

Keep using screenshots as the main judge.

After each route pass, capture the screen again and ask:

1. Did the layout stop wasting width?
2. Did the primary task become easier to understand in under three seconds?
3. Did pills gain meaning without becoming noisy?
4. Did we remove duplicated context instead of relocating it?
5. Did the route become more useful, not just more styled?

This branch should not be judged by whether it looks more elaborate.

It should be judged by whether the product explains itself faster and uses desktop space like it deserves to.