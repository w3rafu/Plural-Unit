# Plural Unit 0.1.3 Checklist

This checklist turns the `0.1.3` roadmap into small execution slices.

Use it when:
- assigning work to junior developers
- tracking what is blocked
- reviewing whether a feature is actually done

Read these first:
- [docs/roadmap-0.1.3.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.3.md)
- [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md)

## Current Status

This checklist is complete in the current `0.1.3` release branch.

The checkboxes below are kept as a reference for future onboarding and review work.

## How To Use This File

Each section is broken into:
- `A` for the first safe slice
- `B` for follow-up work
- `QA` for verification

If a team member is newer to the project, assign the `A` tasks first.

## 0.1.3-a Organization Members

### A. Data And Routing

- [x] Add `/organization/members` as a nested route.
- [x] Add a `Members` tab to [organization/+layout.svelte](/Users/rafa/Desktop/plural-unit/src/routes/organization/+layout.svelte).
- [x] Add a repository method that loads organization members.
- [x] Add or extend organization member types in the model layer.
- [x] Add store support in [currentOrganization.svelte.ts](/Users/rafa/Desktop/plural-unit/src/lib/stores/currentOrganization.svelte.ts) so the route does not fetch directly from markup.

### B. UI

- [x] Create a card-based members surface.
- [x] Use existing `Table`, `Card`, `Badge`, and `Button` primitives.
- [x] Add a clear loading state.
- [x] Add a calm empty state.
- [x] Show at least name and role.
- [x] If available, show joined date or contact info as secondary metadata.

### QA

- [x] Test as admin.
- [x] Test as non-admin if that route should be hidden or blocked.
- [x] Test light mode.
- [x] Test dark mode.
- [x] Run `npm run check`.
- [x] Run `npm test` if model/store logic changed.

## 0.1.3-b Auth Recovery

### A. Recovery Flow

- [x] Add a password reset request action to [LoginForm.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/auth/LoginForm.svelte).
- [x] Add repository support for reset requests.
- [x] Map raw auth errors to friendlier copy in [authHelpers.ts](/Users/rafa/Desktop/plural-unit/src/lib/models/authHelpers.ts).
- [x] Keep field validation inline.
- [x] Use toasts for action-level success or failure.

### B. UX Polish

- [x] Make failed sign-in states tell the user what to do next.
- [x] Add a pending/loading state for reset requests.
- [x] Confirm the reset action reads well in both email and phone-first contexts.
- [x] Add or update tests for new helper behavior.

### QA

- [x] Test wrong password behavior.
- [x] Test missing email behavior for password reset.
- [x] Test success toast in light mode.
- [x] Test success toast in dark mode.
- [x] Run `npm run check`.
- [x] Run `npm test`.

## 0.1.3-c Unsaved Changes Protection

### A. Shared Dirty State Helper

- [x] Create a simple reusable dirty-state helper in `models` or `stores`.
- [x] Support comparison between initial values and current form values.
- [x] Keep the helper small and easy to read.

### B. First Integrations

- [x] Wire dirty tracking into [ProfileDetailsCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/profile/ProfileDetailsCard.svelte).
- [x] Wire dirty tracking into [ProfileSecurityCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/profile/ProfileSecurityCard.svelte).
- [x] Wire dirty tracking into [OrganizationAccessCard.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/organization/OrganizationAccessCard.svelte).
- [x] Wire dirty tracking into [BroadcastEditor.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/admin/BroadcastEditor.svelte).
- [x] Wire dirty tracking into [EventEditor.svelte](/Users/rafa/Desktop/plural-unit/src/lib/components/hub/admin/EventEditor.svelte).

### C. Navigation Protection

- [x] Warn before losing changes on route switch.
- [x] Warn before losing changes on browser unload if practical.
- [x] Reset dirty state after a successful save.
- [x] Make sure nested tab switches behave correctly.

### QA

- [x] Test one dirty form in profile.
- [x] Test one dirty form in organization.
- [x] Test one dirty form in hub manage.
- [x] Confirm no warning appears after save.
- [x] Confirm read-only pages do not warn.
- [x] Run `npm run check`.

## 0.1.3-d Hub Activity Feed

### A. Data Model

- [x] Decide the shared feed item shape.
- [x] Normalize broadcasts and events into one list.
- [x] Sort items consistently.
- [x] Keep the first version read-only.

### B. UI

- [x] Add a simple activity feed card or section to the hub.
- [x] Reuse existing `Card`, `Badge`, and muted text styling.
- [x] Show item type clearly.
- [x] Show one supporting line of detail.
- [x] Add a good empty state when there is no recent activity.

### QA

- [x] Test with only broadcasts.
- [x] Test with only events.
- [x] Test with both.
- [x] Test with no content.
- [x] Test light mode.
- [x] Test dark mode.
- [x] Run `npm run check`.

## Cross-Cutting UI Review

These checks apply to every `0.1.3` task:

- [x] Uses semantic theme classes instead of hardcoded colors.
- [x] Looks correct in light mode.
- [x] Looks correct in dark mode.
- [x] Uses existing shadcn-native primitives where possible.
- [x] Uses toasts only for action-level feedback.
- [x] Keeps field-specific errors inline.
- [x] Keeps route files focused on composition, not business logic.

## Suggested Assignment Plan

If multiple developers are working in parallel:

1. Developer 1: `0.1.3-a Organization Members`
2. Developer 2: `0.1.3-b Auth Recovery`
3. Developer 3: `0.1.3-c Unsaved Changes Protection`
4. Developer 4: `0.1.3-d Hub Activity Feed`

If only one junior developer is working:

1. Finish `0.1.3-a`
2. Finish `0.1.3-b`
3. Finish `0.1.3-c`
4. Finish `0.1.3-d`

## Release Sign-Off

Do not call `0.1.3` complete until all of these are true:

- [x] Feature scope is complete or intentionally trimmed.
- [x] UI still feels consistent with the existing app.
- [x] Light and dark mode were checked manually.
- [x] `npm run check` passes.
- [x] `npm test` passes when logic changed.
- [x] Docs were updated for any route or workflow changes.
