# Presentation UI Handoff: 0.2.7

This is the next presentation pass after 0.2.6.

0.2.6 was about removing waste.

0.2.7 should make the product feel friendlier.

Not softer.

More human.

The screenshots point to the same pattern across the remaining rough spots:

The app is structurally sound, but several important surfaces still read like utility layouts instead of intentional product moments.

For 0.2.7, the work should focus on nine things:

- friendlier volunteer cards on the hub
- renaming the demo organization to Old Town Cape
- larger month and day tiles in event widgets
- a slightly stronger header brand mark and safer long-title behavior
- broader avatar coverage with a modest size increase
- a more curated alerts sheet
- a better-looking organization members editor
- selective cover images on the right cards
- more color on actionable buttons and icons

The operating rule for this pass is:

Add warmth and hierarchy without adding noise.

## Screens Reviewed

The direction below is based on the current live app plus one header stress capture.

Reviewed directly:

- `tmp/screens/analysis-0.2.7-hub-volunteers.png`
- `tmp/screens/analysis-0.2.7-header-home.png`
- `tmp/screens/analysis-0.2.7-header-organization.png`
- `tmp/screens/analysis-0.2.7-header-stress.png`
- `tmp/screens/analysis-0.2.7-alerts-sheet.png`
- `tmp/screens/analysis-0.2.7-organization-members.png`

Implementation owners most directly involved:

- `src/lib/components/hub/member/VolunteersSection.svelte`
- `src/lib/components/volunteer/EventCard.svelte`
- `src/lib/demo/uiPreviewFixtures.ts`
- `src/lib/demo/ui-visual-fixtures.json`
- `src/lib/components/ui/Header.svelte`
- `src/lib/components/ui/HubNotificationsSheet.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`

## What The Screenshots Now Show

### Strong outcomes

- The shell already feels cleaner than the earlier presentation passes.
- The header navigation model is now simple enough that a small polish pass will matter.
- The organization route has the right information density, even though the members editor still looks generic.
- The alerts sheet now carries meaningful operator value instead of acting like a basic notification drawer.

### What still feels underdesigned

- The hub volunteer section still stretches two lightweight event rows across a very wide canvas.
- The month and day tile inside those event widgets is still too small to act as a real anchor.
- The header logo is slightly timid compared with the title weight and control cluster.
- The long-title stress capture shows the title can dominate the row too quickly.
- Avatar usage is still inconsistent across people-heavy moments.
- The alerts sheet contains good information, but its priority system is not visually strong enough.
- The organization members editor still behaves like a raw table with controls attached to the far edge.
- The demo organization still presents as Harbor Unit instead of the newer Old Town Cape story.
- Several cards are still fully text-led even when a restrained cover image could establish context faster.
- Many actionable buttons and icons are still visually neutral, so the UI under-signals what should be tapped first.

## Core Direction For 0.2.7

### Make operational surfaces feel more human

The next pass should not introduce more widgets.

It should improve recognition.

That means:

- more faces where the product is about people
- a better demo identity for presentation screenshots
- bigger date cues where time is the organizing fact
- tighter grouping where actions belong to a person or item
- selective imagery where it improves recognition
- stronger accent color on primary actions
- stronger hierarchy inside dense admin surfaces
- less dependence on full-width rows when desktop space is available
- a header that can absorb longer titles without looking brittle

## 0.2.7 Goals

### 1. Turn hub volunteers into a friendlier desktop grid

What the screenshot shows:

- The section is still one large card containing a vertical stack.
- Each event gets a broad horizontal lane with a long quiet middle.
- The primary action sits far away from the title and coverage information.
- The composition feels operational, but not welcoming.

0.2.7 direction:

- Replace the single stacked container with a two-column grid on desktop.
- Let each volunteer event become its own card instead of a divided row.
- Keep the existing date block, fill state, and sign-up action, but make them local to each card.
- Increase the month and day box by one clear step so it reads as a real visual anchor instead of a small utility badge.
- Pull the progress bar closer to the event summary so the card reads in one glance.
- Add one human cue per card: a volunteer lead avatar, a small stack of participant faces, or a named contact row.
- Consider a cover image only for the lead or featured event card, not every tile.
- Let the sign-up action carry more visible color so the eye finds the next step faster.

Desired result:

- volunteers reads like a community opportunity surface instead of a stretched operations list

Specific recommendation:

- Keep the current compact card language from `EventCard.svelte`, but promote it into a tiled layout instead of one shared parent card.

### 2. Rename the demo organization to Old Town Cape

What the current fixtures show:

- The preview data still uses Harbor Unit as the organization name.
- That name appears in the fixture layer that powers presentation-facing screenshots.
- The underlying issue is not product structure. It is presentation naming.

0.2.7 direction:

- Rename the demo organization from Harbor Unit to Old Town Cape in the preview fixtures that drive screenshots and demo state.
- Update any fixture copy that reads like literal organization storytelling when it still references Harbor Unit.
- Treat this as a presentation consistency pass, not a broader product rename.

Desired result:

- screenshots and demo walkthroughs tell the Old Town Cape story consistently

Implementation note:

- The most direct owners are `src/lib/demo/ui-visual-fixtures.json` and `src/lib/demo/uiPreviewFixtures.ts`.

### 3. Increase the logo slightly and harden the header for long titles

What the screenshots show:

- On normal screens, the logo is clean but slightly underscaled relative to the title.
- On the organization screen, the title area and nav balance well only because the title is short.
- In the header stress capture, a longer page title quickly consumes the row and makes the layout feel fragile.

0.2.7 direction:

- Increase the brand mark and brand image by one small step, not a redesign-level jump.
- Increase the context avatar badge by the same relative notch so the identity system stays balanced.
- Let the title block have a safer max width before it fights the nav and controls.
- On long page titles, prefer wrapping into a controlled two-line block with slightly looser line-height instead of the current heavy stacked look.
- When a title exceeds the comfortable width, let nav and controls yield into a second-row composition rather than forcing a single compressed line.

Desired result:

- the shell feels more confident at a glance and remains stable when page titles grow

Practical implementation note:

- This likely belongs in `Header.svelte` as a layout rule, not in route-level title trimming.

### 4. Use avatars more often, and make the existing ones slightly larger

What the screenshots show:

- The members editor has avatars, but they are still a bit modest relative to the row height.
- The volunteer cards do not yet use faces even though they are about staffing and ownership.
- The alerts sheet remains text-first even when several entries are really about people doing work.

0.2.7 direction:

- Increase standard list avatars one notch on key people surfaces such as the members editor.
- Increase the header context avatar badge slightly alongside the logo change.
- Add avatars where they improve recognition, not decoration.

Best candidates:

- volunteer cards: volunteer lead or participant stack
- alerts sheet: reviewer, assignee, or event owner when a row is clearly person-linked
- any admin follow-up or closeout summary that currently reads as anonymous operational text

Rule:

- If the user is choosing, reviewing, messaging, or delegating around a person, the UI should usually show a face or initials.

Desired result:

- more of the product feels relational instead of system-generated

### 5. Polish the alerts sheet into a clearer triage surface

What the screenshot shows:

- The sheet has useful content, but the opening section is visually flat.
- Count pills, descriptions, labels, cards, and action buttons all compete at similar intensity.
- The drawer feels long before it feels prioritized.
- The footer actions are useful, but the body does not establish a strong first-read hierarchy.

0.2.7 direction:

- Give the top of the sheet a clearer summary band so the user understands the state of the inbox immediately.
- Reduce the amount of explanatory copy visible before the first actionable items.
- Make section headers and counts more deliberate so recovery, closeout, and follow-up do not blur together.
- Tighten label clutter inside each item card.
- Add one human cue where possible, especially for deferred notes or reviewer states.
- Consider a slightly roomier desktop width so the item cards can breathe without feeling cramped.

Desired result:

- alerts behaves like a compact operator inbox with obvious priorities, not a long sheet of equally weighted cards

Simplification note:

- The sheet does not need more features. It needs stronger sequencing: summary first, highest-value items next, supporting context after that.

### 6. Redesign the organization members editor to feel less like a default table

What the screenshot shows:

- The page has good supporting controls, but the main member list still reads like a generic admin table.
- The member identity sits on the far left while role and actions drift to the far right.
- Buttons, select, and badges create a busy action edge.
- The row design makes the people less important than the controls.

0.2.7 direction:

- Keep the search and filter controls, but make the member row itself feel more intentional.
- Treat each row like a compact management card inside a list, even if table semantics stay in place.
- Increase the avatar size slightly and make the name block the visual anchor.
- Pull role, join status, and recent state closer to the identity block so the row reads left-to-right faster.
- Consolidate actions into a tighter cluster with clearer primary and secondary roles.
- Avoid making `Update` and `Remove` feel identical in weight to `Message` and role selection.

Recommended hierarchy:

- primary anchor: avatar, name, contact, short bio
- secondary context: role and join status
- tertiary controls: message, role change, destructive action

Desired result:

- the members surface feels like people management, not spreadsheet maintenance

### 7. Add selective cover images to the right cards

What the screenshots suggest:

- Several cards still rely entirely on text, pills, and spacing to create hierarchy.
- That keeps the product calm, but it also means some modules do not establish context quickly.
- Not every card needs imagery, but a few lead cards could use it.

0.2.7 direction:

- Add cover images only where they improve recognition or emotional context.
- Prefer one strong image-led card in a section over many repetitive thumbnails.
- Use imagery for featured broadcasts, featured events, resources, or other lead cards where the image helps the user understand what the card is about before reading every line.
- Keep operational lists, admin tables, and dense management rows mostly text-led.

Desired result:

- the UI gains a more immediate first read without drifting into a noisy card gallery

Rule:

- If the image does not change understanding in the first second, skip it.

### 8. Add more color to actionable buttons and icons

What the screenshots suggest:

- Too many actions still share the same neutral button treatment.
- The UI often communicates hierarchy through layout alone, even when color could help.
- Actionable icons are present, but not always visually urgent enough.

0.2.7 direction:

- Give the primary action in a card or section more visible color weight.
- Let action-leading icons inherit that same priority when they point to the next step.
- Reserve the strongest accent color for real actions such as sign up, review, open, respond, or manage.
- Keep quiet utilities and secondary controls more restrained.

Desired result:

- the next click is easier to spot, and the product feels less hesitant about what matters most

Color rule:

- Do not color every button. Use color to separate primary action from support action.

## Specific Simplifications To Propose

These are not separate features.

They are simplifications that support the requested changes.

### Volunteer cards

- Remove the single shared outer card on desktop.
- Let each event own its own border and padding.
- Keep only one supporting line under the title before the progress bar.
- Scale the month and day box before adding more padding around the rest of the card.

### Demo identity

- Rename the presentation organization to Old Town Cape in preview fixtures.
- Update nearby fixture copy only where Harbor Unit still appears as visible demo storytelling.

### Header

- Do not truncate titles aggressively.
- Prefer stable wrapping and layout shifting over ellipsis.
- Let long titles switch the row into a more vertical composition when necessary.

### Alerts sheet

- Shorten the opening description.
- Collapse repeated metadata chips when they are not essential.
- Let one visual signal, not three, communicate urgency.

### Card imagery and action color

- Add cover images only to featured or lead cards.
- Use stronger accent color on the one action that should win first attention.
- Let icons participate in action hierarchy instead of remaining purely decorative.

### Members editor

- Reduce the visual independence of each control.
- Make the row read as one composed object before it reads as four separate cells.
- If needed, preserve the table only on very wide screens and use a list-card treatment sooner.

## Priority Order

If this pass needs sequencing, do it in this order:

1. Hub volunteer grid
2. Demo organization rename to Old Town Cape
3. Header scaling and long-title behavior
4. Alerts sheet polish
5. Members editor redesign
6. Selective cover imagery and action color on high-value cards
7. Avatar expansion pass across the touched surfaces

## The Main Question For 0.2.7

When the app shows people, work, and next actions side by side, does it feel like a product that understands who is involved?

That is the quality bar for this pass.

The current branch is close.

It mainly needs a more human visual emphasis in the places where responsibility, identity, and action come together.