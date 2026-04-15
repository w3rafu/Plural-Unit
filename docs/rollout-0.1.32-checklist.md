# 0.1.32 rollout checklist

Use this checklist to roll `0.1.32` through each environment and verify that shared operator workflow state, stale-review surfacing, and the existing hub schema stay aligned.

Primary release commit:

- [ ] Fill in the `release: 0.1.32` commit hash once the release branch is cut

Shared workflow-state migration in this release:

- `029_create_hub_operator_workflow_state.sql`

If rollout hits schema drift, use [hub-schema-recovery.md](/Users/rafa/Desktop/plural-unit/docs/hub-schema-recovery.md).

---

## Environment tracker

- [ ] Local / preview updated
- [ ] Shared staging updated
- [ ] Production updated

Record operator, date, and notes in your deployment system or ticket for each environment.

---

## Preflight

- [ ] Confirm the target environment is deploying code at or after the final `release: 0.1.32` commit
- [ ] Confirm `supabase/migrations/021_add_hub_delivery_state.sql` through `029_create_hub_operator_workflow_state.sql` are present in the release branch
- [ ] Confirm your normal database backup / rollback path is ready for the target environment
- [ ] Confirm nobody is actively debugging a stale schema issue in the same environment before you start
- [ ] Confirm rollout owners know the legacy browser-triage import should happen only on the first admin load against an empty remote workflow table

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
- [ ] `028_fix_get_organization_members_ambiguity.sql`
- [ ] `029_create_hub_operator_workflow_state.sql`

Important preconditions:

- [ ] `020_add_hub_event_reminders.sql` is already present if the environment ever skipped reminder schema work
- [ ] Any environment that missed the member-roster RPC fix is caught up through `028_fix_get_organization_members_ambiguity.sql` before operator inbox or reviewer-name checks begin

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
        or (
            table_name = 'hub_operator_workflow_state'
            and column_name in (
                'organization_id',
                'workflow_key',
                'workflow_kind',
                'status',
                'reviewed_by_profile_id',
                'note',
                'reviewed_against_signature',
                'updated_at'
            )
        )
    )
order by table_name, column_name;
```

You should also confirm these relations exist:

- [ ] `public.hub_event_reminders`
- [ ] `public.hub_notification_preferences`
- [ ] `public.hub_execution_ledger`
- [ ] `public.hub_event_attendances`
- [ ] `public.hub_operator_workflow_state`

---

## Application smoke pass

Optional local preflight before checking a deployed environment:

- [ ] Run `npm run test:smoke`
- [ ] Confirm the smoke harness still covers one workflow write path, one stale-review re-surface path, and one workflow-schema drift scenario (`stale-workflow-schema`) before relying on it for rollout confidence

Run these checks in the updated environment:

- [ ] Open the member home page and verify the hub loads without a blocking error card
- [ ] Open Alerts and verify the sheet loads without a schema error
- [ ] Open Alerts from a route that does not preload organization members and verify the operator inbox loads instead of showing a false empty state
- [ ] Open `/hub/manage` and verify the manage shell loads without falling into an error state
- [ ] Review or defer one queue or follow-up row and verify the state persists after a refresh or navigation round-trip
- [ ] Confirm the same workflow decision is reflected consistently in the queue and the operator inbox
- [ ] Trigger one stale-review path by changing timing, execution state, or attendance backlog and verify the item resurfaces with re-review copy
- [ ] If handoff-note UI ships in the release, confirm reviewer identity and note snippets render on operator surfaces without leaking into member-facing alerts
- [ ] Verify member-facing alert cards stay free of operator-only stale-review or note copy

---

## Rollout-specific risk watch

These are the highest-risk paths in `0.1.32`:

- remote workflow-state hydration and the one-time browser-triage import path
- queue and operator-inbox agreement on reviewed, deferred, and resurfaced work
- stale-signature rules that can hide or re-surface operator work at the wrong time
- reviewer-name resolution when organization members have not already been loaded
- smoke-harness confidence drift if the workflow-schema failure scenario falls behind the real migration shape

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

- `column reference "profile_id" is ambiguous`
- `column reference "role" is ambiguous`
Apply `028`.

- `relation "public.hub_operator_workflow_state" does not exist`
- `column hub_operator_workflow_state.reviewed_against_signature does not exist`
- queue review or defer actions fail after load succeeds
Apply `029_create_hub_operator_workflow_state.sql`, then restart the app.

If the environment is broadly behind, do not cherry-pick one migration unless you know exactly why. Apply the full outstanding sequence in order.
