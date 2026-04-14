drop policy if exists "Members read live own events"
	on public.hub_events;

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
		and canceled_at is null
		and (publish_at is null or publish_at <= now())
		and coalesce(ends_at, starts_at) + interval '24 hours' > now()
	);