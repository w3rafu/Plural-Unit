-- 039: Allow owners to soft-delete their own direct messages.

alter table public.messages
add column if not exists deleted_at timestamptz;

create index if not exists messages_thread_id_deleted_at_idx
on public.messages (thread_id, deleted_at)
where deleted_at is not null;

create or replace function public.soft_delete_message(target_message_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	target_message public.messages%rowtype;
	deleted_timestamp timestamptz := now();
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	select messages.*
	into target_message
	from public.messages messages
	join public.message_threads threads
		on threads.id = messages.thread_id
	where messages.id = target_message_id
		and threads.owner_user_id = current_user_id
	for update of messages;

	if target_message.id is null then
		raise exception 'Message does not belong to the authenticated user.';
	end if;

	if target_message.sender_kind <> 'owner' then
		raise exception 'Only your own messages can be deleted.';
	end if;

	if target_message.deleted_at is not null then
		return target_message.deleted_at;
	end if;

	update public.messages
	set deleted_at = deleted_timestamp
	where id = target_message_id;

	return deleted_timestamp;
end;
$$;

revoke all on function public.soft_delete_message(uuid) from public;
grant execute on function public.soft_delete_message(uuid) to authenticated;