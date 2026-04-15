-- Fix ambiguous OUT-parameter references in get_organization_members.

create or replace function public.get_organization_members(p_organization_id uuid)
returns table (
	profile_id uuid,
	name text,
	email text,
	phone_number text,
	avatar_url text,
	role text,
	joined_via text,
	joined_at timestamptz
)
language plpgsql
security definer
as $$
begin
	if not exists (
		select 1
		from public.organization_memberships as membership
		where membership.organization_id = p_organization_id
			and membership.profile_id = auth.uid()
	) then
		raise exception 'Only organization members can view the member directory.';
	end if;

	return query
	select
		m.profile_id,
		p.name,
		p.email,
		p.phone_number,
		coalesce(p.avatar_url, ''),
		m.role,
		m.joined_via,
		m.created_at
	from public.organization_memberships as m
	join public.profiles as p on p.id = m.profile_id
	where m.organization_id = p_organization_id
	order by
		case when m.role = 'admin' then 0 else 1 end,
		nullif(trim(p.name), ''),
		nullif(trim(p.email), ''),
		m.created_at;
end;
$$;