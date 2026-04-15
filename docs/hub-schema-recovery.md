# Hub Schema Recovery

Use this runbook when newer hub code is running against an older Supabase database and the app starts throwing missing-column, missing-relation, or missing-function errors.

This is the recovery guide for the hub schema work that landed across migrations `021` through `027`.

---

## When to use this

Common symptoms:

- `column hub_broadcasts.delivery_state does not exist`
- `column hub_events.delivery_state does not exist`
- `relation "public.hub_notification_preferences" does not exist`
- `relation "public.hub_execution_ledger" does not exist`
- `column hub_notification_reads.notification_key does not exist`
- `relation "public.hub_event_attendances" does not exist`
- member-facing recent event history disappears as soon as an event starts

If you see one of those, assume the database is behind the application code until proven otherwise.

---

## Migration map

These are the hub migrations most likely to surface as runtime drift in an older database:

| Migration | Purpose | Common symptom when missing |
|-----------|---------|-----------------------------|
| `021_add_hub_delivery_state.sql` | Adds `delivery_state`, `delivered_at`, and `delivery_failure_reason` to `hub_broadcasts` and `hub_events` | `column hub_broadcasts.delivery_state does not exist`, `column hub_events.delivery_state does not exist` |
| `022_add_hub_notification_preferences.sql` | Adds persisted in-app notification preferences and read markers | `relation "public.hub_notification_preferences" does not exist` |
| `023_add_hub_execution_ledger.sql` | Adds the scheduled publish and reminder execution ledger | `relation "public.hub_execution_ledger" does not exist` |
| `024_add_hub_reminder_notification_identity.sql` | Adds `notification_key` support and reminder-aware notification identity | `column hub_notification_reads.notification_key does not exist` |
| `025_add_hub_event_attendances.sql` | Adds durable event attendance rows and policies | `relation "public.hub_event_attendances" does not exist` |
| `026_expand_member_event_visibility_for_recent_history.sql` | Keeps recent published events visible after start time for member follow-up surfaces | events disappear from member surfaces as soon as they start |
| `027_backfill_hub_delivery_metadata.sql` | Catch-up migration for databases that missed the `021` delivery metadata rollout | older databases still fail on `delivery_state` even though newer code expects it |

Important precondition:

- `020_add_hub_event_reminders.sql` is also required for reminder features. If reminder loading fails with `relation "public.hub_event_reminders" does not exist`, the database is behind even before the `021` to `027` range.

---

## Recovery steps

### Local or preview database

1. Make sure your branch has the latest `supabase/migrations/` files.
2. Apply migrations in order:

```sh
supabase db push
```

3. Restart the app after the migration run completes.
4. Re-open the hub surfaces that were failing:
   - Alerts sheet
   - member home hub cards
   - `/hub/manage`
   - profile notification preferences

### Shared or production-like database

1. Pause and confirm which environment is behind.
2. Back up first if your deployment process requires it.
3. Apply the missing migrations in order through your normal Supabase migration path.
4. Restart or redeploy the app so fresh schema assumptions are loaded cleanly.
5. Verify the checks in the next section before closing the incident.

### If the only symptom is missing delivery metadata

If the database specifically missed the delivery-state rollout and the rest of the hub schema is present, applying `027_backfill_hub_delivery_metadata.sql` is the catch-up path. It is intentionally idempotent:

- re-adds missing delivery columns
- re-adds missing delivery-state check constraints
- backfills delivery metadata for existing `hub_broadcasts`
- backfills delivery metadata for existing `hub_events`

This is the fastest recovery path for:

- `column hub_broadcasts.delivery_state does not exist`
- `column hub_events.delivery_state does not exist`

---

## Verification checklist

After recovery, verify these paths:

1. Alerts open without a schema error.
2. Admin manage loads without falling into an error state.
3. Broadcast and event editors render delivery status normally.
4. Notification preferences load and save.
5. Attendance tools render for recent/live events.
6. Recent event history still appears for members after an event starts.

If one of those still fails, use the exact database error message to map back to the migration table above.

---

## Operational guardrails

- Do not ship newer hub UI code without the matching database migrations.
- Treat the app and `supabase/migrations/` as one release unit.
- If you cherry-pick hub UI/store/repository commits into an older environment, run migrations before restarting the app.
- If a recovery patch is needed, prefer a new additive migration like `027` instead of editing an old migration that may already have been applied elsewhere.

---

## Fast diagnosis shortcut

Use the error text itself:

- missing `delivery_state` field: start with `021`, then apply `027` if needed
- missing notification preferences table: apply `022`
- missing execution ledger table: apply `023`
- missing `notification_key`: apply `024`
- missing attendances table: apply `025`
- no error, but recent events vanish too early: apply `026`

If the database is broadly behind, do not cherry-pick one migration unless you know exactly why. Apply the full outstanding sequence in order.
