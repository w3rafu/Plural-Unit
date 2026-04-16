-- 041: Allow owners to mute and unmute direct-message threads.

alter table public.message_threads
add column if not exists muted_at timestamptz;

create index if not exists message_threads_owner_muted_updated_idx
on public.message_threads (owner_user_id, muted_at, updated_at desc);

create or replace function public.mute_message_thread(target_thread_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	target_thread public.message_threads%rowtype;
	muted_timestamp timestamptz := now();
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	select threads.*
	into target_thread
	from public.message_threads as threads
	where threads.id = target_thread_id
		and threads.owner_user_id = current_user_id
	for update;

	if target_thread.id is null then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;

	if target_thread.muted_at is not null then
		return target_thread.muted_at;
	end if;

	update public.message_threads
	set muted_at = muted_timestamp
	where id = target_thread_id;

	return muted_timestamp;
end;
$$;

revoke all on function public.mute_message_thread(uuid) from public;
grant execute on function public.mute_message_thread(uuid) to authenticated;

create or replace function public.unmute_message_thread(target_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	update public.message_threads
	set muted_at = null
	where id = target_thread_id
		and owner_user_id = current_user_id;

	if not found then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;
end;
$$;

revoke all on function public.unmute_message_thread(uuid) from public;
grant execute on function public.unmute_message_thread(uuid) to authenticated;