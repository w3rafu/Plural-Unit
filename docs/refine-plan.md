# Refinement Plan — `refine/simplify-ui`

**Branch:** `refine/simplify-ui`
**Goal:** Strip the UI back to an MVP that leaders love to use and members engage with effortlessly. Keep the backend as-is; simplify surfaces, reduce cognitive load, and introduce a theme system.

---

## Diagnosis

| Area | Current state | Problem |
|---|---|---|
| Header | 800+ lines, 4 presets (brand/section/context/detail), 9 derived CSS classes | Over-engineered for an MVP; the distinction between context and detail adds no user value |
| Hub page | Admin shortcut card, 4 metric cards, commitments card, activity feed, plugin sections (broadcasts/events/resources) | Too many cards competing for attention on one screen |
| Organization | 3 sub-routes (overview/access/members) each with their own load effects and tab switching | Three tabs for what could be two; overview duplicates hub info |
| Profile | Tab-switched details/security sections with avatar upload, notification prefs, sign-out | Reasonable, but the section header + tabs + cards stack is dense |
| Messages | Split-pane inbox/thread workspace | Already decent; needs visual tightening not restructuring |
| Directory | Table with search, stat cards, member detail route | Already simple; minor polish |
| Theming | Hardcoded oklch values in `:root` and `.dark` inside layout.css | No way for your team to add a second theme without editing the core file |
| Route depth | Deepest: `/hub/manage/content`, `/organization/members/[id]` (3 levels) | Acceptable but organization and profile tabs are routes pretending to be tabs |

---

## Principles for the refine pass

1. **One screen, one job.** If a page tries to do two things, split it or cut one.
2. **Members see almost nothing.** Hub, Messages, Directory, Profile. Each is one screen with zero sub-navigation.
3. **Admins get a second layer.** Manage tools live one click deeper, never cluttering the member view.
4. **Cards are content, not chrome.** Kill stat cards that exist only to fill space when counts are zero.
5. **Theme = one CSS file.** A theme is a set of CSS custom properties. Switching themes swaps the file. Nothing else changes.

---

## Phase 1 — Theme system (do first, enables visual work)

### 1a. Extract theme tokens into standalone files

Create `src/themes/`:
```
src/themes/
  base.css          ← current zinc/oklch tokens (:root + .dark)
  midnight.css      ← example second theme (dark-only, blue accent)
  README.md         ← how to add a theme (copy base.css, change values)
```

Move the `:root { ... }` and `.dark { ... }` blocks from `layout.css` into `base.css`. In `layout.css`, replace them with `@import '../themes/base.css';`. The `@theme inline` block and utility classes stay in `layout.css`.

### 1b. Theme loader

Add a `currentTheme` store (or extend the existing `ThemeToggle` model):
- Reads `localStorage` for the active theme name (default `base`)
- Applies a `data-theme="<name>"` attribute on `<html>`
- Each theme CSS file scopes its variables under `[data-theme="<name>"]` and `[data-theme="<name>"].dark`

This lets your team create a new theme by:
1. Copy `base.css` → `<name>.css`
2. Change the oklch values
3. Add the import to `layout.css`

No component code changes. No build config changes.

---

## Phase 2 — Route and navigation cleanup

### 2a. Flatten organization into one page with in-page tabs

**Current:** `/organization/overview`, `/organization/access`, `/organization/members`, `/organization/members/[id]`

**After:**
- `/organization` — single page, in-page tab state (not route-based). Overview content folds into the top of the page as a summary strip, not a full tab. Access and Members remain as switchable sections.
- `/organization/[memberId]` — member detail view (2 levels, acceptable).
- Delete `organization/overview/`, `organization/access/`, `organization/members/` sub-routes. The `+page.svelte` at `/organization` handles tab rendering directly.

This cuts the organization layout from 180+ lines with three `$effect` blocks to a simpler single-page component.

### 2b. Flatten profile into one page

**Current:** `/profile/details`, `/profile/security`

**After:**
- `/profile` — single page. Details section on top, security section below, no tabs. One scroll. Both sections are lightweight enough to coexist.
- Delete `profile/details/` and `profile/security/` sub-routes.

### 2c. Keep hub manage as-is (3 levels, justified)

`/hub/manage/content` and `/hub/manage/sections` are admin-only power tools. Three levels is fine because the depth signals "you're in admin territory." No change.

### Route map after Phase 2

```
/                           ← Hub home (member + admin summary)
/hub/manage/content         ← Admin: manage broadcasts/events/resources
/hub/manage/sections        ← Admin: manage plugin toggles
/messages                   ← Conversations
/directory                  ← Member list
/directory/[memberId]       ← Member detail
/organization               ← Org settings (admin tabs: access, members)
/organization/[memberId]    ← Member detail from org context
/profile                    ← Account details + security
```

Max depth: 3 (hub/manage/*). Every member-facing screen: 1-2 levels.

---

## Phase 3 — Simplify the hub page

### 3a. Reduce header to 2 presets

Kill `context` and `detail` presets. Keep:
- **brand** — top-level pages (Hub, Messages, Directory)
- **page** — everything else (profile, organization, manage, member detail)

The `page` preset takes an optional back button and subtitle. This collapses 4 branches into 2 and probably cuts the Header component in half.

### 3b. Simplify the hub home for members

Current member view: 4 metric cards + commitments card + activity feed + broadcasts section + events section + resources section.

**After:**
- **Summary strip** at the top: org name, member count, role. One line, not four cards.
- **Your next actions**: Upcoming events you've RSVP'd to, unread messages count. One card.
- **Activity feed**: Recent broadcasts and event updates. One scrollable list.
- **Sections below the fold**: Broadcasts, Events, Resources (only sections with active content).

Kill the standalone commitments card (fold "reply needed" into the next-actions card). Kill the 4-metric grid (the info moves to the summary strip or disappears).

### 3c. Simplify the hub home for admins

Current admin view: Admin shortcut card with two buttons + 4 metric cards + commitments + activity + sections.

**After:**
- **Admin bar** at the top: "Open Hub Manage" button + pending invites count. One row, not a card.
- Same simplified member view below.

The admin bar is a single row that disappears for members. No separate admin/member branch for the rest of the page.

---

## Phase 4 — Visual tightening

### 4a. Reduce card density

- Remove `box-shadow: inset ...` on metric cards — they add visual noise
- Increase spacing between sections instead of between cards
- Use `separator` component between page sections instead of card borders

### 4b. Simplify empty states

Current: Every section has its own empty state with explanatory copy. 

**After:** One-line empty states. "No broadcasts yet." Not "When a broadcast goes live, an event update lands, or a reminder is processed, it will appear here first."

### 4c. Kill zero-count stat cards

If pending invites = 0, stale invites = 0, email = 0, phone = 0 — don't show the Pending Invitations stat grid at all. Show it only when there's something to act on.

---

## Phase 5 — Polish pass

- Audit every page for mobile viewport (375px). Ensure nothing overflows.
- Verify dark/light mode parity on every screen.
- Run the existing smoke tests (`hub-smoke.spec.ts`) against the simplified routes.
- Update `bottomNavModel.ts` if any tab paths changed (they shouldn't with this plan).
- Update `contentLayoutModel.ts` locked routes if directory/messages paths changed.

---

## What this plan does NOT touch

- **Backend / Supabase migrations**: No schema changes.
- **Store layer**: `currentHub`, `currentOrganization`, `currentUser`, `currentMessages` stay as-is.
- **Repository layer**: No API changes.
- **Message workspace**: Already reasonable complexity.
- **Demo / preview routes**: Low priority, skip.
- **0.1.32 operator workflow**: That's backend infrastructure, orthogonal to this UI refine.

---

## Suggested work order

1. **Phase 1** — Theme system (unblocks your team's design work)
2. **Phase 2a** — Flatten organization routes
3. **Phase 2b** — Flatten profile routes
4. **Phase 3a** — Header preset reduction
5. **Phase 3b/c** — Hub page simplification
6. **Phase 4** — Visual tightening
7. **Phase 5** — Polish and test

Each phase is a mergeable chunk. The branch can be reviewed and merged incrementally via squash merges back to main, or kept as one refinement PR.
