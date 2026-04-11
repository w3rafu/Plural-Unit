# Plural Unit 0.1.4 Checklist

This checklist turns the `0.1.4` roadmap into small execution slices.

Use it when:
- assigning work to junior developers
- tracking what is blocked
- reviewing whether a feature is actually done

Read these first:
- [docs/roadmap-0.1.4.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.4.md)
- [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md)

## How To Use This File

Each section is broken into:
- `A` for the first safe slice
- `B` for follow-up work
- `QA` for verification

If a team member is newer to the project, assign the `A` tasks first.

## 0.1.4-a Member Roles

### A. Data And Routing

- [ ] Add member role actions to the organization repository.
- [ ] Add any supporting RPC or migration needed for secure role changes.
- [ ] Extend the organization member model if needed.
- [ ] Keep the existing members route and tab shell intact.

### B. UI

- [ ] Add row-level role controls to the members table.
- [ ] Keep the controls inside the current card/table layout.
- [ ] Add clear loading and success states.
- [ ] Add a calm empty state if there are no members.

### QA

- [ ] Test as admin.
- [ ] Test that the current admin cannot remove their last admin path.
- [ ] Test light mode.
- [ ] Test dark mode.
- [ ] Run `npm run check`.
- [ ] Run `npm test` if model/store logic changed.

## 0.1.4-b Member Removal And Invitations

### A. Member And Invite Actions

- [ ] Add remove-member support.
- [ ] Add resend-invitation support.
- [ ] Add revoke-invitation support if the backend needs it.
- [ ] Reuse the current organization store for these actions.

### B. UI

- [ ] Add the actions to the members and access surfaces.
- [ ] Keep destructive actions visually clear.
- [ ] Add toasts for success and failure.
- [ ] Keep pending invite status readable.

### QA

- [ ] Test invite resend.
- [ ] Test invite revoke or cleanup.
- [ ] Test member removal.
- [ ] Test light mode.
- [ ] Test dark mode.
- [ ] Run `npm run check`.
- [ ] Run `npm test`.

## 0.1.4-c Safety And Confirmations

### A. Confirmation Patterns

- [ ] Add lightweight confirmation for destructive member-management actions.
- [ ] Keep the confirmation copy short and direct.
- [ ] Avoid a new visual style just for danger actions.

### B. Feedback

- [ ] Make sure success and error toasts are consistent.
- [ ] Make sure action states are easy to understand.
- [ ] Keep inline validation where it belongs.

### QA

- [ ] Confirm role changes are deliberate.
- [ ] Confirm member removal is deliberate.
- [ ] Confirm invitation cleanup is deliberate.
- [ ] Run `npm run check`.

## 0.1.4-d Accessibility And Keyboard Flow

### A. Route and Tab Flow

- [ ] Check keyboard navigation through organization tabs.
- [ ] Check keyboard navigation through profile tabs.
- [ ] Check keyboard navigation through hub manage tabs.

### B. Controls

- [ ] Confirm focus states are visible.
- [ ] Confirm buttons and tables remain understandable with a keyboard.
- [ ] Confirm dialogs, sheets, and toasts are accessible.

### QA

- [ ] Test without a mouse.
- [ ] Test light mode.
- [ ] Test dark mode.
- [ ] Run `npm run check`.

## Cross-Cutting UI Review

These checks apply to every `0.1.4` task:

- [ ] Uses semantic theme classes instead of hardcoded colors.
- [ ] Looks correct in light mode.
- [ ] Looks correct in dark mode.
- [ ] Uses existing shadcn-native primitives where possible.
- [ ] Uses toasts only for action-level feedback.
- [ ] Keeps field-specific errors inline.
- [ ] Keeps route files focused on composition, not business logic.

## Suggested Assignment Plan

If multiple developers are working in parallel:

1. Developer 1: `0.1.4-a Member Roles`
2. Developer 2: `0.1.4-b Member Removal And Invitations`
3. Developer 3: `0.1.4-c Safety And Confirmations`
4. Developer 4: `0.1.4-d Accessibility And Keyboard Flow`

If only one junior developer is working:

1. Finish `0.1.4-a`
2. Finish `0.1.4-b`
3. Finish `0.1.4-c`
4. Finish `0.1.4-d`

## Release Sign-Off

Do not call `0.1.4` complete until all of these are true:

- [ ] Feature scope is complete or intentionally trimmed.
- [ ] UI still feels consistent with the existing app.
- [ ] Light and dark mode were checked manually.
- [ ] `npm run check` passes.
- [ ] `npm test` passes when logic changed.
- [ ] Docs were updated for any route or workflow changes.
