-- Organization invitations: admin-created invites (email or phone).

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text,
  phone text,
  token text not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default now(),

  -- Prevent duplicate pending invitations per contact.
  constraint pending_email_key unique nulls not distinct (organization_id, email, status),
  constraint pending_phone_key unique nulls not distinct (organization_id, phone, status)
);

alter table public.organization_invitations enable row level security;

-- Admins can read invitations for their own organization.
create policy "Admins read own invitations"
  on public.organization_invitations for select
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert invitations.
create policy "Admins create invitations"
  on public.organization_invitations for insert
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- RPC: accept_organization_invitation — joins by invitation token.
create or replace function public.accept_organization_invitation(p_profile_id uuid, p_token text)
returns void
language plpgsql
security definer
as $$
declare
  inv record;
begin
  select * into inv
  from public.organization_invitations
  where token = lower(trim(p_token)) and status = 'pending';

  if inv is null then
    raise exception 'Invalid or expired invitation.';
  end if;

  insert into public.organization_memberships (organization_id, profile_id, role, joined_via)
  values (inv.organization_id, p_profile_id, 'member', 'invitation');

  update public.organization_invitations
  set status = 'accepted'
  where id = inv.id;
end;
$$;
