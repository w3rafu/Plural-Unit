# Presentation UI Handoff: 0.2.5

This is the next planning brief after the 0.2.4 presentation pass.

0.2.4 improved the product in the right way.

The app feels more human, more intentional, and more useful.

0.2.5 should not try to outdo that with bigger gestures.

It should get sharper.

The next branch should feel:

- tighter
- more exact
- more information-dense where it matters
- less wasteful with space
- more disciplined in hierarchy
- more alive through activity metrics

The main shift for 0.2.5 is this:

Stop treating all empty space as good and all density as bad.

Some screens are still wasting vertical and horizontal space on soft framing, oversized pills, repeated helper copy, and containers that are larger than the content they carry.

Other screens still need more room given to the things that actually help decisions.

0.2.5 should save space where the UI is being polite and spend space where the UI is being useful.

## What The 0.2.4 Screenshots Show

The current screenshots were enough to identify the next pass clearly.

The broad direction is correct.

The remaining issues are mostly not structural anymore.

They are compositional and detail-level.

### Strong outcomes from 0.2.4

- Portraits improved recognition without making the app feel noisy.
- The best routes now have one dominant object and one quieter support region.
- Messages proved that a third desktop rail can work when it carries real context.
- Signup and check-in now belong visually to the same product family as the signed-in routes.

### What still feels wasteful

- Home still spends too much vertical room on card padding and underfilled middle-column content.
- Volunteers has better structure now, but the hero and schedule still use more width and height than the information earns.
- Directory wastes both card width and lower-page space because the cards are too wide for how little each one says.
- Profile still burns a lot of space between sections, especially above the fold and in the right-side flow.
- Check-in still opens with too much hero height for a page that should get to the roster immediately.
- Signup mobile still spends too much time on intro and chip framing before the user reaches the task.
- Pills across the app are more controlled than before, but they are still too similar to each other and often too large.

## Core Rule For 0.2.5

### Save space here

Save vertical or horizontal space when the UI is spending room on:

- oversized section padding
- repeated helper copy
- duplicate labels and metadata
- large pills that say very little
- wide cards with only one or two facts inside
- big empty rails with weak content
- overlines that do not improve reading order
- form spacing that delays the primary action

### Spend space here

Spend more space when it improves comprehension for:

- the primary headline or task
- message text and conversation reading
- active rosters and operational lists
- meaningful metrics and trends
- face/name/status clusters
- primary actions
- the most important summary for the route

The question for every screen should be:

Is this area helping the user decide, act, or scan faster?

If not, compress it.

If yes, let it breathe.

## 0.2.5 Goals

### 1. Reclaim wasted vertical space

The app is calmer now, but several routes still have too much soft height.

0.2.5 should remove dead air without making the UI cramped.

Focus on:

- top-of-page hero blocks that are too tall relative to the task
- stacked cards with repeated top and bottom padding
- long helper copy blocks that can become shorter labels or summaries
- over-separated sections that should sit closer together
- mobile sections that push the primary task too far below the fold

### 2. Reclaim wasted horizontal space

Some desktop layouts are now wide enough to show more meaning, but not all of that width is being used well.

Focus on:

- cards that are too wide for their content
- rails that are present but underfilled
- two-column surfaces where one column is mostly empty whitespace
- list rows that spread sparse metadata too far apart

This does not mean making everything denser.

It means giving width back to the surfaces that can use it.

### 3. Add live activity metrics

0.2.5 should make the product feel more active and more measurable.

The right move is not more dashboard chrome.

It is a small set of compact, visual activity metrics that can live inside otherwise calm screens.

The key pattern should be:

- GitHub commit-graph style green-dot activity grids

Use them to show recent movement over time rather than another flat percentage.

This is especially useful because the rest of the UI is already calm enough to support one stronger visual metric layer.

### 4. Redesign the pill system

Pills still need a sharper hierarchy.

Right now filters, statuses, counts, and labels still look too related.

0.2.5 should define clearer pill roles so each one earns its visual weight.

### 5. Do a detail pass, not just a layout pass

The next quality jump is now in the details.

That includes:

- line-height
- pill sizing
- dividers
- avatar alignment
- button weight
- label frequency
- baseline alignment
- where counts live
- how timestamps and metadata recede

## Route-By-Route Audit

### Home

The home route is directionally correct but still wastes space in the top fold.

What the screenshot suggests:

- The middle signal card is too tall for how little it says.
- The recent-activity cards still use generous internal padding for lightweight content.
- The broadcast area starts with too much vertical separation from the hero group.
- On mobile, the hero is still too tall before the user reaches actionable sections.

Save space:

- Compress the signal-check stack into tighter metric rows.
- Reduce padding inside recent-activity cards.
- Bring the broadcast section closer to the top fold.
- Tighten the mobile hero and summary stack.

Spend space:

- Add a compact activity history module using green-dot metrics.
- Give the most important activity item slightly more prominence.
- Let the lead summary feel more exact, not bigger.

0.2.5 idea:

- Replace one of the current signal blocks with a small 4-week activity grid showing broadcasts, event follow-through, and inbox movement.

### Volunteers

Volunteers has a better desktop structure now, but the hero still burns too much room on summary framing.

What the screenshot suggests:

- The three-column hero is useful, but the center column is underfilled.
- The schedule cards are still taller than necessary.
- The right rail is informative, but the row height can come down.
- Mobile still opens with too much hero before the schedule becomes primary.

Save space:

- Collapse coverage, next-up, and open-gap facts into a more compact stat group.
- Reduce schedule card height and spacing around bars and buttons.
- Tighten people-to-call row height.
- Shorten the mobile intro before the schedule list starts.

Spend space:

- Give more width to the schedule itself.
- Add a volunteer activity or fill-rate heatmap.
- Use space to show cadence across time, not more static text.

0.2.5 idea:

- Add a green-dot staffing activity module that shows which days or weeks had the strongest volunteer participation and where coverage was weak.

### Directory

Directory is one of the clearest examples of wasted horizontal and vertical space.

What the screenshot suggests:

- The cards are too wide for the amount of content they contain.
- The overall page leaves a large empty field in the lower half.
- The search and segmented control bar is taller than it needs to be.
- The role/status treatment is still too weak relative to the face/name block.

Save space:

- Make the top control bar shallower.
- Reduce card width or move to more columns at large breakpoints.
- Tighten internal card spacing.
- Pull low-value metadata closer to the name block.

Spend space:

- Make the face/name/status cluster stronger.
- Add small activity indicators or member recency cues.
- Use space to improve scanning, not to create emptiness.

0.2.5 idea:

- Shift to a denser grid on wide screens and introduce a tiny contribution-style activity strip or dot cluster for admins or recently active members.

### Profile

Profile improved in 0.2.4, but it still wastes too much vertical room and has weak above-the-fold prioritization.

What the screenshot suggests:

- The top identity card has too much empty area on the right.
- The right-side flow uses a lot of space to say very little before notifications appear.
- Danger zone is visually isolated too early.
- The page still feels more stacked than intentionally composed.

Save space:

- Shorten the identity summary card.
- Reduce the gap between top summary, form cards, and notifications.
- Move danger zone lower in the reading order.
- Tighten the security card vertical rhythm.

Spend space:

- Add personal activity metrics that justify the top fold.
- Use the right side for something more useful than empty breathing room.
- Make profile feel like a personal dashboard, not just forms.

0.2.5 idea:

- Add a personal activity module using green dots for message replies, event participation, or admin actions over the last 30 days.

### Messages

Messages is strong now, but the next pass should be about operational refinement.

What the screenshot suggests:

- The third rail works, but the metadata sections are still tall.
- Inbox rows still have a little too much vertical softness.
- Mute and Archive pills feel heavier than the hierarchy requires.
- Mobile thread view is good, but the header and composer still take a lot of room.

Save space:

- Tighten inbox row padding.
- Reduce thread-header control weight.
- Make the context rail more compact.
- Trim mobile composer chrome and top header height where possible.

Spend space:

- Keep message bubbles readable and generous.
- Let the actual conversation remain the most spacious part of the UI.
- Add a small reply-activity view only if it improves follow-up decisions.

0.2.5 idea:

- Add a tiny reply cadence metric in the context rail rather than another text summary block.

### Organization

Organization admin was wasting the top fold on stacked summary chrome before the actual access and member tools began.

What the screenshots suggest:

- The overview block carried too many oversized summary treatments at once.
- The section switcher sat in its own full-height card with more explanation than it needed.
- On mobile, the admin work started too far below the fold.
- The nested access and member surfaces had the right content, but not the right visual priority.

Save space:

- Collapse overview metadata into smaller chips and tighter stat cards.
- Make the section switcher shallower and more explicit.
- Tighten summary rows, search bars, and supporting helper copy inside access and member cards.
- Reduce nested panel chrome where the list content is the real priority.

Spend space:

- Keep the join code and invite actions prominent.
- Let deletion requests and the member roster read as the operational core of the page.
- Preserve strong scan paths for resend, revoke, role updates, and direct message actions.

0.2.5 idea:

- Treat organization as an admin utility surface: compact top summary, clear section switcher, and immediate access to the first operational list.

### Hub Manage

Hub manage was spending too much of the top fold on a large setup dashboard before admins reached the actual section or content tools.

What the screenshots suggest:

- The original setup summary used too many equally weighted metric cards.
- The section switcher sat in a second full-width card, which delayed the editor surfaces underneath.
- On mobile, the summary stacked into a long single-column block that dominated the first screen.
- The actual work queue and section controls were already useful, but they started too late.

Save space:

- Reduce the setup summary to the few metrics that matter most for orientation.
- Move secondary signals into compact pills instead of full cards.
- Make the section switcher shallower and more explicit.
- Keep long explanatory copy out of the mobile top fold unless it changes the next action.

Spend space:

- Keep the operations queue and section toggles readable once they enter view.
- Preserve strong scan paths for due work, recovery, and follow-up counts.
- Let admin tools feel operational rather than dashboard-heavy.

0.2.5 idea:

- Treat hub manage as an operator console: one compact setup summary, a tight mode switcher, and immediate access to the first working panel.

### Broadcast Detail

Broadcast detail was readable, but it spent too much of the first screen on repeated status framing before the admin follow-up work began.

What the screenshots suggest:

- The top summary used two large status cards for information that could be much tighter.
- Admin context repeated visibility-style information that the route had already established above.
- On mobile, the status cards stacked too tall before the acknowledgment action and follow-up roster.

Save space:

- Keep status and acknowledgment context compact at the top of the card.
- Turn metadata into a tighter inline row instead of a loose stack.
- Remove duplicate admin summary blocks that repeat the same meaning.

Spend space:

- Let the acknowledgment follow-up roster remain the dominant admin surface.
- Keep the message body and the primary acknowledgment action easy to scan.

0.2.5 idea:

- Treat broadcast detail like a compact briefing: short status summary up top, direct acknowledgment action next, then the follow-up roster without extra dashboard chrome.

### Event Detail

Event detail had the same broad issue as broadcast detail: too much height was being spent on framing before the actual RSVP and admin follow-up work.

What the screenshots suggest:

- The timing and location stack consumed too much vertical space for metadata that members only need to confirm once.
- Calendar actions lived in their own section even though they support the same top-of-card decision moment as RSVP.
- Admin context used multiple summary cards before the attendance roster, which delayed the operational surface.
- On mobile, the first screen felt more like a brochure than a response workflow.

Save space:

- Keep event metadata compact and scannable.
- Merge supporting actions like calendar export into the response area instead of giving them a full extra section.
- Reduce admin summary chrome so RSVP follow-up and attendance can surface sooner.

Spend space:

- Keep the event title and short description readable.
- Preserve clear response controls and the day-of attendance roster as the dominant actions.

0.2.5 idea:

- Treat event detail like a compact RSVP brief: confirm the essentials quickly, respond immediately, then move into admin follow-up without repeated dashboard blocks.

### Signup

Signup is significantly better, but it still wastes some mobile height and desktop form rhythm.

What the screenshot suggests:

- The desktop left panel is strong, but the pills still feel a little large for their informational value.
- The shift selection rows are slightly taller than they need to be.
- The form fields still stack with generous spacing before the submit button.
- Mobile still gives a lot of real estate to intro copy before the user reaches the task.
- The success state is clear, but it can feel sparse unless the confirmation details are packed more tightly.

Save space:

- Make the informational pills smaller and more precise.
- Tighten shift-row height.
- Reduce form spacing so the CTA arrives sooner.
- Compress the mobile hero and chip area.
- Collapse confirmation notes and recap details so the success state feels complete instead of airy.

Spend space:

- Keep the event headline strong.
- Preserve room for trust cues like the coordinator and selected shift.
- Give more room to the actual task, not the explanation.

0.2.5 idea:

- Move one piece of intro copy into a compact metric row and let the form begin sooner.

### Check-In

Check-in improved a lot, but this route still has the clearest remaining space problem.

What the screenshots suggest:

- The desktop hero is too tall for an operational page.
- The working-now card spends a lot of height on descriptive framing.
- The shift pills are still a little large and soft.
- On mobile, the roster starts too late.

Save space:

- Compress the hero sharply.
- Turn the top summary into a tighter operational strip.
- Reduce pill size and row gutters.
- Get the roster higher on both desktop and mobile.

Spend space:

- Give more width and focus to the roster rows.
- Make names, status, and actions easier to scan.
- Add a live arrival metric that feels temporal, not static.

0.2.5 idea:

- Add a compact arrival activity grid or hourly attendance pattern to the right rail, and let the hero become much smaller.

## Activity Metrics System

0.2.5 should introduce one reusable activity metric pattern.

### Primary pattern

- GitHub-style contribution graph with green dots

Use a calm green scale on light backgrounds.

Suggested states:

- empty
- low
- medium
- strong
- peak

The visual model should feel like evidence, not decoration.

### Best first placements

1. Home: activity movement across the last 28 to 35 days
2. Volunteers: volunteer participation or fill progress over time
3. Profile: personal action history or engagement cadence
4. Directory: admin or recent-activity cues in a restrained form
5. Check-in: arrivals through the day or event cadence

### Rules for use

- Do not use the grid just to decorate empty areas.
- Pair it with one clear label and one short interpretation.
- Keep it compact.
- Use it where time-based activity is more useful than another static percentage.
- Prefer one grid done well over multiple weak mini-charts.

## Pill System v2

The app now needs a clearer pill hierarchy.

### Current problem

- Filter pills, status pills, count pills, and metadata pills still feel too similar.
- Some pills are too wide and too soft.
- Pills sometimes carry content that should be plain text or a stronger label.

### 0.2.5 pill roles

#### Filter pills

Use for mode switching only.

These should feel closer to segmented controls than badges.

#### Status pills

Use for states like:

- needs review
- full
- need 5 more
- active
- muted

These should be smaller, tighter, and more contrast-aware.

#### Count pills

Use for small quantitative emphasis.

These should be more compact and slightly heavier than status pills.

#### Metadata pills

Use rarely.

If something is not actionable and not stateful, it often does not need a pill.

### Practical direction

- reduce pill height
- reduce side padding
- sharpen color meaning
- reduce the number of pills shown at once
- stop turning every secondary fact into a badge

## Detail Pass Checklist

0.2.5 should explicitly inspect:

- repeated top padding above headers
- repeated bottom padding below low-value sections
- line-height on long summaries
- label and overline frequency
- avatar sizing consistency
- action button weight vs. secondary controls
- border-radius consistency between cards, pills, and inputs
- divider use and whether sections need them
- timestamp and metadata quietness
- whether counts sit in the visually right place

## What To Do First In 0.2.5

If time is limited, do these five things first:

1. Rework Home and Volunteers around compact activity metrics, tighter pills, and less waste in the top fold.
2. Compress Check-In so the roster starts sooner and the hero behaves like an operational summary instead of a presentation card.
3. Tighten Directory so wide cards stop wasting space and member activity becomes easier to scan.
4. Recompose Profile so the top fold earns its size with personal activity and less empty right-side air.
5. Run another full screenshot sweep and judge every route specifically for dead space, pill weight, and metric usefulness.

## Screenshot Review Method For 0.2.5

Keep using screenshots as the main design judge.

After each route pass, capture desktop and mobile where relevant and ask:

1. Is there visible dead air that is not helping hierarchy?
2. Are pills doing too much visual work for too little information?
3. Is the primary action or object reaching the user soon enough?
4. Did a new metric add meaning or just fill space?
5. Are the smallest details now cleaner than the previous branch?

This branch should be judged less by whether it looks "new" and more by whether it feels more exact.