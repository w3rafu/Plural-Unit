# 0.1.35 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Push gracefully degrades when VAPID keys are absent
- [ ] Event detail route deep-links from activity feed and push
- [ ] Messaging compose does not disrupt directory-initiated flow
- [ ] Profile schema changes are backward-compatible (nullable columns)
- [ ] Re-run `npm run check` and `npm test` as each major slice lands

## a — Push notification activation

- [ ] Create `scripts/generate-vapid-keys.mjs` using `web-push` library
- [ ] Add `"generate-vapid-keys"` script to `package.json`
- [ ] Update `.env.example` with documented `PUBLIC_VAPID_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- [ ] Add app shell caching to `static/sw.js` (`install` + `fetch` handlers)
- [ ] Keep existing push event listener in `sw.js` unchanged
- [ ] Update broadcast push URL in `currentHub.svelte.ts` (keep `/hub`)
- [ ] Update event push URL to `/hub/event/<id>`
- [ ] Update message push URL to `/messages?thread=<id>`
- [ ] Add dev-only "Send test push" button in `ProfileNotificationPreferencesCard.svelte`
- [ ] Verify push toggle still hidden when `PUBLIC_VAPID_KEY` is empty
- [ ] Verify push triggers no-op in smoke mode

## b — Event detail page

- [ ] Create `src/routes/hub/event/[id]/+page.ts` (extract param, guard auth)
- [ ] Create `src/routes/hub/event/[id]/+page.svelte` (render detail card)
- [ ] Create `src/lib/components/hub/member/EventDetailCard.svelte`
- [ ] Show title, description, date range, location, RSVP status
- [ ] Allow members to set/change RSVP from detail page
- [ ] Show admin-only info: delivery state, reminder config, attendance link
- [ ] Add `getEventById(id)` accessor to `currentHub` store
- [ ] Link event titles in `EventsSection.svelte` to `/hub/event/<id>`
- [ ] Handle "event not found" with friendly message and link to hub
- [ ] Verify event detail works in smoke mode with fixture data

## c — Messaging compose entry point

- [ ] Add "New Message" button to `InboxPane.svelte` header
- [ ] Create `src/lib/components/messages/ContactPicker.svelte`
- [ ] ContactPicker shows searchable list of org members
- [ ] On member select, call `openConversationForProfile` and close picker
- [ ] Exclude members who already have an open thread (or highlight existing)
- [ ] Extend `filterThreadsByInboxQuery` to search message bodies (client-side)
- [ ] Preserve existing search-by-participant-name behavior
- [ ] Verify compose works in smoke mode

## d — Profile enrichment

- [ ] Migration 035: add `bio text` column to `profiles` (nullable)
- [ ] Migration 036: add `deletion_requested_at timestamptz` column to `profiles`
- [ ] RPC `request_account_deletion`: sets `deletion_requested_at = now()` for caller
- [ ] Update `UserDetails` type with `bio` field
- [ ] Update profile select queries to include `bio`
- [ ] Add bio textarea (max 500 chars) to `ProfileDetailsCard.svelte`
- [ ] Add `updateBio(bio)` method to `currentUser` store
- [ ] Show bio in `MemberRow.svelte` in the member directory
- [ ] Create `ProfileDangerZoneCard.svelte` with "Delete my account" button
- [ ] Add confirmation dialog before deletion request
- [ ] Add `requestAccountDeletion()` method to `currentUser` store
- [ ] Show "Deletion requested" indicator after successful request
- [ ] Add `ProfileDangerZoneCard` to `src/routes/profile/+page.svelte`

## e — Rollout safety and test coverage

- [ ] Add smoke fixtures for event detail page
- [ ] Create `EventDetailCard.test.ts`
- [ ] Create `ContactPicker.test.ts`
- [ ] Add bio update and account deletion tests to `currentUser.test.ts`
- [ ] Update push trigger tests to verify deep-link URLs
- [ ] Verify total test count increase is at least +15
- [ ] Create `docs/rollout-0.1.35-checklist.md`
