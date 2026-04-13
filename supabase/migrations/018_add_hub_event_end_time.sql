alter table public.hub_events
	add column if not exists ends_at timestamptz;

alter table public.hub_events
	drop constraint if exists hub_events_end_after_start;

alter table public.hub_events
	add constraint hub_events_end_after_start
	check (ends_at is null or ends_at > starts_at);

create index if not exists idx_hub_events_org_end
	on public.hub_events (organization_id, ends_at);