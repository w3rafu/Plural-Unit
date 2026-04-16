# 0.1.34 checklist

## Release-wide product constraints

- [ ] Each slice is independently shippable
- [ ] Push notifications remain opt-in and respect preference toggles
- [ ] Messaging schema is backward-compatible — pagination changes are transparent
- [ ] Re-run `npm run check` and `npm test` as each major slice lands

## a — Complete push notification triggers

- [x] Add `033_add_message_notification_preference.sql` with `message_enabled boolean not null default true`
- [x] Update Edge Function `send-push/index.ts` to use `message_enabled` for `kind: 'message'`
- [x] Update Edge Function to support single-profile targeting for message push (recipient only)
- [x] Wire `triggerPushNotification({ kind: 'message' })` in `currentMessages.svelte.ts` after `sendMessageToThread`
- [x] Skip push for demo/fake user threads
- [x] Wire `triggerPushNotification({ kind: 'event' })` in `currentHub.svelte.ts` after event publish
- [x] Wire push for scheduled broadcasts that transition to active via the execution ledger delivery path
- [x] Update `HubNotificationPreferences` type to include `message: boolean`
- [x] Update `HubNotificationPreferenceRow` to include `message_enabled`
- [x] Update `saveHubNotificationPreferences` to persist `message_enabled`
- [x] Add "Message notifications" checkbox to `ProfileNotificationPreferencesCard.svelte`
- [x] Verify all new push calls no-op in smoke mode
- [x] Add focused tests for message and event push triggers

## b — Message pagination

- [x] Add `fetchOlderMessages(threadId, beforeSentAt, limit)` to `messageRepository.ts`
- [x] Limit initial message fetch to most recent 50 per thread in `fetchOwnMessageThreads`
- [x] Add `loadOlderMessages()` method to `currentMessages.svelte.ts`
- [x] Track `hasMoreMessages` flag per thread in the store
- [x] Detect scroll-to-top in `ThreadPane.svelte` and trigger `loadOlderMessages`
- [x] Show compact loading indicator while fetching older messages
- [x] Fix `keepScrolledToBottom` — auto-scroll on new message only when user is near bottom
- [x] Preserve existing inbox search behavior with paginated backing
- [x] Add focused repository and store tests for pagination

## c — Test coverage for new services

- [x] Create `src/lib/services/pushSubscription.test.ts` — subscribe, save, remove, smoke bypass, permission state
- [x] Create `src/lib/services/realtimeService.test.ts` — channel subscribe/unsubscribe, typing broadcast/clear, fallback
- [x] Create `src/lib/stores/authBoundary.test.ts`
- [x] Create `src/lib/stores/currentTheme.test.ts`
- [x] Verify total test count increase is at least +15

## d — Lint, format, and error page

- [ ] Install ESLint v9: `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`
- [ ] Install Prettier: `prettier`, `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`
- [ ] Create `eslint.config.js` with SvelteKit flat config
- [ ] Create `.prettierrc` and `.prettierignore`
- [ ] Add `lint` and `format` scripts to `package.json`
- [ ] Create `src/routes/+error.svelte` with 404 and generic error handling
- [ ] Add skip-to-content link in `src/routes/+layout.svelte`
- [ ] Add `id="main-content"` to the main content region
- [ ] Do not auto-format the entire codebase — config only

## e — Organization settings editing

- [ ] Add admin edit mode to `OrganizationOverviewCard.svelte` for org name
- [ ] Add `updateOrganization` repository method (and migration if RLS requires it)
- [ ] Wire optimistic org name update through `currentOrganization.svelte.ts`
- [ ] Add per-member action menu in `OrganizationMembersCard.svelte` (admin only)
- [ ] Wire promote (member → admin) via existing `setOrganizationMemberRole`
- [ ] Wire demote (admin → member) via existing `setOrganizationMemberRole`
- [ ] Wire remove member via existing `removeOrganizationMember` with confirmation dialog
- [ ] Prevent self-removal or self-demotion
- [ ] Add focused store tests for role change and member removal
