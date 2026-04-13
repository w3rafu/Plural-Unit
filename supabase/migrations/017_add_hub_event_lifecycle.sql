alter table public.hub_events
	add column if not exists publish_at timestamptz,
	add column if not exists canceled_at timestamptz,
	add column if not exists archived_at timestamptz;

create index if not exists idx_hub_events_org_starts
	on public.hub_events (organization_id, starts_at);

create index if not exists idx_hub_events_org_publish
	on public.hub_events (organization_id, publish_at);

create index if not exists idx_hub_events_org_archived
	on public.hub_events (organization_id, archived_at desc);

create index if not exists idx_hub_events_org_canceled
	on public.hub_events (organization_id, canceled_at desc);

drop policy if exists "Members read own events" on public.hub_events;

create policy "Members read live own events"
	on public.hub_events for select
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
		and archived_at is null
		and canceled_at is null
		and starts_at > now()
		and (publish_at is null or publish_at <= now())
	);