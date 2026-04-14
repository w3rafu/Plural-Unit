alter table public.hub_notification_reads
	add column if not exists notification_key text not null default 'default';

alter table public.hub_notification_reads
	drop constraint if exists hub_notification_reads_notification_kind_check;

alter table public.hub_notification_reads
	add constraint hub_notification_reads_notification_kind_check
	check (notification_kind in ('broadcast', 'event', 'event_reminder'));

do $$
declare
	existing_constraint text;
begin
	select constraint_lookup.conname
	into existing_constraint
	from (
		select
			constraint_catalog.conname,
			array_agg(attribute.attname::text order by key_ord.ordinality) as column_names
		from pg_constraint as constraint_catalog
		join unnest(constraint_catalog.conkey) with ordinality as key_ord(attnum, ordinality)
			on true
		join pg_attribute as attribute
			on attribute.attrelid = constraint_catalog.conrelid
			and attribute.attnum = key_ord.attnum
		where constraint_catalog.conrelid = 'public.hub_notification_reads'::regclass
			and constraint_catalog.contype = 'u'
		group by constraint_catalog.conname
	) as constraint_lookup
	where constraint_lookup.column_names = array['organization_id', 'profile_id', 'notification_kind', 'source_id'];

	if existing_constraint is not null then
		execute format(
			'alter table public.hub_notification_reads drop constraint %I',
			existing_constraint
		);
	end if;
end $$;

create unique index if not exists idx_hub_notification_reads_identity
	on public.hub_notification_reads (
		organization_id,
		profile_id,
		notification_kind,
		source_id,
		notification_key
	);

create or replace function public.process_hub_due_reminder_executions(target_organization_id uuid)
returns setof public.hub_execution_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
	caller_id uuid;
begin
	caller_id := auth.uid();

	if caller_id is null then
		return;
	end if;

	if not exists (
		select 1
		from public.organization_memberships as membership
		where membership.organization_id = target_organization_id
			and membership.profile_id = caller_id
	) then
		return;
	end if;

	return query
	with processed_rows as (
		update public.hub_execution_ledger as ledger
		set
			execution_state = 'processed',
			processed_at = coalesce(ledger.processed_at, now()),
			last_attempted_at = now(),
			attempt_count = greatest(ledger.attempt_count + 1, 1),
			last_failure_reason = null,
			updated_at = now()
		from public.hub_events as event
		where ledger.organization_id = target_organization_id
			and ledger.job_kind = 'event_reminder'
			and ledger.execution_state = 'pending'
			and ledger.source_id = event.id
			and event.organization_id = target_organization_id
			and ledger.due_at <= now()
			and event.archived_at is null
			and event.canceled_at is null
			and event.starts_at > now()
			and (event.publish_at is null or event.publish_at <= ledger.due_at)
		returning ledger.*
	)
	select *
	from processed_rows
	order by due_at asc;
end;
$$;

revoke all on function public.process_hub_due_reminder_executions(uuid) from public;
grant execute on function public.process_hub_due_reminder_executions(uuid) to authenticated;

drop policy if exists "Members read processed reminder executions"
	on public.hub_execution_ledger;

create policy "Members read processed reminder executions"
	on public.hub_execution_ledger for select
	using (
		job_kind = 'event_reminder'
		and execution_state = 'processed'
		and organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
	);