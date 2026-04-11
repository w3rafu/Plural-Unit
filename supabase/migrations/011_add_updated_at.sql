-- 011: Add updated_at columns to core tables.
--
-- Each table gets an updated_at column that defaults to now()
-- and is refreshed automatically by a shared trigger function.

-- Shared trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

-- profiles
alter table public.profiles
	add column if not exists updated_at timestamptz not null default now();

create trigger trg_profiles_updated_at
	before update on public.profiles
	for each row execute function public.set_updated_at();

-- organizations
alter table public.organizations
	add column if not exists updated_at timestamptz not null default now();

create trigger trg_organizations_updated_at
	before update on public.organizations
	for each row execute function public.set_updated_at();

-- organization_memberships
alter table public.organization_memberships
	add column if not exists updated_at timestamptz not null default now();

create trigger trg_organization_memberships_updated_at
	before update on public.organization_memberships
	for each row execute function public.set_updated_at();

-- organization_invitations
alter table public.organization_invitations
	add column if not exists updated_at timestamptz not null default now();

create trigger trg_organization_invitations_updated_at
	before update on public.organization_invitations
	for each row execute function public.set_updated_at();

-- hub_broadcasts
alter table public.hub_broadcasts
	add column if not exists updated_at timestamptz not null default now();

create trigger trg_hub_broadcasts_updated_at
	before update on public.hub_broadcasts
	for each row execute function public.set_updated_at();

-- hub_events
alter table public.hub_events
	add column if not exists updated_at timestamptz not null default now();

create trigger trg_hub_events_updated_at
	before update on public.hub_events
	for each row execute function public.set_updated_at();
