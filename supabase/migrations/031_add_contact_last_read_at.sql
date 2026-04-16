-- 031_add_contact_last_read_at.sql
--
-- Expose the counterpart's last_read_at so the sender can show a "Seen"
-- indicator. Uses a security-definer function that, given a list of thread
-- IDs owned by the caller, returns each thread's counterpart last_read_at
-- by joining through message_contacts.profile_id to find the mirror thread.

create or replace function public.get_contact_last_read_at(target_thread_ids uuid[])
returns table(thread_id uuid, contact_last_read_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
	current_user_id uuid := auth.uid();
	owner_contact_id uuid;
begin
	if current_user_id is null then
		return;
	end if;

	-- Find the message_contacts row that represents the caller.
	select mc.id into owner_contact_id
	from public.message_contacts mc
	where mc.profile_id = current_user_id;

	if owner_contact_id is null then
		return;
	end if;

	return query
	select
		t.id as thread_id,
		mirror.last_read_at as contact_last_read_at
	from unnest(target_thread_ids) as tid(id)
	join public.message_threads t on t.id = tid.id
		and t.owner_user_id = current_user_id
	join public.message_contacts c on c.id = t.contact_id
	left join public.message_threads mirror
		on mirror.owner_user_id = c.profile_id
		and mirror.contact_id = owner_contact_id
	where c.profile_id is not null;
end;
$$;

grant execute on function public.get_contact_last_read_at(uuid[]) to authenticated;
