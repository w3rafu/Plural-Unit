create table public.hub_resources (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	title text not null,
	description text not null default '',
	href text not null,
	resource_type text not null check (resource_type in ('link', 'form', 'document', 'contact')),
	sort_order integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index idx_hub_resources_org_sort
	on public.hub_resources (organization_id, sort_order);

alter table public.hub_resources enable row level security;

create policy "Members read own resources"
	on public.hub_resources for select
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
	);

create policy "Admins manage resources"
	on public.hub_resources for all
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid() and role = 'admin'
		)
	);

create trigger trg_hub_resources_updated_at
	before update on public.hub_resources
	for each row execute function public.set_updated_at();