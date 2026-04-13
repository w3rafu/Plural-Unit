# 0.1.23 checklist

## a · Shared messages workspace extraction

- [x] Create a shared messages workspace component
- [x] Move live `/messages` onto the shared workspace
- [x] Move demo `/demo/messages` onto the shared workspace
- [x] Confirm no desktop or mobile layout drift between live and demo message surfaces

## b · Shared directory roster surface

- [x] Create a shared directory roster component
- [x] Move live `/directory` onto the shared roster
- [x] Move demo `/demo/directory` onto the shared roster
- [x] Preserve live message actions, demo read-only behavior, and loading/empty states

## c · Directory access contract and shell-lock hardening

- [x] Resolve whether `currentOrganization.loadMembers()` is member-visible or admin-only
- [x] Align `currentOrganization` tests with the chosen member-loading contract
- [x] Extract and test the locked-content route predicate used by `src/routes/+layout.svelte`
- [x] Re-run focused organization, directory, and layout tests after the change

## d · Hub activity CTA completion

- [x] Add next-step CTA treatment to the featured Hub activity item
- [x] Add action-aware metadata or destinations to follow-on activity cards
- [x] Keep demo Hub and live Hub visually aligned after the CTA pass

## e · Demo harness coverage and release gate

- [x] Add fixture helper tests for counts, member lookup, and cloned thread safety
- [x] Re-run focused tests for messages, directory, Hub, and demo fixtures
- [x] `package.json` version → `0.1.23`
