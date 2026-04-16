-- 042: Add explicit invitation expiry and resend recovery semantics.

alter table public.organization_invitations
add column if not exists expires_at timestamptz;

update public.organization_invitations
set expires_at = created_at + interval '14 days'
where expires_at is null;

alter table public.organization_invitations
alter column expires_at set default (now() + interval '14 days');

alter table public.organization_invitations
alter column expires_at set not null;

update public.organization_invitations
set status = 'expired'
where status = 'pending'
	and expires_at <= now();

create index if not exists organization_invitations_review_idx
on public.organization_invitations (organization_id, status, expires_at desc, created_at desc);

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
	where token = lower(trim(p_token))
		and status in ('pending', 'expired');

	if inv is null then
		raise exception 'Invitation token is invalid.';
	end if;

	if inv.status = 'expired' or inv.expires_at <= now() then
		update public.organization_invitations
		set status = 'expired'
		where id = inv.id
			and status = 'pending';

		raise exception 'Invitation expired. Ask an admin to resend it.';
	end if;

	insert into public.organization_memberships (organization_id, profile_id, role, joined_via)
	values (inv.organization_id, p_profile_id, 'member', 'invitation');

	update public.organization_invitations
	set status = 'accepted'
	where id = inv.id;
end;
$$;

create or replace function public.resend_organization_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
	if not exists (
		select 1
		from public.organization_invitations as inv
		join public.organization_memberships as mem
			on mem.organization_id = inv.organization_id
		where inv.id = p_invitation_id
			and mem.profile_id = auth.uid()
			and mem.role = 'admin'
	) then
		raise exception 'Only organization admins can resend invitations.';
	end if;

	update public.organization_invitations
	set token = lower(encode(gen_random_bytes(16), 'hex')),
		status = 'pending',
		created_at = now(),
		expires_at = now() + interval '14 days'
	where id = p_invitation_id
		and status in ('pending', 'expired');

	if not found then
		raise exception 'Invitation not found.';
	end if;
end;
$$;

create or replace function public.revoke_organization_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
	if not exists (
		select 1
		from public.organization_invitations as inv
		join public.organization_memberships as mem
			on mem.organization_id = inv.organization_id
		where inv.id = p_invitation_id
			and mem.profile_id = auth.uid()
			and mem.role = 'admin'
	) then
		raise exception 'Only organization admins can revoke invitations.';
	end if;

	update public.organization_invitations
	set status = 'revoked'
	where id = p_invitation_id
		and status in ('pending', 'expired');

	if not found then
		raise exception 'Invitation not found.';
	end if;
end;
$$;