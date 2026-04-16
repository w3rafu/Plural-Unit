-- 040: Allow owners to archive and recover direct-message threads.

alter table public.message_threads
add column if not exists archived_at timestamptz;

create index if not exists message_threads_owner_archived_updated_idx
on public.message_threads (owner_user_id, archived_at, updated_at desc);

create or replace function public.archive_message_thread(target_thread_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	target_thread public.message_threads%rowtype;
	archived_timestamp timestamptz := now();
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

	if target_thread.archived_at is not null then
		return target_thread.archived_at;
	end if;

	update public.message_threads
	set archived_at = archived_timestamp
	where id = target_thread_id;

	return archived_timestamp;
end;
$$;

revoke all on function public.archive_message_thread(uuid) from public;
grant execute on function public.archive_message_thread(uuid) to authenticated;

create or replace function public.unarchive_message_thread(target_thread_id uuid)
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
	set archived_at = null
	where id = target_thread_id
		and owner_user_id = current_user_id;

	if not found then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;
end;
$$;

revoke all on function public.unarchive_message_thread(uuid) from public;
grant execute on function public.unarchive_message_thread(uuid) to authenticated;

create or replace function public.send_message_to_thread(target_thread_id uuid, message_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
	normalized_body text := regexp_replace(trim(coalesce(message_body, '')), '\s+', ' ', 'g');
	target_thread public.message_threads%rowtype;
	target_contact public.message_contacts%rowtype;
	owner_message_id uuid;
	reply_sent_at timestamptz := now() + interval '1 second';
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	if normalized_body = '' then
		raise exception 'Message body is required.';
	end if;

	select threads.*
	into target_thread
	from public.message_threads threads
	where threads.id = target_thread_id
		and threads.owner_user_id = current_user_id
	for update;

	if target_thread.id is null then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;

	select contacts.*
	into target_contact
	from public.message_contacts contacts
	where contacts.id = target_thread.contact_id;

	insert into public.messages (thread_id, sender_kind, body)
	values (target_thread_id, 'owner', normalized_body)
	returning id into owner_message_id;

	update public.message_threads
	set last_read_at = now(),
		archived_at = null,
		updated_at = now()
	where id = target_thread_id;

	if target_contact.is_demo then
		insert into public.messages (thread_id, sender_kind, body, sent_at)
		values (
			target_thread_id,
			'contact',
			public.build_demo_message_reply(normalized_body),
			reply_sent_at
		);

		update public.message_threads
		set archived_at = null,
			updated_at = reply_sent_at
		where id = target_thread_id;
	end if;

	return owner_message_id;
end;
$$;

create or replace function public.send_image_message_to_thread(target_thread_id uuid, message_image_url text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
	normalized_image_url text := btrim(coalesce(message_image_url, ''));
	target_thread public.message_threads%rowtype;
	target_contact public.message_contacts%rowtype;
	owner_message_id uuid;
	reply_sent_at timestamptz := now() + interval '1 second';
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	if normalized_image_url = '' then
		raise exception 'Message image is required.';
	end if;

	select threads.*
	into target_thread
	from public.message_threads threads
	where threads.id = target_thread_id
		and threads.owner_user_id = current_user_id
	for update;

	if target_thread.id is null then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;

	select contacts.*
	into target_contact
	from public.message_contacts contacts
	where contacts.id = target_thread.contact_id;

	insert into public.messages (thread_id, sender_kind, message_kind, body, image_url)
	values (target_thread_id, 'owner', 'image', '', normalized_image_url)
	returning id into owner_message_id;

	update public.message_threads
	set last_read_at = now(),
		archived_at = null,
		updated_at = now()
	where id = target_thread_id;

	if target_contact.is_demo then
		insert into public.messages (thread_id, sender_kind, message_kind, body, sent_at)
		values (
			target_thread_id,
			'contact',
			'text',
			'Nice photo. I can see it here.',
			reply_sent_at
		);

		update public.message_threads
		set archived_at = null,
			updated_at = reply_sent_at
		where id = target_thread_id;
	end if;

	return owner_message_id;
end;
$$;