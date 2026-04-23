# Presentation UI Handoff: 0.2.4

This is the next planning brief after the 0.2.3 simplification pass.

0.2.3 proved the right direction.

The product is better when it becomes more obvious, calmer, and more useful instead of more decorative.

0.2.4 should keep pushing in that same direction, but with a little more confidence in layout, typography, and human presence.

The next branch should feel:

- more human
- more editorial
- more spatially intentional
- more confident on desktop
- still calm on mobile

The next important shift is this:

Do not re-introduce UI noise just because the screens have become simpler.

Instead, use three stronger tools:

- better portraits
- better columns
- better type and spacing

## What 0.2.3 established

0.2.3 already proved a few things:

- Action-oriented summaries are better than neutral stats.
- Fewer chips and nested cards make the app feel more serious and more useful.
- The product improves when one object per route is clearly dominant.
- Mobile gets better when shared chrome gets out of the way.

0.2.4 should not undo any of that.

## 0.2.4 goals

### 1. Make the product feel more human

The app still leans too hard on initials and abstract UI surfaces in places where a human face would create faster recognition.

For 0.2.4, use portrait avatars more deliberately across the product.

That does not mean random stock-photo clutter.

It means a small, consistent set of licensed or generated portrait photos used in the demo state anywhere the UI benefits from recognizing a person instead of an abstract record.

Best candidates:

- home conversation context
- volunteer contributors and staffing surfaces
- directory member cards
- messages inbox and thread headers
- check-in rows for active volunteers
- profile summary surfaces

The rule should be:

If the screen is about people making decisions about other people, show faces when possible.

Likely follow-up work:

- seed photo avatar urls in the relevant demo fixtures
- extend volunteer contact fixtures to include portraits
- prefer portrait avatars over monograms on contributor-heavy cards

### 2. Let desktop layouts use two or three columns when the information supports it

Several routes are now calm enough that they can carry more ambitious desktop composition.

0.2.3 reduced clutter.

0.2.4 can now use that headroom.

The product should not force single-column reading on desktop when the information naturally separates into:

- primary object
- live status
- people or context rail

Use two or three columns when they improve comprehension, not just density.

Good uses of wider layouts:

- home: lead attention column, recent activity column, compact people or signal rail
- volunteers: primary schedule column, top contributors column, compact operational summary rail
- check-in: active roster column plus a live status or exceptions column
- profile: main personal details column plus adjacent account or preferences column
- directory: triple-column people grid with stronger avatar-first recognition

Avoid this mistake:

- three equal columns with equal weight and no obvious lead object

The layout should still answer, at a glance, what matters most.

### 3. Push typography harder than 0.2.3 did

0.2.3 mostly quieted the interface.

0.2.4 should make it more memorable by using typography and spacing more intentionally.

This means:

- larger display-style headlines when a route has one real point of emphasis
- tighter line lengths for long summaries
- smaller and quieter metadata
- fewer all-caps labels used with more discipline
- more generous white space around the single most important object on a screen

The product should feel more designed through hierarchy, not ornament.

Practical guidance:

- one large headline per route is enough
- overlines should be sparse and meaningful
- supporting copy should read like short editorial guidance, not system labels
- dense utility text should stay compact and secondary

### 4. Make every route feel intentionally useful, not just cleaned up

0.2.3 improved clarity.

0.2.4 should improve usefulness.

Each route should make a stronger claim about why it exists.

That means:

- home should feel like a calm control surface
- volunteers should feel like an operational planning workspace
- signup should feel reassuring and frictionless
- check-in should feel live and time-sensitive
- messages should feel like a communication tool, not a shell around chat
- directory should feel like a people finder, not a member dump
- profile should feel like a high-trust personal workspace

## Route-by-route proposals

### Home

Push the home route beyond a dashboard.

Proposed changes:

- Split the top fold into a stronger two-column composition with a dominant attention column and a narrower signal rail.
- Use real-face avatars in the conversation context area and any follow-up surfaces involving specific people.
- Consider a two-column recent-activity layout on wide screens so items read more like editorial briefs than one long queue.
- Reduce visual similarity between "attention now" and "broader system health" so the page has a clearer reading order.

Desired result:

- home feels like a calm command page, not a tidy analytics board

### Volunteers

The volunteer route can take more spatial ambition.

Proposed changes:

- Use a stronger two- or three-column desktop layout: one lead staffing story, one schedule column, one people rail.
- Add portraits to reliable-volunteer surfaces and any contributor callouts.
- Make the current schedule feel more like a working board by using grouped cards or staggered rhythm instead of one repeated row cadence.
- Let typography carry more emphasis on the staffing gap and reduce the supporting chrome further.

Desired result:

- volunteers feels like a live staffing workspace with real people attached to it

### Signup

Signup is already cleaner. The next step is confidence.

Proposed changes:

- Keep the current two-column structure, but give the left side more editorial calm with stronger display type and slightly more white space.
- Let the selected shift become more typographic and less card-like.
- Consider adding one human touch, such as the coordinator or volunteer team portrait, if it helps trust without creating clutter.
- Tighten the form vertical rhythm so the submit area arrives a little sooner on laptop heights.

Desired result:

- signup feels reassuring, direct, and worth completing immediately

### Check-in

Check-in is better, but still has room to become more operational.

Proposed changes:

- On desktop, consider a split where the roster is primary and the live summary / exceptions form a separate rail.
- Use real volunteer portraits in the active list when available so check-in feels less abstract.
- Explore separating pending and completed arrivals into adjacent grouped zones or clearer visual bands.
- Increase contrast between names, affiliations, and status so the eye lands on the right thing faster.

Desired result:

- check-in feels active, human, and fast to scan under pressure

### Messages

Messages is cleaner, but it can feel more premium and more focused.

Proposed changes:

- On larger screens, explore a three-region layout: inbox, active thread, compact contact/context rail.
- Keep mobile minimal, but let desktop use more generous thread typography and spacing.
- Use face avatars consistently in the inbox, thread header, and any context surfaces.
- Explore slightly more expressive message rhythm through spacing and timestamp treatment rather than more chrome.

Desired result:

- messages feels like a communication surface first and a product shell second

### Directory

Directory is ready for a stronger visual identity.

Proposed changes:

- Lean into a confident three-column desktop people grid.
- Use real-face avatars to make scanning faster and to reduce the generic member-card feeling.
- Let cards breathe more vertically, with clearer name, role, and contact rhythm.
- Consider a compact top row for featured admins or recently active people if it clarifies who matters most.

Desired result:

- directory feels like a people-finding tool, not a catalog of records

### Profile

Profile should become calmer but also more premium.

Proposed changes:

- Use a two-column desktop structure for the most important settings groups instead of a long single stack.
- Let the profile summary breathe more, with stronger portrait presence and more intentional type scale.
- Keep details surfaces plain, but use spacing to separate identity, communication, and preference concerns.
- Consider making the top section feel more like a personal workspace and less like a settings header.

Desired result:

- profile feels personal, trustworthy, and quiet without being bland

## Cross-route system work

### Portrait avatar system

0.2.4 should include a small portrait set for demo and presentation routes.

Requirements:

- use licensed or generated portraits only
- keep styling consistent across all routes
- avoid mixing realistic portraits with too many monogram fallbacks in the same focal area
- reserve monograms mainly for true fallback states

### Type scale tuning

Audit display, title, body, and metadata sizes across the main routes.

What to tune:

- route hero sizes
- secondary headline sizes
- metadata and helper copy sizes
- uppercase overline frequency
- max text widths for long summaries

### Spacing rhythm

0.2.4 should make spacing more deliberate.

Focus on:

- larger top-of-page breathing room where a route has one lead object
- more consistent vertical rhythm between hero, main surface, and secondary surfaces
- fewer cramped internal stacks on desktop
- less dead empty space created by over-padding low-value blocks

## Constraints for 0.2.4

- Keep the 0.2.3 simplification direction.
- Do not bring back decorative chip overload.
- Do not make desktop dense just because more columns are possible.
- Do not use portrait avatars without consistent source quality.
- Keep mobile restrained even when desktop becomes more editorial.

## If time is limited

Do these five things first:

1. Introduce a consistent portrait-avatar set for people-heavy routes.
2. Recompose home and volunteers into stronger two- or three-column desktop layouts.
3. Turn directory into a more confident avatar-first three-column people grid.
4. Restructure profile into a cleaner two-column desktop workspace.
5. Tighten typography and spacing across all route heroes so the app feels more intentional without becoming louder.