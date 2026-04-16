# 0.1.33 rollout checklist

Use this checklist to roll `0.1.33` through each environment and verify that broadcast acknowledgments, real-time messaging, visible read status, and web push notifications are aligned with the database and Edge Function infrastructure.

Primary release commit:

- [ ] Fill in the `release: 0.1.33` commit hash once the release branch is cut

New migrations in this release:

- `030_add_broadcast_acknowledgments.sql`
- `031_add_contact_last_read_at.sql`
- `032_add_push_subscriptions.sql`

New Edge Function:

- `supabase/functions/send-push/index.ts`

If rollout hits schema drift, use [hub-schema-recovery.md](hub-schema-recovery.md).

---

## Environment tracker

- [ ] Local / preview updated
- [ ] Shared staging updated
- [ ] Production updated

Record operator, date, and notes in your deployment system or ticket for each environment.

---

## Preflight

- [ ] Confirm the target environment is deploying code at or after the final `release: 0.1.33` commit
- [ ] Confirm `supabase/migrations/030` through `032` are present in the release branch
- [ ] Confirm `supabase/functions/send-push/index.ts` is present in the release branch
- [ ] Confirm your normal database backup and rollback path is ready for the target environment

---

## Database rollout

Apply the outstanding Supabase migrations through your normal deployment path.

```sh
supabase db push
```

Required new migration range for this release:

- [ ] `030_add_broadcast_acknowledgments.sql` — broadcast engagement tracking
- [ ] `031_add_contact_last_read_at.sql` — cross-thread read status RPC
- [ ] `032_add_push_subscriptions.sql` — Web Push subscription storage

---

## Edge Function deployment

Deploy the `send-push` Edge Function:

```sh
supabase functions deploy send-push
```

### Required secrets

Set these via `supabase secrets set`:

- [ ] `VAPID_PRIVATE_KEY` — base64url-encoded ECDSA P-256 private key
- [ ] `PUBLIC_VAPID_KEY` — base64url-encoded ECDSA P-256 public key
- [ ] `VAPID_SUBJECT` — `mailto:` or `https:` URL identifying the application server

### Generate VAPID keys

If you don't have a key pair yet:

```sh
npx web-push generate-vapid-keys
```

Copy the public key into `PUBLIC_VAPID_KEY` in your `.env` and as an Edge Function secret. Copy the private key as `VAPID_PRIVATE_KEY` Edge Function secret only (never expose client-side).

---

## Environment variable

- [ ] Set `PUBLIC_VAPID_KEY` in `.env` (or your deployment platform's environment)

Without this variable the push toggle will not appear in the profile notification preferences card.

---

## Smoke verification

After migration and deployment:

- [ ] Hub home loads without schema errors
- [ ] Broadcast acknowledgment button appears on active broadcast cards
- [ ] Tapping acknowledge increments the count; tapping again reverses it
- [ ] Conversations show "Seen" label on the last owner message when the contact has read it
- [ ] Profile notification preferences card shows the push toggle (if `PUBLIC_VAPID_KEY` is set)
- [ ] Enabling push requests browser permission and succeeds
- [ ] Publishing a broadcast triggers a push notification to other org members with push enabled
- [ ] Real-time messaging delivers new messages without the 15-second polling delay
- [ ] Typing indicator appears when the other participant types

---

## Rollback notes

If you need to roll back:

- **Database**: the new tables (`hub_broadcast_acknowledgments`, `push_subscriptions`) and the new RPC (`get_contact_last_read_at`) are additive. Older app code ignores them.
- **Edge Function**: if `send-push` errors, the client calls are fire-and-forget and gracefully degrade.
- **Real-time**: if Supabase Realtime channels fail, the messaging store falls back to 15-second polling automatically.
