alter table public.hub_broadcasts
	add column if not exists delivery_state text,
	add column if not exists delivered_at timestamptz,
	add column if not exists delivery_failure_reason text;

alter table public.hub_broadcasts
	add constraint hub_broadcasts_delivery_state_check
	check (delivery_state in ('scheduled', 'published', 'failed', 'skipped'));

update public.hub_broadcasts
set
	delivery_state = case
		when publish_at is null then null
		when archived_at is not null and archived_at <= publish_at then 'skipped'
		when expires_at is not null and publish_at >= expires_at then 'failed'
		when publish_at <= now() then 'published'
		else 'scheduled'
	end,
	delivered_at = case
		when publish_at is not null
			and archived_at is null
			and (expires_at is null or publish_at < expires_at)
			and publish_at <= now()
		then publish_at
		else null
	end,
	delivery_failure_reason = case
		when publish_at is null then null
		when archived_at is not null and archived_at <= publish_at then 'Archived before the scheduled visibility window.'
		when expires_at is not null and publish_at >= expires_at then 'Scheduled publish time lands at or after the expiry time.'
		else null
	end;

alter table public.hub_events
	add column if not exists delivery_state text,
	add column if not exists delivered_at timestamptz,
	add column if not exists delivery_failure_reason text;

alter table public.hub_events
	add constraint hub_events_delivery_state_check
	check (delivery_state in ('scheduled', 'published', 'failed', 'skipped'));

update public.hub_events
set
	delivery_state = case
		when publish_at is null then null
		when archived_at is not null and archived_at <= publish_at then 'skipped'
		when canceled_at is not null and canceled_at <= publish_at then 'skipped'
		when publish_at >= starts_at then 'failed'
		when publish_at <= now() then 'published'
		else 'scheduled'
	end,
	delivered_at = case
		when publish_at is not null
			and publish_at < starts_at
			and publish_at <= now()
			and not (archived_at is not null and archived_at <= publish_at)
			and not (canceled_at is not null and canceled_at <= publish_at)
		then publish_at
		else null
	end,
	delivery_failure_reason = case
		when publish_at is null then null
		when archived_at is not null and archived_at <= publish_at then 'Archived before the scheduled visibility window.'
		when canceled_at is not null and canceled_at <= publish_at then 'Canceled before the scheduled visibility window.'
		when publish_at >= starts_at then 'Scheduled publish time lands at or after the event start.'
		else null
	end;