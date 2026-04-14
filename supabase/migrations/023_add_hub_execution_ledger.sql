create table if not exists public.hub_execution_ledger (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	job_kind text not null check (job_kind in ('broadcast_publish', 'event_publish', 'event_reminder')),
	source_id uuid not null,
	execution_key text not null default 'default',
	due_at timestamptz not null,
	execution_state text not null default 'pending' check (execution_state in ('pending', 'processed', 'failed', 'skipped')),
	processed_at timestamptz,
	last_attempted_at timestamptz,
	attempt_count integer not null default 0 check (attempt_count >= 0),
	last_failure_reason text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (job_kind, source_id, execution_key)
);

create index if not exists idx_hub_execution_ledger_org_state_due
	on public.hub_execution_ledger (organization_id, execution_state, due_at asc);

create index if not exists idx_hub_execution_ledger_org_kind_due
	on public.hub_execution_ledger (organization_id, job_kind, due_at asc);

alter table public.hub_execution_ledger enable row level security;

drop policy if exists "Admins manage hub execution ledger"
	on public.hub_execution_ledger;

create policy "Admins manage hub execution ledger"
	on public.hub_execution_ledger for all
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid() and role = 'admin'
		)
	);

drop trigger if exists trg_hub_execution_ledger_updated_at on public.hub_execution_ledger;

create trigger trg_hub_execution_ledger_updated_at
	before update on public.hub_execution_ledger
	for each row execute function public.set_updated_at();

insert into public.hub_execution_ledger (
	organization_id,
	job_kind,
	source_id,
	execution_key,
	due_at,
	execution_state,
	processed_at,
	last_attempted_at,
	attempt_count,
	last_failure_reason
)
select
	broadcast.organization_id,
	'broadcast_publish',
	broadcast.id,
	'publish',
	broadcast.publish_at,
	case
		when broadcast.archived_at is not null and broadcast.archived_at <= broadcast.publish_at then 'skipped'
		when broadcast.expires_at is not null and broadcast.publish_at >= broadcast.expires_at then 'failed'
		when broadcast.publish_at <= now() then 'processed'
		else 'pending'
	end,
	case
		when broadcast.archived_at is null
			and (broadcast.expires_at is null or broadcast.publish_at < broadcast.expires_at)
			and broadcast.publish_at <= now()
		then broadcast.publish_at
		else null
	end,
	case
		when broadcast.archived_at is null
			and (broadcast.expires_at is null or broadcast.publish_at < broadcast.expires_at)
			and broadcast.publish_at <= now()
		then broadcast.publish_at
		else null
	end,
	case
		when broadcast.archived_at is null
			and (broadcast.expires_at is null or broadcast.publish_at < broadcast.expires_at)
			and broadcast.publish_at <= now()
		then 1
		else 0
	end,
	case
		when broadcast.archived_at is not null and broadcast.archived_at <= broadcast.publish_at then 'Archived before the scheduled visibility window.'
		when broadcast.expires_at is not null and broadcast.publish_at >= broadcast.expires_at then 'The scheduled publish time lands at or after the expiry time.'
		else null
	end
from public.hub_broadcasts as broadcast
where broadcast.publish_at is not null
on conflict (job_kind, source_id, execution_key) do update
set
	organization_id = excluded.organization_id,
	due_at = excluded.due_at,
	execution_state = excluded.execution_state,
	processed_at = excluded.processed_at,
	last_attempted_at = excluded.last_attempted_at,
	attempt_count = excluded.attempt_count,
	last_failure_reason = excluded.last_failure_reason,
	updated_at = now();

insert into public.hub_execution_ledger (
	organization_id,
	job_kind,
	source_id,
	execution_key,
	due_at,
	execution_state,
	processed_at,
	last_attempted_at,
	attempt_count,
	last_failure_reason
)
select
	event.organization_id,
	'event_publish',
	event.id,
	'publish',
	event.publish_at,
	case
		when event.archived_at is not null and event.archived_at <= event.publish_at then 'skipped'
		when event.canceled_at is not null and event.canceled_at <= event.publish_at then 'skipped'
		when event.publish_at >= event.starts_at then 'failed'
		when event.publish_at <= now() then 'processed'
		else 'pending'
	end,
	case
		when event.publish_at < event.starts_at
			and event.publish_at <= now()
			and not (event.archived_at is not null and event.archived_at <= event.publish_at)
			and not (event.canceled_at is not null and event.canceled_at <= event.publish_at)
		then event.publish_at
		else null
	end,
	case
		when event.publish_at < event.starts_at
			and event.publish_at <= now()
			and not (event.archived_at is not null and event.archived_at <= event.publish_at)
			and not (event.canceled_at is not null and event.canceled_at <= event.publish_at)
		then event.publish_at
		else null
	end,
	case
		when event.publish_at < event.starts_at
			and event.publish_at <= now()
			and not (event.archived_at is not null and event.archived_at <= event.publish_at)
			and not (event.canceled_at is not null and event.canceled_at <= event.publish_at)
		then 1
		else 0
	end,
	case
		when event.archived_at is not null and event.archived_at <= event.publish_at then 'Archived before the scheduled visibility window.'
		when event.canceled_at is not null and event.canceled_at <= event.publish_at then 'Canceled before the scheduled visibility window.'
		when event.publish_at >= event.starts_at then 'The scheduled publish time lands at or after the event start.'
		else null
	end
from public.hub_events as event
where event.publish_at is not null
on conflict (job_kind, source_id, execution_key) do update
set
	organization_id = excluded.organization_id,
	due_at = excluded.due_at,
	execution_state = excluded.execution_state,
	processed_at = excluded.processed_at,
	last_attempted_at = excluded.last_attempted_at,
	attempt_count = excluded.attempt_count,
	last_failure_reason = excluded.last_failure_reason,
	updated_at = now();

insert into public.hub_execution_ledger (
	organization_id,
	job_kind,
	source_id,
	execution_key,
	due_at,
	execution_state,
	processed_at,
	last_attempted_at,
	attempt_count,
	last_failure_reason
)
select
	reminder.organization_id,
	'event_reminder',
	reminder.event_id,
	reminder_slot.offset_minutes::text,
	reminder_slot.due_at,
	case
		when event.publish_at is not null and event.publish_at > reminder_slot.due_at then 'failed'
		when event.archived_at is not null and event.archived_at <= now() then 'skipped'
		when event.canceled_at is not null and event.canceled_at <= now() then 'skipped'
		when event.starts_at <= now() then 'skipped'
		else 'pending'
	end,
	null,
	null,
	0,
	case
		when event.publish_at is not null and event.publish_at > reminder_slot.due_at then 'Reminder window lands before event visibility. Adjust the publish time or reminder plan.'
		when event.archived_at is not null and event.archived_at <= now() then 'Event was archived before this reminder could be processed.'
		when event.canceled_at is not null and event.canceled_at <= now() then 'Event was canceled before this reminder could be processed.'
		when event.starts_at <= now() then 'Reminder window passed before the event started.'
		else null
	end
from public.hub_event_reminders as reminder
join public.hub_events as event
	on event.id = reminder.event_id
cross join lateral (
	select
		offset_minutes,
		event.starts_at - make_interval(mins => offset_minutes) as due_at
	from unnest(reminder.reminder_offsets) as offset_minutes
	where offset_minutes > 0
) as reminder_slot
on conflict (job_kind, source_id, execution_key) do update
set
	organization_id = excluded.organization_id,
	due_at = excluded.due_at,
	execution_state = excluded.execution_state,
	processed_at = excluded.processed_at,
	last_attempted_at = excluded.last_attempted_at,
	attempt_count = excluded.attempt_count,
	last_failure_reason = excluded.last_failure_reason,
	updated_at = now();