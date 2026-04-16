-- Migration 038: add review metadata and admin workflow RPCs for account deletion requests.

alter table public.profiles
	add column if not exists deletion_reviewed_at timestamptz,
	add column if not exists deletion_reviewed_by uuid references public.profiles(id);

comment on column public.profiles.deletion_reviewed_at
	is 'Timestamp when an admin reviewed the pending account deletion request.';

comment on column public.profiles.deletion_reviewed_by
	is 'Admin profile who reviewed the pending account deletion request.';

create index if not exists profiles_pending_deletion_idx
	on public.profiles (deletion_requested_at)
	where deletion_requested_at is not null and deletion_reviewed_at is null;

drop function if exists public.request_account_deletion();

create function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	request_timestamp timestamptz;
begin
	select profiles.deletion_requested_at
	into request_timestamp
	from public.profiles as profiles
	where profiles.id = auth.uid();

	if request_timestamp is null then
		update public.profiles
		set deletion_requested_at = now()
		where id = auth.uid()
		returning deletion_requested_at into request_timestamp;
	end if;

	if request_timestamp is null then
		raise exception 'Profile not found.';
	end if;

	return request_timestamp;
end;
$$;

revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;

create or replace function public.get_pending_account_deletion_requests(p_organization_id uuid)
returns table (
	profile_id uuid,
	name text,
	email text,
	phone_number text,
	avatar_url text,
	bio text,
	role text,
	joined_via text,
	joined_at timestamptz,
	deletion_requested_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
	if not exists (
		select 1
		from public.organization_memberships as membership
		where membership.organization_id = p_organization_id
			and membership.profile_id = auth.uid()
			and membership.role = 'admin'
	) then
		raise exception 'Only organization admins can review deletion requests.';
	end if;

	return query
	select
		membership.profile_id,
		profiles.name,
		profiles.email,
		profiles.phone_number,
		coalesce(profiles.avatar_url, ''),
		nullif(trim(profiles.bio), ''),
		membership.role,
		membership.joined_via,
		membership.created_at,
		profiles.deletion_requested_at
	from public.organization_memberships as membership
	join public.profiles as profiles on profiles.id = membership.profile_id
	where membership.organization_id = p_organization_id
		and profiles.deletion_requested_at is not null
		and profiles.deletion_reviewed_at is null
	order by profiles.deletion_requested_at asc;
end;
$$;

revoke all on function public.get_pending_account_deletion_requests(uuid) from public;
grant execute on function public.get_pending_account_deletion_requests(uuid) to authenticated;

create or replace function public.resolve_account_deletion_request(
	p_organization_id uuid,
	p_profile_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	review_timestamp timestamptz;
begin
	if not exists (
		select 1
		from public.organization_memberships as membership
		where membership.organization_id = p_organization_id
			and membership.profile_id = auth.uid()
			and membership.role = 'admin'
	) then
		raise exception 'Only organization admins can resolve deletion requests.';
	end if;

	if not exists (
		select 1
		from public.organization_memberships as membership
		where membership.organization_id = p_organization_id
			and membership.profile_id = p_profile_id
	) then
		raise exception 'Member not found.';
	end if;

	update public.profiles as profiles
	set deletion_reviewed_at = now(),
		deletion_reviewed_by = auth.uid()
	where profiles.id = p_profile_id
		and profiles.deletion_requested_at is not null
		and profiles.deletion_reviewed_at is null
	returning profiles.deletion_reviewed_at into review_timestamp;

	if review_timestamp is null then
		raise exception 'Deletion request not found.';
	end if;

	return review_timestamp;
end;
$$;

revoke all on function public.resolve_account_deletion_request(uuid, uuid) from public;
grant execute on function public.resolve_account_deletion_request(uuid, uuid) to authenticated;