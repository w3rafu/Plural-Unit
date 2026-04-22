-- 044: Add event lifecycle member signals and expand reminder delivery channels.

alter table public.hub_events
	add column if not exists member_signal_kind text,
	add column if not exists member_signal_at timestamptz;

update public.hub_events
set
	member_signal_kind = case
		when canceled_at is not null then 'canceled'
		else 'default'
	end,
	member_signal_at = coalesce(canceled_at, updated_at, created_at, now())
where member_signal_kind is null
	or member_signal_at is null;

alter table public.hub_events
	alter column member_signal_kind set default 'default';

alter table public.hub_events
	alter column member_signal_kind set not null;

alter table public.hub_events
	alter column member_signal_at set default now();

alter table public.hub_events
	alter column member_signal_at set not null;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'hub_events_member_signal_kind_check'
	) then
		alter table public.hub_events
		add constraint hub_events_member_signal_kind_check
		check (member_signal_kind in ('default', 'canceled', 'restored'));
	end if;
end
$$;

drop policy if exists "Members read live and recent events"
	on public.hub_events;

create policy "Members read live and recent events"
	on public.hub_events for select
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
		and archived_at is null
		and (
			(
				canceled_at is null
				and (publish_at is null or publish_at <= now())
				and coalesce(ends_at, starts_at) + interval '24 hours' > now()
			)
			or (
				canceled_at is not null
				and (publish_at is null or publish_at <= canceled_at)
				and member_signal_kind = 'canceled'
				and member_signal_at + interval '30 days' > now()
			)
		)
	);

alter table public.hub_event_reminders
	drop constraint if exists hub_event_reminders_delivery_channel_check;

alter table public.hub_event_reminders
	add constraint hub_event_reminders_delivery_channel_check
	check (delivery_channel in ('in_app', 'push', 'in_app_and_push'));
