-- Profiles table: stores identity-level fields for each authenticated user.
-- The `id` column matches Supabase Auth's `auth.users.id`.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone_number text not null default '',
  created_at timestamptz not null default now()
);

-- RLS: users can only read/write their own profile row.
alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users upsert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);
