# Plural Unit 0.1.3 Roadmap

This document is for the next development pass after `0.1.2`.

It is written for junior developers on purpose:
- what to build
- why it matters
- where the code should live
- what "done" means
- which styling rules must not be broken

If you are new to the codebase, read [README.md](/Users/rafa/Desktop/plural-unit/README.md) first, then read [ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md).

If you want the execution version of this plan, use [roadmap-0.1.3-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.3-checklist.md).

## Release Goal

`0.1.3` should improve the app in four practical ways:

1. Add an organization members tab for real admin visibility.
2. Improve auth recovery and sign-in resilience.
3. Make the hub feel active with a lightweight activity feed.
4. Protect users from losing unsaved changes.

This release should **not** add a brand-new design language.
It should extend the existing shadcn-style system already in the app.

## Build Order

Work in this order unless a product decision changes:

1. Organization members tab
2. Auth recovery
3. Unsaved changes protection
4. Hub activity feed

Why this order:
- member management is the clearest admin gap
- auth recovery has high user value
- unsaved changes protection improves trust across multiple screens
- activity feed depends on us being clear about which events we want to show

## Feature 1: Organization Members Tab

### Goal

Give organization admins a clear place to see who belongs to the organization and what role each person has.

### User Story

As an admin, I want to open the organization area and quickly see:
- who is already in the organization
- who is an admin or member
- when a user joined, if that data is available
- whether I need to take action

### Recommended Route Shape

Add a new child route:

```text
/organization/members
```

That means the organization section would likely become:

```text
/organization/overview
/organization/access
/organization/members
```

### Likely Files To Touch

- [src/routes/organization/+layout.svelte](/Users/rafa/Desktop/plural-unit/src/routes/organization/+layout.svelte)
- [src/routes/organization/members/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/organization/members/+page.svelte)
- [src/lib/repositories/organizationRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/organizationRepository.ts)
- [src/lib/stores/currentOrganization.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentOrganization.svelte.ts)
- [src/lib/models/organizationModel.ts](/Users/rafa/Desktop/plural-unit/src/lib/models/organizationModel.ts)

You may also want a dedicated UI component, for example:

- [src/lib/components/organization/OrganizationMembersCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationMembersCard.svelte)

### Implementation Notes

- Keep the page card-based, using existing `Card`, `Badge`, `Button`, `Table`, and `Item` primitives.
- Do not create a custom visual system just for members.
- If the member list gets long, use the existing scroll/table primitives instead of making a one-off layout.
- Start with read-only member display first. Role editing can be a second step if needed.

### Done Means

- admins can open a `Members` tab from organization
- a member list loads for the current organization
- empty state is clear and calm
- loading state matches existing app patterns
- light and dark mode both look correct
- no hardcoded black/white colors were added

## Feature 2: Auth Recovery

### Goal

Make sign-in failures easier to recover from without manual support.

### User Story

As a user, if I forget my password or get stuck signing in, I need a clear next step.

### Scope

Add:
- password reset request flow
- better inline sign-in error copy
- optional resend or retry guidance where it makes sense

### Likely Files To Touch

- [src/lib/components/auth/LoginForm.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/auth/LoginForm.svelte)
- [src/lib/models/authHelpers.ts](/Users/rafa/Desktop/plural-unit/src/lib/models/authHelpers.ts)
- [src/lib/models/authHelpers.test.ts](/Users/rafa/Desktop/plural-unit/src/lib/models/authHelpers.test.ts)
- [src/lib/repositories/profileRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/profileRepository.ts)
- [src/lib/stores/currentUser.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentUser.svelte.ts)

### Implementation Notes

- Use toasts for cross-page success/error feedback.
- Keep field validation errors inline near the field.
- If Supabase returns technical errors, map them to human-readable copy in the helper/model layer.
- Do not bury recovery actions inside a modal unless there is a strong reason.

### Done Means

- a user can request a password reset from the login screen
- failed sign-in states explain what to do next
- success and error states are readable in both themes
- test coverage is updated for new auth helper behavior

## Feature 3: Unsaved Changes Protection

### Goal

Prevent accidental data loss when a user changes tabs, routes, or closes the page before saving.

### User Story

As a user, if I edit my profile or organization settings and forget to save, the app should warn me before I lose that work.

### Good First Targets

- profile details
- profile security
- organization access forms
- hub manage editors

### Likely Files To Touch

- [src/lib/components/profile/ProfileDetailsCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/profile/ProfileDetailsCard.svelte)
- [src/lib/components/profile/ProfileSecurityCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/profile/ProfileSecurityCard.svelte)
- [src/lib/components/organization/OrganizationAccessCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationAccessCard.svelte)
- [src/lib/components/hub/admin/BroadcastEditor.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/admin/BroadcastEditor.svelte)
- [src/lib/components/hub/admin/EventEditor.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/admin/EventEditor.svelte)

You may want a small reusable helper in:

- `src/lib/models/`
- or `src/lib/stores/`

Prefer a helper/store over repeating the same dirty-check logic in many components.

### Implementation Notes

- Start with simple dirty detection by comparing current form values to initial values.
- Protect route switches and browser unload when practical.
- Keep the warning experience lightweight.
- Avoid blocking the user on every tiny state change.

### Done Means

- the form knows when it is dirty
- route switches or tab switches warn before losing changes
- successful save resets the dirty state
- behavior is consistent across the main editable surfaces

## Feature 4: Hub Activity Feed

### Goal

Make the hub feel alive even when there are only a few content types enabled.

### User Story

As a member, I want to see a simple list of recent updates so I know what changed recently.

### Important Product Note

Do not overbuild this first version.

For `0.1.3`, the feed can be a lightweight merge of:
- recent broadcasts
- recent events

It does not need:
- reactions
- comments
- real-time sockets
- rich media

### Likely Files To Touch

- [src/routes/hub/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/hub/+page.svelte)
- [src/lib/components/hub/member/HubOverviewCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubOverviewCard.svelte)
- [src/lib/repositories/hubRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/hubRepository.ts)
- [src/lib/stores/currentHub.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentHub.svelte.ts)

Possible new component:

- [src/lib/components/hub/member/HubActivityFeed.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/member/HubActivityFeed.svelte)

### Implementation Notes

- The first version can normalize broadcasts and events into one view model.
- Keep the feed visually simple: title, type, timestamp, supporting line.
- Reuse `Card`, `Badge`, and muted text styles from existing sections.
- Make sure the feed still looks clean when there are zero items.

### Done Means

- members can see a recent activity block in the hub
- mixed items are sorted consistently
- the feed has a calm empty state
- the design works in both light and dark mode

## Theme And Styling Rules

Every feature in `0.1.3` must respect the existing UI system:

- Use the shared tokens in [src/routes/layout.css](/Users/rafa/Desktop/plural-unit/src/routes/layout.css).
- Use shadcn-native primitives first.
- Prefer `Card`, `Button`, `Badge`, `Table`, `Field`, `Input`, `Textarea`, `Select`, `Sheet`, and `Toast`.
- Do not hardcode black backgrounds for dark mode.
- Do not hardcode white surfaces for light mode.
- Do not create a one-off "special admin style" for a single screen.

Read [ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md) before editing UI.

## Definition Of Done For This Release

`0.1.3` is ready when:

- the four features above are in place or consciously trimmed
- empty states and loading states stay visually consistent
- every new surface works in light and dark mode
- new logic is tested where model/store behavior changes
- `npm run check` passes
- `npm test` passes
- the documentation is updated if route structure or developer workflow changes

## Junior Dev Checklist

Use this checklist while building:

1. Read the route and store that already own the feature area.
2. Reuse an existing primitive before creating a new component.
3. Keep data fetching in stores/repositories, not route markup.
4. Keep error mapping in models/helpers, not inline in UI.
5. Test light mode and dark mode before calling a task done.
6. Run `npm run check`.
7. Run `npm test` if logic changed.
8. Update docs if you added a route, store, helper, or migration.

## When To Ask For Help

Pause and ask for clarification if:

- you think a feature needs a new database table
- you are tempted to add custom colors outside the theme tokens
- you want to add a third route/tab to an area and are not sure it belongs
- you are duplicating logic already found in a store or helper
