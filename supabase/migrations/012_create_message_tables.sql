-- 012: Create message tables for one-to-one messaging.
--
-- Tables: message_contacts, message_threads, messages
-- Storage: message-images bucket
-- RLS: owner-only access on threads and messages, visible contacts only
-- RPCs: send_message_to_thread, send_image_message_to_thread,
--        mark_message_thread_read, ensure_demo_message_thread,
--        reset_demo_message_thread, ensure_message_thread_for_profile

-- ── message_contacts ────────────────────────────────────────────────

create table if not exists public.message_contacts (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	avatar_url text not null default '',
	subtitle text not null default '',
	profile_id uuid unique references public.profiles(id) on delete cascade,
	is_demo boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint message_contacts_slug_check check (slug = lower(btrim(slug)) and slug <> ''),
	constraint message_contacts_name_check check (char_length(btrim(name)) between 2 and 120),
	constraint message_contacts_subtitle_check check (char_length(btrim(subtitle)) <= 120)
);

create index if not exists message_contacts_profile_id_idx
on public.message_contacts (profile_id)
where profile_id is not null;

create trigger trg_message_contacts_updated_at
before update on public.message_contacts
for each row execute function public.set_updated_at();

insert into public.message_contacts (slug, name, subtitle, is_demo)
values ('demo-contact', 'Demo Contact', 'Test conversation partner', true)
on conflict (slug) do update
set name = excluded.name,
	subtitle = excluded.subtitle,
	is_demo = excluded.is_demo;

-- ── message_threads ─────────────────────────────────────────────────

create table if not exists public.message_threads (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references auth.users(id) on delete cascade,
	contact_id uuid not null references public.message_contacts(id) on delete restrict,
	last_read_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint message_threads_owner_contact_key unique (owner_user_id, contact_id)
);

create index if not exists message_threads_owner_user_id_idx
on public.message_threads (owner_user_id, updated_at desc);

create trigger trg_message_threads_updated_at
before update on public.message_threads
for each row execute function public.set_updated_at();

-- ── messages ────────────────────────────────────────────────────────

create table if not exists public.messages (
	id uuid primary key default gen_random_uuid(),
	thread_id uuid not null references public.message_threads(id) on delete cascade,
	sender_kind text not null,
	message_kind text not null default 'text',
	body text not null default '',
	image_url text,
	sent_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	constraint messages_sender_kind_check check (sender_kind in ('owner', 'contact')),
	constraint messages_message_kind_check check (message_kind in ('text', 'image')),
	constraint messages_payload_check check (
		(
			message_kind = 'text'
			and char_length(btrim(body)) between 1 and 500
			and image_url is null
		)
		or (
			message_kind = 'image'
			and btrim(coalesce(image_url, '')) <> ''
		)
	)
);

create index if not exists messages_thread_id_sent_at_idx
on public.messages (thread_id, sent_at asc);

-- ── message-images storage bucket ───────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'message-images',
	'message-images',
	true,
	5242880,
	array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

-- ── helper functions ────────────────────────────────────────────────

create or replace function public.is_message_thread_owner(target_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.message_threads threads
		where threads.id = target_thread_id
			and threads.owner_user_id = auth.uid()
	);
$$;

create or replace function public.is_message_contact_visible(target_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.message_threads threads
		where threads.contact_id = target_contact_id
			and threads.owner_user_id = auth.uid()
	);
$$;

-- ── demo thread functions ───────────────────────────────────────────

create or replace function public.build_demo_message_reply(message_body text)
returns text
language plpgsql
immutable
as $$
declare
	normalized_body text := lower(regexp_replace(trim(coalesce(message_body, '')), '\s+', ' ', 'g'));
	reply_options text[] := array[
		'That sounds good on my end.',
		'I can make that work.',
		'Thanks for the update. I will keep an eye on it.',
		'Perfect. Keep me posted.',
		'Appreciate it. I am around if you need anything else.'
	];
	reply_index integer;
begin
	if normalized_body like '%hello%' or normalized_body like '%hi%' then
		return 'Hey there. The demo contact is online and the thread is working.';
	end if;

	if normalized_body like '%meeting%' or normalized_body like '%schedule%' then
		return 'That works. Send the time and I will confirm.';
	end if;

	if normalized_body like '%help%' or normalized_body like '%need%' then
		return 'I can help with that. Tell me what you need.';
	end if;

	reply_index := 1 + (get_byte(decode(md5(normalized_body), 'hex'), 0) % array_length(reply_options, 1));
	return reply_options[reply_index];
end;
$$;

create or replace function public.seed_demo_message_thread(target_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
	profile_name text;
	message_one_at timestamptz := now() - interval '8 minutes';
	message_two_at timestamptz := now() - interval '6 minutes';
	message_three_at timestamptz := now() - interval '4 minutes';
	message_four_at timestamptz := now() - interval '2 minutes';
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	if not public.is_message_thread_owner(target_thread_id) then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;

	select coalesce(nullif(regexp_replace(trim(coalesce(profiles.name, '')), '\s+', ' ', 'g'), ''), 'there')
	into profile_name
	from public.profiles
	where profiles.id = current_user_id;

	delete from public.messages
	where thread_id = target_thread_id;

	insert into public.messages (thread_id, sender_kind, body, sent_at)
	values
		(target_thread_id, 'contact', format('Hey %s, this is a demo contact for testing the message flow.', profile_name), message_one_at),
		(target_thread_id, 'contact', 'Send me a note here and I will reply with a fake response.', message_two_at),
		(target_thread_id, 'owner', 'Testing the thread.', message_three_at),
		(target_thread_id, 'contact', 'Perfect. Send a new message whenever you want to test the backend flow.', message_four_at);

	update public.message_threads
	set last_read_at = message_three_at,
		updated_at = message_four_at
	where id = target_thread_id;
end;
$$;

create or replace function public.ensure_demo_message_thread()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
	demo_contact_id uuid;
	demo_thread_id uuid;
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	select id
	into demo_contact_id
	from public.message_contacts
	where slug = 'demo-contact';

	if demo_contact_id is null then
		raise exception 'Demo message contact is missing.';
	end if;

	insert into public.message_threads (owner_user_id, contact_id)
	values (current_user_id, demo_contact_id)
	on conflict (owner_user_id, contact_id) do update
	set owner_user_id = excluded.owner_user_id
	returning id into demo_thread_id;

	if not exists (
		select 1
		from public.messages
		where thread_id = demo_thread_id
	) then
		perform public.seed_demo_message_thread(demo_thread_id);
	end if;

	return demo_thread_id;
end;
$$;

create or replace function public.reset_demo_message_thread()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
	demo_thread_id uuid;
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	demo_thread_id := public.ensure_demo_message_thread();
	perform public.seed_demo_message_thread(demo_thread_id);
	return demo_thread_id;
end;
$$;

-- ── send text message ───────────────────────────────────────────────

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
		set updated_at = reply_sent_at
		where id = target_thread_id;
	end if;

	return owner_message_id;
end;
$$;

-- ── send image message ──────────────────────────────────────────────

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
		set updated_at = reply_sent_at
		where id = target_thread_id;
	end if;

	return owner_message_id;
end;
$$;

-- ── mark thread read ────────────────────────────────────────────────

create or replace function public.mark_message_thread_read(target_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	update public.message_threads
	set last_read_at = now()
	where id = target_thread_id
		and owner_user_id = current_user_id;

	if not found then
		raise exception 'Thread does not belong to the authenticated user.';
	end if;
end;
$$;

-- ── profile thread ──────────────────────────────────────────────────

create or replace function public.ensure_message_thread_for_profile(target_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	current_user_id uuid := auth.uid();
	target_profile public.profiles%rowtype;
	target_contact_id uuid;
	target_thread_id uuid;
	normalized_name text;
begin
	if current_user_id is null then
		raise exception 'No authenticated user. Log in first.';
	end if;

	if target_profile_id is null then
		raise exception 'Profile is required.';
	end if;

	if target_profile_id = current_user_id then
		raise exception 'Cannot start a message thread with yourself.';
	end if;

	select *
	into target_profile
	from public.profiles
	where id = target_profile_id;

	if target_profile.id is null then
		raise exception 'Profile was not found.';
	end if;

	normalized_name := regexp_replace(trim(coalesce(target_profile.name, '')), '\s+', ' ', 'g');
	if normalized_name = '' then
		normalized_name := 'Community member';
	end if;

	insert into public.message_contacts (profile_id, slug, name, avatar_url, subtitle, is_demo)
	values (
		target_profile.id,
		'profile-' || replace(target_profile.id::text, '-', ''),
		normalized_name,
		coalesce(target_profile.avatar_url, ''),
		'Community member',
		false
	)
	on conflict (profile_id) do update
	set
		name = excluded.name,
		avatar_url = excluded.avatar_url,
		subtitle = excluded.subtitle
	returning id into target_contact_id;

	insert into public.message_threads (owner_user_id, contact_id)
	values (current_user_id, target_contact_id)
	on conflict (owner_user_id, contact_id) do update
	set owner_user_id = excluded.owner_user_id
	returning id into target_thread_id;

	return target_thread_id;
end;
$$;

grant execute on function public.ensure_message_thread_for_profile(uuid) to authenticated;

-- ── RLS policies ────────────────────────────────────────────────────

alter table public.message_contacts enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

create policy "message_contacts_select_visible"
on public.message_contacts
for select
to authenticated
using (public.is_message_contact_visible(id));

create policy "message_threads_select_own"
on public.message_threads
for select
to authenticated
using (owner_user_id = auth.uid());

create policy "message_threads_update_own"
on public.message_threads
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "messages_select_own_threads"
on public.messages
for select
to authenticated
using (public.is_message_thread_owner(thread_id));

-- ── storage policies ────────────────────────────────────────────────

create policy "message_images_select_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'message-images');

create policy "message_images_insert_own"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'message-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "message_images_update_own"
on storage.objects
for update
to authenticated
using (
	bucket_id = 'message-images'
	and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
	bucket_id = 'message-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "message_images_delete_own"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'message-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);
