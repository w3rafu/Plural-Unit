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
		created_at = now()
	where id = p_invitation_id
		and status = 'pending';

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
		and status = 'pending';

	if not found then
		raise exception 'Invitation not found.';
	end if;
end;
$$;
