# Plural Unit 0.1.4 Roadmap

This document is for the next development pass after `0.1.3`.

It is written for junior developers on purpose:
- what to build
- why it matters
- where the code should live
- what "done" means
- which styling rules must not be broken

If you are new to the codebase, read [README.md](/Users/rafa/Desktop/plural-unit/README.md) first, then read [ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md).

If you want the execution version of this plan, use [roadmap-0.1.4-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.4-checklist.md).

## Release Goal

`0.1.4` should make organization membership actually manageable.

This release should help admins:
1. change member roles
2. remove members when needed
3. manage pending invitations more confidently
4. keep the UI calm, simple, and consistent in both light and dark mode

This release should **not** introduce the Messages inbox yet.
We are deferring that work for the Communion Link plugin migration.

## Build Order

Work in this order unless a product decision changes:

1. Member role management
2. Member removal and invitation lifecycle
3. Admin safety and confirmation polish
4. Small accessibility and keyboard-flow cleanup

Why this order:
- role management is the clearest admin gap
- removal and invite lifecycle are the most useful follow-up controls
- safety polish prevents mistakes on destructive actions
- accessibility cleanup is easiest after the flows are stable

## Feature 1: Member Role Management

### Goal

Give organization admins a way to change a member from `member` to `admin`, and back again if the organization needs that flexibility.

### User Story

As an admin, I want to open the members tab and update a person’s role without leaving the organization area.

### Recommended Route Shape

Keep this inside the existing organization members tab:

```text
/organization/members
```

### Likely Files To Touch

- [src/routes/organization/members/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/organization/members/+page.svelte)
- [src/lib/components/organization/OrganizationMembersCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationMembersCard.svelte)
- [src/lib/repositories/organizationRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/organizationRepository.ts)
- [src/lib/stores/currentOrganization.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentOrganization.svelte.ts)
- [src/lib/models/organizationModel.ts](/Users/rafa/Desktop/plural-unit/src/lib/models/organizationModel.ts)

You may also need a migration for the admin action itself.

### Implementation Notes

- Keep the UI inside the existing card/table system.
- Use a small action control in each row rather than a separate page.
- Protect the current admin from accidentally removing their own last admin path.
- If a role change needs a confirmation step, keep it lightweight and inline.

### Done Means

- admins can change a member role from the members tab
- the table updates after a successful change
- the current admin cannot accidentally strand the organization without an admin
- light and dark mode both still look correct

## Feature 2: Member Removal And Invitation Lifecycle

### Goal

Let admins remove a member and manage pending invitations from one place.

### User Story

As an admin, I want to remove someone from the organization or clean up stale invites without hunting through separate screens.

### Scope

Add:
- remove member action
- resend invitation action
- revoke invitation action if needed
- clearer pending invitation status handling

### Likely Files To Touch

- [src/routes/organization/access/+page.svelte](/Users/rafa/Desktop/plural-unit/src/routes/organization/access/+page.svelte)
- [src/lib/components/organization/OrganizationAccessCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationAccessCard.svelte)
- [src/lib/components/organization/PendingInvitationsTable.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/PendingInvitationsTable.svelte)
- [src/lib/repositories/organizationRepository.ts](/Users/rafa/Desktop/plural-unit/src/lib/repositories/organizationRepository.ts)
- [src/lib/stores/currentOrganization.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentOrganization.svelte.ts)

### Implementation Notes

- Use toasts for success and failure states.
- Keep destructive actions visually clear, but do not overdecorate them.
- If the backend needs a new RPC or policy, add the smallest secure change possible.
- Reuse the current shadcn-style buttons, badges, and tables.

### Done Means

- admins can remove a member
- admins can manage pending invites without leaving the access tab
- stale invites can be cleaned up or resent
- destructive actions have sensible confirmations

## Feature 3: Admin Safety And Confirmation Polish

### Goal

Make the member-management actions feel safe and understandable.

### User Story

As an admin, I want to be confident that role changes and removals are deliberate.

### Good First Targets

- member role changes
- member removal
- invitation resend/revoke

### Likely Files To Touch

- [src/lib/components/organization/OrganizationMembersCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationMembersCard.svelte)
- [src/lib/components/organization/OrganizationAccessCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationAccessCard.svelte)
- [src/lib/components/ui/UnsavedChangesGuard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/UnsavedChangesGuard.svelte)
- [src/lib/stores/toast.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/toast.svelte.ts)

### Implementation Notes

- Keep confirmations short.
- Use the same tone as the rest of the app.
- Prefer inline confirmation patterns or a small sheet/dialog if a destructive action really needs it.
- Avoid introducing a brand-new “admin danger zone” style.

### Done Means

- admins get clear feedback before destructive actions
- success and failure states are obvious
- the styling still matches the rest of the app

## Feature 4: Accessibility And Keyboard Flow

### Goal

Make the organization admin flows easier to use with the keyboard and easier to understand with assistive tech.

### User Story

As a user, I want tabbed admin screens and action controls to work cleanly without a mouse.

### Scope

Focus on:
- tab focus behavior
- table and button focus states
- form label clarity
- dialog and toast accessibility

### Likely Files To Touch

- [src/routes/organization/+layout.svelte](/Users/rafa/Desktop/plural-unit/src/routes/organization/+layout.svelte)
- [src/routes/profile/+layout.svelte](/Users/rafa/Desktop/plural-unit/src/routes/profile/+layout.svelte)
- [src/routes/hub/manage/+layout.svelte](/Users/rafa/Desktop/plural-unit/src/routes/hub/manage/+layout.svelte)
- [src/lib/components/ui/button-group/button-group.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/button-group/button-group.svelte)
- [src/lib/components/ui/table/table.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/ui/table/table.svelte)

### Implementation Notes

- Keep this as a polish pass, not a redesign.
- Test keyboard navigation through the tabbed pages.
- Check that focus states are visible in light and dark mode.

### Done Means

- tabbed sections are easy to use without a mouse
- focus states are obvious
- assistive text and labels make sense
- light and dark mode still look good

## Theme And Styling Rules

Every feature in `0.1.4` must respect the existing UI system:

- Use the shared tokens in [src/routes/layout.css](/Users/rafa/Desktop/plural-unit/src/routes/layout.css).
- Use shadcn-native primitives first.
- Prefer `Card`, `Button`, `Badge`, `Table`, `Field`, `Input`, `Textarea`, `Select`, `Sheet`, and `Toast`.
- Do not hardcode black backgrounds for dark mode.
- Do not hardcode white surfaces for light mode.
- Do not create a one-off "special admin style" for a single screen.

Read [ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md) before editing UI.

## Definition Of Done For This Release

`0.1.4` is ready when:

- the member-management features above are in place or consciously trimmed
- destructive actions are safe and understandable
- empty states and loading states still feel consistent
- every new surface works in light and dark mode
- new logic is tested where model/store behavior changes
- `npm run check` passes
- `npm test` passes
- the documentation is updated if route structure or workflow changes

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

- you think a member-management feature needs a new database table
- you are tempted to add custom colors outside the theme tokens
- you want to add a third route/tab to an area and are not sure it belongs
- you are duplicating logic already found in a store or helper
