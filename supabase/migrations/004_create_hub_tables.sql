-- Hub plugins activation table.
-- Each row means "this organization has toggled this plugin key."
-- Missing row = disabled.

create table public.hub_plugins (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plugin_key text not null,
  is_enabled boolean not null default true,
  primary key (organization_id, plugin_key)
);

alter table public.hub_plugins enable row level security;

create policy "Members read own hub plugins"
  on public.hub_plugins for select
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid()
    )
  );

create policy "Admins manage hub plugins"
  on public.hub_plugins for all
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- Broadcasts table.

create table public.hub_broadcasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.hub_broadcasts enable row level security;

create policy "Members read own broadcasts"
  on public.hub_broadcasts for select
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid()
    )
  );

create policy "Admins manage broadcasts"
  on public.hub_broadcasts for all
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- Events table.

create table public.hub_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  location text not null default '',
  created_at timestamptz not null default now()
);

alter table public.hub_events enable row level security;

create policy "Members read own events"
  on public.hub_events for select
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid()
    )
  );

create policy "Admins manage events"
  on public.hub_events for all
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and role = 'admin'
    )
  );
