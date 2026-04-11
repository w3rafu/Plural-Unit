create or replace function public.set_organization_member_role(
	p_organization_id uuid,
	p_profile_id uuid,
	p_role text
)
returns void
language plpgsql
security definer
as $$
declare
	admin_count integer;
begin
	if p_role not in ('admin', 'member') then
		raise exception 'Invalid role.';
	end if;

	if not exists (
		select 1
		from public.organization_memberships
		where organization_id = p_organization_id
			and profile_id = auth.uid()
			and role = 'admin'
	) then
		raise exception 'Only organization admins can update member roles.';
	end if;

	if not exists (
		select 1
		from public.organization_memberships
		where organization_id = p_organization_id
			and profile_id = p_profile_id
	) then
		raise exception 'Member not found.';
	end if;

	if p_role = 'member' then
		select count(*)
		into admin_count
		from public.organization_memberships
		where organization_id = p_organization_id
			and role = 'admin';

		if admin_count = 1 and exists (
			select 1
			from public.organization_memberships
			where organization_id = p_organization_id
				and profile_id = p_profile_id
				and role = 'admin'
		) then
			raise exception 'At least one admin is required.';
		end if;
	end if;

	update public.organization_memberships
	set role = p_role
	where organization_id = p_organization_id
		and profile_id = p_profile_id;
end;
$$;

create or replace function public.remove_organization_member(
	p_organization_id uuid,
	p_profile_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
	admin_count integer;
	is_target_admin boolean;
begin
	if not exists (
		select 1
		from public.organization_memberships
		where organization_id = p_organization_id
			and profile_id = auth.uid()
			and role = 'admin'
	) then
		raise exception 'Only organization admins can remove members.';
	end if;

	select count(*)
	into admin_count
	from public.organization_memberships
	where organization_id = p_organization_id
		and role = 'admin';

	select exists (
		select 1
		from public.organization_memberships
		where organization_id = p_organization_id
			and profile_id = p_profile_id
			and role = 'admin'
	)
	into is_target_admin;

	if is_target_admin and admin_count = 1 then
		raise exception 'At least one admin is required.';
	end if;

	delete from public.organization_memberships
	where organization_id = p_organization_id
		and profile_id = p_profile_id;
end;
$$;
