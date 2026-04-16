-- Allow admins to update their organization's name.

create or replace function public.update_organization_name(
  p_organization_id uuid,
  p_name text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Validate caller is an admin of this organization.
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = p_organization_id
      and profile_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only organization admins can update the name.';
  end if;

  -- Validate name is not empty.
  if trim(p_name) = '' then
    raise exception 'Organization name cannot be empty.';
  end if;

  update public.organizations
  set name = trim(p_name)
  where id = p_organization_id;
end;
$$;
