# 0.1.29 rollout checklist

Use this checklist to roll `0.1.29` through any remaining environments and verify that the hub schema and application code stay aligned.

Primary release commit:

- `fed29b5` — `release: 0.1.29`

Useful follow-up docs commit:

- `5c045eb` — `docs: add hub schema recovery runbook`

If rollout hits schema drift, use [hub-schema-recovery.md](/Users/rafa/Desktop/plural-unit/docs/hub-schema-recovery.md).

---

## Environment tracker

- [ ] Local / preview updated
- [ ] Shared staging updated
- [ ] Production updated

Record operator, date, and notes in your deployment system or ticket for each environment.

---

## Preflight

- [ ] Confirm the target environment is deploying code at or after commit `fed29b5`
- [ ] Confirm `supabase/migrations/021_add_hub_delivery_state.sql` through `027_backfill_hub_delivery_metadata.sql` are present in the release branch
- [ ] Confirm your normal database backup / rollback path is ready for the target environment
- [ ] Confirm nobody is actively debugging a stale schema issue in the same environment before you start

---

## Database rollout

Apply the outstanding Supabase migrations through your normal deployment path.

Typical local / CLI path:

```sh
supabase db push
```

If you use the Supabase SQL editor or a managed deployment pipeline instead, apply the same migration sequence there in order.

Required hub migration range for this release:

- [ ] `021_add_hub_delivery_state.sql`
- [ ] `022_add_hub_notification_preferences.sql`
- [ ] `023_add_hub_execution_ledger.sql`
- [ ] `024_add_hub_reminder_notification_identity.sql`
- [ ] `025_add_hub_event_attendances.sql`
- [ ] `026_expand_member_event_visibility_for_recent_history.sql`
- [ ] `027_backfill_hub_delivery_metadata.sql`

Important precondition:

- [ ] `020_add_hub_event_reminders.sql` is already present if the environment ever skipped reminder schema work

After the migration step:

- [ ] Restart or redeploy the app so the runtime and schema assumptions are refreshed together

---

## Optional schema spot-check

If you are unsure whether the environment is fully caught up, run this SQL in the Supabase editor and inspect the results:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
    and (
        (table_name = 'hub_broadcasts' and column_name in ('delivery_state', 'delivered_at', 'delivery_failure_reason'))
        or (table_name = 'hub_events' and column_name in ('delivery_state', 'delivered_at', 'delivery_failure_reason'))
        or (table_name = 'hub_notification_reads' and column_name = 'notification_key')
    )
order by table_name, column_name;
```

You should also confirm these relations exist:

- [ ] `public.hub_event_reminders`
- [ ] `public.hub_notification_preferences`
- [ ] `public.hub_execution_ledger`
- [ ] `public.hub_event_attendances`

---

## Application smoke pass

Optional local preflight before checking a deployed environment:

- [ ] Run `npm run test:smoke` to cover the local home, Alerts, manage content, manage sections, and profile alert-preferences routes through the fixture-backed smoke harness
- [ ] Confirm the smoke harness still covers the simulated stale-schema recovery path before relying on it for rollout confidence

Run these checks in the updated environment:

- [ ] Open the member home page and verify the hub loads without a blocking error card
- [ ] Open Alerts and verify the sheet loads without a schema error
- [ ] Open `/hub/manage` and verify the manage shell loads without falling into an error state
- [ ] Open Broadcasts in manage and verify live/scheduled/draft rows render delivery status normally
- [ ] Open Events in manage and verify live/scheduled/history lanes render, including attendance tools for live or recent events
- [ ] Open Profile notification preferences and verify settings load
- [ ] Save notification preferences successfully
- [ ] Record attendance for one event/member and clear it again
- [ ] Verify a recently started or recently completed published event still appears in member-facing recent history

---

## Rollout-specific risk watch

These are the highest-risk paths in `0.1.29`:

- hub load and hydration through the split `currentHub/` modules
- delivery metadata sync for scheduled broadcasts and events
- execution-ledger reconciliation
- attendance writes and readback
- alerts and notification preference loading against older databases

If any of those fail, capture the exact error text before retrying.

---

## Incident shortcut

Use the error itself to jump to the likely missing migration:

- `column hub_broadcasts.delivery_state does not exist`
- `column hub_events.delivery_state does not exist`
Start with `021`, then apply `027` if the environment missed the backfill path.

- `relation "public.hub_notification_preferences" does not exist`
Apply `022`.

- `relation "public.hub_execution_ledger" does not exist`
Apply `023`.

- `column hub_notification_reads.notification_key does not exist`
Apply `024`.

- `relation "public.hub_event_attendances" does not exist`
Apply `025`.

- No explicit schema error, but recent events vanish too early for members
Apply `026`.

If the environment is broadly behind, do not cherry-pick one migration unless you know exactly why. Apply the full outstanding sequence in order.
