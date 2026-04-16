# 0.1.35 Rollout Checklist

## Pre-deploy

- [ ] All 749+ tests passing (`npx vitest run`)
- [ ] No TypeScript errors (`npx svelte-check`)
- [ ] Migrations 035 and 036 reviewed and ready

## Database migrations

- [ ] Apply `035_add_profile_bio.sql` — adds `bio` text column to profiles
- [ ] Apply `036_add_account_deletion_request.sql` — adds `deletion_requested_at` column and `request_account_deletion()` RPC

## Feature verification

### Slice A — Push activation
- [ ] VAPID keys generated (`npm run generate-vapid-keys`)
- [ ] Push test button visible in dev mode on profile notification preferences
- [ ] Service worker caches app shell on install
- [ ] Push notifications deep-link to `/hub/event/<id>` and `/messages?thread=<id>`

### Slice B — Event detail page
- [ ] Navigate to `/hub/event/<eventId>` directly
- [ ] Event title, description, dates, location render correctly
- [ ] RSVP buttons work on event detail page
- [ ] Calendar export (Google Calendar + .ics) works
- [ ] "Event not found" state renders for invalid event IDs
- [ ] Back button returns to hub
- [ ] Event titles in hub list link to detail page

### Slice C — Messaging compose entry point
- [ ] "New message" button visible in inbox header (pen icon)
- [ ] Contact picker sheet opens with searchable member list
- [ ] Selecting a member opens/creates conversation thread
- [ ] Current user is excluded from contact picker list
- [ ] Message body search finds text across all messages in a thread
- [ ] Compose flow works on mobile and desktop layouts

### Slice D — Profile enrichment
- [ ] Bio textarea appears in profile details card
- [ ] Bio saves and persists on profile update
- [ ] Bio character limit (500) enforced via maxlength
- [ ] Danger zone card appears on profile page
- [ ] "Delete my account" confirmation sheet works
- [ ] Deletion request calls RPC and shows success toast
- [ ] Dirty-tracking includes bio field changes

### Slice E — Rollout safety
- [ ] Smoke mode renders without errors
- [ ] New tests added for body search, bio, and deletion
- [ ] Push URL assertions verified in existing test suite

## Post-deploy

- [ ] Verify live push notifications arrive with correct deep-link URLs
- [ ] Verify event detail page loads for existing events
- [ ] Verify bio field round-trips through save
- [ ] Monitor error logs for regressions
