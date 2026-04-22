-- 046: Add lightweight resource engagement tracking for admin review.

alter table public.hub_resources
	add column if not exists open_count integer not null default 0,
	add column if not exists last_opened_at timestamptz;

create or replace function public.record_hub_resource_open(target_resource_id uuid)
returns public.hub_resources
language plpgsql
security definer
set search_path = public
as $$
declare
	caller_id uuid;
	target_resource public.hub_resources;
begin
	caller_id := auth.uid();

	if caller_id is null then
		raise exception 'Unauthorized';
	end if;

	select *
	into target_resource
	from public.hub_resources
	where id = target_resource_id;

	if not found then
		raise exception 'Resource not found';
	end if;

	if target_resource.is_draft or target_resource.archived_at is not null then
		raise exception 'Resource is not member-visible';
	end if;

	if not exists (
		select 1
		from public.organization_memberships as membership
		where membership.organization_id = target_resource.organization_id
			and membership.profile_id = caller_id
	) then
		raise exception 'Unauthorized';
	end if;

	update public.hub_resources
	set
		open_count = greatest(open_count, 0) + 1,
		last_opened_at = now()
	where id = target_resource_id
	returning *
	into target_resource;

	return target_resource;
end;
$$;

revoke all on function public.record_hub_resource_open(uuid) from public;
grant execute on function public.record_hub_resource_open(uuid) to authenticated;
