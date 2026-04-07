-- Organizations table: the top-level group a user belongs to.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now()
);

-- Organization memberships: links a profile to an organization.

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_via text not null default 'created' check (joined_via in ('created', 'invitation', 'code')),
  created_at timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

-- RLS: members can read their own organization and membership.
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

create policy "Members read own organization"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid()
    )
  );

create policy "Members read own membership"
  on public.organization_memberships for select
  using (profile_id = auth.uid());

-- RPC: create_organization — creates the org and adds the caller as admin.
create or replace function public.create_organization(p_name text, p_creator_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name)
  values (p_name)
  returning id into new_org_id;

  insert into public.organization_memberships (organization_id, profile_id, role, joined_via)
  values (new_org_id, p_creator_id, 'admin', 'created');

  return new_org_id;
end;
$$;

-- RPC: join_organization_by_code — joins by short code as a member.
create or replace function public.join_organization_by_code(p_profile_id uuid, p_join_code text)
returns void
language plpgsql
security definer
as $$
declare
  target_org_id uuid;
begin
  select id into target_org_id
  from public.organizations
  where join_code = upper(trim(p_join_code));

  if target_org_id is null then
    raise exception 'Invalid join code.';
  end if;

  insert into public.organization_memberships (organization_id, profile_id, role, joined_via)
  values (target_org_id, p_profile_id, 'member', 'code');
end;
$$;

-- RPC: regenerate_organization_join_code — admin-only code refresh.
create or replace function public.regenerate_organization_join_code(p_organization_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  new_code text;
begin
  -- Verify caller is admin.
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = p_organization_id
      and profile_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admins can regenerate the join code.';
  end if;

  new_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
  update public.organizations set join_code = new_code where id = p_organization_id;
  return new_code;
end;
$$;
