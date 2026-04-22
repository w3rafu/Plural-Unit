-- 043: Add role-aware visibility targeting for hub sections.

alter table public.hub_plugins
add column if not exists visibility_mode text;

update public.hub_plugins
set visibility_mode = 'all_members'
where visibility_mode is null;

alter table public.hub_plugins
alter column visibility_mode set default 'all_members';

alter table public.hub_plugins
alter column visibility_mode set not null;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'hub_plugins_visibility_mode_check'
	) then
		alter table public.hub_plugins
		add constraint hub_plugins_visibility_mode_check
		check (visibility_mode in ('all_members', 'admins_only'));
	end if;
end
$$;