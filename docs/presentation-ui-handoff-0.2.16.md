# Presentation UI Handoff: 0.2.16

This is the next presentation pass after 0.2.15.

0.2.15 fixed the largest remaining hierarchy problem by turning home into a live landing page instead of a stacked summary wall.

The latest screenshot review shows that home is no longer the route that most obviously needs attention.

The next gains should come from two broader presentation decisions:

- make the admin shell and organization screens feel less chrome-heavy before real content starts
- increase the global type scale so the product feels clearer and more presentation-sized across the board

0.2.16 should be an organization-plus-shell pass, with global typography adjustments treated as a real release goal rather than a minor tweak.

## Screens reviewed

These notes are based on the fresh capture set saved in `tmp/screens-0.2.16-review/`:

- `tmp/screens-0.2.16-review/home-desktop.png`
- `tmp/screens-0.2.16-review/home-mobile.png`
- `tmp/screens-0.2.16-review/messages-desktop.png`
- `tmp/screens-0.2.16-review/directory-desktop.png`
- `tmp/screens-0.2.16-review/organization-members-desktop.png`
- `tmp/screens-0.2.16-review/profile-desktop.png`
- `tmp/screens-0.2.16-review/volunteers-desktop.png`
- `tmp/screens-0.2.16-review/volunteers-mobile.png`
- `tmp/screens-0.2.16-review/signup-desktop.png`
- `tmp/screens-0.2.16-review/signup-mobile.png`
- `tmp/screens-0.2.16-review/checkin-desktop.png`
- `tmp/screens-0.2.16-review/checkin-mobile.png`

## What is working now

- Home desktop and mobile now get to live hub content quickly enough that they should move into the protection bucket.
- Messages desktop still reads like a finished workspace and does not need route-specific changes.
- Directory remains stable and intentional at the current fixture density.
- Profile is calm and usable, even if its desktop canvas could still be used more boldly later.
- Volunteers desktop/mobile, signup desktop/mobile, and check-in desktop/mobile remain clear and presentation-safe.
- The product family still feels coherent across dark and light surfaces.

## What still weakens the screenshots

- Organization members still spends a lot of valuable top-of-page height on overview and management chrome before the roster becomes dominant.
- The shared admin shell still presents several peer-level utility controls that compete with route content instead of framing it.
- Across the app, text still reads slightly too small for presentation screenshots, especially in metadata, helper copy, segmented controls, table-like admin rows, and public desktop flows with lots of surrounding space.
- Profile, signup, and check-in are clear, but on desktop they can still look slightly under-scaled because the type rhythm stays conservative relative to the amount of canvas.
- The home route is improved enough to stop, but the lingering small-type feeling is still visible there too; the next pass should solve that globally rather than route by route.

## Core direction for 0.2.16

### Increase clarity through bigger type and less admin chrome

0.2.16 should keep the current visual language and component family.

It should:

- raise the global font size baseline so the app feels easier to read in presentation screenshots and at large desktop widths
- rebalance dense small-text UI pieces so they do not fall behind once the base type scale increases
- reduce top-of-page admin control weight where it competes with the main content
- make organization members read like a people-management surface first and a control strip second
- leave the already-stable member-facing routes alone unless the shared typography changes improve them naturally

The working question for 0.2.16 should be:

Is this screen hard to read because the hierarchy is wrong, or because the type scale is too timid for the amount of space the layout already has?

If the main problem is timid scale, fix the type system before redesigning the route.

## 0.2.16 priorities

### 1. Make font size larger globally

What the screenshots show:

- The app is now structurally cleaner than it was in 0.2.14, but many surfaces still rely on very small supporting text to stay compact.
- On large desktop screenshots, this makes otherwise-stable screens feel slightly under-scaled rather than intentionally editorial.
- The issue is broad enough that solving it one route at a time would create churn.

0.2.16 direction:

- Increase the global type baseline by a small but noticeable step.
- Revisit the smallest utility text sizes so labels, metadata, helper copy, and segmented controls remain proportional instead of becoming cramped.
- Use the global increase to make presentation screens feel more confident before changing layout structure.

Likely surfaces:

- app-level typography defaults
- shared text utilities and shell components
- dense control surfaces that currently rely on very small labels

Desired result:

- the product feels easier to read and more confidently scaled without route-specific redesign everywhere

### 2. Simplify the admin shell hierarchy

What the screenshots show:

- The shell is cleaner than it was before 0.2.13, but the admin-facing routes still open with multiple utility targets competing for attention.
- This is most visible on organization and still somewhat visible on home mobile.

0.2.16 direction:

- Demote or consolidate utility controls so the route title and main surface lead.
- Keep the controls available, but stop treating them as equal-weight content.
- Prefer one quieter operator control cluster over multiple separate attention points.

Likely files:

- `src/lib/components/ui/Header.svelte`
- `src/lib/components/ui/PageHeader.svelte`

Desired result:

- admin routes feel framed by the shell instead of crowded by it

### 3. Pull the organization roster higher and let it dominate

What the screenshots show:

- Organization members is improved, but the management stack still claims too much space before the roster really starts.
- The page reads like overview plus controls plus roster, instead of a roster with attached controls.

0.2.16 direction:

- Continue compressing or reorganizing the organization top band so the member list begins sooner.
- Keep the section state and admin tooling, but stop letting them delay the core people-management surface.
- Let the roster feel like the page’s first real commitment, not the third.

Likely files:

- `src/routes/organization/+page.svelte`
- `src/lib/components/organization/OrganizationMembersCard.svelte`
- `src/lib/components/organization/MemberRow.svelte`

Desired result:

- organization members reads primarily as a roster and only secondarily as an admin control page

### 4. Use the larger type scale to improve public desktop flows for free

What the screenshots show:

- Signup and check-in are clear, but on desktop they still sit inside a lot of open space with relatively conservative type.
- Those routes may improve naturally if the global type system becomes slightly larger and more confident.

0.2.16 direction:

- Do not redesign these routes yet.
- Let them benefit from the type-scale pass first, then reassess whether any route-specific composition work is still needed.

Likely files:

- shared typography and layout primitives first, not route-specific files

Desired result:

- public-facing flows feel stronger on desktop without route churn

### 5. Keep home, messages, directory, and volunteers in the protection bucket

What the screenshots show:

- Home is finally good enough to stop.
- Messages, directory, and volunteers remain stable and believable.

0.2.16 direction:

- Do not reopen these as standalone passes.
- Allow them to improve only through shared type and shell changes unless a clear regression appears.

Likely files:

- none unless shared changes naturally touch them

Desired result:

- the next pass spends energy on the new weak spots instead of relitigating solved ones

## Recommended working order

1. Global type scale increase
2. Admin shell control-weight reduction
3. Organization roster-first compaction
4. Recheck profile, signup, and check-in after the type pass

## Validation checklist

- Rerun `node tmp/capture-0.2.16-review.mjs`
- Confirm the app reads larger and clearer across home, organization, profile, signup, and check-in without feeling cramped
- Confirm organization members reaches the roster sooner
- Confirm shared admin controls are quieter without losing usability
- Confirm home, messages, directory, and volunteers do not regress
- Preserve the exact `Deletion requests` label unless the organization capture script changes too

## Definition of done

0.2.16 is successful when:

- text across the product is noticeably easier to read at presentation sizes
- organization members reads as a roster-first screen
- the admin shell frames content instead of competing with it
- stable member-facing routes remain stable after the shared scale changes

## Recommendation before implementation

- Start with the global type scale increase before touching individual routes.
- Then spend the route-specific work on organization plus the shared admin shell.
- Keep home out of scope unless the type-scale pass unexpectedly regresses it.