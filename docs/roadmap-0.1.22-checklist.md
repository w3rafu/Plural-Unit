# 0.1.22 checklist

## a · Shared messages workspace shell
- [ ] Create a shared messages workspace shell component
- [ ] Move live `/messages` route onto the shared shell
- [ ] Move demo `/demo/messages` route onto the shared shell
- [ ] Confirm no layout drift between live and demo message surfaces

## b · Shared directory roster surface
- [ ] Create a shared directory roster component
- [ ] Move live `/directory` route onto the shared roster
- [ ] Move demo `/demo/directory` route onto the shared roster
- [ ] Preserve mobile cards, desktop table, and route-specific actions

## c · Hub continuity pass
- [ ] Add stronger next-step treatment to the featured hub activity surface
- [ ] Tighten metadata hierarchy in broadcasts and events lists
- [ ] Keep demo hub and live hub visually aligned after the pass

## d · Demo harness hardening
- [ ] Add fixture helper tests for counts, member lookup, and thread cloning
- [ ] Add test coverage for demo shell locking behavior or extracted route-lock helper
- [ ] Re-run focused tests for messages, hub, and directory after the refactor

## e · Version bump
- [ ] `package.json` version → `0.1.22`