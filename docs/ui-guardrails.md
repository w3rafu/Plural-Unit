# UI Guardrails

This file explains how to extend the Plural Unit UI without breaking the current design system.

The short version:

- stay shadcn-native
- support both light and dark mode
- use shared tokens
- keep surfaces simple

## Core Rule

When adding UI, prefer existing primitives over custom wrappers.

Start with:
- `Card`
- `Button`
- `Badge`
- `Item`
- `Field`
- `Input`
- `Textarea`
- `Select`
- `Table`
- `Sheet`
- `Toast`

If one of those primitives can solve the problem, use it.

## Theme Rule

Plural Unit already defines its color system in:

- [src/routes/layout.css](/Users/rafa/Desktop/plural-unit/src/routes/layout.css)

That file owns:
- light mode tokens
- dark mode tokens
- shell gradients
- border/input/ring colors
- typography baseline

### Do This

- use semantic classes like `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`
- use opacity modifiers like `/70` or `/80` when needed
- use muted surfaces for inset panels and small stat blocks

### Do Not Do This

- do not hardcode `#000`, `#111`, `#fff`, or custom gray values for one screen
- do not add a component that only looks correct in dark mode
- do not build a "special light theme" inside one route component

## Surface Hierarchy

Use this hierarchy consistently:

1. Page shell/header/nav
2. Main cards
3. Inset content blocks
4. Small badges and supporting text

That means:
- page-level sections should usually be `Card.Root`
- small metric tiles can be simple rounded divs using `bg-muted/35` or similar existing patterns
- supporting text should use `text-muted-foreground`

## Light And Dark Mode Checks

Before considering a UI task done, test both themes.

Check:
- border visibility
- button contrast
- muted text readability
- empty-state readability
- selected/active tab clarity
- hover/focus states

If dark mode looks good but light mode feels washed out, or the reverse, the work is not done yet.

## Typography Rule

Plural Unit already uses `Instrument Sans Variable`.

Keep typography simple:
- titles should be compact and confident
- descriptions should be short and muted
- avoid oversized hero text inside app-internal screens
- avoid decorative label styles unless they already exist nearby

## Spacing Rule

Use the spacing patterns already present in the app.

Good defaults:
- `gap-3` or `gap-4` inside dense cards
- `gap-5` or `gap-6` between larger page sections
- `rounded-xl` for inset sections

Avoid inventing a brand-new spacing rhythm on one screen.

## New Component Rule

Create a new component only if:
- the UI block is reused
- the route file is getting too noisy
- the logic can be isolated cleanly

Do not create custom wrapper components just to restyle a single card.

## Toast And Feedback Rule

Use toasts for:
- cross-page success states
- actions that do not belong to one field
- "completed" feedback after save/copy/send flows

Keep inline errors for:
- invalid inputs
- field-specific validation
- guidance that helps the user fix one form field

## Accessibility Rule

Even small UI tasks should preserve:
- visible focus states
- button labels that still make sense without icon context
- headings in a sensible order
- descriptive alt text for meaningful images

## If You Are Unsure

When in doubt:

1. copy the nearest good pattern already in the app
2. keep it inside the existing shadcn primitives
3. test both themes
4. choose the simpler option
