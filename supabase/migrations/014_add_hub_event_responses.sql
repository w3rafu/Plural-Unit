create table public.hub_event_responses (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.hub_events(id) on delete cascade,
	organization_id uuid not null references public.organizations(id) on delete cascade,
	profile_id uuid not null references public.profiles(id) on delete cascade,
	response text not null check (response in ('going', 'maybe', 'cannot_attend')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (event_id, profile_id)
);

create index idx_hub_event_responses_org_event
	on public.hub_event_responses (organization_id, event_id);

create index idx_hub_event_responses_event_updated
	on public.hub_event_responses (event_id, updated_at desc);

alter table public.hub_event_responses enable row level security;

create policy "Members read own event responses"
	on public.hub_event_responses for select
	using (
		exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_event_responses.organization_id
				and memberships.profile_id = auth.uid()
		)
	);

create policy "Members insert own event responses"
	on public.hub_event_responses for insert
	with check (
		profile_id = auth.uid()
		and exists (
			select 1
			from public.hub_events as events
			join public.organization_memberships as memberships
				on memberships.organization_id = events.organization_id
			where events.id = hub_event_responses.event_id
				and events.organization_id = hub_event_responses.organization_id
				and memberships.profile_id = auth.uid()
		)
	);

create policy "Members update own event responses"
	on public.hub_event_responses for update
	using (profile_id = auth.uid())
	with check (
		profile_id = auth.uid()
		and exists (
			select 1
			from public.hub_events as events
			join public.organization_memberships as memberships
				on memberships.organization_id = events.organization_id
			where events.id = hub_event_responses.event_id
				and events.organization_id = hub_event_responses.organization_id
				and memberships.profile_id = auth.uid()
		)
	);

create trigger trg_hub_event_responses_updated_at
	before update on public.hub_event_responses
	for each row execute function public.set_updated_at();
