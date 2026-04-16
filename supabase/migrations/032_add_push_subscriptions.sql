-- 032_add_push_subscriptions.sql
--
-- Stores Web Push subscriptions per profile so the send-push Edge Function
-- can deliver out-of-app notifications. Each row maps one browser/device
-- subscription endpoint to a profile.

create table public.push_subscriptions (
	id uuid primary key default gen_random_uuid(),
	profile_id uuid not null references public.profiles(id) on delete cascade,
	endpoint text not null,
	p256dh_key text not null,
	auth_key text not null,
	user_agent text not null default '',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (profile_id, endpoint)
);

-- RLS: users manage their own subscriptions only.
alter table public.push_subscriptions enable row level security;

create policy "Users can read own push subscriptions"
	on public.push_subscriptions for select
	using (profile_id = auth.uid());

create policy "Users can insert own push subscriptions"
	on public.push_subscriptions for insert
	with check (profile_id = auth.uid());

create policy "Users can delete own push subscriptions"
	on public.push_subscriptions for delete
	using (profile_id = auth.uid());

-- Index for Edge Function lookups: find all subscriptions for a list of profile IDs.
create index idx_push_subscriptions_profile on public.push_subscriptions (profile_id);
