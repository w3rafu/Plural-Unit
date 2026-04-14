create table if not exists public.hub_event_attendances (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.hub_events(id) on delete cascade,
	organization_id uuid not null references public.organizations(id) on delete cascade,
	profile_id uuid not null references public.profiles(id) on delete cascade,
	status text not null check (status in ('attended', 'absent')),
	marked_by_profile_id uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (event_id, profile_id)
);

create index if not exists idx_hub_event_attendances_org_event
	on public.hub_event_attendances (organization_id, event_id);

create index if not exists idx_hub_event_attendances_profile_event
	on public.hub_event_attendances (profile_id, event_id);

create index if not exists idx_hub_event_attendances_event_updated
	on public.hub_event_attendances (event_id, updated_at desc);

alter table public.hub_event_attendances enable row level security;

drop policy if exists "Members read event attendance"
	on public.hub_event_attendances;

create policy "Members read event attendance"
	on public.hub_event_attendances for select
	using (
		exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_event_attendances.organization_id
				and memberships.profile_id = auth.uid()
				and (
					memberships.role = 'admin'
					or hub_event_attendances.profile_id = auth.uid()
				)
		)
	);

drop policy if exists "Admins manage event attendance"
	on public.hub_event_attendances;

create policy "Admins manage event attendance"
	on public.hub_event_attendances for all
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid() and role = 'admin'
		)
	)
	with check (
		marked_by_profile_id = auth.uid()
		and exists (
			select 1
			from public.organization_memberships as admin_membership
			where admin_membership.organization_id = hub_event_attendances.organization_id
				and admin_membership.profile_id = auth.uid()
				and admin_membership.role = 'admin'
		)
		and exists (
			select 1
			from public.organization_memberships as member_membership
			where member_membership.organization_id = hub_event_attendances.organization_id
				and member_membership.profile_id = hub_event_attendances.profile_id
		)
		and exists (
			select 1
			from public.hub_events as events
			where events.id = hub_event_attendances.event_id
				and events.organization_id = hub_event_attendances.organization_id
		)
	);

drop trigger if exists trg_hub_event_attendances_updated_at on public.hub_event_attendances;

create trigger trg_hub_event_attendances_updated_at
	before update on public.hub_event_attendances
	for each row execute function public.set_updated_at();
